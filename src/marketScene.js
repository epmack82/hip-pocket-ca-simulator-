import { knowledgeFor, sentenceCase } from './sceneKnowledge';
import { marketInquiryBeat } from './marketStoryBeats';

// Original fictional character design, not Thai cultural doctrine. Roles stay
// the canonical keys for saves, scoring and source attribution.
const cast = {
  'market association chair': { name: 'Mali', portrait: '/art/mali-v1.png', introduction: 'Market association chair', interest: 'Wants the people behind the trading figures to be heard.' },
  'transport cooperative representative': { name: 'Niran', portrait: '/art/niran-v1.png', introduction: 'Transport cooperative representative', interest: 'Wants practical questions about access and the movement of goods.' },
  'produce vendor': { name: 'Dao', portrait: '/art/dao-v1.png', introduction: 'Produce vendor', interest: 'Wants space to describe daily trading without speaking for every vendor.' },
  'municipal licensing officer': { name: 'Kiet', portrait: null, introduction: 'Municipal licensing officer', interest: 'Wants records interpreted within what they actually measure.' }
};
export const isMarket = scenario => /market/i.test(`${scenario?.metadata?.site || ''} ${scenario?.siteType || ''} ${scenario?.location || ''}`);
export function marketCharacter(role) { return { role, ...(cast[String(role).toLowerCase()] || { name: sentenceCase(role), portrait: null, introduction: sentenceCase(role), interest: 'An individual perspective—not a substitute for other sources.' }) }; }
export function resolveMarketName(text, stakeholders) {
  return stakeholders.filter(role => cast[role]?.name && new RegExp('\\b' + cast[role].name.toLowerCase() + '\\b').test(text));
}

// A concrete explanation, not merely the words "explain my purpose".
export function statesMarketPurpose(act = {}) {
  return act.kinds?.includes('introduction') && !act.negated && !act.hypothetical && !act.reporting
    && /\b(?:understand|learn|listen|assess|document)\b/.test(act.description || '')
    && /\b(?:trading|market|vendors?|livelihoods?|access|conditions)\b/.test(act.description || '');
}

