import React from 'react';
export default function ChiefPlanningScreen({ plan, onChange, onContinue, onSave, visits, destinations }) {
  const ready = ['priority', 'approach', 'coordination', 'collection', 'rationale'].every(k => plan[k]?.trim());
  const fields = [
    ['priority', 'Your priority', 'Which civil information gap should the team address first, and what command decision will it support?'],
    ['approach', 'Compare approaches', 'Compare a service-focused route with a community-access route. What would each reveal or leave unknown?'],
    ['coordination', 'Team responsibilities', 'Assign engagement leadership, interpreter liaison, note-taking and local coordination. Retain Soldier responsibility for decisions.'],
    ['collection', 'Collection and handover', 'What evidence and products will you seek? What requires confirmation, and what will you hand over if time runs out?'],
    ['rationale', 'Your recommendation to the commander', 'Recommend an approach, explain the tradeoff, and identify guidance or authority you still need.']
  ];
  return <main className="min-h-screen bg-slate-950 text-slate-100 p-6"><div className="max-w-4xl mx-auto space-y-6">
    <header><p className="text-amber-300 uppercase tracking-wide">Team Chief · Pre-deployment</p><h1 className="text-4xl font-bold mt-3">Before the team steps off</h1><p className="mt-4 text-lg leading-relaxed">The map is still on the briefing-room wall. Your sergeant sets a blank notebook beside it. “We can cover {visits} locations, Chief. There are {destinations} on the board. What are we trying to learn—and what are we willing to leave for the next team?”</p></header>
    <section className="rounded-xl border border-blue-700 bg-blue-950/40 p-5"><h2 className="font-bold text-xl">Fictional exercise guidance</h2><p className="mt-2">Prepare an initial civil-service and access assessment. Distinguish local accounts from verified evidence, coordinate visits through responsible contacts, and report gaps to the supported staff. Do not assume contracting, funding or public-announcement authority. The field-visit budget includes travel, coordination and reporting time.</p><p className="text-blue-200 text-sm mt-3">This is a focused planning rehearsal, not full MDMP or an approved operations order. Written reasoning is retained for AAR review, not automatically graded. No team composition changes are made here.</p></section>
    {fields.map(([key, label, hint]) => <label key={key} className="block bg-slate-800 border border-slate-600 rounded-xl p-5"><span className="font-bold text-xl">{label}</span><span className="block text-slate-300 my-2">{hint}</span><textarea rows={3} maxLength={4000} value={plan[key]} onChange={e => onChange({ ...plan, [key]: e.target.value })} className="w-full bg-slate-950 text-white border border-slate-500 rounded p-3" /></label>)}
    <div className="flex gap-3 flex-wrap"><button disabled={!ready} onClick={onContinue} className="bg-green-700 disabled:bg-slate-700 px-5 py-3 rounded font-bold">Record Plan & Continue Preparation</button><button onClick={onSave} className="bg-slate-700 px-5 py-3 rounded">Save & Exit</button></div><p className="text-sm text-slate-400">Enter a brief response in each field. This records your reasoning; it does not certify that the plan is correct.</p>
  </div></main>;
}
