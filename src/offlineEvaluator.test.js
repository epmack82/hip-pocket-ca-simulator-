import { createOfflineDebrief, evaluateOffline } from './offlineEvaluator';
import { getProductWorksheet } from './productTemplates';

test('returns the response shape required by the game', () => {
  const result = evaluateOffline(`TRAINEE'S ACTION: "I greet the mayor, assess the site, validate reports, and document findings."

Evaluate this action`, { name: 'Test mission', keyStakeholders: ['Mayor'] });
  expect(result.evaluationMode).toBe('offline');
  expect(result.qualityScore).toBeGreaterThan(50);
  expect(result.relationshipShifts.Mayor).toBeGreaterThan(0);
  expect(result.product).toBeNull();
});

test('creates an offline product when requested', () => {
  const result = evaluateOffline('TRAINEE WANTS TO CREATE THIS PRODUCT: "Stakeholder map"\nADDITIONAL DETAILS FROM TRAINEE: "Known actors entered by trainee"\n\nGenerate this product', { name: 'Network mission' });
  expect(result.product.name).toBe('Stakeholder map');
  expect(result.product.recipient).toContain('S-9');
});

test('product score increases with worksheet completion rather than selection alone', () => {
  const scenario = { name: 'Network mission', location: 'clinic' };
  const blankWorksheet = getProductWorksheet('SITREP', scenario);
  const blank = evaluateOffline(`TRAINEE WANTS TO CREATE THIS PRODUCT: "SITREP"\nADDITIONAL DETAILS FROM TRAINEE: "${blankWorksheet}"\n\nGenerate this product`, scenario);
  const completed = evaluateOffline('TRAINEE WANTS TO CREATE THIS PRODUCT: "SITREP"\nADDITIONAL DETAILS FROM TRAINEE: "TRAINING WORKSHEET completed with confirmed observations and coordination."\n\nGenerate this product', scenario);
  expect(blank.qualityScore).toBe(5);
  expect(completed.qualityScore).toBeGreaterThan(blank.qualityScore);
});

test('creates a debrief without a provider', () => {
  expect(createOfflineDebrief([{ qualityScore: 80 }], [])).toContain('average assessment score of 80');
});
