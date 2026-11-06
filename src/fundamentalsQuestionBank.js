// Original questions based on the public reference below, not game events or held schoolhouse documents.
export const FUNDAMENTALS_VERSION = 'civil-considerations-1';
export const FUNDAMENTALS_SOURCE = {
  title: 'TC 3-22.69, Advanced Situational Awareness, 2 April 2021',
  locator: 'paragraphs 9-30–9-31, printed page 9-14',
  url: 'https://rdl.train.army.mil/catalog-ws/view/100.ATSC/F1F91BAC-8502-4D86-903F-E7F6557E558A-1617728671201/TC_3-22x69.pdf'
};
export const FUNDAMENTALS_QUESTIONS = [
  { id: 'framework', prompt: 'Which framework organizes six categories of civil considerations?', options: ['ASCOPE', 'A maintenance schedule', 'A personnel roster'], answer: 0, feedback: 'ASCOPE organizes civil considerations. It is an analysis aid, not a complete plan.' },
  { id: 'categories', prompt: 'Which set correctly expands ASCOPE?', options: ['Assets, security, command, objectives, plans, equipment', 'Areas, structures, capabilities, organizations, people, events', 'Authorities, services, culture, operations, population, economy'], answer: 1, feedback: 'The six categories are areas, structures, capabilities, organizations, people and events.' },
  { id: 'purpose', prompt: 'Why analyze civil considerations during planning?', options: ['To replace the commander’s mission', 'To eliminate the need for other operational analysis', 'To understand how the civil environment affects operations'], answer: 2, feedback: 'Civil considerations inform operational choices, including objectives, movement and protection.' },
  { id: 'perspectives', prompt: 'Which approach best supports civil-considerations analysis?', options: ['Examine multiple perspectives', 'Use only the team’s own perspective', 'Assume every group experiences conditions identically'], answer: 0, feedback: 'The cited publication calls for analysis from multiple perspectives.' },
  { id: 'missing', prompt: 'A worksheet lists areas, structures, capabilities, organizations and people. Which ASCOPE category is missing?', options: ['Equipment', 'Events', 'Orders'], answer: 1, feedback: 'Events is the remaining ASCOPE category.' },
  { id: 'application', prompt: 'A civil-considerations review changes a proposed movement route. Is this a relevant use of the analysis?', options: ['No; civil considerations apply only to reporting', 'No; routes can never be informed by civil analysis', 'Yes; civil considerations can inform movement decisions'], answer: 2, feedback: 'Movement is one of the operational decisions identified in paragraph 9-30.' }
];
export function gradeFundamentals(answers) {
  if (!FUNDAMENTALS_QUESTIONS.every(q => Number.isInteger(answers[q.id]) && q.options[answers[q.id]] !== undefined)) throw new Error('Answer every question before submitting.');
  return FUNDAMENTALS_QUESTIONS.map(q => ({ ...q, selected: answers[q.id], correct: answers[q.id] === q.answer }));
}
