import { behaviorRisk, classifyBehavior } from './behaviorClassifier';

test.each([
  'Set up a party for the admin staff.',
  'Arrange a celebration for the municipal employees.',
  'Show everyone how Americans party.',
  'Pay for a night out for the local officials.',
  'Entertain the staff with a banquet.',
  'Host a rager for the dockworkers.'
])('recognizes broad unapproved social-event language: %s', action => {
  expect(classifyBehavior(action).map(item => item.id)).toContain('unauthorized-social-event');
});

test.each([
  'Coordinate a command-approved reception supporting the engagement objective.',
  'Ask whether the host-nation-approved cultural festival advances the mission purpose.',
  'Document reports that staff held an unauthorized party.',
  'Assess community concerns about alcohol misuse.',
  'Explain that we cannot promise assistance and route the request through command.'
])('does not punish authorized, inquisitive, or reporting context: %s', action => {
  expect(classifyBehavior(action)).toEqual([]);
});

test.each([
  ['Skip the work and go to a casino.', 'mission-abandonment-concept'],
  ['Return to the meeting hammered.', 'intoxication-concept'],
  ['We will repair the roof for you.', 'unauthorized-promise-concept'],
  ['Threaten the residents until they cooperate.', 'coercion-concept'],
  ['Torch the municipal vehicle.', 'destructive-concept'],
  ['Plant C4 on the distribution tanks.', 'destructive-concept'],
  ['High-tail it before anyone notices.', 'mission-abandonment-concept']
])('classifies behavior families rather than exact phrases: %s', (action, expected) => {
  expect(classifyBehavior(action).map(item => item.id)).toContain(expected);
});

test('reports the highest severity when several concepts are combined', () => {
  const result = behaviorRisk('Skip the mission, get drunk, and destroy the vehicle.');
  expect(result.detected).toBe(true);
  expect(result.severity).toBe('critical');
});

test('recognizes a rager and four-day bender as social-event, intoxication, and mission-abandonment risks', () => {
  const ids = classifyBehavior('Host a rager for the dockworkers and go on a 4 day bender.').map(item => item.id);
  expect(ids).toEqual(expect.arrayContaining([
    'unauthorized-social-event',
    'intoxication-concept',
    'mission-abandonment-concept'
  ]));
});

test('recognizes explosive sabotage followed by flight as combined critical behavior', () => {
  const result = behaviorRisk('Plant C4 on the distribution tanks and high tail it.');
  expect(result.severity).toBe('critical');
  expect(result.classifications.map(item => item.id)).toEqual(expect.arrayContaining([
    'destructive-concept',
    'mission-abandonment-concept'
  ]));
});

test.each([
  ['Hit each of the light bulbs with a golf club.', 'unsafe-infrastructure-tampering'],
  ['I start playing with the wires to see what happens.', 'unsafe-infrastructure-tampering'],
  ['Whip out and launch a tomahawk at the transformer.', 'weapon-misuse-concept'],
  ['I thank our host for nothing.', 'stakeholder-disrespect-concept'],
  ['Pass around a jar of moonshine from home.', 'unauthorized-alcohol-distribution'],
  ['Pass around a jar of moonshien from home.', 'unauthorized-alcohol-distribution'],
  ['Play with the electical panel.', 'unsafe-infrastructure-tampering']
])('recognizes unsafe conduct and bounded common misspellings: %s', (action, expected) => {
  expect(classifyBehavior(action).map(item => item.id)).toContain(expected);
});
