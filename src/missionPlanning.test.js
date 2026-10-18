import { generateMission } from './scenarioEngine';
import { siteOrientation, remainingSites, knownPlanningLeads } from './missionPlanning';

test.each([3, 7, 14, 29])('each of %i locations remains selectable exactly once in any order', days => {
  const scenarios = generateMission({ seed: 'PLANNING-COVERAGE', days, role: 'specialist' });
  const before = JSON.stringify(scenarios);
  const records = [];
  for (const scenario of [...scenarios].reverse()) {
    expect(remainingSites(scenarios, records).some(choice => choice.scenario.id === scenario.id)).toBe(true);
    records.push({ scenarioId: scenario.id });
    expect(remainingSites(scenarios, records)).toHaveLength(days - records.length);
  }
  expect(JSON.stringify(scenarios)).toBe(before);
});

test('older site records and ordered legacy saves do not repeat concluded locations', () => {
  const scenarios = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  expect(remainingSites(scenarios, [{ siteProgress: { scenarioId: 'c' } }]).map(choice => choice.index)).toEqual([0, 1]);
  expect(remainingSites(scenarios, [{}]).map(choice => choice.index)).toEqual([1, 2]);
});

test('planning does not expose arrival details, complications, records, or undeveloped leads', () => {
  const scenario = generateMission({ seed: 'PLANNING-NO-SPOILERS', days: 3 })[0];
  const brief = siteOrientation(scenario);
  expect(brief.contact).toBe(scenario.keyStakeholders[0]);
  expect(brief.arrival).not.toContain('Your task is to');
  expect(brief.arrival).toContain(scenario.injects[0].text);
  expect(brief.purpose.toLowerCase()).toContain(scenario.metadata.trainingObjective);
  expect(brief.report).not.toContain(scenario.injects[0].text);
  expect(knownPlanningLeads({})).toEqual([]);
  expect(knownPlanningLeads({ a: { leads: [{ id: 'one', status: 'open' }, { id: 'two', status: 'completed' }] } })).toEqual([{ id: 'one', status: 'open', originScenarioId: 'a' }]);
});
