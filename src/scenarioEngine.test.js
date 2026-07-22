import { generateMission, generateScenario } from './scenarioEngine';

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

test('school scenes begin with school-relevant stakeholders and a grounded scene', () => {
  const schoolStakeholders = ['school administrator', 'parent association representative', 'municipal education officer', 'senior teacher'];
  const scenarios = Array.from({ length: 200 }, (_, index) => generateScenario(`HIP-SCHOOL-${index}`));
  const school = scenarios.find(scenario => scenario.metadata.site === 'school');
  expect(school).toBeTruthy();
  expect(schoolStakeholders).toContain(school.keyStakeholders[0]);
  expect(schoolStakeholders).toContain(school.keyStakeholders[1]);
  expect(school.narrative).toContain('classroom');
});
