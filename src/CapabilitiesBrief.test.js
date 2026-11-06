import { emptyCapabilitiesBrief, briefReady, briefAllowsTravel, restoreCapabilitiesBrief } from './CapabilitiesBrief';

test('requires all briefing sections without grading keywords', () => {
  const brief = emptyCapabilitiesBrief();
  expect(briefReady(brief)).toBe(false);
  expect(briefAllowsTravel(brief)).toBeFalsy();
  Object.assign(brief, { team: 'Team', support: 'Support', limits: 'Limits', request: 'Direction' });
  expect(briefReady(brief)).toBe(true);
  expect(briefAllowsTravel(brief)).toBeFalsy();
  expect(briefAllowsTravel({ ...brief, completed: true })).toBe(true);
});

test('legacy preparation requires brief but existing field missions do not get interrupted', () => {
  expect(briefAllowsTravel(restoreCapabilitiesBrief({ screen: 'missionPlanning' }))).toBeFalsy();
  expect(briefAllowsTravel(restoreCapabilitiesBrief({ screen: 'scenarioScreen' }))).toBe(true);
  const draft = { ...emptyCapabilitiesBrief(), team: 'Saved draft' };
  expect(restoreCapabilitiesBrief({ capabilitiesBrief: draft })).toEqual(draft);
});
