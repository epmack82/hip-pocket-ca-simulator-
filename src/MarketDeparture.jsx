import React from 'react';
import { buildValidationBrief } from './siteProgression';
import { marketCharacter } from './marketScene';

export function marketHandover(site = {}) {
  const validation = buildValidationBrief(site);
  return {
    accounts: validation.claims,
    gaps: validation.gaps,
    replies: (site.conversationEvents || []).filter(e => e.kind === 'reply').map(e => ({ person: marketCharacter(e.participant).name, text: e.subject })),
    requests: (site.followUpRequests || []).filter(r => r.status !== 'completed'),
    products: site.completedProducts || [],
    voices: [...new Set((site.conversationEvents || []).filter(e => e.kind === 'inquiry').map(e => marketCharacter(e.participant).name))]
  };
}

export default function MarketDeparture({ site, onReturn, onLeave, onSave }) {
  const handover = marketHandover(site);
  return <main className="min-h-screen bg-slate-900 text-slate-100 p-6"><div className="max-w-3xl mx-auto space-y-6">
    <header><p className="text-amber-200">Before you leave · Central Market</p><h1 className="text-3xl font-bold">What you carry out of the market</h1></header>
    <p className="text-lg leading-relaxed">The market does not stop when your conversation does. Your team has another decision to make: stay a little longer, or carry this unfinished picture back into the larger mission.</p>
    <p>{handover.voices.length ? `You have heard from ${handover.voices.join(', ')}. Their accounts travel with you, but none can speak for everyone you have not met.` : 'You have not recorded a substantive account here. There is still time to ask a question before you leave.'}</p>
    <section className="bg-slate-800 rounded-lg p-5"><h2 className="font-bold text-xl">Your handover at a glance</h2><p className="mt-2">{handover.accounts.length} attributed accounts · {handover.gaps.length} open questions · {handover.products.length} products recorded</p>
      <details className="mt-4"><summary className="cursor-pointer">Review accounts and unanswered questions</summary><h3 className="font-bold mt-3">Accounts—not independently confirmed</h3><ul>{handover.accounts.map((text, i) => <li key={i} className="mt-2">{text}</li>)}</ul><h3 className="font-bold mt-3">Still unresolved</h3><ul>{handover.gaps.map((text, i) => <li key={i} className="mt-2">{text}</li>)}</ul></details>
    </section>
    {handover.replies.length > 0 && <details className="bg-slate-800 rounded-lg p-5"><summary className="cursor-pointer font-bold">What you told people you would do</summary><p className="text-sm text-slate-300 mt-2">These are your recorded statements, not proof that you followed through.</p>{handover.replies.map((reply, i) => <p className="mt-3" key={i}><strong>To {reply.person}:</strong> {reply.text}</p>)}</details>}
    {handover.requests.length > 0 && <p className="text-amber-100">{handover.requests.length} coordination request(s) remain in the record. A request is not a confirmed appointment.</p>}
    <p className="text-slate-300">Leaving does not resolve open questions or automatically penalize them. Your recorded work will remain with this mission.</p>
    <div className="flex flex-wrap gap-3"><button onClick={onReturn} className="bg-slate-700 px-5 py-3 rounded">Stay & Continue Conversation</button><button onClick={onLeave} className="bg-green-700 px-5 py-3 rounded">Leave Market & Continue Mission</button><button onClick={onSave} className="border border-slate-500 px-5 py-3 rounded">Save & Exit</button></div>
  </div></main>;
}
