import { STUDY_LESSONS, STUDY_VERSION } from './studyLessons';
import { emptyStudy, blankDraft, gradeStudy, submitStudy, readStudy, writeStudy, buildStudyReport, studyReportHtml, STUDY_STORAGE_KEY } from './studyPractice';

const lesson = STUDY_LESSONS[0];
const ready = () => ({ ...blankDraft(), answers: Object.fromEntries(lesson.questions.map(q => [q.id, q.answer])), response: 'A bounded plan with a follow-up.', selfReview: [0] });
beforeEach(() => localStorage.clear());

test.each(STUDY_LESSONS)('$title has valid questions and transparent practice criteria', l => {
  expect(l.questions).toHaveLength(3);
  expect(new Set(l.questions.map(q => q.id)).size).toBe(3);
  l.questions.forEach(q => { expect(q.options[q.answer]).toBeTruthy(); expect(q.feedback).toBeTruthy(); });
  expect(l.criteria.length).toBeGreaterThan(0);
  expect(l.example).toBeTruthy();
  expect(gradeStudy(l).correct).toBe(0);
});
test('submission requires valid selections and written work, but does not grade writing', () => {
  expect(() => submitStudy(lesson, blankDraft())).toThrow(/Answer each/);
  expect(() => submitStudy(lesson, { ...ready(), response: '  ' })).toThrow(/written/);
  expect(() => submitStudy(lesson, { ...ready(), answers: { role: -1, rapport: 2, next: 0 } })).toThrow(/Answer each/);
  const result = submitStudy(lesson, ready(), [], '2026-10-18T12:00:00Z');
  expect(result.knowledge.correct).toBe(3);
  expect(result.writtenReview).toBe('Pending leader review');
  expect(result).not.toHaveProperty('writtenScore');
  expect(result.selfReview.filter(c => c.checkedByLearner)).toHaveLength(1);
  expect(submitStudy(lesson, ready(), [result]).attempt).toBe(2);
});
test('study saves round-trip without touching mission saves', () => {
  localStorage.setItem('hipPocket_saves', 'mission sentinel');
  const data = { ...emptyStudy(), modules: { engagement: { draft: ready(), attempts: [submitStudy(lesson, ready())] } } };
  expect(writeStudy(localStorage, data)).toBe('');
  expect(readStudy(localStorage).data).toEqual(data);
  expect(localStorage.getItem('hipPocket_saves')).toBe('mission sentinel');
});
test('corrupt, incompatible and unavailable storage remain recoverable and are not erased', () => {
  for (const raw of ['not json', 'null', '{"schemaVersion":99}', '{"schemaVersion":1,"learner":"x","modules":{"engagement":null}}']) {
    localStorage.setItem(STUDY_STORAGE_KEY, raw);
    expect(readStudy(localStorage).warning).toMatch(/not been overwritten/);
    expect(localStorage.getItem(STUDY_STORAGE_KEY)).toBe(raw);
  }
  const unavailable = { getItem: () => { throw Error('denied'); }, setItem: () => { throw Error('full'); } };
  expect(readStudy(unavailable).warning).toBeTruthy();
  expect(writeStudy(unavailable, emptyStudy())).toMatch(/could not be saved/);
});
test('export distinguishes unsubmitted drafts, current submissions and prior-version attempts', () => {
  const attempt = submitStudy(lesson, ready());
  const data = { ...emptyStudy(), modules: { engagement: { draft: ready(), attempts: [{ ...attempt, lessonVersion: 'older' }] } } };
  let report = buildStudyReport(data);
  expect(report.modules[0].status).toMatch(/Not submitted/);
  expect(report.modules[0].draft.grading).toMatch(/not scored/);
  data.modules.engagement.attempts.push(attempt);
  report = buildStudyReport(data);
  expect(report.modules[0].attempts).toHaveLength(2);
  expect(report.modules[0].status).toMatch(/leader review pending/);
  expect(report.curriculumVersion).toBe(STUDY_VERSION);
  expect(report.modules[1].attempts).toEqual([]);
});
test('HTML report escapes learner text and includes versions, evidence and review limits', () => {
  const attack = '<img src=x onerror=alert(1)>';
  const draft = { ...ready(), response: attack };
  const data = { ...emptyStudy(), learner: attack, modules: { engagement: { draft: { ...draft, submitted: true }, attempts: [submitStudy(lesson, draft)] } } };
  const html = studyReportHtml(buildStudyReport(data));
  expect(html).not.toContain(attack);
  expect(html).toContain('&lt;img');
  expect(html).toContain('3/3');
  expect(html).toContain(STUDY_VERSION);
  expect(html).toContain('not proof of identity');
  expect(html).toContain('First-line-leader review');
});
