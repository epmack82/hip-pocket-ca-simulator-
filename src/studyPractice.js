import { STUDY_LESSONS, STUDY_VERSION } from './studyLessons';

export const STUDY_STORAGE_KEY = 'hipPocket_study_v1';
export const PRACTICE_NOTICE = 'Locally recorded practice, not an official qualification or verified identity. Knowledge checks are automatically scored; written work and self-review are not. Leader review is pending. No information is sent automatically.';
export const emptyStudy = () => ({ schemaVersion: 1, learner: '', modules: {} });
export const blankDraft = () => ({ version: STUDY_VERSION, answers: {}, response: '', selfReview: [], submitted: false });

export function gradeStudy(lesson, answers = {}) {
  const items = lesson.questions.map(q => ({ id: q.id, prompt: q.prompt, selected: q.options[answers[q.id]] ?? 'Not answered', correctAnswer: q.options[q.answer], correct: answers[q.id] === q.answer, feedback: q.feedback }));
  return { correct: items.filter(i => i.correct).length, total: items.length, items };
}

export function submitStudy(lesson, draft, previous = [], now = new Date().toISOString()) {
  if (!lesson.questions.every(q => Number.isInteger(draft.answers[q.id]) && q.options[draft.answers[q.id]] !== undefined)) throw new Error('Answer each knowledge-check question before submitting.');
  if (!draft.response.trim()) throw new Error('Add your written practice response before submitting. It will be saved for review, not automatically graded.');
  return { attempt: previous.length + 1, lessonId: lesson.id, title: lesson.title, lessonVersion: STUDY_VERSION,
    submittedAt: now, answers: { ...draft.answers }, response: draft.response.trim(),
    selfReview: lesson.criteria.map((criterion, i) => ({ criterion, checkedByLearner: draft.selfReview.includes(i) })),
    knowledge: gradeStudy(lesson, draft.answers), writtenReview: 'Pending leader review' };
}

function validDraft(d) {
  return d && typeof d.version === 'string' && d.answers && typeof d.answers === 'object' && !Array.isArray(d.answers)
    && Object.values(d.answers).every(Number.isInteger)
    && typeof d.response === 'string' && Array.isArray(d.selfReview) && d.selfReview.every(Number.isInteger) && typeof d.submitted === 'boolean';
}
export function readStudy(storage) {
  try {
    const raw = storage.getItem(STUDY_STORAGE_KEY);
    if (!raw) return { data: emptyStudy(), warning: '' };
    const data = JSON.parse(raw);
    if (data.schemaVersion !== 1 || typeof data.learner !== 'string' || !data.modules || typeof data.modules !== 'object' || Array.isArray(data.modules)) throw new Error('Unsupported study save');
    for (const entry of Object.values(data.modules)) {
      if (!entry || !validDraft(entry.draft) || !Array.isArray(entry.attempts)) throw new Error('Invalid module save');
      for (const a of entry.attempts) {
        if (!a || !Number.isInteger(a.attempt) || typeof a.title !== 'string' || typeof a.lessonVersion !== 'string' || typeof a.submittedAt !== 'string'
          || typeof a.response !== 'string' || !a.knowledge || !Array.isArray(a.knowledge.items) || !Array.isArray(a.selfReview)
          || !Number.isInteger(a.knowledge.correct) || !Number.isInteger(a.knowledge.total)
          || !a.knowledge.items.every(i => i && typeof i.id === 'string' && typeof i.prompt === 'string' && typeof i.feedback === 'string'
            && typeof i.selected === 'string' && typeof i.correctAnswer === 'string' && typeof i.correct === 'boolean')
          || !a.selfReview.every(i => i && typeof i.criterion === 'string' && typeof i.checkedByLearner === 'boolean')) throw new Error('Invalid attempt save');
      }
    }
    return { data, warning: '' };
  } catch {
    return { data: emptyStudy(), warning: 'Saved study data could not be read. Existing data has not been overwritten. This session is temporary; export your work before leaving.' };
  }
}

export function writeStudy(storage, data) {
  try { storage.setItem(STUDY_STORAGE_KEY, JSON.stringify(data)); return ''; }
  catch { return 'Study progress could not be saved on this device. Keep this page open and export your work before leaving.'; }
}

export function buildStudyReport(data, now = new Date().toISOString()) {
  return { reportType: 'Hip Pocket Study and Staff Practice', reportVersion: 1, curriculumVersion: STUDY_VERSION,
    exportedAt: now, learner: data.learner.trim() || 'Not provided', learnerIdentity: 'Self-entered, unverified', notice: PRACTICE_NOTICE,
    modules: STUDY_LESSONS.map(lesson => {
      const entry = data.modules[lesson.id];
      const attempts = entry?.attempts || [];
      return { id: lesson.id, title: lesson.title, objective: lesson.objective, referenceNote: lesson.referenceNote,
        status: attempts.some(a => a.lessonVersion === STUDY_VERSION) ? 'Practice submitted — leader review pending' : 'Not submitted for current version',
        attempts, draft: entry?.draft && !entry.draft.submitted ? { ...entry.draft, grading: 'Unsubmitted; not scored' } : null };
    }) };
}
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function studyReportHtml(report) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Study practice report</title><style>body{font:16px/1.6 system-ui;max-width:900px;margin:32px auto;padding:20px;color:#172033}h1,h2,h3{line-height:1.2}article{border-top:1px solid #aaa;margin-top:24px}p{white-space:pre-wrap}.note{background:#eef2f6;padding:16px}li{margin-bottom:10px}@media print{body{margin:0}h2,h3{break-after:avoid}}</style></head><body><h1>${escape(report.reportType)}</h1><p>Learner: ${escape(report.learner)} (${escape(report.learnerIdentity)})<br>Exported: ${escape(report.exportedAt)}<br>Curriculum: ${escape(report.curriculumVersion)}</p><p class="note">${escape(report.notice)} This editable local file is not proof of identity or tamper-resistant proof of completion. Use your browser’s Print / Save as PDF command for a PDF copy.</p>${report.modules.map(m => `<article><h2>${escape(m.title)}</h2><p>${escape(m.status)}</p><p>${escape(m.objective)}</p><p>${escape(m.referenceNote)}</p>${m.attempts.map(a => `<h3>Attempt ${escape(a.attempt)} — ${escape(a.lessonVersion)}</h3><p>Submitted: ${escape(a.submittedAt)}<br>Knowledge check: ${escape(a.knowledge.correct)}/${escape(a.knowledge.total)} correct. Written work: pending leader review.</p><ol>${a.knowledge.items.map(i => `<li>${escape(i.prompt)}<br>Learner: ${escape(i.selected)}<br>Expected: ${escape(i.correctAnswer)}<br>${escape(i.feedback)}</li>`).join('')}</ol><h4>Written response (not automatically graded)</h4><p>${escape(a.response)}</p><h4>Learner self-review (not independently verified)</h4><ul>${a.selfReview.map(c => `<li>${c.checkedByLearner ? 'Checked' : 'Not checked'}: ${escape(c.criterion)}</li>`).join('')}</ul>`).join('')}${m.draft ? `<h3>Unsubmitted draft — not scored</h3><p>${escape(m.draft.response || 'No written response yet.')}</p>` : ''}</article>`).join('')}<h2>First-line-leader review</h2><p>Leader / date: __________________________<br>Evidence reviewed and discussion: __________________________<br>Follow-up practice: __________________________</p></body></html>`;
}
