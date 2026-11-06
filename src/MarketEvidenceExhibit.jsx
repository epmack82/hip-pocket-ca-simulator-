import React from 'react';
import { isMarket } from './marketScene';

export function marketExhibit(scenario, site = {}) {
  if (!isMarket(scenario)) return null;
  const comparison = (site.evidence || []).find(e => e.id === `${scenario.id}-service-access:comparison`);
  if (!comparison) return null;
  return {
    record: comparison,
    observation: (site.evidence || []).find(e => e.id === `${scenario.id}-service-access:observation`),
    accounts: site.claims || []
  };
}

export default function MarketEvidenceExhibit({ scenario, site }) {
  const exhibit = marketExhibit(scenario, site);
  if (!exhibit) return null;
  return <details className="my-4 rounded-lg border border-amber-300/50 bg-slate-800 p-4" aria-label="Market evidence exhibit">
    <summary className="font-bold text-amber-200 cursor-pointer">Evidence on the table · Stall register</summary>
    <p className="text-sm text-slate-300 my-3">Fictional exercise exhibit · A readable summary of the record your team compared, not an official form or an additional source.</p>
    <article className="bg-amber-50 text-slate-900 rounded p-5">
      <header className="border-b border-slate-400 pb-3"><p className="text-xs uppercase tracking-widest">Central Market · Allocation record</p><h3 className="text-xl font-bold">Stall register — what this record contains</h3></header>
      <p className="my-4">{exhibit.record.text}</p>
      <dl className="grid sm:grid-cols-2 gap-4"><div><dt className="font-bold">Recorded</dt><dd>Allocation of market spaces</dd></div><div><dt className="font-bold">Not established by this record</dt><dd>Daily trading, owners’ circumstances, or reasons for closure</dd></div></dl>
      <p className="text-sm mt-4">Individual entries and totals are not supplied by this exercise record. Do not infer a closure rate or name an absent owner from it.</p>
    </article>
    <section className="mt-5"><h3 className="font-bold">Set it beside what you have heard and seen</h3>
      {exhibit.accounts.map(account => <blockquote key={account.id} className="border-l-2 border-amber-300 pl-3 my-3"><p>{account.text}</p><footer className="text-sm text-slate-300">{account.source} · Attributed account</footer></blockquote>)}
      {exhibit.observation ? <p className="my-3"><strong>Your observation:</strong> {exhibit.observation.text}</p> : <p className="my-3 text-slate-300">No direct observation of the trading area is recorded yet. The register cannot substitute for that visit.</p>}
      <p className="text-amber-100">The record answers who has an allocated space—not why a stall is closed. Which person or source could help answer that next question?</p>
    </section>
  </details>;
}
