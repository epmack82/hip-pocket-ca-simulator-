import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { authorMarketReactions, conversationParagraphs } from './marketScene';
import MarketScenePanel from './MarketScenePanel';
import CampaignMap from './CampaignMap';
import { generateMission, generateScenario } from './scenarioEngine';
import { processUnifiedAction, outcomeFromTurn } from './unifiedActionPipeline';
import { buildPerformanceReport, performanceReportHtml } from './performanceReport';
import { resolveStakeholders } from './localActionParser';

const scenario = generateScenario('market-art-test', { featuredMarket: true, role: 'specialist' });
const run = (rawText, worldState = {}, id = 'market-turn-1') => processUnifiedAction({ id, kind: 'action', rawText, scenarioId: scenario.id, scenario, worldState });

test.each(['specialist', 'canco', 'sgt', 'chief'])('new %s campaign includes a selectable market without changing the visit budget', role => {
  const pool = generateMission({ seed: 'art-pool-' + role, days: 3, role, candidateCount: 6, includeMarket: true });
  expect(pool).toHaveLength(6);
  expect(pool[0].metadata.site).toBe('market');
  expect(pool[0].keyStakeholders.slice(0, 2)).toEqual(['market association chair', 'transport cooperative representative']);
  expect(generateMission({ seed: 'art-pool-' + role, days: 3, role, candidateCount: 6, includeMarket: true })).toEqual(pool);
});
test('named characters resolve to canonical roles, including compound references', () => {
  expect(resolveStakeholders('I greet Mali.', scenario.keyStakeholders)).toEqual(['market association chair']);
  expect(resolveStakeholders('Mali and the transport cooperative representative', scenario.keyStakeholders)).toEqual(['market association chair', 'transport cooperative representative']);
  expect(resolveStakeholders('Mali', ['school administrator'])).toEqual([]);
});
test('market prose is richer but preserves every non-presentation finding field', () => {
  const turn = run('I greet Mali through our interpreter. I ask Mali about current service conditions.');
  expect(turn.ok).toBe(true);
  const finding = { id: 'focused-inquiry', severity: 'none', acceptedActs: [turn.actionRecord.understanding.actions[1].id], discoveries: [{ id: 'test', text: 'Claim only' }], scoreChanges: [{ dimension: 'rapport', delta: 1 }], effects: ['Old wording'] };
  const [reworded] = authorMarketReactions(turn.actionRecord, [finding], {});
  expect({ ...reworded, effects: [] }).toEqual({ ...finding, effects: [] });
  expect(reworded.effects[0]).toContain('Mali (market association chair) says');
  expect(outcomeFromTurn(turn).narrativeOutcome).toContain('not a confirmed cause');
  expect(conversationParagraphs(reworded.effects[0]).some(p => p.type === 'dialogue')).toBe(true);
});
test('repeated greetings remember the person without farming relationship credit', () => {
  const first = run('I greet Niran.');
  const next = run('I greet Niran.', first.nextWorld, 'market-turn-2');
  expect(next.worldUpdate.relationshipChanges).toEqual([]);
  expect(outcomeFromTurn(next).narrativeOutcome).toContain('recognizes the team');
});
test.each(['I do not schedule a meeting with Mali.', 'What if I arrange a meeting with Niran?'])('non-actions create no pending request: %s', text => {
  const turn = run(text);
  expect(turn.worldUpdate.followUpRequests).toEqual([]);
  expect(turn.worldUpdate.scoreChanges).toEqual([]);
});
test('coordination proposals survive serialization and report export without becoming appointments', () => {
  const turn = run('I schedule a meeting with Mali to discuss service conditions.');
  expect(turn.worldUpdate.followUpRequests).toHaveLength(1);
  expect(turn.nextWorld.sites[scenario.id].followUpRequests[0].status).toBe('Requested — not confirmed');
  const reloaded = JSON.parse(JSON.stringify(turn.nextWorld));
  const next = run('I greet Niran.', reloaded, 'market-turn-2');
  expect(next.nextWorld.sites[scenario.id].followUpRequests).toHaveLength(1);
  const report = buildPerformanceReport({ world: next.nextWorld });
  expect(report.followUpRequests).toHaveLength(1);
  expect(performanceReportHtml(report)).toContain('Requested — not confirmed');
  expect(outcomeFromTurn(turn).narrativeOutcome).toContain('nobody has been marked late');
});
test('exclusion and serious conduct are not overwritten by warm conversation', () => {
  const excluded = run('I leave my interpreter outside. I greet Mali.');
  expect(outcomeFromTurn(excluded).narrativeOutcome).not.toContain('The interpreter translates in short sections');
  const serious = run('I greet Mali and then set fire to the market.');
  expect(serious.worldUpdate.severity).toBe('critical');
  expect(outcomeFromTurn(serious).narrativeOutcome).not.toContain('welcome is attentive');
  expect(serious.worldUpdate.followUpRequests).toEqual([]);
});
test('cast view distinguishes introduction from availability and never renders hidden complications', () => {
  const html = renderToStaticMarkup(<MarketScenePanel scenario={{ ...scenario, metadata: { ...scenario.metadata, complications: ['HIDDEN-SECRET'] } }} text="Visible arrival" site={{ engagedParticipants: ['market association chair'] }} />);
  expect(html).toContain('/art/mali-v1.png');
  expect(html).toContain('/art/niran-v1.png');
  expect(html).toContain('Directly engaged');
  expect(html).toContain('introduction not recorded');
  expect(html).not.toContain('HIDDEN-SECRET');
});
test('map exposes only known leads and distinguishes concluded destinations', () => {
  const html = renderToStaticMarkup(<CampaignMap scenarios={[scenario]} records={[{ scenarioId: scenario.id }]} selected={null} onSelect={() => {}} visitLimit={3} sites={{ [scenario.id]: { leads: [{ status: 'open' }, { status: 'completed' }] } }} />);
  expect(html).toContain('2 visit slots remaining');
  expect(html).toContain('1 open lead recorded here');
  expect(html).toContain('Concluded');
  expect(html).toContain('disabled');
  expect(html).not.toContain(scenario.lead.discoveryText || 'HIDDEN-SECRET');
});
