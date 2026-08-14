export const PLAYTEST_REPORT_VERSION = 1;

export function createPlaytestTurn({
  missionSeed,
  scenario,
  day,
  locationNumber,
  actionNumber,
  playerAction,
  summaryLabel,
  interpretation,
  outcome,
  relationshipChanges,
  siteState
}) {
  return {
    id: `${missionSeed || 'mission'}-${scenario?.id || locationNumber}-${actionNumber}-${Date.now()}`,
    recordedAt: new Date().toISOString(),
    missionSeed: missionSeed || '',
    scenario: {
      id: scenario?.id || '',
      name: scenario?.name || '',
      location: scenario?.location || '',
      missionActivity: scenario?.missionActivity || '',
      operationalEnvironment: scenario?.operationalEnvironment || '',
      geography: scenario?.geography || ''
    },
    day,
    locationNumber,
    actionNumber,
    playerAction: playerAction || summaryLabel || '',
    summaryLabel: summaryLabel || '',
    systemInterpretation: interpretation || null,
    systemResponse: outcome?.narrativeOutcome || '',
    evaluation: {
      mode: outcome?.evaluationMode || 'unknown',
      qualityScore: outcome?.qualityScore ?? null,
      assessmentType: outcome?.assessmentType || '',
      coachingInsight: outcome?.coachingInsight || '',
      missionTerminated: Boolean(outcome?.missionTerminated)
    },
    relationshipChanges: relationshipChanges || {},
    worldStateAfterTurn: {
      stage: siteState?.stage || '',
      facts: siteState?.facts || [],
      informationGaps: siteState?.informationGaps || [],
      leads: siteState?.leads || []
    },
    testerFeedback: {
      inaccurate: false,
      categories: [],
      expectedResponse: '',
      notes: ''
    }
  };
}

export function updateTurnFeedback(turns, turnId, feedback) {
  return turns.map(turn => turn.id === turnId
    ? { ...turn, testerFeedback: { ...turn.testerFeedback, ...feedback } }
    : turn);
}

export function buildPlaytestReport({ missionSeed, turns, appVersion = '4.3.0' }) {
  return {
    reportType: 'Hip Pocket CA Simulator Playtest Report',
    reportVersion: PLAYTEST_REPORT_VERSION,
    appVersion,
    exportedAt: new Date().toISOString(),
    privacyNotice: 'Player identity and save data are intentionally excluded. Review free-text actions and tester notes before sharing.',
    missionSeed: missionSeed || '',
    turnCount: turns.length,
    flaggedTurnCount: turns.filter(turn => turn.testerFeedback?.inaccurate).length,
    turns
  };
}

export function reportFilename(missionSeed) {
  const safeSeed = (missionSeed || 'unknown-mission').replace(/[^a-z0-9-]/gi, '_');
  return `hip-pocket-playtest-${safeSeed}.json`;
}
