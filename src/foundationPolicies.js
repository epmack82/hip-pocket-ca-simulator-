import { knowledgeFor, sentenceCase } from './sceneKnowledge';

const has = (act, kind) => (act.kinds || []).includes(kind);
const any = (record, kind) => record.understanding.actions.some(act => has(act, kind));
const primary = record => record.context.stakeholders[0] || 'Local stakeholder';
const evidence = act => act.description;
const dimensions = (act, id, entries) => Object.entries(entries).map(([dimension, delta]) => ({ dimension, delta, reasonCode: id, evidence: evidence(act) }));

function incident(record, act, world, id, severity, effect, coaching, options = {}) {
  const target = act.target || primary(record);
  const repeat = (world.persistentConditions || []).filter(c => c.ruleId === id).length;
  const delta = -(severity === 'critical' ? 30 : severity === 'serious' ? 12 : 5) - Math.min(10, repeat * 3);
  return {
    id, severity, evidence: evidence(act), rejectedActs: [act.id],
    effects: [effect],
    relationshipChanges: [{ participant: target, delta, reasonCode: id, evidence: evidence(act) }],
    scoreChanges: dimensions(act, id, { professionalism: delta * 2, missionFocus: delta, rapport: delta, ...(options.scores || {}) }),
    persistentConditions: [{
      id: record.id + '-' + id + '-' + act.id, ruleId: id, sourceAction: record.id, sourceScenario: record.scenarioId,
      title: options.title || id.replace(/-/g, ' '), severity, status: 'active', occurrenceCount: 1,
      categories: [id], persistentEffects: [effect], evidence: evidence(act)
    }],
    teamReactions: [severity === 'critical'
      ? 'The team sergeant stops normal mission activity, accounts for the team, and notifies command. The incident now takes priority over collection.'
      : repeat ? 'A teammate points out that this has happened before. The team chief takes direct control of the engagement; the rest of the team loses time to managing the aftermath.'
      : 'The team sergeant steps into the exchange. A second teammate gathers the notebook and stays with the host while the interruption is addressed.'],
    coaching: [coaching], ...options
  };
}

