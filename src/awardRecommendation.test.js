import { recommendTrainingRecognition } from './awardRecommendation';

const records = (count, score) => Array.from({ length: count }, (_, index) => ({ scenarioName: `Site ${index + 1}`, qualityScore: score }));
const profile = minimum => ({ dimensions: Array.from({ length: 8 }, (_, index) => ({ key: `${index}`, score: minimum })) });

test('misconduct prevents favorable recognition', () => {
  const recommendation = recommendTrainingRecognition(records(5, 95), [{}, {}, {}, {}, {}], [{ status: 'active', occurrenceCount: 1 }], profile(95), { terminated: false });
  expect(recommendation.level).toBe('No favorable recognition recommended');
});

test('strong three-location performance can support an AAM-level training recommendation', () => {
  expect(recommendTrainingRecognition(records(3, 84), [{}, {}], [], profile(75), {}).level).toContain('AAM-level');
});

test('MSM-level recommendation requires exceptional sustained scope', () => {
  expect(recommendTrainingRecognition(records(7, 96), [{}, {}, {}, {}, {}], [], profile(90), {}).level).toContain('MSM-level');
  expect(recommendTrainingRecognition(records(3, 96), [{}, {}, {}, {}, {}], [], profile(90), {}).level).not.toContain('MSM-level');
});

test('ordinary completion receives participation recognition rather than an inflated medal', () => {
  expect(recommendTrainingRecognition(records(1, 60), [], [], profile(50), {}).level).toContain('Participation');
});
