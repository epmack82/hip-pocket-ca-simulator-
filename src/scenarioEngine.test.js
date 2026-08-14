import { generateMission, generateScenario, summarizeMissionCoverage } from './scenarioEngine';

test('same seed reproduces the same scenario', () => {
  expect(generateScenario('HIP-TEST-1', { role: 'sgt' }))
    .toEqual(generateScenario('HIP-TEST-1', { role: 'sgt' }));
});

test('different seeds create varied missions', () => {
  const signatures = new Set(
    Array.from({ length: 100 }, (_, index) => {
      const scenario = generateScenario(`HIP-DIVERSITY-${index}`, { role: 'chief' });
      return Object.values(scenario.metadata).join('|');
    })
  );
  expect(signatures.size).toBeGreaterThanOrEqual(85);
});

test('generated sites are coherent and provide legacy UI fields', () => {
  for (let index = 0; index < 250; index += 1) {
    const scenario = generateScenario(`HIP-COMPAT-${index}`);
    expect(scenario.location).toBeTruthy();
    expect(scenario.keyStakeholders.length).toBeGreaterThan(0);
    expect(scenario.referenceStandards.planned).toBeTruthy();
    expect(scenario.referenceStandards.deliberate).toBeTruthy();
    expect(scenario.referenceStandards.initial).toBeTruthy();
  }
});

test('supports every existing mission duration', () => {
  for (const days of [3, 7, 14, 29]) {
    expect(generateMission({ seed: 'HIP-DURATION', days, role: 'canco' })).toHaveLength(days);
  }
});

test('coverage scheduler avoids immediate repetition and maximizes early exposure', () => {
  const mission = generateMission({ seed: 'HIP-COVERAGE', days: 7, role: 'canco' });
  const sites = mission.map(scenario => scenario.metadata.site);
  const missions = mission.map(scenario => scenario.metadata.mission);
  expect(new Set(sites).size).toBe(7);
  expect(new Set(missions).size).toBe(7);
  for (let index = 1; index < mission.length; index += 1) {
    expect(sites[index]).not.toBe(sites[index - 1]);
    expect(missions[index]).not.toBe(missions[index - 1]);
  }
});

test('long missions balance repeat exposure instead of clustering it', () => {
  const mission = generateMission({ seed: 'HIP-LONG-COVERAGE', days: 29, role: 'sgt' });
  const coverage = summarizeMissionCoverage(mission);
  const siteCounts = Object.values(coverage.sites);
  const missionCounts = Object.values(coverage.missions);
  expect(Math.max(...siteCounts) - Math.min(...siteCounts)).toBeLessThanOrEqual(1);
  expect(Math.max(...missionCounts) - Math.min(...missionCounts)).toBeLessThanOrEqual(1);
});

test('coverage-aware missions remain reproducible from the same seed', () => {
  expect(generateMission({ seed: 'HIP-COVERAGE-REPLAY', days: 14, role: 'chief' }))
    .toEqual(generateMission({ seed: 'HIP-COVERAGE-REPLAY', days: 14, role: 'chief' }));
});

test('school scenes begin with school-relevant stakeholders and a grounded scene', () => {
  const schoolStakeholders = ['school administrator', 'parent association representative', 'municipal education officer', 'senior teacher'];
  const scenarios = Array.from({ length: 200 }, (_, index) => generateScenario(`HIP-SCHOOL-${index}`));
  const school = scenarios.find(scenario => scenario.metadata.site === 'school');
  expect(school).toBeTruthy();
  expect(schoolStakeholders).toContain(school.keyStakeholders[0]);
  expect(schoolStakeholders).toContain(school.keyStakeholders[1]);
  expect(school.narrative).toContain('classroom');
});

test('interpreter injects are occasional and always visibly cued in the opening narrative', () => {
  const scenarios = Array.from({ length: 600 }, (_, index) => generateScenario(`HIP-INTERPRETER-${index}`));
  const interpreterScenarios = scenarios.filter(scenario => scenario.interpreterInject);
  const rate = interpreterScenarios.length / scenarios.length;

  expect(rate).toBeGreaterThan(0.05);
  expect(rate).toBeLessThan(0.16);
  interpreterScenarios.forEach(scenario => {
    expect(scenario.narrative).toContain(scenario.interpreterInject.cue);
  });
});
