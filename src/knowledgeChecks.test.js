import { getKnowledgeQuestions, gradeKnowledgeQuestions } from './knowledgeChecks';

test('second attempt uses different learning questions', () => {
  const first = getKnowledgeQuestions('annex', 1, 'HIP-ONE').map(question => question.id);
  const second = getKnowledgeQuestions('annex', 2, 'HIP-ONE').map(question => question.id);
  expect(second).not.toEqual(first);
});

test('framework review varies by mission and always covers ASCOPE and PMESII-PT', () => {
  const firstMission = getKnowledgeQuestions('frameworks', 1, 'HIP-ONE');
  const secondMission = getKnowledgeQuestions('frameworks', 1, 'HIP-TWO');
  expect(firstMission).toHaveLength(4);
  expect(firstMission.map(question => question.id)).not.toEqual(secondMission.map(question => question.id));
  expect(firstMission.filter(question => question.id.startsWith('ascope')).length).toBe(2);
  expect(firstMission.filter(question => question.id.startsWith('pmesii') || question.id === 'framework-combine').length).toBe(2);
});

test('knowledge check identifies missed answers', () => {
  const questions = getKnowledgeQuestions('frameworks', 1, 'HIP-GRADE');
  expect(gradeKnowledgeQuestions(questions, Object.fromEntries(questions.map(q => [q.id, q.answer]))).passed).toBe(true);
  expect(gradeKnowledgeQuestions(questions, {}).missed).toHaveLength(4);
});
