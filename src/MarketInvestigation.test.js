import { marketInvestigationChoices } from './MarketInvestigation';
import { processUnifiedAction, outcomeFromTurn } from './unifiedActionPipeline';
const scenario = { id: 'investigation-market', siteType: 'market', location: 'Central Market', keyStakeholders: ['market association chair', 'produce vendor', 'transport cooperative representative'] };
const run = (text, world = {}) => processUnifiedAction({ id: 'turn-' + (world.history?.length || 0), kind: 'action', rawText: text, scenarioId: scenario.id, scenario, worldState: world });

test.each([['Dao', 'produce vendor', 'start with my stall'], ['Niran', 'transport cooperative representative', 'I can speak about transport']])('purpose continuity follows %s rather than always returning to Mali', (name, role, reply) => {
  const mali = run('I explain our purpose to Mali: we want to understand trading conditions.');
  const greeted = run(`I greet ${name} and introduce our team.`, mali.nextWorld);
  expect(greeted.worldUpdate.discoveries).toEqual([]);
  const saved = JSON.parse(JSON.stringify(greeted.nextWorld));
  const options = marketInvestigationChoices(scenario, saved.sites[scenario.id]);
  const purpose = options.find(c => c.id === 'purpose');
  expect(purpose.text).toContain(name);
  expect(purpose.text).not.toContain('Mali');
  const explained = run(purpose.text, saved);
  expect(outcomeFromTurn(explained).narrativeOutcome).toContain(reply);
  expect(explained.worldUpdate.discoveries).toEqual([]);
  expect(marketInvestigationChoices(scenario, explained.nextWorld.sites[scenario.id]).some(c => c.id === 'purpose')).toBe(false);
  expect(explained.nextWorld.sites[scenario.id].engagedParticipants).toContain(role);
});

test('looking around before contact does not invent an earlier conversation', () => {
  const first = run('I walk the back rows.');
  expect(outcomeFromTurn(first).narrativeOutcome).toContain('from the entrance');
  expect(outcomeFromTurn(first).narrativeOutcome).not.toContain('turn from the conversation');
  const greeting = run('I greet Dao.', first.nextWorld);
  const later = run('I walk the back rows.', greeting.nextWorld);
  expect(outcomeFromTurn(later).narrativeOutcome).toContain('turn from the conversation');
});

test('introduction, purpose and inquiry form a saved conversation without premature findings', () => {
  const opening = marketInvestigationChoices(scenario).find(c => c.id === 'introduce');
  const first = run(opening.text);
  expect(first.worldUpdate.severity).toBe('none');
  expect(first.worldUpdate.discoveries).toEqual([]);
  expect(outcomeFromTurn(first).narrativeOutcome).toContain('Yes, I am Mali');
  const restored = JSON.parse(JSON.stringify(first.nextWorld));
  const choices = marketInvestigationChoices(scenario, restored.sites[scenario.id]);
  expect(choices.some(c => c.id === 'introduce')).toBe(false);
  const purpose = run(choices.find(c => c.id === 'purpose').text, restored);
  expect(purpose.worldUpdate.discoveries).toEqual([]);
  expect(outcomeFromTurn(purpose).narrativeOutcome).toContain('You want to understand what is happening here');
  expect(outcomeFromTurn(purpose).narrativeOutcome).not.toContain('What brings your team here today');
  expect(marketInvestigationChoices(scenario, purpose.nextWorld.sites[scenario.id]).some(c => c.id === 'purpose')).toBe(false);
  const question = run('I ask Mali about current trading conditions.', purpose.nextWorld);
  expect(question.worldUpdate.discoveries.some(d => d.reliability === 'claim')).toBe(true);
});

test.each(['I do not explain our purpose to Mali: we want to understand trading conditions.', 'What if I explain our purpose to Mali: we want to understand trading conditions?'])('unperformed explanation does not create purpose memory: %s', text => {
  const turn = run(text);
  expect(turn.nextWorld.sites[scenario.id]?.conversationEvents || []).toEqual([]);
  expect(outcomeFromTurn(turn).narrativeOutcome).not.toContain('You want to understand what is happening here');
});

test('observation and accounts can be pursued in either order without proving the cause', () => {
  for (const order of [['observe', 'perspective'], ['perspective', 'observe']]) {
    let world = {};
    for (const id of order) {
      const choice = marketInvestigationChoices(scenario, world.sites?.[scenario.id]).find(c => c.id === id);
      const turn = run(choice.text, world);
      expect(turn.ok).toBe(true);
      expect(turn.worldUpdate.severity).toBe('none');
      world = turn.nextWorld;
    }
    expect(world.sites[scenario.id].claims).toHaveLength(1);
    expect(world.sites[scenario.id].evidence.some(e => e.reliability === 'observation')).toBe(true);
    expect(world.sites[scenario.id].informationGaps.length).toBeGreaterThan(0);
    const comparison = marketInvestigationChoices(scenario, world.sites[scenario.id]).find(c => c.id === 'compare');
    const result = run(comparison.text, world);
    expect(result.worldUpdate.discoveries.some(e => e.reliability === 'partially-supported')).toBe(true);
    expect(result.worldUpdate.gaps.resolved).toEqual([]);
  }
});

test('missing voices are a request, not an invented meeting; repeated observation adds no duplicate evidence', () => {
  const first = run('I ask Mali about current trading conditions.');
  const choices = marketInvestigationChoices(scenario, first.nextWorld.sites[scenario.id]);
  expect(choices.find(c => c.id === 'perspective').text).toContain('Dao');
  const request = run(choices.find(c => c.id === 'absent').text, first.nextWorld);
  expect(request.worldUpdate.followUpRequests[0].status).toBe('Requested — not confirmed');
  const observed = run(choices.find(c => c.id === 'observe').text, request.nextWorld);
  const repeated = run(choices.find(c => c.id === 'observe').text, observed.nextWorld);
  expect(repeated.nextWorld.sites[scenario.id].evidence).toHaveLength(observed.nextWorld.sites[scenario.id].evidence.length);
});
