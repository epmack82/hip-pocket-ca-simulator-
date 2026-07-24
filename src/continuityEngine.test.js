import { applyActionOrderRules, currentContinuityNarrative } from './continuityEngine';

const scenario = { narrative: 'Initial arrival.', keyStakeholders: ['School director', 'Teacher'] };

test('site-assessment paperwork before rapport creates a poor first impression', () => {
  const result = {
    qualityScore: 80,
    relationshipShifts: { 'School director': 0 },
    narrativeOutcome: 'Worksheet completed.',
    product: { name: 'community school Site Assessment' }
  };
  const adjusted = applyActionOrderRules(result, { actions: [] }, 'Product: "community school Site Assessment"', scenario);
  expect(adjusted.qualityScore).toBe(80);
  expect(adjusted.relationshipShifts['School director']).toBe(-4);
  expect(adjusted.continuityNarrative).toContain('poor first impression');
});

test('an introduction first creates room for later assessment', () => {
  const adjusted = applyActionOrderRules(
    { qualityScore: 70, relationshipShifts: { 'School director': 4 }, narrativeOutcome: 'Initial response.' },
    { actions: [] },
    'Action: "I greet the director, introduce the team, explain our purpose, and listen."',
    scenario
  );
  expect(adjusted.relationshipShifts['School director']).toBe(4);
  expect(adjusted.continuityNarrative).toContain('reason for the visit is now understood');
});

test('current continuity returns the adapted scene instead of a generic progress phrase', () => {
  expect(currentContinuityNarrative({ continuityNarrative: 'The director returns to class.' }, scenario)).toBe('The director returns to class.');
});
