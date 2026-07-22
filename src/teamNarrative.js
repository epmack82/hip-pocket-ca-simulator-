const surnames = ['Alvarez', 'Brooks', 'Chen', 'Davis', 'Ellis', 'Garcia', 'Harris', 'Jackson', 'Kim', 'Morgan', 'Nguyen', 'Patel', 'Rivera', 'Thompson', 'Walker', 'Young'];

function hash(value) {
  return [...String(value)].reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 2166136261);
}

export function createTeamRoster(seed, playerRole) {
  const start = hash(seed) % surnames.length;
  const names = Array.from({ length: 4 }, (_, index) => surnames[(start + index * 3) % surnames.length]);
  const positions = [
    { key: 'chief', rank: 'SFC', title: 'Team Chief' },
    { key: 'sgt', rank: 'SSG', title: 'Team Sergeant' },
    { key: 'canco', rank: 'SGT', title: 'Civil Affairs NCO' },
    { key: 'specialist', rank: 'SPC', title: 'Civil Affairs Specialist' }
  ];
  return positions.map((position, index) => ({
    ...position,
    name: names[index],
    isPlayer: position.key === playerRole,
    display: position.key === playerRole ? `You — ${position.title}` : `${position.rank} ${names[index]} — ${position.title}`
  }));
}

export function teamHuddleNarrative(seed, playerRole) {
  const roster = createTeamRoster(seed, playerRole);
  const chief = roster.find(member => member.key === 'chief');
  const teamSergeant = roster.find(member => member.key === 'sgt');
  const specialist = roster.find(member => member.key === 'specialist');
  const player = roster.find(member => member.isPlayer);
  return {
    roster,
    title: 'The Team Comes Together',
    paragraphs: [
      `The briefing room begins to empty, but your team stays behind. The Annex K remains projected on the wall beside a map crowded with routes, population centers, and handwritten coordination notes. The mission is no longer an abstract block of text—it is becoming yours.`,
      `${chief.isPlayer ? 'You pull' : `${chief.rank} ${chief.name} pulls`} the team closer to the map. “Before we start moving, we make sure we understand what the commander needs and why. We can adapt later, but we cannot afford to begin without a shared picture.” ${teamSergeant.isPlayer ? 'You begin' : `${teamSergeant.rank} ${teamSergeant.name} begins`} tracing the mission’s key tasks and reporting requirements with a pen.`,
      `${specialist.isPlayer ? 'You open your notebook' : `${specialist.rank} ${specialist.name} opens a notebook`} and starts translating the guidance into questions the team can carry into the first engagement. Around the table, each person sees the mission from a different angle—but every observation, relationship, and product will have to support the same commander’s intent.`,
      `As ${player?.title || 'a member of the team'}, you are not being handed a schoolhouse test. You are joining a final team review before deployment. Work through the questions together, correct anything the team missed, and step into the mission with a common understanding.`
    ]
  };
}
