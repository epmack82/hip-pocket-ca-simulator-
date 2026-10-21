import { CAMPAIGNS, campaignDay, campaignTradeoffs } from './campaign';
import { generateMission } from './scenarioEngine';
import { processUnifiedAction, outcomeFromTurn } from './unifiedActionPipeline';
import { buildPerformanceReport, performanceReportHtml } from './performanceReport';
import { createPlaytestTurn, buildPlaytestReport } from './playtestReport';

const scenario = { id: 'water', location: 'water facility', siteType: 'water', keyStakeholders: ['public health officer'], suggestedProducts: ['Site Assessment'] };
const action = (rawText, extra = {}) => processUnifiedAction({ id: 'turn-1', rawText, scenarioId: scenario.id, scenario, ...extra });
test.each(CAMPAIGNS)('$days-day campaign offers more choices than visits', campaign => {
  const pool = generateMission({ seed: 'budget-test', days: campaign.days, role: 'specialist', candidateCount: campaign.destinations });
  expect(pool).toHaveLength(campaign.destinations);
  expect(new Set(pool.map(s => s.id)).size).toBe(pool.length);
  expect(campaign.destinations).toBeGreaterThan(campaign.visits);
  const records = pool.slice(0, campaign.visits).map(s => ({ scenarioId: s.id }));
  expect(campaignTradeoffs(pool, records)).toHaveLength(campaign.destinations - campaign.visits);
  expect(campaignDay(campaign.days, campaign.visits, campaign.visits - 1)).toBeLessThanOrEqual(campaign.days);
});
test('compound scheduling, data correction, bids and messaging are not an apology or completed project', () => {
  const turn = action('schedule a meeting with civilian authorities to correct population estimate, arrange for contract bids to upgrade building water pressure, schedule meeting with public affairs office to publish distribution schedule and water improvement projects by us forces');
  expect(turn.ok).toBe(true);
  expect(turn.interpretation.actions).toHaveLength(3);
  expect(turn.interpretation.intent).not.toContain('accountability');
  expect(turn.worldUpdate.effects.join(' ')).toMatch(/no replacement number/i);
  expect(turn.worldUpdate.effects.join(' ')).toMatch(/no upgrade has been approved/i);
  expect(turn.worldUpdate.effects.join(' ')).toMatch(/Nothing has been published/);
  expect(turn.worldUpdate.classification).not.toBe('courtesy-apology');
  expect(turn.worldUpdate.discoveries).toEqual([]);
});
test.each(['I do not schedule a meeting to correct the population estimate.', 'What if I arrange for contract bids?'])('negated and hypothetical plans do not execute: %s', text => {
  const turn = action(text);
  expect(turn.worldUpdate.scoreChanges).toEqual([]);
  expect(turn.worldUpdate.discoveries).toEqual([]);
});
test('asking an interpreter for orientation is not substitution or missing a meeting', () => {
  const turn = action('we have our translator give us the general lay of the land. we purchase a few random items from random shops to help improve sentiment and begin engaging with the locals');
  expect(turn.worldUpdate.persistentConditions).toEqual([]);
  expect(turn.worldUpdate.relationshipChanges).toEqual([]);
  expect(turn.interpretation.intent).not.toContain('interpreter-substitution');
  expect(turn.interpretation.missionRelevance).toBe('high');
  expect(outcomeFromTurn(turn).narrativeOutcome).toContain('No meeting has been recorded as missed');
});
test('mission product earns one participation credit without validating its finding', () => {
  const extra = { kind: 'product', productName: 'Site Assessment', missionProduct: { name: 'Site Assessment', recipient: 'S-9', purpose: 'Prioritize follow-up', keyFinding: 'Unverified account' } };
  const first = action('My submitted brief', extra);
  expect(first.nextWorld.sites.water.dimensionScores.productQuality).toBe(100);
  expect(first.worldUpdate.discoveries).toEqual([]);
  expect(first.worldUpdate.product.completionPercent).toBeUndefined();
  const second = action('A revised brief', { ...extra, id: 'turn-2', worldState: first.nextWorld });
  expect(second.worldUpdate.scoreChanges).toEqual([]);
  expect(second.nextWorld.sites.water.dimensionScores.productQuality).toBe(100);
  expect(() => action('Incomplete', { ...extra, missionProduct: { ...extra.missionProduct, recipient: '' } })).toThrow(/required/);
});
test('handover and Chief plan appear in leader report without grading unvisited sites', () => {
  const report = buildPerformanceReport({ world: {}, chiefPlan: { completed: true, rationale: 'Access before capacity' }, unvisitedDestinations: [{ location: 'Unvisited school' }] });
  const html = performanceReportHtml(report);
  expect(html).toContain('Access before capacity'); expect(html).toContain('Unvisited school');
  expect(report.dimensions.every(d => d.evidence.length === 0)).toBe(true);
});
test('unrecognized clauses are automatically included in the local feedback export', () => {
  const turn = action('I contemplate the purple widget.');
  const receipt = createPlaytestTurn({ playerAction: turn.actionRecord.rawText, interpretation: turn.interpretation, outcome: outcomeFromTurn(turn) });
  const report = buildPlaytestReport({ turns: [receipt] });
  expect(report.unresolvedTurnCount).toBe(1);
  expect(report.turns[0].reviewFlags[0].detail).toContain('purple widget');
});