export function conductPolicy(record, world = {}) {
  if (record.kind !== 'action' && record.kind !== 'lead') return [];
  const findings = [];
  const site = world.sites?.[record.scenarioId] || {};
  for (const act of record.understanding.actions) {
    const who = sentenceCase(act.target || primary(record));
    if (has(act, 'destruction')) findings.push(incident(record, act, world, 'destruction-or-arson', 'critical',
      'The destructive act damages the site and stops its normal use. ' + who + ' calls for assistance; people withdraw from the area. The loss of service and the team’s responsibility remain part of the mission record.',
      'Address immediate safety, report what happened accurately, and account for the effects on people and essential services. Later good work cannot erase this incident.', { title: 'Destructive conduct' }));
    else if (has(act, 'violence')) findings.push(incident(record, act, world, 'violence-or-weapon-use', 'critical',
      who + ' breaks off the engagement as the weapon or assault turns the visit into a security incident. Local personnel secure the area and command removes the team from normal duties.',
      'Account for safety and report the incident accurately. The exercise proceeds to an AAR with the harm and loss of access recorded.', { title: 'Violent conduct' }));
    if (has(act, 'intoxication')) findings.push(incident(record, act, world, 'duty-impairment', 'serious',
      who + ' ends the substantive discussion when the team’s attention shifts to intoxication. An assigned meeting is missed while another teammate arranges accountability and reports the interruption.',
      'Recognize the effect on duty performance, interpreter trust, host access, and teammates who must cover the work.', { title: 'Duty impairment' }));
    if (has(act, 'substance-offer')) findings.push(incident(record, act, world, 'substance-distribution', 'serious',
      who + ' declines the offered substance and sets it aside. The conversation stops; a teammate has to explain the incident and arrange a professional follow-up.',
      'An unsolicited offer of intoxicants or medication in this engagement is not credited as relationship building.', { title: 'Inappropriate substance offer' }));
    if (has(act, 'abandonment')) findings.push(incident(record, act, world, 'mission-abandonment', 'serious',
      'The host is left waiting while the team departs from its assigned work. The remaining teammates cover the missed engagement and report the loss of contact to command.',
      'Own the missed task, coordinate your return through team leadership, and document what other team members had to cover.', { title: 'Mission abandonment' }));
    if (has(act, 'harassment') || has(act, 'coercion')) findings.push(incident(record, act, world, has(act, 'harassment') ? 'harassment-or-discrimination' : 'coercive-engagement', 'serious',
      who + ' withdraws cooperation after the pressure or degrading treatment. A teammate separates the parties and records the affected person’s concern without forcing them to continue the meeting.',
      'Respect autonomy and equal treatment. Acknowledge the specific conduct and use the appropriate team and support channels.', { title: 'Coercion or mistreatment' }));
    if (has(act, 'unsafe-equipment') && !has(act, 'destruction') && !act.request) findings.push(incident(record, act, world, 'unsafe-facility-interference', 'serious',
      'The interference with operational equipment interrupts the visit. Facility staff move the team away from the controls and check for damage; ' + who + ' restricts the team to the public area.',
      'Permission to visit is not technical authorization to operate or manipulate equipment. Coordinate qualified inspection.', { title: 'Unsafe equipment interference' }));
    const permitted = act.permission === 'stated' || (site.permissions || []).includes('supervised-contact');
    const schoolPerformance = has(act, 'performance') && /school|classroom/.test(record.context.siteType + ' ' + record.context.location + ' ' + act.description);
    if ((has(act, 'contact') || schoolPerformance) && !act.request && !act.conditional && !permitted) findings.push(incident(record, act, world, 'protected-contact-without-permission', 'serious',
      'As the uncoordinated activity begins, the responsible staff member gathers the group back under supervision. ' + who + ' asks why the official engagement was bypassed. A teammate has to restore contact with the host while the activity ends.',
      'For this exercise, coordinate the purpose, appropriate consent, supervision, and access before contact with children or other vulnerable people. The attempted contact and interrupted meeting remain recorded.', { title: 'Uncoordinated protected-population contact' }));
    if (has(act, 'interpreter-exclusion')) findings.push(incident(record, act, world, 'interpreter-deliberately-excluded', 'concern',
      'The interpreter stays outside as instructed. Inside, ' + who + ' pauses when the team tries to continue privately: “How will we make sure we understand each other?” Tea is served, but no translated discussion or new information is credited.',
      'Establish a shared language or an approved alternative before continuing. Explain confidentiality boundaries respectfully; excluding the interpreter does not make them an unseen translator.', { title: 'Interpreter excluded', interpreterStatus: 'excluded', scores: { coordination: -12 } }));
    else if (has(act, 'interpreter-substitution')) findings.push(incident(record, act, world, 'interpreter-substituted-for-soldier', 'concern',
      'The interpreter pauses at the instruction to take responsibility for the engagement. ' + who + ' asks who will speak for the team and own its decisions. A teammate asks the Soldier to clarify the division of responsibilities.',
      'The interpreter facilitates language and meaning. The team retains ownership of introductions, decisions, and follow-through.', { title: 'Engagement delegated to interpreter', scores: { coordination: -12 } }));
    if (has(act, 'promise')) findings.push(incident(record, act, world, 'unauthorized-commitment', 'serious',
      who + ' repeats the promised support to the people nearby and asks when it will arrive. The team now has to correct an expectation it has not established authority or resources to meet.',
      'Record the need, explain your limits, and coordinate a possible response without guaranteeing support or an outcome.', { title: 'Unauthorized commitment' }));
    if (has(act, 'social-event') && !has(act, 'intoxication') && act.permission !== 'stated') findings.push(incident(record, act, world, 'uncoordinated-social-event', 'concern',
      who + ' asks who approved the event, who is included, and who pays. Staff stop their work to discuss the proposal; the assessment loses time and the event does not proceed as an approved mission activity.',
      'Account for purpose, authority, cost, inclusion, and local expectations before committing staff to an event.', { title: 'Uncoordinated event' }));
  }
  return findings;
}

function credit(record, act, id, effect, scores, extra = {}) {
  return {
    id, severity: 'none', evidence: evidence(act), acceptedActs: [act.id], effects: [effect],
    creditKey: record.scenarioId + ':' + id + ':' + act.target,
    scoreChanges: dimensions(act, id, scores),
    relationshipChanges: [], ...extra
  };
}

