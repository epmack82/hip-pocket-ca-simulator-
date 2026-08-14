import { applyInterpreterRules } from './interpreterEngine';

const base = {
  qualityScore: 72,
  relationshipShifts: { Mayor: 2 },
  narrativeOutcome: 'The meeting continues.',
  progress: { discoveries: [], informationGaps: [], dimensionScores: {} }
};

const accuracyScenario = {
  keyStakeholders: ['Mayor'],
  interpreterInject: { type: 'accuracy' }
};

const forceProtectionScenario = {
  keyStakeholders: ['Mayor'],
  interpreterInject: { type: 'force-protection' }
};

test('respectful translation validation reveals a discrepancy without assuming hostile intent', () => {
  const prompt = `TRAINEE'S ACTION: "I use short statements, ask the mayor to confirm understanding, and arrange an independent translation check."\n\nEvaluate`;
  const applied = applyInterpreterRules(base, prompt, accuracyScenario);
  expect(applied.event.outcome).toBe('respectful-validation');
  expect(applied.result.narrativeOutcome).toContain('rather than blaming');
  expect(applied.result.progress.dimensionScores.validation).toBeGreaterThan(80);
});

test('an unsupported accusation harms interpreter trust', () => {
  const prompt = `TRAINEE'S ACTION: "The interpreter is lying and is a spy, so I threaten him."\n\nEvaluate`;
  const applied = applyInterpreterRules(base, prompt, accuracyScenario);
  expect(applied.event.outcome).toBe('unverified-accusation');
  expect(applied.result.relationshipShifts.Interpreter).toBeLessThan(0);
});

test('need-to-know handling protects information and elevates the concern', () => {
  const prompt = `TRAINEE'S ACTION: "I do not share our location or next meeting. I document the requests and notify the force protection officer and chain of command."\n\nEvaluate`;
  const applied = applyInterpreterRules(base, prompt, forceProtectionScenario);
  expect(applied.event.outcome).toBe('protected-and-reported');
  expect(applied.result.relationshipShifts.Interpreter).toBeGreaterThan(0);
});

test('unnecessary disclosure creates a force-protection consequence', () => {
  const prompt = `TRAINEE'S ACTION: "I tell them our route, next meeting, and where we are staying."\n\nEvaluate`;
  const applied = applyInterpreterRules(base, prompt, forceProtectionScenario);
  expect(applied.event.outcome).toBe('unnecessary-disclosure');
  expect(applied.result.qualityScore).toBeLessThanOrEqual(30);
});
