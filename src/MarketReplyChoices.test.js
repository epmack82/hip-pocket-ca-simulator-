import { availableMarketReplies } from './MarketReplyChoices';
import { generateScenario } from './scenarioEngine';
import { processUnifiedAction, outcomeFromTurn } from './unifiedActionPipeline';
const scenario = generateScenario('reply-test', { featuredMarket: true, role: 'specialist' });
scenario.keyStakeholders = ['produce vendor', 'market association chair', 'transport cooperative representative', 'municipal licensing officer'];
const run = (rawText, worldState = {}, id = 'first') => processUnifiedAction({ id, kind: 'action', rawText, scenario, scenarioId: scenario.id, worldState });

test.each(['Mali', 'Dao', 'Niran', 'Kiet'])('repeating an inquiry does not reopen %s’s answered reciprocal question', name => {
  const question = `I ask ${name} about current trading conditions.`;
  const first = run(question);
  const answer = availableMarketReplies(scenario, first.nextWorld.sites[scenario.id])[0];
  const second = run(answer.text, first.nextWorld, 'answered');
  const repeated = run(question, JSON.parse(JSON.stringify(second.nextWorld)), 'repeated');
  expect(availableMarketReplies(scenario, repeated.nextWorld.sites[scenario.id])).toEqual([]);
  const narrative = outcomeFromTurn(repeated).narrativeOutcome;
  expect(narrative).toContain('recognizes the question you asked earlier');
  expect(narrative).toContain('remembers your earlier reply');
  expect(narrative).toContain('not independent confirmation');
  expect(repeated.nextWorld.sites[scenario.id].claims.length).toBe(first.nextWorld.sites[scenario.id].claims.length);
  expect(repeated.worldUpdate.gaps.resolved).toEqual([]);
});

test('pending questions follow the speaker and resume on return after reload', () => {
  const mali = run('I greet Mali. I ask Mali about current trading conditions.');
  const original = availableMarketReplies(scenario, mali.nextWorld.sites[scenario.id]);
  expect(original[0].role).toBe('market association chair');
  const dao = run('I greet Dao.', mali.nextWorld, 'dao');
  expect(availableMarketReplies(scenario, dao.nextWorld.sites[scenario.id])).toEqual([]);
  const returned = run('I greet Mali.', JSON.parse(JSON.stringify(dao.nextWorld)), 'return');
  expect(availableMarketReplies(scenario, returned.nextWorld.sites[scenario.id])[0].replyTo).toBe(original[0].replyTo);
  expect(outcomeFromTurn(returned).narrativeOutcome).toContain('earlier question is still available');
  const answered = run(original[0].text, returned.nextWorld, 'answer');
  const niran = run('I greet Niran.', answered.nextWorld, 'niran');
  const again = run('I greet Mali.', niran.nextWorld, 'again');
  expect(availableMarketReplies(scenario, again.nextWorld.sites[scenario.id])).toEqual([]);
  expect(outcomeFromTurn(again).narrativeOutcome).toContain('already talked about');
  expect(again.worldUpdate.discoveries).toEqual([]);
});

test('older journal-only saves do not surface another person’s question after a new opening', () => {
  const events = [{ id: 'mali-q', participant: 'market association chair', kind: 'inquiry' }, { id: 'dao-hi', participant: 'produce vendor', kind: 'opening' }];
  expect(availableMarketReplies(scenario, { conversationEvents: events })).toEqual([]);
});

test.each(['Dao', 'Mali', 'Niran', 'Kiet'])('%s question can be answered once and remembers the reply after reload', name => {
  const first = run(`I greet ${name}. I ask ${name} about current service conditions.`);
  const choices = availableMarketReplies(scenario, first.nextWorld.sites[scenario.id]);
  expect(choices).toHaveLength(2);
  const second = run(choices[0].text, JSON.parse(JSON.stringify(first.nextWorld)), 'second');
  expect(second.ok).toBe(true);
  expect(outcomeFromTurn(second).narrativeOutcome).toContain(choices[0].answer);
  expect(second.worldUpdate.discoveries).toEqual([]);
  expect(second.worldUpdate.scoreChanges).toEqual([]);
  expect(availableMarketReplies(scenario, JSON.parse(JSON.stringify(second.nextWorld.sites[scenario.id])))).toEqual([]);
});

test('no pending question means no reply choices; appended conduct cannot use the reply shortcut', () => {
  expect(availableMarketReplies(scenario)).toEqual([]);
  const first = run('I ask Dao about current service conditions.');
  const choice = availableMarketReplies(scenario, first.nextWorld.sites[scenario.id])[0];
  const second = run(choice.text + ' I set fire to the market.', first.nextWorld, 'second');
  expect(second.worldUpdate.classification).not.toBe('market-question-answered');
  expect(second.worldUpdate.severity).toBe('critical');
});