export function engagementPolicy(record, world = {}) {
  if (record.kind !== 'action' && record.kind !== 'lead') return [];
  const site = world.sites?.[record.scenarioId] || {};
  const knowledge = knowledgeFor(record.context);
  const findings = [];
  let hasClaim = Boolean(site.claims?.length);
  const engaged = new Set(site.engagedParticipants || []);
  let observationPermission = (site.permissions || []).includes('escorted-observation');
  const unavailable = any(record, 'interpreter-exclusion') || world.interpreterStatus === 'excluded';
  for (const act of record.understanding.actions) {
    const who = sentenceCase(act.target || primary(record));
    let introduced = engaged.has(act.target || primary(record));
    const speaker = act.target || primary(record);
    const speakerKnowledge = knowledgeFor(record.context, speaker);
    if (act.negated || act.hypothetical || act.actor !== 'trainee') continue;
    if (has(act, 'accountability')) {
      const active = (world.persistentConditions || []).filter(c => c.status === 'active');
      const reported = any(record, 'coordination') && /\b(?:command|team leader|team chief|cmoc|chain of command)\b/i.test(record.rawText);
      findings.push(credit(record, act, active.length ? 'accountability' : 'courtesy-apology',
        who + (active.length ? ' hears the acknowledgment without immediately relaxing. “I appreciate that you addressed it. We still need to deal with what happened.” The conversation can continue, but the earlier incident remains between you.\n\n“Tell me what you will do differently—and who will follow through.” An apology opens that discussion; it does not restore lost access or erase the effect on other people.' : ' pauses, then accepts the apology. “Thank you for saying that. Let us start with what you need to understand.” The tone becomes less guarded, but the host has not yet endorsed a plan or offered new evidence.\n\nThere is room to continue now. A specific question or explanation of purpose will give the conversation somewhere to go.'),
        active.length && reported ? { coordination: 10 } : {},
        { conditionChanges: reported ? active.filter(c => c.severity !== 'critical').map(c => ({ id: c.id, status: 'mitigating' })) : [],
          coaching: active.length ? ['Acknowledgment and reporting begin mitigation. Restrictions and the recorded consequence remain; this is not a reset.'] : [] }));
    }
    if (has(act, 'invitation') || has(act, 'introduction') || has(act, 'conversation-opening')) {
      const repeated = (site.engagedParticipants || []).includes(speaker);
      const intro = repeated ? ' recognizes you and returns the greeting. “We have made a start. Which of the questions from our earlier discussion do you want to pursue?” The familiar opening does not add new evidence; the next move is yours.' : ' turns toward the team and joins the exchange. “Thank you for including me. What would you like to understand about our work?” The welcome is measured: you have their attention, not yet their agreement.\n\n“Please hear our situation before deciding what we need.” The invitation gives you a chance to explain your purpose and ask whose perspective is still missing.';
      const translation = any(record, 'interpreter-support') && !unavailable && !any(record, 'interpreter-substitution')
        ? ' The interpreter translates the introduction in short sections while you remain responsible for the exchange.' : '';
      findings.push(credit(record, act, 'constructive-engagement-opening', who + intro + translation, { rapport: 35, professionalism: 30, missionFocus: 15 },
        { engagedParticipants: [speaker], relationshipChanges: [{ participant: speaker, delta: 4, reasonCode: 'constructive-engagement-opening', evidence: evidence(act) }] }));
      introduced = true;
      engaged.add(speaker);
    }
    if (has(act, 'gift') && !has(act, 'alcohol-gift')) findings.push(credit(record, act, 'gift-protocol',
      who + ' pauses over the offered gift. “Please explain what this represents.” The gesture is acknowledged, but acceptance is left open while local and official expectations are checked.',
      {}, { coaching: ['The value of a gift does not earn points. Explain intent and check applicable protocol; do not assume acceptance.'] }));
    if (has(act, 'alcohol-gift')) {
      const declined = /market/i.test(record.context.location || '') && speaker === 'produce vendor';
      findings.push(credit(record, act, 'alcohol-gift-response',
        who + (declined ? ' declines the bottle. The gift remains with the team; conversation can continue.' : ' asks to leave the bottle with the team while appropriate gift expectations are clarified. Acceptance has not been established.'), {},
        { giftResponses: [{ participant: speaker, status: declined ? 'declined' : 'not-accepted', item: 'alcohol', sourceActionId: record.id }],
          coaching: ['Respect the individual response and clarify applicable gift protocol. The gift itself earns no points.'] }));
    }
    if (has(act, 'respect-refusal') && site.giftResponses?.some(g => g.participant === speaker)) findings.push(credit(record, act, 'respect-gift-response',
      who + ' notices that you put the gift aside. The earlier answer has been respected, and the conversation can return to its purpose.', {}));
    if (has(act, 'rapport-intent')) findings.push(credit(record, act, 'rapport-intent',
      who + ' waits for you to give the conversation a direction. Building rapport is your purpose, not yet an established change in trust. You can explain why you came or ask what matters to this person.', {}));
    if (has(act, 'local-orientation')) findings.push(credit(record, act, 'local-orientation',
      'The interpreter stays alongside the team as you get your bearings. “I can help with language and local context. Let us check our impressions with the people who work here.” You remain responsible for the engagement; asking for orientation has not delegated leadership.\n\nThe wider scene is still open to you. No meeting has been recorded as missed, and the listed contact remains a possible next stop.',
      { initiative: 15, missionFocus: 10 }, { interpreterStatus: 'available', coaching: ['Orientation can support the mission. Distinguish an interpreter’s perspective from verified information and keep any actual appointments in view.'] }));
    if (has(act, 'community-rapport')) findings.push(credit(record, act, 'community-rapport',
      'At the stalls, the ordinary exchange gives the team a less formal way to begin conversation. A vendor acknowledges your interest, but a purchase alone does not establish trust or tell you how the wider community views the team.\n\nThere is an opening here: listen to what matters to the people you meet, rather than assuming the gesture achieved the sentiment you intended. The official contact has not been marked as neglected simply because you chose to start elsewhere.',
      { initiative: 10 }, { coaching: ['Goodwill is an intent, not a measured outcome. Look for voluntary engagement and contrasting perspectives; do not equate spending with favorable sentiment.'] }));
    if (has(act, 'meeting-request')) findings.push(credit(record, act, 'meeting-request',
      who + ' considers the proposed meeting. “I can see why you want the right people together. What decision should they be ready to discuss?” Interest is not a confirmed appointment: the invitation, availability and agenda still need agreement.\n\nThe request is now part of your field notes. You can refine the purpose here, identify who must attend, or return to gathering the evidence that would make the meeting useful.',
      { coordination: 15, initiative: 10 }, { coaching: ['A proposed meeting is not a completed engagement. Track the recipient, purpose, confirmation and follow-up.'] }));
    if (has(act, 'data-correction')) findings.push(credit(record, act, 'data-correction',
      who + ' looks carefully at the proposed correction. “If we change that figure, people will ask which count we trust. Show us the source and when it was collected.” The need to reconcile the estimate is acknowledged; no replacement number has been accepted as verified.\n\nThis is a question of evidence, not an apology. Comparing dates, coverage and counting methods is still work for the team.',
      { missionFocus: 10 }, { coaching: ['Retain the old and proposed figures, their sources and the basis for reconciliation. A request to correct data does not itself validate it.'] }));
    if (has(act, 'procurement-request')) findings.push(credit(record, act, 'procurement-request',
      who + ' becomes attentive at the mention of bids. “Is this an assessment of a need, or are you telling us work has been funded?” The distinction matters to the host. No contractor has been selected and no upgrade has been approved.\n\nYour proposal remains a coordination request. Clarifying the responsible contracting authority, scope and funding would keep a useful idea from becoming an expectation the team cannot meet.',
      { initiative: 10 }, { coaching: ['Seeking bids is not authority to award a contract. Clarify authority and funding without promising a project.'] }));
    if (has(act, 'public-communication')) findings.push(credit(record, act, 'public-communication',
      who + ' weighs the proposed announcement. “People will plan around what they hear. What can we say with confidence today?” A reliable schedule could help; announcing unconfirmed improvements could instead undermine trust.\n\nThe communication proposal is recorded for coordination. Nothing has been published, and local ownership, factual accuracy and the appropriate release channel still need confirmation.',
      { coordination: 10 }, { coaching: ['Separate confirmed service information from proposed projects. Coordinate the audience, local partners and release authority before publication.'] }));
    if (has(act, 'permission-request')) {
      const contact = has(act, 'contact') || act.protectedPopulation !== 'none';
      const observationRequested = !contact && /\b(?:inspect|observe|observation|walk|tour|visit)\b/.test(act.description);
      if (observationRequested) observationPermission = true;
      findings.push(credit(record, act, 'permission-request', who + ' considers the request. ' + (contact
        ? '“Let us agree on the purpose and speak with the responsible staff and participants first.” No contact has occurred and consent has not yet been granted.'
        : observationRequested ? knowledge.permission : '“Please continue with the purpose of your visit.” This permits conversation, not entry into restricted spaces or contact with protected groups.'),
      { professionalism: 25, coordination: 15 },
      { permissions: observationRequested ? ['escorted-observation'] : [] }));
    }
    if (has(act, 'contact') && !act.request && !act.conditional && (act.permission === 'stated' || (site.permissions || []).includes('supervised-contact'))) {
      findings.push(credit(record, act, 'supervised-contact', 'With the stated permission and supervision, the activity takes place within the agreed boundaries. ' + who + ' remains present and brings the group back to the engagement afterward.',
        { professionalism: 15, rapport: 15 }, { permissions: ['supervised-contact'] }));
    }
    if (has(act, 'inquiry') && !has(act, 'permission-request') && !has(act, 'interpreter-substitution')) {
      if (unavailable && !/\b(?:shared language|both speak|approved alternative)\b/i.test(record.rawText)) {
        findings.push(credit(record, act, 'communication-unresolved', who + ' cannot complete a reliable exchange while the interpreter remains excluded. The question is recorded as unanswered.', {}, { coaching: ['Restore language support or establish an approved shared-language arrangement.'] }));
      } else if (act.topic) {
        const prior = (site.claims || []).find(c => c.source === speaker);
        findings.push(credit(record, act, prior ? 'follow-up-inquiry' : 'focused-inquiry',
          who + ' says, “' + (prior ? speakerKnowledge.reply : speakerKnowledge.claim) + '” ' + (introduced ? '' : 'The host first asks the team to explain its purpose. ') + 'This remains an attributed account, not a confirmed fact.',
          introduced ? { informationCollection: prior ? 15 : 45, missionFocus: 20, rapport: 10 } : { informationCollection: 20 },
          { discoveries: [{ id: knowledge.id + ':' + speaker, text: prior ? speakerKnowledge.claim + ' ' + speakerKnowledge.reply : speakerKnowledge.claim, source: speaker, reliability: 'claim' }],
            gaps: { opened: [knowledge.issue], advanced: [], resolved: [] },
            leads: /\b(?:who else|source|depend|connect|lead|responsib|other)\w*\b/.test(act.description) && record.context.lead
              ? { opened: [{ ...record.context.lead, status: 'open' }], changed: [] } : undefined }));
        hasClaim = true;
      } else findings.push(credit(record, act, 'open-question', who + ' gives you the floor. “Are you asking about current service, the people who cannot reach it, or the records we keep?” No specific claim has been collected yet.', {}));
    }
    if (has(act, 'observation') && !act.request && !act.conditional) {
      const permission = act.permission === 'stated' || observationPermission;
      findings.push(credit(record, act, permission ? 'site-observation' : 'public-observation',
        permission ? knowledge.observation : 'From the public area, ' + knowledge.observation.replace(/^.{0,70}?, /, '') + ' The observation does not imply permission to enter restricted areas.',
        { informationCollection: permission ? 25 : 10, initiative: 25 },
        { discoveries: [{ id: knowledge.id + ':observation', text: knowledge.observation, source: 'Direct observation from permitted/public area', reliability: 'observation' }] }));
    }
    if (has(act, 'validation')) {
      const canCompare = hasClaim && act.method && !act.request;
      findings.push(credit(record, act, canCompare ? 'evidence-comparison' : 'validation-incomplete',
        canCompare ? 'The team compares the attributed account with the available record. ' + knowledge.record
          : who + (hasClaim ? ' asks which record, independent source, or observable condition you intend to compare. The existing claim stays unconfirmed.' : ' asks which claim you intend to test. A statement that validation occurred cannot supply the missing claim or evidence.'),
        canCompare ? { validation: 60, informationCollection: 15, missionFocus: 15 } : {},
        canCompare ? { discoveries: [{ id: knowledge.id + ':comparison', text: knowledge.record, source: 'Comparison with site record', reliability: 'partially-supported' }],
          gaps: { opened: [], advanced: [knowledge.issue], resolved: [] } } : {}));
    }
    if (has(act, 'coordination') && /\b(?:cmoc|s-9|command|authority|team leader|team chief|clinic|director|office|channel|chief|ig|inspector general)\b/i.test(act.description) && !record.evidence.claimedProducts.length) findings.push(credit(record, act, 'coordination',
      'The team records the issue and sends it through the stated coordination channel. ' + who + ' asks to be kept informed. Reporting the request does not establish that resources or assistance have been approved.',
      { coordination: 40, missionFocus: 20 }, { coaching: ['Track the recipient, unresolved questions, and requested follow-up.'] }));
    if (has(act, 'documentation') && !record.evidence.claimedProducts.length && !has(act, 'coordination')) findings.push(credit(record, act, 'field-notes',
      'The team adds the action and its sources to the field notes. Unconfirmed accounts remain labeled as claims; these notes do not create a submitted worksheet.',
      { initiative: 10 }));
    if (has(act, 'interpreter-support') && !any(record, 'interpreter-exclusion') && !any(record, 'interpreter-substitution')) {
      findings.push(credit(record, act, 'interpreter-support', 'The interpreter confirms the phrasing with you and remains available for the next exchange.',
        { coordination: 15 }, { interpreterStatus: 'available' }));
    }
  }
  return findings;
}

// Kept as named exports for consumers of the initial foundation contract.
export const seriousMisconductPolicy = conductPolicy;
export const FOUNDATION_POLICIES = [conductPolicy, engagementPolicy];

