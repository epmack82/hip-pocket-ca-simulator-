import { createOfflineDebrief, evaluateOffline } from './offlineEvaluator';
import { getProductWorksheet } from './productTemplates';

test('returns the response shape required by the game', () => {
  const result = evaluateOffline(`TRAINEE'S ACTION: "I greet the mayor, assess the site, validate reports, and document findings."

Evaluate this action`, { name: 'Test mission', keyStakeholders: ['Mayor'] });
  expect(result.evaluationMode).toBe('offline');
  expect(result.qualityScore).toBeGreaterThan(50);
  expect(result.relationshipShifts.Mayor).toBeGreaterThan(0);
  expect(result.product).toBeNull();
});

test('does not award rapport when the action contains no rapport behavior', () => {
  const result = evaluateOffline(`TRAINEE'S ACTION: "I stand nearby and do nothing relevant."\n\nEvaluate this action`, {
    name: 'Test mission',
    keyStakeholders: ['School director']
  });
  expect(result.relationshipShifts['School director']).toBe(0);
});

test('creates an offline product when requested', () => {
  const result = evaluateOffline('TRAINEE WANTS TO CREATE THIS PRODUCT: "Stakeholder map"\nADDITIONAL DETAILS FROM TRAINEE: "Known actors entered by trainee"\n\nGenerate this product', { name: 'Network mission' });
  expect(result.product.name).toBe('Stakeholder map');
  expect(result.product.recipient).toContain('S-9');
});

test('product score increases with worksheet completion rather than selection alone', () => {
  const scenario = { name: 'Network mission', location: 'clinic' };
  const blankWorksheet = getProductWorksheet('SITREP', scenario);
  const blank = evaluateOffline(`TRAINEE WANTS TO CREATE THIS PRODUCT: "SITREP"\nADDITIONAL DETAILS FROM TRAINEE: "${blankWorksheet}"\n\nGenerate this product`, scenario);
  const completed = evaluateOffline('TRAINEE WANTS TO CREATE THIS PRODUCT: "SITREP"\nADDITIONAL DETAILS FROM TRAINEE: "TRAINING WORKSHEET completed with confirmed observations and coordination."\n\nGenerate this product', scenario);
  expect(blank.qualityScore).toBe(5);
  expect(completed.qualityScore).toBeGreaterThan(blank.qualityScore);
});

test('creates a debrief without a provider', () => {
  expect(createOfflineDebrief([{ qualityScore: 80 }], [])).toContain('average assessment score of 80');
});

test('asking for stakeholder concerns and leads produces a concrete claim to validate', () => {
  const scenario = {
    keyStakeholders: ['School administrator'],
    lead: { id: 'lead-1', label: 'water facility', contact: 'utility manager' }
  };
  const result = evaluateOffline(`TRAINEE'S ACTION: "I ask the stakeholder for their input, concerns, and any leads we should follow."\n\nEvaluate this action`, scenario);

  expect(result.narrativeOutcome).toContain('water facility');
  expect(result.narrativeOutcome).toContain('single-source claim');
  expect(result.progress.discoveries.join(' ')).toContain('utility manager');
  expect(result.progress.leads[0].id).toBe('lead-1');
  expect(result.relationshipShifts['School administrator']).toBeGreaterThan(0);
});

test('validation after inquiry references the earlier claim and distinguishes method from intent', () => {
  const previousState = { discoveries: ['The school administrator links the problem to the water facility.'] };
  const specific = evaluateOffline(`TRAINEE'S ACTION: "I validate the claim by comparing the maintenance ledger with direct observation and another source."\n\nEvaluate this action`, { keyStakeholders: ['School administrator'] }, previousState);
  const vague = evaluateOffline(`TRAINEE'S ACTION: "I validate the information."\n\nEvaluate this action`, { keyStakeholders: ['School administrator'] }, previousState);

  expect(specific.narrativeOutcome).toContain('tests an earlier claim');
  expect(vague.narrativeOutcome).toContain('three practical paths are available');
  expect(vague.narrativeOutcome).toContain('Choose one path');
});

test('successive unclassified actions receive action-specific feedback instead of a repeated fallback', () => {
  const scenario = { location: 'irrigation cooperative', keyStakeholders: ['Cooperative chair'] };
  const first = evaluateOffline(`TRAINEE'S ACTION: "I wait by the vehicle."\n\nEvaluate this action`, scenario, { actions: [] });
  const fourth = evaluateOffline(`TRAINEE'S ACTION: "I walk toward the storage shed."\n\nEvaluate this action`, scenario, {
    actions: ['one', 'two', 'three']
  });

  expect(first.narrativeOutcome).toContain('wait by the vehicle');
  expect(fourth.narrativeOutcome).toContain('walk toward the storage shed');
  expect(fourth.narrativeOutcome).not.toBe(first.narrativeOutcome);
  expect(fourth.narrativeOutcome).not.toContain('established an initial presence');
});

