import React, { useState } from 'react';
import { FUNDAMENTALS_QUESTIONS as questions, FUNDAMENTALS_SOURCE as source, FUNDAMENTALS_VERSION as version, gradeFundamentals } from './fundamentalsQuestionBank';
import { downloadFile } from './performanceReport';
const key = 'hipPocket_fundamentals_v1';
export default function FundamentalsQuiz({ onExit }) {
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [stored] = useState(() => { try { const saved = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(saved) ? { attempts: saved } : { attempts: [], unreadable: true }; } catch { return { attempts: [], unreadable: true }; } });
  const [attempts, setAttempts] = useState(stored.attempts);
  function submit(e) {
    e.preventDefault();
    try {
      const items = gradeFundamentals(answers);
      const attempt = { version, submittedAt: new Date().toISOString(), correct: items.filter(i => i.correct).length, total: items.length, items, source, status: 'Practice only — not an official qualification' };
      const next = [...attempts, attempt]; setResult(attempt); setAttempts(next); setError('');
      try { if (stored.unreadable) throw new Error('Unreadable prior records'); localStorage.setItem(key, JSON.stringify(next)); } catch { setError('Your result could not be saved. Existing records have been preserved. Download this result before leaving.'); }
    } catch (e) { setError(e.message); }
  }
  return <main className="study-shell"><div className="study-wrap">
    <button onClick={onExit}>← Study & Staff Practice</button>
    <header className="study-header"><p className="study-eyebrow">FOUNDATIONS CHECK · TEST FIRST</p><h1>Civil considerations fundamentals</h1><p>Six questions on core planning vocabulary and its purpose. No mission storyline, prefilled responses or hints. Explanations appear only after you submit.</p><p className="study-small">Draft practice bank based on a public 2021 reference, not an approved schoolhouse examination. This is an initial topic, not a comprehensive CA assessment. Unsubmitted answers are not saved.</p></header>
    {error && <p role="alert">{error}</p>}
    <form onSubmit={submit} className="study-card study-form">
      {questions.map((q, index) => <fieldset key={q.id} disabled={Boolean(result)}><legend>{index + 1}. {q.prompt}</legend>{q.options.map((option, i) => <label className="study-option" key={option}><input type="radio" name={`fundamentals-${q.id}`} checked={answers[q.id] === i} onChange={() => setAnswers({ ...answers, [q.id]: i })} />{option}</label>)}</fieldset>)}
      {!result && <button className="study-primary" type="submit">Submit Test</button>}
    </form>
    {result && <section className="study-card" aria-label="Test results"><h2>{result.correct} / {result.total} correct</h2><p>Practice score only. Review the explanations, then try again.</p>{result.items.map(q => <div key={q.id} className="study-concept"><h3>{q.correct ? 'Correct' : 'Review'} — {q.prompt}</h3><p>Your answer: {q.options[q.selected]}</p><p>Expected answer: {q.options[q.answer]}</p><p>{q.feedback}</p></div>)}<p>Reference: <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a>, {source.locator}. Examples and distractors are authored for this practice.</p><button className="study-primary" onClick={() => { setAnswers({}); setResult(null); setError(''); }}>Start Fresh Attempt</button></section>}
    <section className="study-card"><p>{attempts.length} saved or current attempt(s). Earlier answers do not populate a new test.</p><button disabled={!attempts.length} onClick={() => downloadFile('hip-pocket-fundamentals-results.json', JSON.stringify({ version, attempts }, null, 2), 'application/json')}>Download Test Results</button><p className="study-small">Local, editable practice evidence—not identity verification or tamper-resistant completion proof. No results are sent automatically.</p></section>
  </div></main>;
}
