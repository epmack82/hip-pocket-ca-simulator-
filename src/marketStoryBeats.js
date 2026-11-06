// Original fictional presentation. These beats cannot add evidence or change
// permission, scores, relationships, or the cause of the market's difficulties.
const voices = {
  'market association chair': {
    first: 'Mali folds her hands, then unfolds them. She seems to be choosing between the answer that would end this conversation quickly and the one she wants you to carry away.',
    follow: 'Mali leans forward. Her voice is quieter now, but the insistence has not left it. She wants you to hear the difference between speaking for the association and speaking for every person in it.',
    repeat: 'Mali lets the question settle. When she answers, she speaks slowly, as if asking you to carry the words carefully.',
    question: 'If you write about this market, will you leave room for the people who are not here to correct us?',
    closing: 'She holds your gaze. You have an account to investigate, and a choice about whose voice you will seek next.'
  },
  'transport cooperative representative': {
    first: 'Niran shifts his weight and listens to the whole question before answering. His manner is practical, but he does not rush to offer you a tidy explanation.',
    follow: 'Niran draws a short line in the air with one finger, then stops. He is trying to separate two ideas that sound almost identical until someone has to act on them.',
    repeat: 'Niran lowers his hand. There is no anger in the pause, but he is no longer searching for a different way to give the same answer.',
    question: 'Are you asking whether goods can enter, or whether a particular vendor can get their goods here? Those are different questions.',
    closing: 'He waits for you to choose which question to pursue. The next useful answer may have to come from someone making that journey.'
  },
  'produce vendor': {
    first: 'Dao stills her hands for a moment. The attention is welcome, but she studies you before deciding how much weight to put behind her answer.',
    follow: 'Dao looks back at you. Her tone is direct now—not unfriendly, but personal. She does not want a conversation about her work to become a story about people she cannot speak for.',
    repeat: 'Dao pauses again. This time she leaves the silence in place before answering, giving you a chance to hear where her knowledge ends.',
    question: 'When you leave, what will you say I told you? I want to be sure we mean the same thing.',
    closing: 'The question is yours to answer. You can reflect her account back to her, seek another perspective, or explain what you will do next.'
  },
  'municipal licensing officer': {
    first: 'Kiet listens with a measured expression. He is willing to explain his work; he is less willing to let a convenient number become an answer to a question it was never meant to settle.',
    follow: 'Kiet raises a finger, then lowers it. The distinction matters to him, but he makes the effort to explain it without turning the exchange into an argument.',
    repeat: 'Kiet takes a breath before replying. His answer remains precise, even as the conversation returns to familiar ground.',
    question: 'What do you need to establish: who has a space, who is trading, or why somebody is absent?',
    closing: 'He waits for a specific question. A record can help, but it cannot supply the experience of the person named in it.'
  }
};

export function marketInquiryBeat(role, priorInquiries = 0) {
  const voice = voices[role];
  if (!voice) return null;
  return { reaction: priorInquiries > 1 ? voice.repeat : priorInquiries ? voice.follow : voice.first,
    question: voice.question, closing: voice.closing };
}