// The authored reciprocal question is currently one per character, not a new
// question every time the player repeats an inquiry.
export function hasAnsweredMarketQuestion(site = {}, participant) {
  const events = site.conversationEvents || [];
  const inquiries = new Set(events.filter(event => event.kind === 'inquiry' && event.participant === participant).map(event => event.id));
  return events.some(event => event.participant === participant && inquiries.has(event.replyTo));
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
      const lastQuestion = [...(site.conversationEvents || [])].reverse().find(event => event.participant === act.target && event.kind === 'inquiry');
      if (known && lastQuestion && !guarded) {
        const answered = (site.conversationEvents || []).some(event => event.replyTo === lastQuestion.id);
        dialogue = answered ? 'We have already talked about what you will carry away from this conversation. Is there something else you want to ask me, or something you need to check?' : 'Before you go, there was something I asked you. We can come back to that, or you can tell me what else you need to understand.';
        limit = answered ? 'Your earlier exchange remains in the journal. Returning does not create a new source or confirm the earlier account.' : 'The earlier question is still available to answer. You can pick up that thread without collecting the same account again.';
      }
      if (!known && !guarded && host.role === 'market association chair') {
        reaction = 'You approach the woman with the folder and introduce the team. She finishes a sentence to the vendor beside her, then turns toward you. Up close, the folder is worn at its corners; she keeps it tucked against her side rather than offering it over.';
        dialogue = 'Yes, I am Mali. I help coordinate the market association. What brings your team here today?';
        limit = 'Mali gives you her attention. Behind her, the vendor returns to work. There is room to begin a conversation, but you have not yet heard her account of the market.';
      }
      if (!known && !guarded && host.role === 'produce vendor') {
        reaction = 'Dao moves a basket away from the edge of her stall as you approach. She lets you finish the introduction, then glances toward the shoppers passing behind you. You step aside so the counter stays clear.';
        dialogue = 'I am Dao. You can talk to me here, but I need to keep serving people. What did you come to ask?';
        limit = 'She stays behind her counter. You have her attention between customers, not an appointment that stops her working day.';
      }
      if (!known && !guarded && host.role === 'transport cooperative representative') {
        reaction = 'Niran waits for a handcart to pass before turning toward your team. He listens to the introduction without interrupting, then shifts out of the loading lane to make space for the conversation.';
        dialogue = 'Niran. I represent the transport cooperative. Are you looking for someone, or do you want to talk about moving goods?';
        limit = 'He has told you his role, not yet his account. You can explain your purpose without committing the team to a solution.';
      }
      if (statesMarketPurpose(act)) {
        reaction = guarded ? `${host.name} listens to your explanation, still guarded after the earlier incident.` : `${host.name} waits for you to finish explaining why the team came. The conversation now has a subject, rather than just a set of introductions.`;
        dialogue = host.role === 'market association chair'
          ? 'All right. You want to understand what is happening here. Where would you like to begin—with my account, with the vendors, or by looking around? Do not let my answer become everybody’s answer.'
          : host.role === 'produce vendor'
            ? 'Then start with my stall. I can tell you about my own day. If you want to know why someone else is missing, you will need to hear from them too.'
            : host.role === 'transport cooperative representative'
              ? 'All right. I can speak about transport. Keep the road being open separate from a vendor being able to use it. Which part do you want to understand first?'
              : 'That helps me understand why you came. What would you like to know about my part in the market?';
        limit = 'You have explained your purpose. No assistance has been promised, and no finding has been established by this exchange.';
      }
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
      const previous = (site.conversationEvents || []).filter(e => e.participant === act.target && e.kind === 'inquiry');
      const beat = marketInquiryBeat(host.role, previous.length);
      reaction = beat?.reaction || `${host.name} considers your question before answering.`;
      if (!introduced) reaction += ' Before you part, you still need to explain what your team hopes to do with this information.';
      dialogue = finding.id === 'follow-up-inquiry' ? voice.reply : voice.claim;
      const answered = hasAnsweredMarketQuestion(site, act.target);
      if (beat && !answered) dialogue += ` ${beat.question}`;
      limit = beat?.closing || `${host.name} waits for your next question.`;
      if (answered) limit = `${host.name} remembers your earlier reply. You can seek a different source, compare the account with a record, or ask a more specific question.`;
      if (previous.some(event => event.subject === act.description)) {
        reaction = `${host.name} recognizes the question you asked earlier and takes a moment before answering again.`;
        limit += ' This is the same person’s account, not independent confirmation.';
      }
    } else if (finding.id === 'open-question') {
      reaction = `${host.name} pauses, giving you room to make the question more specific.`;
      dialogue = 'Which part would you like to talk about—my work here, what has changed, or who else you should speak with?';
      limit = 'No account has been added yet. Choose a subject, or explain the part you want clarified.';
    } else if (finding.id === 'gift-protocol') {
      reaction = `${host.name} pauses at the mention of a gift. For a moment, the conversation is no longer about the market.`;
      dialogue = 'What did you have in mind? Please tell me before we go further. I would rather understand the gesture than misunderstand what you expect in return.';
      limit = 'The offer remains open. Nothing has been accepted; you can explain the gift or set it aside and continue the conversation.';
    } else if (['site-observation', 'public-observation'].includes(finding.id)) {
      const approach = site.engagedParticipants?.length ? 'You turn from the conversation toward the trading area.' : 'You move from the entrance into the public trading area, keeping clear of the handcarts.';
      return { ...finding, effects: [`${approach} For a moment, there is no one explaining the scene for you.\n\n${knowledge.observation}\n\nThe contrast is visible. Its cause is not. A closed stall cannot tell you whether its owner lacks stock, cannot reach the market, or has another reason for staying away. Those are questions to investigate, not conclusions to put in someone else’s mouth.`] };
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
