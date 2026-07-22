import { createTeamRoster, teamHuddleNarrative } from './teamNarrative';

test('team roster is repeatable and marks the selected player role', () => {
  expect(createTeamRoster('HIP-TEAM', 'canco')).toEqual(createTeamRoster('HIP-TEAM', 'canco'));
  expect(createTeamRoster('HIP-TEAM', 'canco').find(member => member.isPlayer).key).toBe('canco');
});

test('team huddle frames the check as mission preparation', () => {
  const narrative = teamHuddleNarrative('HIP-TEAM', 'specialist');
  expect(narrative.paragraphs.join(' ')).toContain('final team review');
  expect(narrative.roster).toHaveLength(4);
});
