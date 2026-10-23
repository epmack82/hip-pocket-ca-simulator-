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
    const who = `${host.name} (${host.role})`;
    let reaction, dialogue, limit;
    if (finding.id === 'constructive-engagement-opening') {
      const known = site.engagedParticipants?.includes(act.target);
      reaction = guarded ? `${host.name} listens, but the earlier incident keeps the exchange guarded.` : known ? `${host.name} recognizes the team. The conversation resumes without another round of formal introductions.` : `${host.name} turns away from the flow of market traffic to give the team a hearing. The welcome is attentive rather than unreserved.`;
      dialogue = known ? 'We have made a start. What do you want to follow up before you leave?' : /transport/.test(host.role) ? 'You can learn something from this entrance, but not everything. What are you hoping to understand about how people reach the market?' : 'Before you decide what this market needs, tell me what you came to learn. Whose account will you listen to?';
      limit = 'The opening establishes contact, not agreement or a verified finding.';
    } else if (['focused-inquiry', 'follow-up-inquiry'].includes(finding.id)) {
      const introduced = site.engagedParticipants?.includes(act.target) || findings.some(f => f.id === 'constructive-engagement-opening' && f.engagedParticipants?.includes(act.target));
      reaction = `${host.name} weighs the question. ${!introduced ? 'Before going further, the host asks the team to explain its purpose. ' : ''}${/transport/.test(host.role) ? 'The answer returns to the difference between movement through the market and who can actually take part.' : 'The answer shifts attention from the summary to the people it may leave out.'}`;
      dialogue = finding.id === 'follow-up-inquiry' ? knowledge.reply : knowledge.claim;
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

// Quotes are shown verbatim, never synthesized from a score or mood number.
export function conversationParagraphs(text = '') {
  return text.split(/\n\n+/).filter(Boolean).map(paragraph => {
    const match = paragraph.match(/^(.+?) says, “([^”]+)”$/);
    return match ? { type: 'dialogue', speaker: match[1], text: match[2] } : { type: 'narration', text: paragraph };
  });
}
