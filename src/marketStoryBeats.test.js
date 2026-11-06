import { marketInquiryBeat } from './marketStoryBeats';

test.each(['market association chair', 'produce vendor', 'transport cooperative representative', 'municipal licensing officer'])('%s has distinct first, follow-up and repeated-question beats', role => {
  const stages = [0, 1, 2].map(count => marketInquiryBeat(role, count));
  expect(new Set(stages.map(stage => stage.reaction)).size).toBe(3);
  stages.forEach(stage => {
    expect(stage.question).toContain('?');
    expect(Object.keys(stage).sort()).toEqual(['closing', 'question', 'reaction']);
  });
});

test('unknown roles do not borrow a named character’s story', () => {
  expect(marketInquiryBeat('school principal')).toBeNull();
});
