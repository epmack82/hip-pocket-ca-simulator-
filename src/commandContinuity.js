// Authored simulation rules, not doctrine or an approval authority.
export const COMMAND_VERSION = 1;
export const COMMAND_REQUESTS = [
  { id: 'collection', label: 'Prioritize further collection' },
  { id: 'technical', label: 'Request specialist coordination' },
  { id: 'handover', label: 'Recommend a handover review' },
];
export const COMMAND_INTENT = 'Give command a sourced picture of civil access and local capacity, identify appropriate support partners, and leave unresolved risks visible for the next team.';

const questions = {
  clinic: ['Does the community have dependable access to care, and what capacity needs independent review?', 'Medical planning liaison'],
  water: ['Does reported water production translate into reliable household and service access?', 'Engineer / utility coordination liaison'],
  substation: ['Which service dependencies need technical review before any support is proposed?', 'Engineer / utility coordination liaison'],
  market: ['What is limiting access to livelihoods and supplies, and whose account is still missing?', 'Civil-military coordination staff'],
  port: ['Which reported transport constraints affect civilian services and require verification?', 'Transport / sustainment coordination liaison'],
  distribution: ['Who can actually access assistance, and which coordination gaps remain?', 'Humanitarian coordination liaison'],
  irrigation: ['How do reported allocations compare with access and local maintenance capacity?', 'Engineer / local-service coordination liaison'],
  school: ['Can families access education reliably, and what capacity or representation gaps remain?', 'Civil-military coordination staff'],
  municipal: ['Which local institutions can sustain services, and whose perspective is not represented?', 'Civil-military coordination staff'],
};
export function commandQuestion(scenario = {}) {
  const [question, partner] = questions[scenario.metadata?.site || scenario.siteType] || ['Which civil conditions require verification before command considers further support?', 'Civil-military coordination staff'];
  return { question, partner };
}

export function campaignEvidence(world = {}, scenarios = []) {
  return Object.entries(world.sites || {}).flatMap(([scenarioId, site]) => (site.evidence || []).filter(e => e.id && e.text).map(e => ({
    key: JSON.stringify([scenarioId, e.id]), id: e.id, scenarioId,
    location: scenarios.find(s => s.id === scenarioId)?.location || scenarioId,
    text: e.text, source: e.source || 'Source not recorded', reliability: e.reliability || 'not assessed',
    actionId: [...(site.history || [])].reverse().find(update => update.discoveries?.some(d => d.id === e.id))?.actionRecordId || null,
  })));
}

export function commandHandover(world = {}, scenarios = [], records = []) {
  const visited = new Set(records.map(r => r.scenarioId));
  return {
    gaps: Object.entries(world.sites || {}).flatMap(([id, site]) => (site.informationGaps || []).map(text => ({ scenarioId: id, location: scenarios.find(s => s.id === id)?.location || id, text }))),
    requests: Object.entries(world.sites || {}).flatMap(([id, site]) => (site.followUpRequests || []).map(request => ({ ...request, scenarioId: id }))),
    conditions: (world.persistentConditions || []).filter(c => c.status !== 'resolved'),
    unvisited: scenarios.filter(s => !visited.has(s.id)).map(s => ({ id: s.id, location: s.location })),
  };
}

export function commandBriefViews(world = {}, scenarios = [], records = []) {
  const entries = world.commandBriefs || [];
  const superseded = new Set(entries.map(b => b.supersedes).filter(Boolean));
  const evidence = campaignEvidence(world, scenarios);
  const visited = new Set(records.map(r => r.scenarioId));
  return entries.map(brief => {
    const targetId = brief.followUp?.scenarioId || brief.scenarioId;
    const newEvidence = evidence.filter(e => e.scenarioId === targetId && !(brief.knownEvidenceKeys || []).includes(e.key));
    const archived = superseded.has(brief.id);
    return { ...brief, superseded: archived, newEvidence,
      followUpStatus: archived ? 'Superseded — retained in history'
        : newEvidence.length ? 'New material available — review and rebrief'
          : visited.has(targetId) ? 'Visit concluded — recommendation still open'
            : brief.followUp ? 'Follow-up destination not yet concluded' : 'Awaiting further review',
    };
  });
}

export function commandFollowUpIds(world = {}, scenarios = [], records = []) {
  return [...new Set(commandBriefViews(world, scenarios, records).filter(b => !b.superseded && b.followUp && b.evidence.length && b.request !== 'handover').map(b => b.followUp.scenarioId))];
}

