import { getKnowledgeQuestions, gradeKnowledgeQuestions } from './knowledgeChecks';

test('second attempt uses different learning questions', () => {
  const first = getKnowledgeQuestions('annex', 1, 'HIP-ONE').map(question => question.id);
  const second = getKnowledgeQuestions('annex', 2, 'HIP-ONE').map(question => question.id);
  expect(second).not.toEqual(first);
});

test('readiness review has three clearly separated questions per subject', () => {
  const annex = getKnowledgeQuestions('annex', 1, 'HIP-ONE');
  const ascope = getKnowledgeQuestions('ascope', 1, 'HIP-ONE');
  const pmesii = getKnowledgeQuestions('pmesii', 1, 'HIP-ONE');
  expect(annex).toHaveLength(3);
  expect(ascope).toHaveLength(3);
  expect(pmesii).toHaveLength(3);
  expect(ascope.every(question => question.id.startsWith('ascope'))).toBe(true);
  expect(pmesii.every(question => question.id.startsWith('pmesii') || question.id === 'framework-combine')).toBe(true);
});

test('knowledge check identifies missed answers', () => {
  const questions = getKnowledgeQuestions('pmesii', 1, 'HIP-GRADE');
  expect(gradeKnowledgeQuestions(questions, Object.fromEntries(questions.map(q => [q.id, q.answer]))).passed).toBe(true);
  expect(gradeKnowledgeQuestions(questions, {}).missed).toHaveLength(3);
});

test('second attempts use different ASCOPE and PMESII-PT questions', () => {
  for (const phase of ['ascope', 'pmesii']) {
    const first = getKnowledgeQuestions(phase, 1, 'HIP-RETRY').map(question => question.id);
    const second = getKnowledgeQuestions(phase, 2, 'HIP-RETRY').map(question => question.id);
    expect(second).not.toEqual(first);
    expect(second.some(id => first.includes(id))).toBe(false);
  }
});

test('Annex K refresher teaches that the team does not promise assistance or outcomes', () => {
  const annexQuestions = [
    ...getKnowledgeQuestions('annex', 1, 'HIP-NO-PROMISES'),
    ...getKnowledgeQuestions('annex', 2, 'HIP-NO-PROMISES')
  ];
  const question = annexQuestions.find(item => item.id === 'annex-authorities');
  const correctOption = question.options[question.answer];

  expect(question.prompt).toContain('asks the team to promise');
  expect(correctOption).toContain('Do not promise an outcome');
  expect(question.review).toContain('must not promise assistance or an outcome');
  expect(question.review).not.toContain('promise only what');
});
