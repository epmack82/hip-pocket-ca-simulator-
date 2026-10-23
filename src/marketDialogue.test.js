import { generateScenario } from './scenarioEngine';
import { processUnifiedAction, outcomeFromTurn } from './unifiedActionPipeline';
import { marketActionDraft } from './MarketActionHelper';
const scenario = generateScenario('market-dialogue', { featuredMarket: true, role: 'specialist' });
scenario.keyStakeholders = ['market association chair', 'transport cooperative representative', 'produce vendor', 'municipal licensing officer'];
const run = (rawText, worldState = {}, id = 'one') => processUnifiedAction({ id, kind: 'action', rawText, scenario, scenarioId: scenario.id, worldState });

test('actual playtest: introductions with interpreter and whiskey are not delegation', () => {
  const turn = run('i want to talk to Dao. i have my interpreter work with them to conduct introductions as i give a bottle of american whiskey as a token of thanks for their time. we begin building rapport');
  expect(turn.ok).toBe(true);
  expect(turn.interpretation.interpreterRole).toBe('supporting');
  expect(turn.interpretation.ambiguities).toEqual([]);
  expect(turn.worldUpdate.severity).toBe('none');
  expect(turn.worldUpdate.persistentConditions).toEqual([]);
  expect(turn.nextWorld.sites[scenario.id].giftResponses[0].status).toBe('declined');
  const story = outcomeFromTurn(turn).narrativeOutcome;
  expect(story).toContain('Dao');
  expect(story).toContain('please keep it');
  expect(story).not.toMatch(/departing Soldier|who is responsible|leadership is restored/);
});
test.each(['I ask my interpreter to conduct introductions with Dao.', 'I have my translator help introduce us to Dao.', 'I work with my interpreter to greet Dao.'])('support paraphrase: %s', text => {
  const turn = run(text);
  expect(turn.interpretation.interpreterRole).toBe('supporting');
  expect(turn.worldUpdate.severity).toBe('none');
});
test('explicit delegation still triggers a grounded concern', () => {
  const turn = run('I tell my interpreter to handle the meeting alone.');
  expect(turn.worldUpdate.classification).toBe('interpreter-substituted-for-soldier');
  expect(outcomeFromTurn(turn).narrativeOutcome).not.toContain('departing Soldier');
});
test('gift refusal persists through serialization and can be respected', () => {
  const first = run('I greet Dao. I offer Dao whiskey as a gift.');
  const next = run('I put the bottle away.', JSON.parse(JSON.stringify(first.nextWorld)), 'two');
  expect(next.worldUpdate.classification).toBe('respect-gift-response');
  expect(outcomeFromTurn(next).narrativeOutcome).toContain('earlier answer');
  expect(next.worldUpdate.relationshipChanges).toEqual([]);
});
test.each(['I do not offer Dao whiskey as a gift.', 'What if I give Dao whiskey as a gift?'])('non-action does not establish refusal: %s', text => {
  expect(run(text).worldUpdate.giftResponses).toEqual([]);
});

test('a gift does not earn points or establish agreement', () => {
  const turn = run('I offer Dao whiskey as a gift.');
  expect(turn.worldUpdate.relationshipChanges).toEqual([]);
  expect(turn.worldUpdate.scoreChanges).toEqual([]);
  expect(turn.worldUpdate.discoveries).toEqual([]);
});
test('a refusal belongs to its recipient, not every character', () => {
  const first = run('I greet Dao. I offer Dao whiskey as a gift.');
  const next = run('I greet Niran. I put the bottle away.', first.nextWorld, 'two');
  expect(next.findings.some(f => f.id === 'respect-gift-response')).toBe(false);
});

test('four characters supply distinct attributed accounts matching their dialogue', () => {
  const claims = ['Dao', 'Niran', 'Mali', 'Kiet'].map(name => {
    const turn = run(`I greet ${name}. I ask ${name} about current service conditions.`);
    const claim = turn.worldUpdate.discoveries[0];
    expect(claim.reliability).toBe('claim');
    expect(outcomeFromTurn(turn).narrativeOutcome).toContain(claim.text);
    return claim.text;
  });
  expect(new Set(claims).size).toBe(4);
});
test('conversation memory survives reload and remains scoped to the speaker', () => {
  const first = run('I greet Dao. I ask Dao about current service conditions.');
  const second = run('I ask Dao about service conditions.', JSON.parse(JSON.stringify(first.nextWorld)), 'two');
  expect(outcomeFromTurn(second).narrativeOutcome).toContain('speak to those owners');
  expect(second.nextWorld.sites[scenario.id].claims).toHaveLength(1);
  const third = run('I ask Dao about service conditions.', second.nextWorld, 'three');
  expect(outcomeFromTurn(third).narrativeOutcome).toContain('Repeating the question');
  const fourth = run('I ask Kiet about current service conditions.', third.nextWorld, 'four');
  expect(outcomeFromTurn(fourth).narrativeOutcome).not.toContain('Repeating the question');
  expect(fourth.nextWorld.sites[scenario.id].claims).toHaveLength(2);
  expect(fourth.nextWorld.sites[scenario.id].conversationEvents.filter(e => e.participant === 'produce vendor' && e.kind === 'inquiry')).toHaveLength(3);
});
test('unknown or misconduct actions do not create accepted conversation history', () => {
  expect(run('Purple moon pancakes.').nextWorld.sites[scenario.id].conversationEvents).toEqual([]);
  expect(run('I greet Dao. I set fire to the market.').nextWorld.sites[scenario.id].conversationEvents).toEqual([]);
});

test.each(['introduce', 'ask', 'records', 'coordinate'])('optional %s starter resolves to its selected recipient without misconduct', kind => {
  const turn = run(marketActionDraft('produce vendor', kind));
  expect(turn.ok).toBe(true);
  expect(turn.interpretation.actions[0].target).toBe('produce vendor');
  expect(turn.worldUpdate.severity).toBe('none');
  expect(turn.interpretation.ambiguities).toEqual([]);
});
