import React from 'react';
import { marketCharacter, statesMarketPurpose } from './marketScene';
import MarketEvidenceExhibit from './MarketEvidenceExhibit';
import { absentVendorChoices } from './absentVendor';

// Original exercise navigation. All choices use the same adjudicator as typing.
export function marketInvestigationChoices(scenario, site = {}) {
  const evidence = site.evidence || [];
  const roles = scenario.keyStakeholders || [];
  const claims = site.claims || [];
  const observed = evidence.some(e => e.reliability === 'observation');
  const compared = evidence.some(e => e.reliability === 'partially-supported');
  const activeRole = roles.includes(site.conversationTarget) ? site.conversationTarget : roles[0];
  const activeName = marketCharacter(activeRole || 'local contact').name;
  const choices = [{ id: 'observe', title: observed ? 'Look again at the trading area' : 'Walk the public trading area',
    detail: 'Look beyond the conversation. What is happening in the stalls you can see?',
    text: 'I observe the stalls from the public trading area.', revisited: observed }];
  if (activeRole && !(site.engagedParticipants || []).includes(activeRole)) choices.unshift({
    id: 'introduce', title: `Approach ${activeName} and introduce your team`,
    detail: 'Use your contact notes to find the person, then explain why you came.',
    text: `I speak with ${activeName} and introduce our team. Our interpreter helps translate our introduction.`
  });
  if (activeRole && (site.engagedParticipants || []).includes(activeRole) && !(site.conversationEvents || []).some(event =>
    event.participant === activeRole && event.kind === 'opening' && statesMarketPurpose({ kinds: ['introduction'], description: event.subject }))) choices.unshift({
    id: 'purpose', title: 'Explain why your team came',
    detail: `Give ${activeName} a reason for the conversation before asking for an account.`,
    text: `I explain our purpose to ${activeName}: we want to understand trading conditions and listen to the vendors.`
  });
  const unheard = roles.find(role => !claims.some(c => c.source === role));
  if (unheard) choices.push({ id: 'perspective', title: `Hear ${marketCharacter(unheard).name}’s perspective`,
    detail: 'Another account may complicate the picture rather than settle it.',
    text: `I ask ${marketCharacter(unheard).name} about current trading conditions and who is affected.` });
  if (claims.length) choices.push({ id: 'compare', title: compared ? 'Revisit the register comparison' : 'Compare the account with the stall register',
    detail: 'Test what an allocated stall tells you about whether someone is actually trading.',
    text: 'I compare the reported trading conditions with the stall register.', revisited: compared });
  if (roles.includes('market association chair')) choices.push({ id: 'absent', title: 'Try to reach the missing voices',
    detail: 'Ask Mali to help arrange a conversation. Availability is not guaranteed.',
    text: 'I request a meeting with Mali and the absent stallholders to discuss the unresolved market concerns.',
    revisited: (site.followUpRequests || []).some(r => /absent stallholders/.test(r.description)) });
  return choices;
}

export default function MarketInvestigation({ scenario, site, world, onAct, onProduct, disabled }) {
  const choices = [...marketInvestigationChoices(scenario, site), ...absentVendorChoices(scenario, site, world)];
  return <details open className="bg-slate-800 rounded-lg border border-slate-600 p-4 my-4" aria-label="Market investigation">
    <summary className="font-bold text-amber-200 cursor-pointer">Follow the story · Choose an investigation</summary>
    <p className="text-slate-300 my-3">There is no prescribed order. Choose a thread to pursue, or write your own action below.</p>
    <div className="grid sm:grid-cols-2 gap-3">{choices.map(choice => <button key={choice.id} disabled={disabled} onClick={() => onAct(choice.text)} className="text-left rounded border border-slate-500 p-4 hover:bg-slate-700 disabled:opacity-40"><strong>{choice.title}</strong><span className="block text-sm mt-2">{choice.detail}</span>{choice.revisited && <span className="block text-xs text-amber-200 mt-2">Already explored · repeating this is not independent evidence</span>}</button>)}</div>
    {(site.claims || []).length > 0 && <button disabled={disabled} onClick={onProduct} className="mt-4 underline text-cyan-200">Decide what to report · Create a Product</button>}
    <MarketEvidenceExhibit scenario={scenario} site={site} />
  </details>;
}
