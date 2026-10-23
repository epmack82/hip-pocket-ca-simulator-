import { campaignEvidence, commandBriefViews, commandFollowUpIds, commandHandover, commandQuestion, submitCommandBrief } from './commandContinuity';
import { createWorldUpdate, applyWorldUpdate, migrateWorldState } from './worldUpdate';
import { buildPerformanceReport, performanceReportHtml } from './performanceReport';

const scenarios = [{ id: 'water', location: 'Water facility', metadata: { site: 'water' } }, { id: 'clinic', location: 'District clinic', metadata: { site: 'clinic' } }, { id: 'school', location: 'School', metadata: { site: 'school' } }];
const finding = { id: 'flow-account', text: 'Manager reports an interruption.', source: 'Utility manager', reliability: 'claim' };
function initial() {
  return applyWorldUpdate(migrateWorldState(), createWorldUpdate({ actionRecordId: 'turn-1', scenarioId: 'water', discoveries: [finding], gaps: { opened: ['Verify supply at the clinic'], advanced: [], resolved: [] } }), { id: 'turn-1', rawText: 'Ask about water access.' });
}
const draftFor = world => ({ request: 'collection', recommendation: 'Compare the account with clinic access.', uncertainty: 'The manager is one source; delivery data is missing.', evidenceKeys: campaignEvidence(world, scenarios).map(e => e.key), followUpId: 'clinic' });
const brief = (world, extra = {}, overrides = {}) => submitCommandBrief({ world, scenarios, scenarioId: 'water', draft: { ...draftFor(world), ...extra }, ...overrides });

test('briefing preserves evidence, grades, relationships and field action count', () => {
  const world = initial();
  const before = JSON.stringify(world);
  const after = brief(world);
  expect(JSON.stringify(world)).toBe(before);
  expect(after.sites).toBe(world.sites);
  expect(after.history).toBe(world.history);
  expect(after.relationships).toBe(world.relationships);
  expect(after.commandBriefs[0].evidence[0].reliability).toBe('claim');
  expect(after.commandBriefs[0].evidence[0].actionId).toBe('turn-1');
  expect(after.commandBriefs[0].status).toBe('Collection priority recorded');
  expect(commandFollowUpIds(after, scenarios)).toEqual(['clinic']);
  expect(after.commandBriefs[0].authority).toContain('No funding');
});

test('a request without attachments is not a specialist referral or an invented confirmed fact', () => {
  const world = brief(initial(), { evidenceKeys: [], request: 'technical' });
  expect(world.commandBriefs[0].status).toBe('Supporting findings requested');
  expect(world.commandBriefs[0].response).not.toContain('request is routed');
  expect(commandFollowUpIds(world, scenarios)).toEqual([]);
  expect(world.commandBriefs[0].evidence).toEqual([]);
});

test('specialist coordination names the relevant partner without granting resources', () => {
  const world = brief(initial(), { request: 'technical' });
  expect(world.commandBriefs[0].status).toBe('Referred for feasibility review');
  expect(world.commandBriefs[0].partner).toBe(commandQuestion(scenarios[0]).partner);
  expect(world.commandBriefs[0].response).toContain('not an appointment, allocation of resources or permission');
});

test('a follow-up visit and new accounts do not resolve earlier gaps or approve a recommendation', () => {
  const world = brief(initial());
  const arrived = commandBriefViews(world, scenarios, [{ scenarioId: 'clinic' }])[0];
  expect(arrived.followUpStatus).toContain('recommendation still open');
  const after = applyWorldUpdate(world, createWorldUpdate({ actionRecordId: 'turn-2', scenarioId: 'clinic', discoveries: [{ id: 'clinic-account', text: 'Nurse reports variable access.', source: 'Nurse', reliability: 'claim' }] }), { id: 'turn-2' });
  const view = commandBriefViews(after, scenarios)[0];
  expect(view.newEvidence).toHaveLength(1);
  expect(view.followUpStatus).toContain('rebrief');
  expect(after.commandBriefs).toBe(world.commandBriefs);
  expect(after.sites.water.informationGaps).toEqual(world.sites.water.informationGaps);
  expect(after.commandBriefs[0].evidence).toHaveLength(1);
});