test('an unsupported IG product is capped and explains that selecting the form does not create a complaint', () => {
  const result = evaluateOffline(
    'TRAINEE WANTS TO CREATE THIS PRODUCT: "Inspector General Action Request (DA Form 1559)"\nADDITIONAL DETAILS FROM TRAINEE: "I selected this because it was available, but I have no complaint or factual issue to report."\n\nGenerate this product',
    { name: 'Training mission' }
  );

  expect(result.qualityScore).toBeLessThanOrEqual(10);
  expect(result.narrativeOutcome).toContain('Selecting or filling a form does not create a valid complaint');
  expect(result.routingRationale).toContain('unsupported fictional complaint');
});

test('an urgent allegation in an IG worksheet prompts parallel priority routing', () => {
  const result = evaluateOffline(
    'TRAINEE WANTS TO CREATE THIS PRODUCT: "Inspector General Action Request (DA Form 1559)"\nADDITIONAL DETAILS FROM TRAINEE: "A Soldier reports a sexual assault and immediate safety concerns. The report identifies who received the disclosure, the date, time, location, witness, messages, and requested support. The team documents the facts without investigating the victim."\n\nGenerate this product',
    { name: 'Training mission' }
  );

  expect(result.qualityScore).toBeLessThanOrEqual(25);
  expect(result.narrativeOutcome).toContain('IG is not the only—or necessarily the first—channel');
  expect(result.routingRationale).toContain('SHARP');
});

test('a vague complaint that a stakeholder was mean is rejected as IG misuse', () => {
  const result = evaluateOffline(
    'TRAINEE WANTS TO CREATE THIS PRODUCT: "Inspector General Action Request (DA Form 1559)"\nADDITIONAL DETAILS FROM TRAINEE: "2. SPECIFIC ACTION REQUESTED: The clinic director was mean to us. Please protect us."\n\nGenerate this product',
    { name: 'Training mission' }
  );

  expect(result.qualityScore).toBeLessThanOrEqual(10);
  expect(result.narrativeOutcome).toContain('do not identify misconduct');
  expect(result.narrativeOutcome).toContain('not a customer-service complaint channel');
});

test('stakeholder titles are capitalized when beginning evaluator sentences', () => {
  const result = evaluateOffline(
    `TRAINEE'S ACTION: "I wait by the door."\n\nEvaluate this action`,
    { location: 'district clinic', keyStakeholders: ['clinic director'] }
  );

  expect(result.narrativeOutcome.startsWith('Clinic director')).toBe(true);
});

test('a thoughtful interpreter-assisted introduction with a gift produces an immersive first scene', () => {
  const result = evaluateOffline(
    `TRAINEE'S ACTION: "I provide warm introductions, use our interpreter for culturally appropriate language, sincerely thank the host, and offer a small gift."\n\nEvaluate this action`,
    { location: 'municipal office', keyStakeholders: ['municipal administrator', 'public works director'] },
    { actions: [] }
  );

  expect(result.narrativeOutcome).toContain('interpreter');
  expect(result.narrativeOutcome).toContain('gift');
  expect(result.narrativeOutcome).toContain("item's value");
  expect(result.relationshipShifts['municipal administrator']).toBe(4);
  expect(result.relationshipShifts['public works director']).toBe(0);
});

test('free-text product claims receive a missing-attachments note and no product credit', () => {
  const result = evaluateOffline(
    `TRAINEE'S ACTION: "I prepared a KLE report, baseball card, and site assessment."\n\nEvaluate this action`,
    { location: 'water facility', keyStakeholders: ['utility manager'] },
    { actions: [] }
  );

  expect(result.product).toBeNull();
  expect(result.claimedProducts).toEqual(expect.arrayContaining(['Post-KLE Report', 'Stakeholder Baseball Card', 'Site Assessment']));
  expect(result.narrativeOutcome).toContain('Please resend with attachments');
  expect(result.narrativeOutcome).toContain('No product-quality credit');
  expect(result.narrativeOutcome).toContain('cannot be completed before the engagement');
});

test('dialogue and rapport follow the explicitly addressed secondary stakeholder despite a misspelling', () => {
  const result = evaluateOffline(
    `TRAINEE'S ACTION: "I apologize to the municipile engineer, invite them into the conversation, and ask for their perspective."\n\nEvaluate this action`,
    {
      location: 'water facility',
      keyStakeholders: ['utility operations manager', 'municipal engineer'],
      lead: { id: 'lead-2', label: 'municipal records office', contact: 'network planning supervisor' }
    },
    { actions: [], discoveries: ['A baseline assessment of the water facility has begun.'] }
  );

  expect(result.narrativeOutcome.startsWith('Municipal engineer')).toBe(true);
  expect(result.narrativeOutcome).not.toContain('follow-up to the earlier account: "A baseline assessment');
  expect(result.relationshipShifts['municipal engineer']).toBe(4);
  expect(result.relationshipShifts['utility operations manager']).toBe(0);
});
