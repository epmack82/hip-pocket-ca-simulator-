import React, { useState } from 'react';
import { clinicTopics } from './clinicDialogue';

export default function ClinicConversationPanel({ scenario, site = {}, onSay, disabled }) {
  const people = (scenario.keyStakeholders || []).filter(p => /nurse|director/i.test(p));
  const [chosen, setChosen] = useState(null);
  const person = people.includes(chosen) ? chosen : people.includes(site.conversationTarget) ? site.conversationTarget : people[0];
  if (!person) return null;
  const turns = site.clinicTurns || [];
  const heardBoth = people.length > 1 && people.every(p => turns.some(t => t.speaker === p.toLowerCase()));
  const history = site.history || [];
  return <section aria-label="Clinic conversation" className="bg-slate-950/70 rounded-lg border border-teal-600 p-5 mb-5">
    <h2 className="text-teal-200 text-xl font-bold">Continue the conversation</h2>
    <p className="text-sm text-slate-300 mt-2">Choose what to say, or write your own action below. Each choice is recorded as your action; it does not end the visit.</p>
    <label className="block text-slate-200 mt-4">Speaking with
      <select aria-label="Clinic conversation partner" value={person} onChange={e => setChosen(e.target.value)} className="block w-full bg-slate-800 p-3 rounded mt-2">
        {people.map(p => <option key={p} value={p}>{p}</option>)}
      </select>
    </label>
    <p className="text-sm text-teal-200 my-3">{/director/i.test(person) ? 'Clinic director · Responsible for the service picture and how recommendations represent the clinic.' : 'Senior nurse · A perspective from the waiting area and daily care.'}</p>
    <div role="log" aria-label="Clinic conversation journal" aria-live="polite" className="max-h-96 overflow-y-auto space-y-4 my-4">
      {!history.length && <p className="text-slate-400">The conversation has not started. Introduce your team or begin with a question.</p>}
      {history.slice(-4).map((turn, index) => <article key={turn.actionRecordId} className="border-l-2 border-teal-600 pl-4">
        <p className="text-sm text-teal-200">You: {site.actions?.[history.length - Math.min(history.length, 4) + index]}</p>
        <p className="text-slate-100 whitespace-pre-wrap mt-2">{turn.effects.join('\n\n')}</p>
      </article>)}
    </div>
    <div className="grid sm:grid-cols-2 gap-2">
      {!(site.engagedParticipants || []).includes(person) && <button disabled={disabled} className="text-left border border-teal-700 rounded p-3 text-white hover:bg-teal-900" onClick={() => onSay(`I introduce the team to the ${person}.`)}>Introduce your team</button>}
      {clinicTopics.filter(t => t.id !== 'difference' || heardBoth).map(t => <button key={t.id} disabled={disabled} className="text-left border border-slate-600 rounded p-3 text-white hover:bg-slate-700" onClick={() => onSay(`I ask the ${person} ${t.question}.`)}>
        {t.label}{turns.some(p => p.speaker === person.toLowerCase() && p.topics.includes(t.id)) && <span className="block text-xs text-teal-200 mt-1">Revisit earlier topic</span>}
      </button>)}
    </div>
    {history.length > 4 && <details className="text-slate-300 mt-4"><summary>Earlier exchanges ({history.length - 4})</summary>{history.slice(0, -4).map((turn, i) => <p key={turn.actionRecordId} className="whitespace-pre-wrap mt-3">You: {site.actions?.[i]}{'\n'}{turn.effects.join('\n\n')}</p>)}</details>}
  </section>;
}
