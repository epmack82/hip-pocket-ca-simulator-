import React, { useEffect, useRef, useState } from 'react';
import { campaignEvidence, COMMAND_INTENT, COMMAND_REQUESTS, commandBriefViews, commandQuestion, commandHandover } from './commandContinuity';
import './commandContinuity.css';

const empty = () => ({ request: 'collection', recommendation: '', uncertainty: '', evidenceKeys: [], followUpId: '', supersedes: null });

export function CommandArrivalNote({ world, scenario, scenarios, records }) {
  const linked = commandBriefViews(world, scenarios, records).filter(b => !b.superseded && b.followUp?.scenarioId === scenario.id);
  if (!linked.length) return null;
  return <aside className="command-arrival" aria-label="Command follow-up context"><strong>This visit connects to your earlier brief</strong>{linked.map(b => <p key={b.id}>From {b.location}: {b.recommendation}<br /><span>Request: {b.status}. Arrival alone does not confirm the original account or complete the request.</span></p>)}</aside>;
}

export default function CommandContinuityPanel({ world = {}, scenarios = [], records = [], scenario, day, onSubmit, reviewOnly = false }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(empty);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [originId, setOriginId] = useState(scenario?.id || records[records.length - 1]?.scenarioId || scenarios[0]?.id || '');
  const formRef = useRef(null);
  useEffect(() => {
    if (open) {
      formRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
      formRef.current?.querySelector('textarea')?.focus();
    }
  }, [open, draft.supersedes]);
  const briefs = commandBriefViews(world, scenarios, records);
  const active = briefs.filter(b => !b.superseded);
  const evidence = campaignEvidence(world, scenarios);
  const handover = commandHandover(world, scenarios, records);
  const question = scenario && commandQuestion(scenario);
  const origin = scenarios.find(s => s.id === originId);
  const editable = origin && onSubmit && !reviewOnly && !world.missionOutcome?.terminated;
  const choices = scenarios.filter(s => !records.some(r => r.scenarioId === s.id));
  function change(key, value) { setDraft(d => ({ ...d, [key]: value })); setError(''); }
  function revise(brief) {
    setOriginId(brief.scenarioId);
    setDraft({ request: brief.request, recommendation: brief.recommendation, uncertainty: brief.uncertainty, evidenceKeys: brief.evidence.map(e => e.key),
      followUpId: choices.some(s => s.id === brief.followUp?.scenarioId) ? brief.followUp.scenarioId : '', supersedes: brief.id });
    setOpen(true); setNotice('Review the new material and update your recommendation. The previous brief remains in the history.'); setError('');
  }
  function submit(event) {
    event.preventDefault();
    try {
      onSubmit(draft, originId);
      setDraft(empty()); setOpen(false); setError(''); setNotice('Brief recorded in this exercise. The simulated staff reply is below; no message was sent outside the app.');
    } catch (e) { setError(e.message || 'The brief could not be saved. Your draft remains here.'); }
  }
  return <section className="command-panel" aria-label="Command decisions and continuity">
    <header><div><p className="command-eyebrow">FIELD FINDINGS → COMMAND DECISIONS → HANDOVER</p><h2>{reviewOnly ? 'Command handover' : 'The larger mission'}</h2></div>{editable && <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="command-brief-form">{open ? 'Close Brief Form' : 'Brief Command'}</button>}</header>
    <p>{question?.question || COMMAND_INTENT}</p>
    <p className="command-small">{active.length} current brief{active.length === 1 ? '' : 's'} · {handover.gaps.length} open information gaps. Optional, ungraded staff practice; unresolved opportunities are not automatic failures.</p>
    {notice && <p role="status" className="command-notice">{notice}</p>}
    {error && <p role="alert" className="command-error">{error}</p>}
    {editable && open && <form ref={formRef} id="command-brief-form" onSubmit={submit}>
      <h3>{draft.supersedes ? `Revise ${draft.supersedes}` : 'Send a short decision brief'} · Day {day}</h3>
      <p className="command-small">Your written recommendation is retained for leader review. The staff reply follows the selected request and attached findings; it does not approve every action mentioned in your text. Submit or copy your draft before leaving this screen.</p>
      <label>Location this brief concerns<select aria-label="Location this brief concerns" value={originId} onChange={e => { setOriginId(e.target.value); setDraft(empty()); }} disabled={Boolean(draft.supersedes)}>{scenarios.map(s => <option key={s.id} value={s.id}>{s.location}</option>)}</select></label>
      <p>{commandQuestion(origin).question}</p>
      <label>Decision requested<select aria-label="Decision requested" value={draft.request} onChange={e => change('request', e.target.value)}>{COMMAND_REQUESTS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}</select></label>
      <label>Your recommendation<textarea data-testid="command-recommendation" required maxLength={2000} rows={3} value={draft.recommendation} onChange={e => change('recommendation', e.target.value)} /></label>
      <label>What remains uncertain?<textarea data-testid="command-uncertainty" required maxLength={2000} rows={2} value={draft.uncertainty} onChange={e => change('uncertainty', e.target.value)} /></label>
      <fieldset><legend>Attach recorded findings (up to 10)</legend><p className="command-small">Claims remain claims. Check a finding to include its source and reliability in the brief.</p><div className="command-evidence-list">{evidence.length ? evidence.map(e => <label className="command-evidence" key={e.key}><input type="checkbox" checked={draft.evidenceKeys.includes(e.key)} disabled={!draft.evidenceKeys.includes(e.key) && draft.evidenceKeys.length >= 10} onChange={event => change('evidenceKeys', event.target.checked ? [...draft.evidenceKeys, e.key] : draft.evidenceKeys.filter(key => key !== e.key))} /><span>{e.text}<small>{e.location} · {e.source} · {e.reliability}</small></span></label>) : <p>No findings recorded yet. You may raise a question now; staff will request supporting findings, not invent them.</p>}</div></fieldset>
      {draft.request !== 'handover' && <label>Proposed follow-up destination<select aria-label="Proposed follow-up destination" value={draft.followUpId} onChange={e => change('followUpId', e.target.value)}><option value="">No new destination selected</option>{choices.filter(s => s.id !== originId).map(s => <option key={s.id} value={s.id}>{s.location}</option>)}</select></label>}
      <p className="command-small">The destination stays optional and uses the normal visit budget. A specialist request is referred to {commandQuestion(origin).partner.toLowerCase()}, not automatically approved.</p>
      <button type="submit">Record Command Brief</button>
    </form>}
    {active.length > 0 && <div className="command-briefs">{active.slice().reverse().map((brief, index) => <article key={brief.id}>
      <p className="command-eyebrow">{brief.id} · Day {brief.day} · {brief.location}</p><details open={index === 0}><summary>{brief.status}</summary><p className="command-quote">{brief.response}</p>
      <p className="command-progress">{brief.followUpStatus}{brief.followUp ? ` · ${brief.followUp.location}` : ''}</p>
      {brief.newEvidence.length > 0 && <p className="command-small">{brief.newEvidence.length} new finding{brief.newEvidence.length === 1 ? '' : 's'} recorded since this brief. They have not automatically confirmed the recommendation.</p>}
      <details><summary>Your brief and attached findings</summary><p><strong>Recommendation:</strong> {brief.recommendation}</p><p><strong>Uncertainty:</strong> {brief.uncertainty}</p><ul>{brief.evidence.map(e => <li key={e.key}>{e.text} — {e.source} ({e.reliability})</li>)}</ul>{!brief.evidence.length && <p>No findings attached.</p>}<p className="command-small">{brief.authority}</p></details>
      {editable && <button type="button" onClick={() => revise(brief)}>Revise {brief.id}</button>}
      </details>
    </article>)}</div>}
    {(reviewOnly || active.length > 0) && <details className="command-handover"><summary>What must carry forward</summary><p>These entries remain open for review. Recording a brief, visiting a location or finishing the game does not accept a handover or remove uncertainty.</p><ul>{handover.gaps.map((g, i) => <li key={g.scenarioId + i}>{g.location}: {g.text}</li>)}{handover.requests.map((r, i) => <li key={r.id || i}>{r.description} — {r.status}</li>)}{handover.conditions.map(c => <li key={c.id}>{c.title} — {c.status}</li>)}</ul><h3>Destinations left for follow-up</h3><ul>{handover.unvisited.map(s => <li key={s.id}>{s.location}</li>)}</ul></details>}
    {briefs.some(b => b.superseded) && <details><summary>Earlier briefs retained ({briefs.filter(b => b.superseded).length})</summary>{briefs.filter(b => b.superseded).map(b => <p key={b.id}><strong>{b.id} · {b.status}</strong><br />{b.recommendation}<br />Uncertainty: {b.uncertainty}</p>)}</details>}
  </section>;
}
