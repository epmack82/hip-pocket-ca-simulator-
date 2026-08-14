import { buildPlaytestReport, createPlaytestTurn, reportFilename, updateTurnFeedback } from './playtestReport';

test('creates a useful turn without player identity', () => {
  const turn = createPlaytestTurn({
    missionSeed: 'HIP-TEST', scenario: { id: 2, name: 'KLE', location: 'School' },
    day: 1, locationNumber: 1, actionNumber: 2, playerAction: 'Ask the director about attendance.',
    outcome: { narrativeOutcome: 'The director answers.', qualityScore: 70 }, relationshipChanges: { Director: 2 }
  });
  expect(turn.playerAction).toContain('attendance');
  expect(turn.systemResponse).toBe('The director answers.');
  expect(turn).not.toHaveProperty('operator');
});

test('flags a specific turn and summarizes the export', () => {
  const turns = updateTurnFeedback([{ id: 'one', testerFeedback: { inaccurate: false } }], 'one', {
    inaccurate: true, categories: ['missed-risk'], notes: 'Permission should have mattered.'
  });
  const report = buildPlaytestReport({ missionSeed: 'HIP-TEST', turns });
  expect(report.flaggedTurnCount).toBe(1);
  expect(report.turns[0].testerFeedback.notes).toContain('Permission');
  expect(reportFilename('HIP TEST/1')).toBe('hip-pocket-playtest-HIP_TEST_1.json');
});
