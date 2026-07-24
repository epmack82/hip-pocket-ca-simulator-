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

test('team huddle applies optional region and teammate personalization', () => {
  const narrative = teamHuddleNarrative('HIP-TEAM', 'specialist', {
    region: 'North Valley',
    teamNames: { chief: 'Martinez', sgt: 'Okafor' }
  });

  expect(narrative.paragraphs.join(' ')).toContain('map of North Valley');
  expect(narrative.roster.find(member => member.key === 'chief').name).toBe('Martinez');
  expect(narrative.roster.find(member => member.key === 'sgt').name).toBe('Okafor');
  expect(narrative.roster.find(member => member.key === 'canco').name).toBeTruthy();
});
