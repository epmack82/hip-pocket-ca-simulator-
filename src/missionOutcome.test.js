import { determineMissionDisposition, totalConsequenceOccurrences } from './missionOutcome';

const serious = (count = 1) => ({
  id: 'SERIOUS',
  status: 'active',
  severity: 'serious',
  occurrenceCount: count,
  categories: ['Mission-compromising intoxication']
});

test('counts repeated occurrences rather than only unique categories', () => {
  expect(totalConsequenceOccurrences([serious(3), { ...serious(2), id: 'OTHER' }])).toBe(5);
});

test('three repeated serious events end the mission', () => {
  const disposition = determineMissionDisposition([serious(3)]);
  expect(disposition.terminated).toBe(true);
  expect(disposition.status).toContain('redeployment');
  expect(disposition.reason).toContain('3 serious misconduct events');
});

test('a violent critical event can end the mission immediately', () => {
  const disposition = determineMissionDisposition([{
    ...serious(),
    severity: 'critical',
    categories: ['Destruction, violence, or reckless endangerment']
  }]);
  expect(disposition.terminated).toBe(true);
  expect(disposition.reason).toContain('immediate removal');
});

test('one serious event triggers oversight but not automatic redeployment', () => {
  const disposition = determineMissionDisposition([serious()]);
  expect(disposition.terminated).toBe(false);
  expect(disposition.status).toContain('oversight');
});
