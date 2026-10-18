import React from 'react';
import { siteOrientation, remainingSites, knownPlanningLeads } from './missionPlanning';

export default function MissionPlanningScreen({ scenarios, records, sites, consequences, day, region, missionLabel,
  selected, rationale, onSelect, onRationale, onTravel, onSave }) {
  const choices = remainingSites(scenarios, records);
  const leads = knownPlanningLeads(sites);
  const chosen = choices.find(({ scenario }) => scenario.id === selected)?.scenario;
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-4 sm:p-8">
      <main className="max-w-5xl mx-auto space-y-6" data-testid="mission-planning">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-blue-300 text-sm">Day {day} of {scenarios.length} · Locations concluded: {records.length}</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mt-2">{records.length ? 'Plan Your Next Move' : 'Plan Your First Move'}</h1>
            <p className="text-slate-300 mt-2">{missionLabel}</p>
          </div>
          <button onClick={onSave} className="bg-slate-700 hover:bg-slate-600 border border-slate-500 text-white px-4 py-2 rounded font-semibold">Save &amp; Exit</button>
        </header>

        <section aria-labelledby="orientation-title" className="bg-blue-950/40 border border-blue-700 rounded-lg p-6">
          <h2 id="orientation-title" className="text-blue-200 text-sm font-bold uppercase tracking-wide">Mission orientation</h2>
          <p className="text-white mt-3 leading-relaxed">{records.length
            ? `Your team has concluded its latest engagement in ${region}. Review what you learned and choose where to go next.`
            : `Your team is at its staging point in ${region}. Preparation is complete; you have not arrived at a field location yet.`}</p>
          <p className="text-slate-200 mt-3 leading-relaxed">Command needs a clearer picture of civil needs, local capabilities, and gaps in access to essential services. Decide where to begin collecting information, distinguish reports from verified findings, and document follow-up recommendations.</p>
          <p className="text-blue-200 text-sm mt-3">Choose one of the available engagements below. Each visit uses one day in this preview. There is no scored “correct” order or additional travel penalty; permission and access still need to be established at the site.</p>
        </section>

        {consequences.length > 0 && <section className="bg-red-950/40 border border-red-800 rounded-lg p-5" aria-label="Continuing mission consequences">
          <h2 className="text-red-200 font-bold">The mission carries forward</h2>
          <p className="text-slate-200 text-sm mt-2">Changing locations does not erase earlier conduct or restore lost trust.</p>
          <ul className="list-disc pl-5 text-red-100 mt-2 space-y-1">{consequences.map(item => <li key={item.id}>{item.title} — {item.status}</li>)}</ul>
        </section>}

        {leads.length > 0 && <section className="bg-slate-800 border border-amber-800 rounded-lg p-5" aria-label="Discovered leads for planning">
          <h2 className="text-amber-200 font-bold">Leads you have developed</h2>
          <p className="text-slate-300 text-sm mt-2">These connections remain unverified. Keep them in mind for planning and AAR discussion; they do not add full-day locations to this preview.</p>
          <ul className="mt-3 space-y-3">{leads.map(lead => <li key={lead.originScenarioId + ':' + lead.id}>
            <p className="text-white font-semibold">{lead.label}</p>
            <p className="text-slate-300 text-sm">{lead.reason}</p>
            <p className="text-amber-200 text-xs mt-1">Possible contact: {lead.contact || 'Not yet identified'} · Reported by: {lead.source || 'Source recorded at the originating site'}</p>
          </li>)}</ul>
        </section>}

        <fieldset>
          <legend className="text-white text-2xl font-bold mb-2">Where will you go{records.length ? ' next' : ' first'}?</legend>
          <p className="text-slate-400 text-sm mb-4">Preliminary reporting only. What you find on arrival may differ.</p>
          <div className="grid md:grid-cols-2 gap-4" data-testid="remaining-sites">
            {choices.map(({ scenario }) => {
              const brief = siteOrientation(scenario);
              return <label key={scenario.id} className={`block cursor-pointer rounded-lg border-2 p-5 transition-colors focus-within:ring-2 focus-within:ring-blue-300 ${selected === scenario.id ? 'border-blue-400 bg-blue-950/60' : 'border-slate-700 bg-slate-800 hover:border-slate-500'}`}>
                <div className="flex items-start gap-3">
                  <input className="mt-1 accent-blue-500" type="radio" name="destination" value={scenario.id} checked={selected === scenario.id} onChange={() => onSelect(scenario.id)} aria-label={`Visit ${scenario.location} — ${scenario.name.split(' — ')[0]}`} />
                  <div><h3 className="text-white text-lg font-bold capitalize">{scenario.location}</h3><p className="text-blue-200 text-xs mt-1">{scenario.name.split(' — ')[0]}</p></div>
                </div>
                <p className="text-slate-200 mt-4 text-sm leading-relaxed">{brief.report}</p>
                <p className="text-slate-300 mt-2 text-sm"><span className="text-slate-400">Why it matters:</span> {brief.relevance}</p>
                <p className="text-slate-300 mt-3 text-sm"><span className="text-slate-400">Listed point of contact:</span> {brief.contact}</p>
              </label>;
            })}
          </div>
        </fieldset>

        <section className="bg-slate-800 border border-slate-700 rounded-lg p-5">
          <label htmlFor="planning-rationale" className="text-white font-semibold">Why this location? <span className="text-slate-400 font-normal">(optional)</span></label>
          <p id="rationale-help" className="text-slate-400 text-sm mt-1">A sentence is enough. Your reasoning is saved for AAR discussion, not scored.</p>
          <textarea id="planning-rationale" aria-describedby="rationale-help" rows={2} maxLength={2000} value={rationale} onChange={event => onRationale(event.target.value)} className="w-full mt-3 bg-slate-900 border border-slate-600 rounded p-3 text-white" />
          <p className="text-blue-200 text-sm my-3" aria-live="polite">{chosen ? `Selected: ${chosen.location}` : 'Select a location to continue.'}</p>
          <button disabled={!chosen} onClick={onTravel} className="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg px-6 py-4 text-white text-lg font-bold">Travel to Selected Site</button>
        </section>
        {records.length > 0 && <details className="border border-slate-700 rounded-lg p-4 text-slate-300">
          <summary className="cursor-pointer font-semibold">Locations already concluded ({records.length})</summary>
          <ol className="list-decimal pl-5 mt-3 space-y-2">{records.map((record, index) => <li key={record.scenarioId || index}>Day {record.day}: {record.location}</li>)}</ol>
        </details>}
      </main>
    </div>
  );
}
