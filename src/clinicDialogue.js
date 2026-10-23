// Original fictional encounter content. Not a doctrinal rule or AI service.
export const isClinic = c => c.siteType === 'clinic' || c.metadata?.site === 'clinic' || /clinic/i.test(c.location || '');
export const clinicTopics = [
  { id: 'changes', label: 'What has changed here?', pattern: /changed|current|condition/i, question: 'what has changed in current service conditions' },
  { id: 'people', label: 'Who is missing from the figures?', pattern: /affected|who.*missing/i, question: 'who is affected and who is missing from the service figures' },
  { id: 'sources', label: 'Whose perspective should we hear?', pattern: /who else|other.*source|relevant information/i, question: 'who else has relevant information' },
  { id: 'records', label: 'What can the records tell us?', pattern: /record|log/i, question: 'what records may exist' },
  { id: 'difference', label: 'Help me understand your different accounts.', pattern: /different accounts|different perspectives/i, question: 'why the service accounts reflect different perspectives' },
  { id: 'priorities', label: 'What should command understand?', pattern: /priorit/i, question: 'what priorities you want command to understand' }
];
export const clinicSubjects = text => clinicTopics.filter(t => t.pattern.test(text));
const directorReplies = {
  changes: '“We are still delivering care. The completed-visit total tells me what the clinic accomplished, not everyone we could not reach. I am concerned that a report could confuse those two things.”',
  people: '“We do not have a reliable count of people who leave before treatment. The nurse sees the waiting area more closely than I do. Please hear that account without treating it as a complete population estimate.”',
  sources: '“Speak with the senior nurse about the queue. I can explain how the clinic organizes its work. Neither of us can speak for every family; voluntary community conversations need separate arrangements.”',
  records: '“An aggregate service log records visits, not everyone who leaves. We can discuss what a non-identifying summary would need to show. This conversation is not permission to inspect patient files.”',
  difference: '“The nurse is describing access. I am describing completed care. Both matter. If you report that one of us is wrong before comparing the evidence, you will miss the actual question.”',
  priorities: '“Tell command what is known and what is uncertain. Do not turn this visit into a promise of personnel or equipment. A recommendation we can explain together is more useful than an announcement we cannot deliver.”'
};
export function contextualClinicAnswer(text, context, who, site, baseAnswer) {
  if (!isClinic(context) || !/nurse|director/i.test(who)) return null;
  const topics = clinicSubjects(text);
  if (!topics.length) return null;
  const prior = (site.clinicTurns || []).filter(t => t.speaker === who.toLowerCase());
  const repeated = topics.every(t => prior.some(p => p.topics.includes(t.id)));
  let answer = /director/i.test(who) ? who + ' sets the summary sheet aside and gives you a careful look.\n\n' + topics.map(t => directorReplies[t.id]).join('\n\n') + '\n\nThese remain attributed accounts, not verified findings or permission to access records.' : baseAnswer || '';
  if (/nurse/i.test(who)) {
    if (topics.some(t => t.id === 'difference')) answer += '\n\n“Please do not make this a contest between the director and me. I am not saying the numbers are invented. They answer a different question from who can obtain care.”';
    if (topics.some(t => t.id === 'priorities')) answer += '\n\n“Tell command the clinic is working, and that being open does not mean everyone can get care. I would rather have an honest unanswered question than a promise you cannot keep.”';
    if (!baseAnswer) answer = who + ' considers your question.' + answer + '\n\nThis is the nurse’s perspective, not a verified finding.';
  }
  return (repeated ? who + ' returns to the earlier discussion. “My account has not changed; repeating it is not independent confirmation.”\n\n' : prior.length ? 'The conversation picks up where you left off.\n\n' : '') + answer;
}
export function clinicTurn(record, update) {
  if (!isClinic(record.context) || update.severity !== 'none' || update.classification === 'communication-unresolved') return [];
  return record.understanding.actions.filter(a => update.acceptedActs.includes(a.id) && a.kinds.includes('inquiry') && !a.negated && !a.hypothetical && /nurse|director/i.test(a.target || '') && clinicSubjects(a.description).length).map(a => ({ id: record.id + ':' + a.id, speaker: a.target.toLowerCase(), topics: clinicSubjects(a.description).map(t => t.id) }));
}
