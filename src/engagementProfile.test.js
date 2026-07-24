import { buildDecisionTimeline, buildEngagementProfile } from './engagementProfile';

const records = [{
  location: 'community school',
  siteProgress: {
    actions: ['Action: "I greet the director, listen, and ask questions."', 'Action: "I validate the report with the municipal office."'],
    leads: [{ status: 'completed' }],
    dimensionScores: {
      rapport: 80, informationCollection: 75, validation: 70, productQuality: 50,
      coordination: 65, initiative: 70, missionFocus: 68
    }
  }
}];

test('builds an evidence-based CA engagement profile', () => {
  const profile = buildEngagementProfile(records, [{ name: 'KLE Record' }], [], {
    annex: { firstAttemptPassed: true, completedPassed: true }
  });
  expect(profile.dimensions).toHaveLength(8);
  expect(profile.tendency).toBeTruthy();
  expect(profile.confidence).toBe('Provisional');
  expect(profile.readinessScore).toBe(100);
  expect(profile.strongest[0].evidence).toContain('Action:');
});

test('serious consequences reduce the judgment dimension', () => {
  const clean = buildEngagementProfile(records, [], []);
  const affected = buildEngagementProfile(records, [], [{ status: 'active' }]);
  const score = profile => profile.dimensions.find(item => item.key === 'judgment').score;
  expect(score(affected)).toBeLessThan(score(clean));
});

test('decision timeline retains action evidence and location', () => {
  const timeline = buildDecisionTimeline(records);
  expect(timeline).toHaveLength(2);
  expect(timeline[0].location).toBe('community school');
});
