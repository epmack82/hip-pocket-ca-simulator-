import { adjudicateAction, applyActionAdjudication } from './actionAdjudicator';

const school = { location: 'community school', siteType: 'school', keyStakeholders: ['school administrator'] };

test('interrupts interpreter substitution and unapproved child contact', () => {
  const result = adjudicateAction('I tell my interpreter to talk to the school administrator while I go play soccer with the children.', school, { seed: 'TEST', playerRole: 'canco' });
  expect(result.classification).toBe('serious');
  expect(result.issues.map(issue => issue.id)).toEqual(expect.arrayContaining(['interpreter-substitution', 'protected-contact-without-permission']));
  expect(result.outcome).toBe('interrupted-and-redirected');
  expect(result.narrative).toMatch(/intervenes|steps in/i);
  expect(result.coaching).toMatch(/permission/i);
});

test('allows coordinated protected-population interaction', () => {
  const result = adjudicateAction('I ask the school administrator for permission, remain with the host, and with a teacher supervising invite the students to play soccer.', school, { seed: 'TEST', playerRole: 'canco' });
  expect(result).toBeNull();
});

test('allows interpreter support without delegating accountability', () => {
  const result = adjudicateAction('I lead the introduction and use our interpreter to translate short phrases while I watch the administrator and confirm meaning.', school, { seed: 'TEST', playerRole: 'canco' });
  expect(result.classification).toBe('appropriate');
});

test('overrides inappropriate positive rapport and adds coaching', () => {
  const applied = applyActionAdjudication({ qualityScore: 82, relationshipShifts: { 'school administrator': 4 }, progress: { dimensionScores: { rapport: 4 } } }, 'I tell my interpreter to conduct the meeting while I go play with the children.', school, { seed: 'TEST', playerRole: 'canco' });
  expect(applied.result.qualityScore).toBeLessThanOrEqual(35);
  expect(applied.result.relationshipShifts['school administrator']).toBeLessThan(0);
  expect(applied.result.coachingInsight).toMatch(/Protected-population coaching/i);
});

