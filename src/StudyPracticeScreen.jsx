import React, { useEffect, useRef, useState } from 'react';
import { STUDY_LESSONS, STUDY_VERSION } from './studyLessons';
import { blankDraft, readStudy, writeStudy, submitStudy, buildStudyReport, studyReportHtml, PRACTICE_NOTICE } from './studyPractice';
import { downloadFile } from './performanceReport';
import './studyPractice.css';
import TemplateWorkshop from './TemplateWorkshop';

const storage = { getItem: key => window.localStorage.getItem(key), setItem: (key, value) => window.localStorage.setItem(key, value) };

export default function StudyPractice({ onExit }) {
  const [initial] = useState(() => readStudy(storage));
  const [data, setData] = useState(initial.data);
  const [saveWarning, setSaveWarning] = useState(initial.warning);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const heading = useRef(null);
  useEffect(() => {
    if (!initial.warning) setSaveWarning(writeStudy(storage, data));
  }, [data, initial.warning]);
  useEffect(() => { heading.current?.focus(); }, [selected]);

  const lesson = STUDY_LESSONS.find(l => l.id === selected);
  const entry = lesson && data.modules[lesson.id];
  const draft = entry?.draft?.version === STUDY_VERSION ? entry.draft : blankDraft();
  const attempts = entry?.attempts || [];
  const latest = attempts[attempts.length - 1];
  const submitted = draft.submitted && latest?.lessonVersion === STUDY_VERSION;
  const completed = STUDY_LESSONS.filter(l => data.modules[l.id]?.attempts.some(a => a.lessonVersion === STUDY_VERSION)).length;
  function updateDraft(change) {
    setError(''); setNotice('');
    setData(current => ({ ...current, modules: { ...current.modules, [lesson.id]: { attempts, draft: { ...draft, ...change } } } }));
  }
  function submit(event) {
    event.preventDefault();
    try {
      const attempt = submitStudy(lesson, draft, attempts);
      setData(current => ({ ...current, modules: { ...current.modules, [lesson.id]: { draft: { ...draft, submitted: true }, attempts: [...attempts, attempt] } } }));
      setError(''); setNotice('Practice submitted. Knowledge-check feedback is available below; your written response still needs review.');
    } catch (e) { setError(e.message); }
  }
  function open(id) { setSelected(id); setError(''); setNotice(''); }
  function exportReport(format) {
    try {
      const report = buildStudyReport(data);
      const date = report.exportedAt.slice(0, 10);
      downloadFile(`hip-pocket-study-${date}.${format}`, format === 'html' ? studyReportHtml(report) : JSON.stringify(report, null, 2), format === 'html' ? 'text/html;charset=utf-8' : 'application/json');
      setNotice('Report download requested. It includes submitted attempts and any unfinished written drafts. Nothing was sent to a leader automatically.');
    } catch { setError('The download could not be created. Your work is still shown here; try again or copy it before leaving.'); }
  }
  if (selected === 'workshop') return <TemplateWorkshop onExit={() => open(null)} />;
  return <main className="study-shell">
    <div className="study-wrap">
      <nav className="study-nav" aria-label="Study navigation">
        <button type="button" onClick={onExit}>← Hip Pocket home</button>
        {lesson && <button type="button" onClick={() => open(null)}>All study modules</button>}
        <span>OFFLINE PRACTICE · {STUDY_VERSION}</span>
      </nav>
      <header className="study-header">
        <p className="study-eyebrow">STUDY & STAFF PRACTICE</p>
        <h1 ref={heading} tabIndex={-1}>{lesson ? lesson.title : 'Prepare. Think. Brief.'}</h1>
        <p>{lesson ? lesson.objective : 'Build the habits behind a useful engagement, a credible report and a decision-ready assessment. No mission setup required.'}</p>
        <p className="study-small">Separate from mission saves and grades. No login, API key or AI service. Work stays in this browser unless you export it.</p>
        {!saveWarning && <p className="study-small">Drafts and attempts save automatically in this browser.</p>}
      </header>
      {saveWarning && <div role="alert" className="study-warning">{saveWarning}</div>}
      {error && <div role="alert" className="study-warning">{error}</div>}
      {notice && <p role="status" className="study-notice">{notice}</p>}
      {!lesson ? <>
        <section className="study-summary" aria-label="Study progress">
          <div><strong>{completed} / {STUDY_LESSONS.length}</strong><span>modules submitted for practice</span></div>
          <p>Submission is not a passing grade. Review knowledge-check feedback, then discuss written work with your first-line leader.</p>
        </section>
        <div className="study-grid">
          <article className="study-card"><p className="study-eyebrow">PRODUCT PRACTICE</p><h2>Template Workshop</h2><p>Explore and practice detailed reports separately from the short mission-product flow. Keep drafts, download your work, and discuss it with a leader.</p><button className="study-primary" onClick={() => open('workshop')}>Open Template Workshop</button></article>
          {STUDY_LESSONS.map((l, index) => {
            const saved = data.modules[l.id];
            const submittedAttempts = saved?.attempts.filter(a => a.lessonVersion === STUDY_VERSION) || [];
            const hasDraft = saved?.draft.version === STUDY_VERSION && !saved.draft.submitted;
            return <article className="study-card" key={l.id}>
              <p className="study-eyebrow">0{index + 1} · {l.duration}</p>
              <h2>{l.title}</h2><p>{l.objective}</p>
              <p className="study-small">{submittedAttempts.length ? `${submittedAttempts.length} attempt(s) submitted · leader review pending` : 'Not submitted'}{hasDraft ? ' · draft in progress' : ''}</p>
              <button className="study-primary" onClick={() => open(l.id)}>{hasDraft ? 'Continue' : submittedAttempts.length ? 'Review' : 'Open'}: {l.title}</button>
            </article>;
          })}
        </div>
        <section className="study-card study-export" aria-labelledby="export-heading">
          <h2 id="export-heading">Take your work to the discussion</h2>
          <p>Download a readable leader report or a structured evidence file. The report includes every submitted attempt, answers, feedback, written responses and learner self-review.</p>
          <label htmlFor="study-learner">Learner name or training identifier (optional, self-entered)</label>
          <input id="study-learner" autoComplete="off" maxLength={100} value={data.learner} onChange={e => setData({ ...data, learner: e.target.value })} placeholder="Use a training alias if preferred" />
          <div className="study-actions"><button className="study-primary" onClick={() => exportReport('html')}>Download Study Report</button><button onClick={() => exportReport('json')}>Download Study Evidence JSON</button></div>
          <p className="study-small">Open the HTML report in a browser to print or save as PDF. It is editable local evidence, not tamper-resistant proof of completion. Storage is specific to this browser and website address; clearing browser data removes local progress.</p>
        </section>
        <details className="study-card"><summary>Reference scope and upcoming practice</summary><p>These are original fictional exercises with transparent, draft practice criteria. They are not an approved schoolhouse assessment. No schoolhouse documents or held materials are bundled in this area.</p><p>OPORD analysis, capabilities briefs, COA comparison and MOP/MOE exercises are planned after the relevant reference editions and criteria are reviewed. The development reference library is separate; this application does not search it at runtime.</p></details>
      </> : <>
        <div className="study-lesson-grid">
          <section className="study-card" aria-labelledby="concept-heading"><h2 id="concept-heading">Before you practice</h2>{lesson.concepts.map(([title, detail]) => <div className="study-concept" key={title}><h3>{title}</h3><p>{detail}</p></div>)}<p className="study-small">{lesson.referenceNote}</p></section>
          <section className="study-card study-scene" aria-labelledby="scene-heading"><p className="study-eyebrow">YOUR EVIDENCE</p><h2 id="scene-heading">Read the situation</h2><p>{lesson.scene}</p><p className="study-small">Use these facts. Do not assume events, permissions or results that are not stated.</p></section>
        </div>
        <form onSubmit={submit} className="study-card study-form">
          <h2>Check your understanding</h2><p>Three knowledge checks, then a written practice response. Feedback appears after submission. You may retry; earlier attempts remain in your report.</p>
          {lesson.questions.map((q, index) => <fieldset key={q.id} disabled={submitted}><legend>{index + 1}. {q.prompt}</legend>{q.options.map((option, i) => <label className="study-option" key={option}><input type="radio" name={`study-${q.id}`} value={i} checked={draft.answers[q.id] === i} onChange={() => updateDraft({ answers: { ...draft.answers, [q.id]: i } })} /><span>{option}</span></label>)}</fieldset>)}
          <label className="study-task" htmlFor="study-response">Written practice — leader review</label><p id="study-task-description">{lesson.task}</p>
          <textarea id="study-response" aria-describedby="study-task-description" rows={7} maxLength={12000} value={draft.response} disabled={submitted} onChange={e => updateDraft({ response: e.target.value })} placeholder="Use fictional information only. This writing is not automatically graded." />
          <fieldset disabled={submitted}><legend>Self-review (optional, not a score)</legend>{lesson.criteria.map((c, i) => <label key={c} className="study-option"><input type="checkbox" checked={draft.selfReview.includes(i)} onChange={e => updateDraft({ selfReview: e.target.checked ? [...draft.selfReview, i] : draft.selfReview.filter(n => n !== i) })} /><span>{c}</span></label>)}</fieldset>
          {!submitted && <button className="study-primary" type="submit">Submit Practice for Review</button>}
          {submitted && <section className="study-feedback" aria-labelledby="feedback-heading"><h2 id="feedback-heading">Knowledge check: {latest.knowledge.correct} / {latest.knowledge.total}</h2><p>Attempt {latest.attempt}. Written response: pending leader review. No automatic pass/fail determination.</p>{latest.knowledge.items.map(item => <div key={item.id} className="study-concept"><h3>{item.correct ? 'Correct' : 'Review'} — {item.prompt}</h3><p>Your choice: {item.selected}</p><p>{item.feedback}</p></div>)}<details><summary>Compare with one possible written response</summary><p>{lesson.example}</p><p className="study-small">Other evidence-supported answers can be valid. This example is a discussion aid, not a phrase-matching answer key.</p></details><button type="button" onClick={() => updateDraft(blankDraft())}>Start Another Attempt</button></section>}
        </form>
        <div className="study-actions"><button type="button" onClick={() => open(null)}>Back to Study Modules</button><button type="button" onClick={() => exportReport('html')}>Download Study Report</button></div>
      </>}
      <footer className="study-footer">{PRACTICE_NOTICE}</footer>
    </div>
  </main>;
}
