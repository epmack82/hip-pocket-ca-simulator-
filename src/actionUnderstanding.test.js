import { fallbackInterpretation, normalizeInterpretation } from './actionUnderstanding';
test('identifies an uncoordinated classroom performance', () => {
  const result = fallbackInterpretation('I roll into the classroom and start rapping and performing a freestyle dance to impress the students.', { location: 'community school' });
  expect(result.protectedPopulation).toBe('children'); expect(result.permission).toBe('missing'); expect(result.professionalRisk).toBe('high');
});
test('recognizes stated permission', () => {
  expect(fallbackInterpretation('After the administrator invited us and granted permission, we perform a short cultural exchange for the students.', { location: 'community school' }).permission).toBe('established');
});
test('normalizes provider output', () => {
  const result = normalizeInterpretation({ confidence: 900, actions: 'wrong', professionalRisk: 'invented' });
  expect(result.confidence).toBe(100); expect(result.actions).toEqual([]); expect(result.professionalRisk).toBe('moderate');
});
