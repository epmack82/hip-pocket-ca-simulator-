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
  expect(applied.result.qualityScore).toBeLessThan(0);
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
  expect(applied.result.qualityScore).toBeLessThan(0);
  expect(applied.result.relationshipShifts['School director']).toBeLessThan(0);
  expect(applied.result.relationshipShifts['Municipal official']).toBeLessThan(0);
  expect(applied.result.narrativeOutcome).toContain('turns away from the assigned engagement');
  expect(applied.result.narrativeOutcome).not.toContain('pending command review');
});

test('concise skip-it-and-get-drunk language is treated as mission abandonment', () => {
  const prompt = `TRAINEE'S ACTION: "Skip it and get drunk."\n\nEvaluate this action`;
  const base = {
    qualityScore: 38,
    relationshipShifts: { 'School director': 0, 'Municipal official': 0 },
    narrativeOutcome: 'The team establishes an initial presence.'
  };
  const applied = applyConsequenceRules(base, prompt, scenario, []);

  expect(applied.detected.title).toBe('Deliberate mission abandonment');
  expect(applied.result.qualityScore).toBeLessThan(0);
  expect(applied.result.relationshipShifts['School director']).toBeLessThan(0);
  expect(applied.result.narrativeOutcome).toContain('turns away from the assigned engagement');
});

test('documenting alcohol-related community concerns is not treated as abandonment', () => {
  const prompt = `TRAINEE'S ACTION: "I ask the clinic director whether reports that residents get drunk are connected to the public health concern, then document the answer."\n\nEvaluate this action`;
  expect(detectMisconduct(prompt, scenario)).toBeNull();
});

test('returning intoxicated and offering alcohol to a local contact compounds prior misconduct', () => {
  const prior = [detectMisconduct(`TRAINEE'S ACTION: "Skip it and get drunk."\n\nEvaluate this action`, scenario)];
  const prompt = `TRAINEE'S ACTION: "I arrived back at the location drunk and offered booze to the local POC."\n\nEvaluate this action`;
  const base = {
    qualityScore: 44,
    relationshipShifts: { 'School director': 1, 'Municipal official': 1 },
    narrativeOutcome: 'The team conducts an assessment.'
  };
  const applied = applyConsequenceRules(base, prompt, scenario, prior);

  expect(applied.detected.title).toBe('Intoxication during a stakeholder engagement');
  expect(applied.result.qualityScore).toBeLessThan(0);
  expect(applied.result.relationshipShifts['School director']).toBeLessThan(0);
  expect(applied.result.relationshipShifts['SSG Davis (CMOC)']).toBeLessThan(0);
  expect(applied.result.narrativeOutcome).toContain('misconduct event 2');
  expect(applied.result.narrativeOutcome).toContain('compounds the earlier event');
  expect(applied.result.narrativeOutcome).toContain('return visibly intoxicated');
  expect(applied.result.narrativeOutcome).toContain('The offer does not build rapport');
  expect(applied.consequences).toHaveLength(2);
});

test('responsible inquiry about alcohol does not trigger intoxication misconduct', () => {
  const prompt = `TRAINEE'S ACTION: "I ask the local POC about reports of alcohol misuse, validate the concern with the clinic, and document the response."\n\nEvaluate this action`;
  expect(detectMisconduct(prompt, scenario)).toBeNull();
});

test('opening a gambling ring is recognized as criminal misconduct', () => {
  const prompt = `TRAINEE'S ACTION: "I open a gambling ring next door."\n\nEvaluate this action`;
  const applied = applyConsequenceRules(
    { qualityScore: 38, relationshipShifts: { 'Clinic director': 0 }, narrativeOutcome: 'Unclear action.' },
    prompt,
    { keyStakeholders: ['Clinic director'] },
    []
  );

  expect(applied.detected.title).toBe('Proposed criminal enterprise');
  expect(applied.result.qualityScore).toBeLessThan(0);
  expect(applied.result.relationshipShifts['Clinic director']).toBeLessThan(0);
  expect(applied.result.narrativeOutcome).toContain('illegal gambling or criminal enterprise');
});

test('hosting a party to get everyone hammered is intoxication misconduct', () => {
  const prompt = `TRAINEE'S ACTION: "I host a BBQ and get everyone hammered."\n\nEvaluate this action`;
  const applied = applyConsequenceRules(
    { qualityScore: 38, relationshipShifts: { 'Clinic director': 0 }, narrativeOutcome: 'Unclear action.' },
    prompt,
    { keyStakeholders: ['Clinic director'] },
    []
  );

  expect(applied.detected.title).toBe('Intoxication during a stakeholder engagement');
  expect(applied.result.qualityScore).toBeLessThan(0);
  expect(applied.result.relationshipShifts['Clinic director']).toBeLessThan(0);
  expect(applied.result.narrativeOutcome).toContain('alcohol-centered social event');
});

test('hanging out instead of doing any work is mission abandonment', () => {
  const prompt = `TRAINEE'S ACTION: "I hang out with the boys instead of doing any work."\n\nEvaluate this action`;
  const applied = applyConsequenceRules(
    { qualityScore: 38, relationshipShifts: { 'Facilities manager': 0 }, narrativeOutcome: 'Unclear action.' },
    prompt,
    { keyStakeholders: ['Facilities manager'] },
    []
  );

  expect(applied.detected.title).toBe('Deliberate mission abandonment');
  expect(applied.result.qualityScore).toBeLessThan(0);
  expect(applied.result.relationshipShifts['Facilities manager']).toBeLessThan(0);
});

