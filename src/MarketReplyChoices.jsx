import React from 'react';
import { isMarket, marketCharacter, hasAnsweredMarketQuestion } from './marketScene';

const options = {
  'produce vendor': [
    ['Keep her account attributed', 'I will report what you told me as your account, not as a finding about every vendor.', 'That is what I wanted to hear. Let my words be mine. If another vendor tells you something different, please give them the same chance you gave me.'],
    ['Explain that you still need other accounts', 'I cannot draw a conclusion yet. I need to hear from other vendors before I recommend anything.', 'Then we understand each other. I can tell you about my experience, but I cannot finish the other conversations for you.']
  ],
  'market association chair': [
    ['Make room for absent voices', 'I will keep the absent owners’ circumstances unresolved until we can hear their accounts.', 'Good. An empty place in a meeting is easy to overlook. Please leave that question open in your report rather than filling it with my answer.'],
    ['Be honest about limited time', 'Our visit time is limited. I will record whose perspective we could not obtain for the next team.', 'I would prefer that you heard them yourself. But if you cannot, tell the next team who is missing. Do not leave them a report that sounds finished.']
  ],
  'transport cooperative representative': [
    ['Focus on individual access', 'I want to understand whether individual vendors can bring their stock here, not just whether the entrance is open.', 'Then ask about their journeys. I can explain the transport perspective, but a route and a person using it are not the same story.'],
    ['Separate the two questions', 'I will keep route access separate from each vendor’s ability to use it.', 'Yes. Keep those questions separate long enough to hear the answers. Otherwise an open entrance can become a very misleading conclusion.']
  ],
  'municipal licensing officer': [
    ['Clarify what the register measures', 'I want to establish allocated spaces first, then compare that with observations of trading.', 'That is a question the register can help with. The comparison still needs your observations; the entries cannot make them for you.'],
    ['Ask about the missing explanation', 'I need to understand why owners are absent, and I recognize the register cannot explain that.', 'Then we have found the edge of what this record can do. You will need those people’s accounts, not a stronger claim from me.']
  ]
};
export function availableMarketReplies(scenario, site = {}) {
  if (!isMarket(scenario)) return [];
  const events = site.conversationEvents || [];
  const participant = site.conversationTarget || events[events.length - 1]?.participant;
  if (hasAnsweredMarketQuestion(site, participant)) return [];
  const event = [...events].reverse().find(e => e.kind === 'inquiry' && e.participant === participant);
  if (!event || (event.evidenceIds && !event.evidenceIds.length) || site.conversationEvents.some(e => e.replyTo === event.id)) return [];
  return (options[event.participant] || []).map(([label, statement, answer], index) => ({ id: `${event.id}:reply-${index}`, replyTo: event.id, role: event.participant, label, answer,
    text: `I tell ${marketCharacter(event.participant).name}: “${statement}”` }));
}
export function resolveMarketReply(input, scenario, world) {
  if (input.kind !== 'action') return null;
  return availableMarketReplies(scenario, world.sites?.[input.scenarioId]).find(choice => choice.text === input.rawText) || null;
}
export default function MarketReplyChoices({ scenario, site, onSay, disabled }) {
  const choices = availableMarketReplies(scenario, site);
  if (!choices.length) return null;
  return <section aria-label="Answer the market character" className="bg-slate-800 rounded-lg p-5 my-4"><h3 className="font-bold text-amber-200">Answer {marketCharacter(choices[0].role).name}</h3><p className="text-sm text-slate-300 mb-3">Choose a reply, or describe your own action below.</p><div className="grid gap-3">{choices.map(choice => <button key={choice.id} disabled={disabled} onClick={() => onSay(choice.text)} className="text-left border border-slate-500 rounded p-3"><strong>{choice.label}</strong><span className="block text-sm mt-1">{choice.text}</span></button>)}</div></section>;
}
