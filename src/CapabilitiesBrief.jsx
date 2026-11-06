import React from 'react';
import { createTeamRoster } from './teamNarrative';

export const briefFields = [
  ['team', 'Introduce your team', 'Explain each member’s background, specialty, and contribution.'],
  ['support', 'Connect capabilities to command’s mission', 'What can this team help command understand or accomplish?'],
  ['limits', 'Explain limits and support needs', 'What requires coordination, specialist support, or authorization?'],
  ['request', 'Recommend employment and request direction', 'Propose an initial priority and explain what guidance you need.']
];
export const emptyCapabilitiesBrief = () => ({ team: '', support: '', limits: '', request: '', completed: false });
export const briefReady = brief => briefFields.every(([key]) => String(brief[key] || '').trim().length > 0);
export function restoreCapabilitiesBrief(save) {
  if (save.capabilitiesBrief) return save.capabilitiesBrief;
  const inField = Boolean(save.routeDecisions?.length || save.missionRecords?.length || save.scenarioRecord || ['scenarioScreen', 'outcomeDisplay', 'productDisplay', 'leadScene', 'debrief'].includes(save.screen));
  return { ...emptyCapabilitiesBrief(), legacyInField: inField };
}
export const briefAllowsTravel = brief => brief.completed || brief.skipped || brief.legacyInField;
const backgrounds = {
  chief: 'Prior exercise staff liaison experience; connects team findings to command decisions and coordinates requests.',
  sgt: 'Civilian logistics background; organizes team preparation, sustainment, and follow-through.',
  canco: 'Community outreach background; prepares engagements and tracks stakeholder perspectives.',
  specialist: 'Data-management background; organizes observations, source attribution, and draft products.'
};

export default function CapabilitiesBrief({ value, onChange, onSave, onComplete, onSkip, seed, role, names, playerName }) {
  return <main className="min-h-screen bg-slate-900 text-slate-100 p-6"><div className="max-w-4xl mx-auto space-y-6">
    <img src="/art/classroom-brief-v1.png" alt="Soldiers presenting a map briefing to a military audience" className="w-full h-48 object-cover rounded-xl" />
    <header><p className="text-amber-200">Arrival · Optional staff practice</p><h1 className="text-3xl font-bold">Capabilities Brief to AO Command</h1></header>
    <p>Meet your team before choosing where to go. Review who you brought and what each person contributes.</p>
    <details className="bg-slate-800 p-5 rounded-lg" open><summary className="font-bold cursor-pointer">Your team dossier</summary>
      <p className="text-sm text-slate-300 my-3">Fictional exercise backgrounds—not certifications or authority to perform specialist work.</p>
      <div className="grid sm:grid-cols-2 gap-4">{createTeamRoster(seed, role, names).map(member => <article key={member.key}><h2 className="font-bold">{member.isPlayer ? `${playerName || 'You'} (You) — ${member.title}` : member.display}</h2><p>{backgrounds[member.key]}</p></article>)}</div>
    </details>
    <button onClick={onSkip} className="bg-green-700 px-5 py-3 rounded font-bold">Quick Start · Continue to Field Planning</button>
    <details><summary className="cursor-pointer text-slate-300">Optional briefing worksheet · review only, not part of the story</summary>
    <p className="my-3">These notes are saved for your review. They do not change character dialogue, team abilities, or mission outcomes. You can leave this worksheet closed and continue playing.</p>
    <form onSubmit={event => { event.preventDefault(); if (briefReady(value)) onComplete(); }} className="space-y-5">
      {briefFields.map(([key, label, hint]) => <label key={key} className="block font-semibold">{label}<span className="block text-sm text-slate-300 font-normal">{hint}</span><textarea required aria-label={label} value={value[key]} onChange={event => onChange({ ...value, [key]: event.target.value })} className="w-full bg-slate-800 border border-slate-500 rounded p-3 mt-2 font-normal" rows={3} /></label>)}
      <details className="text-slate-300"><summary className="cursor-pointer">Need help getting started?</summary><p className="mt-2">For mission support, explain how your team could learn about local services and bring attributed findings to command. For limits, identify what you cannot promise and what support you need. For direction, ask which information gap command wants you to prioritize. These are starting points, not a required answer.</p></details>
      <p className="text-sm text-slate-300">All four sections are required. This records briefing participation, not doctrinal correctness or command approval. Your words are saved for review; no keyword score is assigned.</p>
      <div className="flex gap-4"><button type="button" onClick={onSave} className="bg-slate-700 rounded px-5 py-3">Save & Exit</button><button disabled={!briefReady(value)} className="bg-green-700 disabled:opacity-40 rounded px-5 py-3">Record Brief & Plan First Move</button></div>
    </form></details>
  </div></main>;
}
