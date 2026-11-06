import { processUnifiedAction, outcomeFromTurn } from './unifiedActionPipeline';
import { availableMarketReplies } from './MarketReplyChoices';
const scenario = { id: 'short-followup', siteType: 'market', location: 'Central Market', keyStakeholders: ['market association chair', 'produce vendor'] };
const run = (rawText, worldState = {}, id = 'first') => processUnifiedAction({ id, kind: 'action', rawText, scenario, scenarioId: scenario.id, worldState });

test.each(['Tell me more.', 'What do you mean?', 'Could you explain that?', 'Please say more.'])('short follow-up uses the active speaker’s existing account: %s', text => {
  const first = run('I ask Mali about current trading conditions.');
  const next = run(text, JSON.parse(JSON.stringify(first.nextWorld)), 'next');
  expect(next.interpretation.ambiguities).toEqual([]);
  expect(next.worldUpdate.discoveries[0].source).toBe('market association chair');
  expect(next.worldUpdate.discoveries[0].reliability).toBe('claim');
  expect(next.nextWorld.sites[scenario.id].claims).toHaveLength(1);
  expect(next.worldUpdate.gaps.resolved).toEqual([]);
});

test('short follow-up before any account asks for clarification without invented findings or reply choices', () => {
  const result = run('What do you mean?');
  expect(result.worldUpdate.discoveries).toEqual([]);
  expect(outcomeFromTurn(result).narrativeOutcome).toContain('Which part would you like to talk about');
  expect(availableMarketReplies(scenario, result.nextWorld.sites[scenario.id])).toEqual([]);
});

test('switching speakers does not borrow the previous speaker’s account', () => {
  const mali = run('I ask Mali about trading conditions.');
  const dao = run('I greet Dao.', mali.nextWorld, 'dao');
  const result = run('Tell me more.', dao.nextWorld, 'more');
  expect(result.worldUpdate.discoveries).toEqual([]);
  expect(outcomeFromTurn(result).narrativeOutcome).toContain('Dao (produce vendor) says');
});