test('unsupported arrests and coercive force are misconduct', () => {
  const prompt = `TRAINEE'S ACTION: "The market surely has criminal activity. Let's start arresting people and using force to expose it."\n\nEvaluate this action`;
  const applied = applyConsequenceRules(
    { qualityScore: 38, relationshipShifts: { 'Market representative': 0 }, narrativeOutcome: 'Unclear action.' },
    prompt,
    { keyStakeholders: ['Market representative'] },
    []
  );

  expect(applied.detected.categories).toContain('Corruption, theft, coercion, or intimidation');
  expect(applied.result.qualityScore).toBeLessThan(0);
  expect(applied.result.relationshipShifts['Market representative']).toBeLessThan(0);
});

test('lighting a joint and heading to a strip club triggers intoxication and abandonment', () => {
  const prompt = `TRAINEE'S ACTION: "I light a joint and head to the strip club."\n\nEvaluate this action`;
  const applied = applyConsequenceRules(
    { qualityScore: 38, relationshipShifts: { 'Clinic director': 0 }, narrativeOutcome: 'Unclear action.' },
    prompt,
    { keyStakeholders: ['Clinic director'] },
    []
  );

  expect(applied.detected.categories).toContain('Misuse of funds or mission-compromising intoxication');
  expect(applied.detected.categories).toContain('Deliberate abandonment of the mission or assigned engagement');
  expect(applied.detected.severity).toBe('critical');
  expect(applied.result.qualityScore).toBe(-100);
  expect(applied.result.relationshipShifts['Clinic director']).toBeLessThan(0);
});

test('repeated misconduct in the same category keeps accumulating beyond two events', () => {
  const firstPrompt = `TRAINEE'S ACTION: "I returned drunk and offered booze to the local POC."\n\nEvaluate this action`;
  const first = detectMisconduct(firstPrompt, scenario);
  const second = applyConsequenceRules({}, firstPrompt, scenario, [{ ...first, occurrenceCount: 1 }]);
  const third = applyConsequenceRules({}, firstPrompt, scenario, second.consequences);

  expect(second.consequences[0].occurrenceCount).toBe(2);
  expect(third.consequences[0].occurrenceCount).toBe(3);
  expect(third.result.narrativeOutcome).toContain('misconduct event 3');
  expect(third.result.qualityScore).toBeLessThan(second.result.qualityScore);
  expect(third.result.missionTerminated).toBe(true);
  expect(third.result.relationshipShifts['SSG Davis (CMOC)']).toBeLessThan(second.result.relationshipShifts['SSG Davis (CMOC)']);
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
  expect(applied.result.qualityScore).toBeLessThan(0);
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

test('an unapproved staff party triggers contextual clarification without being treated as catastrophic misconduct', () => {
  const prompt = `TRAINEE'S ACTION: "Set up a party for the admin staff."

Evaluate this action`;
  const applied = applyConsequenceRules(
    { qualityScore: 45, relationshipShifts: { 'School director': 1 }, narrativeOutcome: 'Unclear action.' },
    prompt,
    scenario,
    []
  );

  expect(applied.detected.title).toBe('Unapproved social-event proposal requires clarification');
  expect(applied.detected.severity).toBe('questionable');
  expect(applied.result.qualityScore).toBeLessThan(0);
  expect(applied.result.qualityScore).toBeGreaterThan(-100);
  expect(applied.result.relationshipShifts['School director']).toBeLessThan(0);
  expect(applied.result.narrativeOutcome).toContain('mission purpose');
  expect(applied.result.narrativeOutcome).toContain('funding source');
  expect(applied.result.narrativeOutcome).toContain('No relationship gain is awarded');
});

test('an approved mission-related reception is not classified as misconduct', () => {
  const prompt = `TRAINEE'S ACTION: "Coordinate a command-approved reception that supports the engagement objective."

Evaluate this action`;
  expect(detectMisconduct(prompt, scenario)).toBeNull();
});

test('a rager and four-day bender receives action-specific critical consequences', () => {
  const prompt = `TRAINEE'S ACTION: "Host a rager for the dockworkers and go on a 4 day bender."

Evaluate this action`;
  const applied = applyConsequenceRules(
    { qualityScore: 45, relationshipShifts: { 'Dockworkers representative': 0 }, narrativeOutcome: 'Unclear action.' },
    prompt,
    { keyStakeholders: ['Dockworkers representative', 'Port director'] },
    []
  );

  expect(applied.detected.severity).toBe('critical');
  expect(applied.result.qualityScore).toBe(-100);
  expect(applied.result.narrativeOutcome).toContain('multi-day bender');
  expect(applied.result.narrativeOutcome).toContain('No rapport is gained');
  expect(applied.result.relationshipShifts['Dockworkers representative']).toBeLessThan(0);
});

test('planting C4 on civilian infrastructure and fleeing triggers critical explosive-sabotage consequences', () => {
  const prompt = `TRAINEE'S ACTION: "Plant C4 on the distribution tanks and high tail it."

Evaluate this action`;
  const applied = applyConsequenceRules(
    { qualityScore: 45, relationshipShifts: { 'Utility operations manager': 0 }, narrativeOutcome: 'Unclear action.' },
    prompt,
    { keyStakeholders: ['Utility operations manager', 'Municipal engineer'] },
    []
  );

  expect(applied.detected.severity).toBe('critical');
  expect(applied.detected.categories).toEqual(expect.arrayContaining([
    'Destruction, violence, or reckless endangerment',
    'Deliberate abandonment of the mission or assigned engagement'
  ]));
  expect(applied.result.qualityScore).toBe(-100);
  expect(applied.result.narrativeOutcome).toContain('explosive attack against critical civilian infrastructure');
  expect(applied.result.narrativeOutcome).toContain('attempt to flee');
  expect(applied.result.relationshipShifts['Utility operations manager']).toBeLessThan(0);
  expect(applied.result.missionTerminated).toBe(true);
});
