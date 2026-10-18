import { buildPerformanceReport, performanceReportHtml } from './performanceReport';
import { processUnifiedAction } from './unifiedActionPipeline';

test('testing shortcut is never a perfect readiness score or completed assessment', () => {
  const report = buildPerformanceReport({ readinessResults: { annex: { skippedForTesting: true } } });
  expect(report.status).toBe('Incomplete');
  expect(report.readinessComplete).toBe(false);
  expect(report.readiness[0].firstAttemptScore).toBeNull();
});

test('zero scores, attempts, and final scores remain distinct', () => {
  const report = buildPerformanceReport({ readinessResults: { annex: { questionCount: 3, attempts: 2, firstAttemptMissed: 3, finalMissed: 1 } } });
  expect(report.readiness[0].firstAttemptScore).toBe(0);
  expect(report.readiness[0].finalScore).toBe(67);
  expect(report.readiness[0].attempts).toBe(2);
});

test('completion requires an ending and the planned location count', () => {
  expect(buildPerformanceReport({ completedAt: 'now', plannedLocations: 3, missionRecords: [{}] }).status).toBe('Incomplete');
  expect(buildPerformanceReport({ completedAt: 'now', plannedLocations: 3, missionRecords: [{}, {}, {}] }).status).toBe('Completed');
  expect(buildPerformanceReport({ completedAt: 'now', plannedLocations: 1, missionRecords: [{}], world: { missionOutcome: { terminated: true } } }).status).toMatch(/Terminated/);
});

test('leader report uses authoritative grades and escaped action evidence', () => {
  const turn = processUnifiedAction({ rawText: 'I introduce the team. <script>alert(1)</script>', scenarioId: 'site' });
  const report = buildPerformanceReport({ world: turn.nextWorld, operator: { name: '<img src=x onerror=alert(1)>' } });
  expect(report.dimensions.find(d => d.key === 'rapport').score).toBe(turn.nextWorld.sites.site.dimensionScores.rapport);
  expect(report.decisions[0].action).toBe(turn.actionRecord.rawText);
  const html = performanceReportHtml(report);
  expect(html).not.toContain('<script>');
  expect(html).not.toContain('<img ');
  expect(html).toContain('&lt;script&gt;');
  expect(html).toContain('First-line-leader review');
  expect(html).toContain('not independently authenticated');
});