export function submitCommandBrief({ world = {}, scenarios = [], records = [], scenarioId, draft, day = 1 }) {
  if (world.missionOutcome?.terminated) throw new Error('This mission has ended. Retain outstanding recommendations for the AAR.');
  const scenario = scenarios.find(s => s.id === scenarioId);
  if (!scenario) throw new Error('Select an existing mission location to brief.');
  if (!COMMAND_REQUESTS.some(r => r.id === draft?.request)) throw new Error('Choose a command request.');
  const recommendation = String(draft.recommendation || '').trim();
  const uncertainty = String(draft.uncertainty || '').trim();
  if (!recommendation || !uncertainty || recommendation.length > 2000 || uncertainty.length > 2000) throw new Error('Enter a recommendation and its uncertainty (up to 2,000 characters each).');
  const entries = world.commandBriefs || [];
  const previous = draft.supersedes && entries.find(b => b.id === draft.supersedes && b.scenarioId === scenarioId);
  if (draft.supersedes && (!previous || entries.some(b => b.supersedes === previous.id))) throw new Error('Only the current brief for this location can be revised.');
  const allEvidence = campaignEvidence(world, scenarios);
  const selectedKeys = [...new Set(draft.evidenceKeys || [])];
  if (selectedKeys.length > 10 || selectedKeys.some(key => !allEvidence.some(e => e.key === key))) throw new Error('Attach up to ten findings already recorded in this mission.');
  const evidence = allEvidence.filter(e => selectedKeys.includes(e.key)).map(e => ({ ...e }));
  const followUp = draft.request !== 'handover' && draft.followUpId ? scenarios.find(s => s.id === draft.followUpId && s.id !== scenarioId && !records.some(r => r.scenarioId === s.id)) : null;
  if (draft.request !== 'handover' && draft.followUpId && !followUp) throw new Error('Choose a destination that has not been concluded.');
  const context = commandQuestion(scenario);
  const handover = commandHandover(world, scenarios, records);
  const status = !evidence.length ? 'Supporting findings requested' : draft.request === 'collection' ? 'Collection priority recorded' : draft.request === 'technical' ? 'Referred for feasibility review' : 'Handover review pending';
  const opening = !evidence.length
    ? 'The staff officer looks over your message, then pauses. “I have your recommendation, but no recorded findings are attached. Keep the question open and bring me the observations or attributed accounts behind it.”'
    : `The staff officer draws the ${evidence.length === 1 ? 'attached finding' : `${evidence.length} attached findings`} alongside your recommendation. “This gives us something to discuss. Keep the sources and their limits with the brief; attaching an account does not make it a confirmed fact.”`;
  const response = opening + '\n\n' + (!evidence.length
    ? '“The proposal stays in the record, but it is not yet a supported collection priority, a specialist referral or an accepted handover. Attach what you have learned and revise the brief when you can.”'
    : draft.request === 'collection'
    ? `“Your collection priority is recorded${followUp ? ` for ${followUp.location}` : ''}. You still choose where to go within the remaining visit budget. Tell us what you can verify, not simply that the visit happened.”`
    : draft.request === 'technical'
      ? `“The request is routed to the ${context.partner.toLowerCase()} for feasibility review. That is not an appointment, allocation of resources or permission to begin work. The responsible organization and local authority still need to agree.”`
      : `“A handover recommendation needs to carry the unfinished work with it. The mission record currently has ${handover.gaps.length} open information gaps and ${handover.requests.length} recorded coordination requests. We have not accepted a transfer of responsibility or confirmed that services are sustainable.”`);
  const brief = {
    id: `command-${entries.length + 1}`, version: COMMAND_VERSION, supersedes: previous?.id || null,
    scenarioId, location: scenario.location, day, question: context.question, partner: context.partner,
    request: draft.request, recommendation, uncertainty, evidence, status, response,
    followUp: followUp ? { scenarioId: followUp.id, location: followUp.location } : null,
    knownEvidenceKeys: allEvidence.map(e => e.key), historyLength: (world.history || []).length,
    handoverSnapshot: handover, authority: 'Simulation staff response only. No funding, technical work, public commitment or transition approval granted.',
  };
  return { ...world, commandBriefs: [...entries, brief] };
}
