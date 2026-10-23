import React, { useState } from 'react';
import { marketCharacter } from './marketScene';

export function marketActionDraft(role, kind) {
  const name = marketCharacter(role).name;
  return {
    introduce: `I greet ${name} and introduce our team through the interpreter.`,
    ask: `I ask ${name} about current trading conditions and who is affected.`,
    records: `I ask ${name} what the market records can tell us about service conditions.`,
    coordinate: `I request a meeting with ${name} to discuss the unresolved market concerns.`
  }[kind] || '';
}

export default function MarketActionHelper({ stakeholders = [], onDraft }) {
  const [person, setPerson] = useState('');
  const [kind, setKind] = useState('introduce');
  return <details className="mb-4 border border-slate-500 rounded p-3 text-slate-200">
    <summary className="cursor-pointer font-semibold">Optional conversation starter</summary>
    <p className="text-sm my-3">Choose who to address and add an editable opening. This does not submit an action or guarantee an outcome. You can still write freely.</p>
    <label className="block mb-2">Person <select className="bg-slate-900 p-2 ml-2" value={person} onChange={e => setPerson(e.target.value)}><option value="">Choose a person</option>{stakeholders.map(role => <option key={role} value={role}>{marketCharacter(role).name} · {role}</option>)}</select></label>
    <label className="block mb-3">Approach <select className="bg-slate-900 p-2 ml-2" value={kind} onChange={e => setKind(e.target.value)}><option value="introduce">Introduce the team</option><option value="ask">Ask about trading</option><option value="records">Ask about records</option><option value="coordinate">Propose follow-up</option></select></label>
    <button type="button" disabled={!stakeholders.includes(person)} onClick={() => onDraft(marketActionDraft(person, kind))} className="rounded bg-slate-700 p-2 disabled:opacity-50">Add to my draft</button>
  </details>;
}
