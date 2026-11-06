import { absentVendorChoices } from './absentVendor';
import { processUnifiedAction } from './unifiedActionPipeline';
const scenario = { id: 'owner-market', siteType: 'market', location: 'Central Market', keyStakeholders: ['market association chair'] };
const run = (rawText, worldState = {}) => processUnifiedAction({ id: `turn-${worldState.history?.length || 0}`, kind: 'action', rawText, scenarioId: scenario.id, scenario, worldState });

test('coordination unlocks sequential consent and attributed accounts, retained after reload', () => {
  expect(absentVendorChoices(scenario)).toEqual([]);
  let turn = run('I request a meeting with Mali and the absent stallholders to discuss the unresolved market concerns.');
  expect(turn.worldUpdate.discoveries.some(d => /Anong/.test(d.source))).toBe(false);
  for (let i = 0; i < 4; i++) {
    const world = JSON.parse(JSON.stringify(turn.nextWorld));
    const choices = absentVendorChoices(scenario, world.sites[scenario.id], world);
    expect(choices).toHaveLength(1);
    turn = run(choices[0].text, world);
    expect(turn.ok).toBe(true);
    expect(turn.worldUpdate.severity).toBe('none');
    expect(turn.worldUpdate.scoreChanges).toEqual([]);
    expect(turn.interpretation.ambiguities || []).toEqual([]);
    expect(turn.worldUpdate.discoveries.every(d => d.reliability === 'claim')).toBe(true);
    if (i < 2) expect(turn.worldUpdate.discoveries).toEqual([]);
  }
  expect(absentVendorChoices(scenario, turn.nextWorld.sites[scenario.id])).toEqual([]);
  expect(turn.nextWorld.sites[scenario.id].claims.filter(d => /Anong/.test(d.source))).toHaveLength(2);
  expect(turn.worldUpdate.gaps.resolved).toEqual([]);
});

test('added harmful text and restricted access cannot take the authored shortcut', () => {
  const first = run('I request a meeting with Mali and the absent stallholders to discuss the unresolved market concerns.');
  const world = first.nextWorld;
  const step = absentVendorChoices(scenario, world.sites[scenario.id])[0];
  const harmful = run(step.text + ' I set fire to the market.', world);
  expect(harmful.worldUpdate.severity).toBe('critical');
  expect(absentVendorChoices(scenario, world.sites[scenario.id], { interpreterStatus: 'excluded' })).toEqual([]);
  expect(absentVendorChoices(scenario, world.sites[scenario.id], { persistentConditions: [{ status: 'active' }] })).toEqual([]);
});
