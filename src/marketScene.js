import { knowledgeFor, sentenceCase } from './sceneKnowledge';

// Original fictional character design, not Thai cultural doctrine. Roles stay
// the canonical keys for saves, scoring and source attribution.
const cast = {
  'market association chair': { name: 'Mali', portrait: '/art/mali-v1.png', introduction: 'Market association chair', interest: 'Wants the people behind the trading figures to be heard.' },
  'transport cooperative representative': { name: 'Niran', portrait: '/art/niran-v1.png', introduction: 'Transport cooperative representative', interest: 'Wants practical questions about access and the movement of goods.' },
  'produce vendor': { name: 'Dao', portrait: null, introduction: 'Produce vendor', interest: 'Wants space to describe daily trading without speaking for every vendor.' },
  'municipal licensing officer': { name: 'Kiet', portrait: null, introduction: 'Municipal licensing officer', interest: 'Wants records interpreted within what they actually measure.' }
};
export const isMarket = scenario => /market/i.test(`${scenario?.metadata?.site || ''} ${scenario?.siteType || ''} ${scenario?.location || ''}`);
export function marketCharacter(role) { return { role, ...(cast[String(role).toLowerCase()] || { name: sentenceCase(role), portrait: null, introduction: sentenceCase(role), interest: 'An individual perspective—not a substitute for other sources.' }) }; }
export function resolveMarketName(text, stakeholders) {
  return stakeholders.filter(role => cast[role]?.name && new RegExp('\\b' + cast[role].name.toLowerCase() + '\\b').test(text));
}

// Presentation changes may replace phrasing, but never scoring, discovered
// evidence, conditions, permissions or the success/failure of an act.
export function authorMarketReactions(record, findings, world) {
  if (!isMarket(record.context) || record.kind !== 'action' || findings.some(f => ['concern', 'serious', 'critical'].includes(f.severity)) || world.interpreterStatus === 'excluded') return findings;
  const site = world.sites?.[record.scenarioId] || {};
  const guarded = (world.persistentConditions || []).some(c => c.status !== 'resolved');
  const knowledge = knowledgeFor(record.context);
  return findings.map(finding => {
    const act = record.understanding.actions.find(a => finding.acceptedActs?.includes(a.id));
    if (!act) return finding;
    const host = marketCharacter(act.target);
    const voice = knowledgeFor(record.context, act.target);
    const who = `${host.name} (${host.role})`;
    let reaction, dialogue, limit;
    if (finding.id === 'constructive-engagement-opening') {
      const known = site.engagedParticipants?.includes(act.target);
      reaction = guarded ? `${host.name} listens, but the earlier incident keeps the exchange guarded.` : known ? `${host.name} recognizes the team. The conversation resumes without another round of formal introductions.` : `${host.name} turns away from the flow of market traffic to give the team a hearing. The welcome is attentive rather than unreserved.`;
      const openings = {
        'produce vendor': 'I can speak while I tend the stall. Tell me what brought you here, and please ask before making my experience stand for everyone else.',
        'transport cooperative representative': 'You can learn something from this entrance, but not everything. What are you hoping to understand about how people reach the market?',
        'municipal licensing officer': 'I can help you understand the register. First, what question are you trying to answer? A number can be accurate and still answer the wrong question.',
        'market association chair': 'Before you decide what this market needs, tell me what you came to learn. Whose account will you listen to?'
      };
      dialogue = known ? 'We have made a start. What do you want to follow up before you leave?' : openings[host.role] || 'What would you like to understand about my work here?';
      limit = 'The opening establishes contact, not agreement or a verified finding.';
    } else if (finding.id === 'alcohol-gift-response') {
      const prior = site.giftResponses?.some(g => g.participant === act.target);
      const declined = finding.giftResponses?.[0]?.status === 'declined';
      reaction = prior ? `${host.name} looks at the bottle again. The earlier answer has not changed.` : `${host.name} pauses as you offer the bottle. The gesture draws attention, but an offered gift is not an accepted one.`;
      dialogue = declined ? 'Thank you for thinking of me, but please keep it. You do not need to bring something to speak with me.' : 'Before I accept anything, let us be clear about the reason for your visit and the expectations around gifts. Please keep it with you for now.';
      limit = declined ? 'Dao leaves the bottle with the team and makes space beside the counter for the conversation. Her refusal concerns this gift; it does not close the engagement. You can acknowledge her answer and explain what you hope to learn.' : 'The bottle remains with the team. You can continue talking without making acceptance a condition of the exchange.';
    } else if (finding.id === 'respect-gift-response') {
      reaction = `${host.name} notices that you respect the earlier answer. The gift no longer needs to be the subject of the exchange.`;
      dialogue = 'Thank you for understanding. What would you like to ask about our work here?';
      limit = 'The earlier gift response remains in the record. Respecting it creates room to continue, not automatic trust or new evidence.';
    } else if (finding.id === 'rapport-intent') {
      reaction = `${host.name} leaves a pause for you to speak. A conversation needs more than an intention to build rapport; it needs something the other person can respond to.`;
      dialogue = /vendor/.test(host.role) ? 'I can talk while I work. Are you interested in my stall, or are you asking about the whole market?' : 'Tell me a little about why your team is here. What are you hoping we can understand together?';
      limit = 'Your intent is acknowledged. The next question or explanation will shape the exchange; wider sentiment has not been measured.';
    } else if (['focused-inquiry', 'follow-up-inquiry'].includes(finding.id)) {
      const introduced = site.engagedParticipants?.includes(act.target) || findings.some(f => f.id === 'constructive-engagement-opening' && f.engagedParticipants?.includes(act.target));
      reaction = `${host.name} weighs the question. ${!introduced ? 'Before going further, the host asks the team to explain its purpose. ' : ''}${/transport/.test(host.role) ? 'The answer returns to the difference between movement through the market and who can actually take part.' : 'The answer shifts attention from the summary to the people it may leave out.'}`;
      const previous = (site.conversationEvents || []).filter(e => e.participant === act.target && e.kind === 'inquiry');
      if (previous.length > 1) reaction = `${host.name} returns to the limits already discussed. Repeating the question has not produced an independent source or established a cause.`;
      dialogue = finding.id === 'follow-up-inquiry' ? voice.reply : voice.claim;
      limit = `${sentenceCase(host.role)} is the source of this attributed account. It remains a claim, not a confirmed cause. You can ask for another perspective, examine what the register measures, or observe the public trading area.`;
    } else if (finding.id === 'evidence-comparison') {
      reaction = 'The team sets the attributed account beside the available record. ' + knowledge.record;
      dialogue = 'That is what the book can tell you. Please do not make it say why someone is absent when it never recorded the reason.';
      limit = 'The comparison advances the question; it does not settle the cause of the closures.';
    } else if (finding.id === 'courtesy-apology' || finding.id === 'accountability') {
      reaction = guarded ? `${host.name} acknowledges the apology without treating the earlier conduct as undone.` : `${host.name} gives the apology a moment, then makes room to continue.`;
      dialogue = guarded ? 'I hear you. What matters now is what happens next—and whether you follow through.' : 'Thank you for saying that. Let us return to what you wanted to understand.';
      limit = guarded ? 'Recorded restrictions and consequences remain. Courtesy begins a conversation about repair; it does not complete it.' : 'The conversation is open again. No new information or agreement has been established by the apology alone.';
    } else if (finding.id === 'meeting-request') {
      reaction = `${host.name} considers the proposed meeting. There is interest in the purpose, but no appointment has been agreed.`;
      dialogue = 'Who needs to be in that conversation, and what should they be ready to decide? I do not want people leaving their work for a meeting with no clear purpose.';
      limit = 'The request is recorded as unconfirmed. Availability, participants and timing still need coordination; nobody has been marked late or absent.';
    }
    if (!reaction) return finding;
    const translation = finding.id === 'constructive-engagement-opening' && record.understanding.interpreterRole === 'supporting' ? ' The interpreter translates in short sections while the Soldier leads.' : '';
    return { ...finding, effects: [`${reaction}${translation}\n\n${who} says, “${dialogue}”\n\n${limit}`] };
  });
}

