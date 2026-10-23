// Original fictional dialogue. Answers remain attributed claims, not observations.
export function clinicAnswer(description, context, who) {
  if (context.siteType !== 'clinic' && context.metadata?.site !== 'clinic' && !/clinic/i.test(context.location || '')) return null;
  const parts = [];
  if (/changed|current|condition/i.test(description)) parts.push('“We are still open, but families tell us the wait is becoming harder to manage. Our daily total can look reassuring while someone outside has given up and gone home. I cannot give you a measured trend from that total alone.”');
  if (/affected|who.*missing/i.test(description)) parts.push('“The people who leave before being seen worry me most. They disappear from our treatment count. We need to find out who they are and what prevented them from waiting; I do not want to guess on their behalf.”');
  if (/who else|other.*source|relevant information/i.test(description)) parts.push('“Speak with the clinic director about how services are organized, and ask how to arrange voluntary conversations with people using the clinic. My account is only one perspective.”');
  if (/record|log/i.test(description)) parts.push('“An aggregate service log records visits. It does not count everyone who left the queue. Ask the responsible staff about reviewing a non-identifying summary; this conversation is not permission to open patient files.”');
  if (!parts.length) return null;
  return who + ' pauses and takes your questions in turn.\n\n' + parts.join('\n\n') + '\n\nYour host looks back toward the waiting area. “Where would you like to begin checking that picture?” These are attributed accounts and suggested follow-ups, not verified findings or completed introductions.';
}
