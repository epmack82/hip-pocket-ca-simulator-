import { applyConsequenceRules, detectMisconduct, extractTraineeAction, isRemedialAction } from './consequenceEngine';

const scenario = { keyStakeholders: ['School director', 'Municipal official'] };

test('extracts only the trainee action rather than scenario background', () => {
  const prompt = `NARRATIVE: A vehicle burned yesterday.\nTRAINEE'S ACTION: "I greet the director and ask about school attendance."\n\nEvaluate this action`;
  expect(extractTraineeAction(prompt)).toContain('greet the director');
  expect(detectMisconduct(prompt, scenario)).toBeNull();
});

test('compound destructive misconduct overrides keyword-based rapport rewards', () => {
  const prompt = `TRAINEE'S ACTION: "I use slush funds to throw a party and get everyone drunk, set fire to a vehicle, and blame a local civilian."\n\nEvaluate this action`;
  const base = { qualityScore: 82, relationshipShifts: { 'School director': 4 }, narrativeOutcome: 'The party improves rapport.' };
  const applied = applyConsequenceRules(base, prompt, scenario, []);
  expect(applied.result.qualityScore).toBe(0);
  expect(applied.result.relationshipShifts['Ahmad (Interpreter)']).toBeLessThan(0);
  expect(applied.result.relationshipShifts['School director']).toBeLessThan(0);
  expect(applied.result.narrativeOutcome).toContain('breakdown in trust');
  expect(applied.result.progress.leads).toEqual([]);
  expect(applied.consequences).toHaveLength(1);
});

test('consequences carry into later turns and limit instant relationship recovery', () => {
  const prior = [detectMisconduct(`TRAINEE'S ACTION: "I set fire to a vehicle."\n\nEvaluate this action`, scenario)];
  const normal = { qualityScore: 75, relationshipShifts: { 'School director': 6 }, narrativeOutcome: 'You conduct an assessment.' };
  const applied = applyConsequenceRules(normal, `TRAINEE'S ACTION: "I inspect the school."\n\nEvaluate this action`, scenario, prior);
  expect(applied.result.qualityScore).toBe(65);
  expect(applied.result.relationshipShifts['School director']).toBe(0);
  expect(applied.result.narrativeOutcome).toContain('continues to shape the mission');
});

test('deliberately leaving the engagement for personal entertainment is penalized', () => {
  const prompt = `TRAINEE'S ACTION: "I ignore everyone and head to the strip club."\n\nEvaluate this action`;
  const base = {
    qualityScore: 38,
    relationshipShifts: { 'School director': 1, 'Municipal official': 1 },
    narrativeOutcome: 'The team establishes an initial presence.'
  };
  const applied = applyConsequenceRules(base, prompt, scenario, []);

  expect(applied.detected.title).toBe('Deliberate mission abandonment');
  expect(applied.result.qualityScore).toBe(0);
  expect(applied.result.relationshipShifts['School director']).toBeLessThan(0);
  expect(applied.result.relationshipShifts['Municipal official']).toBeLessThan(0);
  expect(applied.result.narrativeOutcome).toContain('turns away from the assigned engagement');
  expect(applied.result.narrativeOutcome).not.toContain('pending command review');
});

test('active serious consequences never allow automatic positive rapport', () => {
  const prior = [detectMisconduct(`TRAINEE'S ACTION: "I set fire to a vehicle."\n\nEvaluate this action`, scenario)];
  const base = {
    qualityScore: 45,
    relationshipShifts: { 'School director': 1, 'Municipal official': 4 },
    narrativeOutcome: 'The team is present.'
  };
  const applied = applyConsequenceRules(base, `TRAINEE'S ACTION: "I wait nearby."\n\nEvaluate this action`, scenario, prior);

  expect(applied.result.relationshipShifts['School director']).toBe(0);
  expect(applied.result.relationshipShifts['Municipal official']).toBe(0);
});

test('a promise to provide a school window creates persistent command and relationship consequences', () => {
  const prompt = `TRAINEE'S ACTION: "I promise the school that our team will replace the broken window."\n\nEvaluate this action`;
  const base = {
    qualityScore: 70,
    relationshipShifts: { 'School director': 4 },
    narrativeOutcome: 'The school appreciates the offer.'
  };
  const applied = applyConsequenceRules(base, prompt, scenario, []);

  expect(applied.detected.title).toBe('Unauthorized promise or commitment');
  expect(applied.result.qualityScore).toBe(0);
  expect(applied.result.relationshipShifts['School director']).toBeLessThan(0);
  expect(applied.result.relationshipShifts['SSG Davis (CMOC)']).toBeLessThan(0);
  expect(applied.result.narrativeOutcome).toContain('firm commitment of U.S. support');
  expect(applied.result.narrativeOutcome).toContain('Personal payment');
  expect(applied.result.progress.informationGaps).toContain('Actual authority, funding, and delivery capability');
  expect(applied.consequences[0].persistentEffects.join(' ')).toContain('Failure to deliver can damage trust');
});

test('material-support promises are caught without penalizing transparent limitations or routine reporting', () => {
  const promised = detectMisconduct(`TRAINEE'S ACTION: "We'll provide construction materials and supplies next week."\n\nEvaluate this action`, scenario);
  const transparent = detectMisconduct(`TRAINEE'S ACTION: "I explain that I cannot promise assistance, document the request, and coordinate it through authorized channels."\n\nEvaluate this action`, scenario);
  const reporting = detectMisconduct(`TRAINEE'S ACTION: "I will provide an update to CMOC after validating the school report."\n\nEvaluate this action`, scenario);

  expect(promised?.title).toBe('Unauthorized promise or commitment');
  expect(transparent).toBeNull();
  expect(reporting).toBeNull();
});

test('accountability can begin mitigation without erasing the consequence', () => {
  const prior = [detectMisconduct(`TRAINEE'S ACTION: "I set fire to a vehicle."\n\nEvaluate this action`, scenario)];
  const prompt = `TRAINEE'S ACTION: "I notify the chain of command, accept responsibility, correct the record, and cooperate with the investigation."\n\nEvaluate this action`;
  expect(isRemedialAction(prompt)).toBe(true);
  const applied = applyConsequenceRules({ qualityScore: 70, relationshipShifts: {}, narrativeOutcome: 'You report.' }, prompt, scenario, prior);
  expect(applied.consequences[0].status).toBe('mitigating');
  expect(applied.result.narrativeOutcome).toContain('does not erase the harm');
});
