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

test('later continuity names the latest action and its cumulative action number', () => {
  const adjusted = applyActionOrderRules(
    { qualityScore: 40, relationshipShifts: {}, narrativeOutcome: 'No usable information gained.' },
    { actions: ['one', 'two', 'three'], discoveries: [] },
    'Action: "I wait behind the building."',
    scenario
  );

  expect(adjusted.continuityNarrative).toContain('wait behind the building');
  expect(adjusted.continuityNarrative).toContain('action 4');
  expect(adjusted.continuityNarrative).not.toContain("reacts to the team's latest decision");
});

test('stakeholder titles are capitalized at the beginning of continuity scenes', () => {
  const adjusted = applyActionOrderRules(
    { qualityScore: 40, relationshipShifts: {}, narrativeOutcome: 'No usable information gained.' },
    { actions: ['one'], discoveries: [] },
    'Action: "I wait outside."',
    { narrative: 'Initial arrival.', keyStakeholders: ['clinic director'] }
  );

  expect(adjusted.continuityNarrative.startsWith('Clinic director')).toBe(true);
});

test('first rapport scene reflects interpreter use, gift protocol, and the observing secondary stakeholder', () => {
  const adjusted = applyActionOrderRules(
    { qualityScore: 76, relationshipShifts: { 'Municipal administrator': 4, 'Public works director': 0 }, narrativeOutcome: 'Opening.' },
    { actions: [] },
    'Action: "I provide warm introductions, involve our interpreter, sincerely thank the host, and offer a small gift."',
    { location: 'municipal office', keyStakeholders: ['municipal administrator', 'public works director'] }
  );

  expect(adjusted.continuityNarrative).toContain('interpreter');
  expect(adjusted.continuityNarrative).toContain('protocol');
  expect(adjusted.continuityNarrative).toContain('public works director');
});

test('continuity follows a specifically addressed secondary stakeholder with a minor misspelling', () => {
  const adjusted = applyActionOrderRules(
    { qualityScore: 70, relationshipShifts: { 'utility operations manager': 0, 'municipal engineer': 4 }, narrativeOutcome: 'The engineer joins.' },
    { actions: ['opening'], discoveries: [] },
    'Action: "I apologize to the municipile engineer, invite them to join, and ask their perspective."',
    { location: 'water facility', keyStakeholders: ['utility operations manager', 'municipal engineer'] }
  );

  expect(adjusted.continuityNarrative.startsWith('Municipal engineer')).toBe(true);
});