export function marketFollowUps(record, update) {
  if (!isMarket(record.context) || update.severity !== 'none') return [];
  return record.understanding.actions.filter(a => update.acceptedActs.includes(a.id) && a.kinds?.some(k => ['meeting-request', 'procurement-request', 'public-communication'].includes(k)))
    .map(a => ({ id: record.id + ':' + a.id, scenarioId: record.scenarioId, description: a.description, status: 'Requested — not confirmed', sourceActionId: record.id }));
}

// Event memory is derived only from accepted actions after adjudication. It is
// not a second evaluator and cannot create evidence, permission or credit.
export function marketConversationEvents(record, update) {
  if (!isMarket(record.context) || update.severity !== 'none') return [];
  return record.understanding.actions.filter(a => update.acceptedActs.includes(a.id) && !a.negated && !a.hypothetical && !a.reporting)
    .filter(a => a.kinds?.some(k => ['inquiry', 'introduction', 'conversation-opening', 'meeting-request', 'alcohol-gift', 'respect-refusal'].includes(k)))
    .map(a => ({ id: record.id + ':' + a.id, participant: a.target, sourceActionId: record.id,
      kind: a.kinds.includes('inquiry') ? 'inquiry' : a.kinds.includes('meeting-request') ? 'request' : a.kinds.includes('alcohol-gift') ? 'gift' : a.kinds.includes('respect-refusal') ? 'acknowledgment' : 'opening',
      subject: a.description, evidenceIds: update.discoveries.filter(d => d.source === a.target).map(d => d.id) }));
}

// Quotes are shown verbatim, never synthesized from a score or mood number.
export function conversationParagraphs(text = '') {
  return text.split(/\n\n+/).filter(Boolean).map(paragraph => {
    const match = paragraph.match(/^(.+?) says, “([^”]+)”$/);
    return match ? { type: 'dialogue', speaker: match[1], text: match[2] } : { type: 'narration', text: paragraph };
  });
}