test('material already known at submission and repeated findings are not falsely presented as new', () => {
  const world = initial();
  const other = applyWorldUpdate(world, createWorldUpdate({ actionRecordId: 'turn-2', scenarioId: 'clinic', discoveries: [{ ...finding, id: 'earlier-clinic' }] }), { id: 'turn-2' });
  const after = brief(other);
  expect(commandBriefViews(after, scenarios)[0].newEvidence).toEqual([]);
});

test('revision retains the earlier snapshot and marks only that brief superseded', () => {
  const first = brief(initial());
  const after = brief(first, { supersedes: 'command-1', recommendation: 'Ask the liaison to review the uncertainty.', request: 'technical', followUpId: 'school' });
  const views = commandBriefViews(after, scenarios);
  expect(views[0].superseded).toBe(true);
  expect(views[1].superseded).toBe(false);
  expect(views[0].recommendation).toBe('Compare the account with clinic access.');
  expect(commandFollowUpIds(after, scenarios)).toEqual(['school']);
  expect(() => brief(after, { supersedes: 'command-1' })).toThrow(/current brief/);
});

test('handover retains requests, gaps, conduct and unvisited destinations without declaring success', () => {
  const world = initial();
  world.sites.water.followUpRequests = [{ id: 'meeting', description: 'Request a meeting', status: 'requested' }];
  world.persistentConditions = [{ id: 'access', title: 'Access restricted', status: 'active' }];
  const after = brief(world, { request: 'handover' }, { records: [{ scenarioId: 'water' }] });
  expect(after.commandBriefs[0].status).toBe('Handover review pending');
  expect(after.commandBriefs[0].followUp).toBeNull();
  const handover = commandHandover(after, scenarios, [{ scenarioId: 'water' }]);
  expect(handover.requests).toHaveLength(1);
  expect(handover.gaps.length).toBeGreaterThan(0);
  expect(handover.conditions).toHaveLength(1);
  expect(handover.unvisited.map(s => s.id)).toEqual(['clinic', 'school']);
  expect(commandFollowUpIds(after, scenarios)).toEqual([]);
});

test('rejects invented attachments, nonexistent or concluded targets, invalid revisions and terminated missions', () => {
  const world = initial();
  expect(() => brief(world, { evidenceKeys: ['made-up'] })).toThrow(/recorded/);
  expect(() => brief(world, { followUpId: 'phantom' })).toThrow(/destination/);
  expect(() => brief(world, {}, { records: [{ scenarioId: 'clinic' }] })).toThrow(/destination/);
  expect(() => brief(world, { supersedes: 'missing' })).toThrow(/current brief/);
  expect(() => brief(world, { recommendation: '' })).toThrow(/recommendation/);
  expect(() => brief({ ...world, missionOutcome: { terminated: true } })).toThrow(/ended/);
});

test('old worlds remain usable and serialized briefs preserve history on reload', () => {
  expect(commandBriefViews({}, scenarios)).toEqual([]);
  expect(commandFollowUpIds({}, scenarios)).toEqual([]);
  expect(campaignEvidence({ sites: { legacy: { evidence: [{ id: 'old', text: 'Legacy account' }] } } })[0].reliability).toBe('not assessed');
  const world = brief(initial());
  const loaded = migrateWorldState({ world: JSON.parse(JSON.stringify(world)) });
  expect(loaded.commandBriefs).toEqual(world.commandBriefs);
});

test('leader report exports the original recommendation, attached source and uncertainty safely without score credit', () => {
  const before = initial();
  const world = brief(before, { recommendation: '<script>unsafe</script>', uncertainty: '<img src=x>' });
  const report = buildPerformanceReport({ world, missionScenarios: scenarios });
  expect(report.overallScore).toBe(buildPerformanceReport({ world: before }).overallScore);
  expect(report.actionCount).toBe(1);
  expect(report.commandBriefs[0].evidence[0].source).toBe('Utility manager');
  const html = performanceReportHtml(report);
  expect(html).toContain('Command briefs and continuity');
  expect(html).toContain('&lt;script&gt;');
  expect(html).not.toContain('<script>');
  expect(html).not.toContain('<img ');
  expect(html).toContain('turn-1');
});
