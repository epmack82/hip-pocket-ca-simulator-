export function totalConsequenceOccurrences(consequences = []) {
  return consequences.reduce((total, item) => total + (item.occurrenceCount || 1), 0);
}

export function determineMissionDisposition(consequences = []) {
  const occurrences = totalConsequenceOccurrences(consequences);
  const active = consequences.filter(item => item.status === 'active');
  const critical = active.some(item => item.severity === 'critical');
  const violentOrDestructive = active.some(item =>
    (item.categories || []).some(category => /destruction|violence|reckless endangerment|assault/i.test(category))
  );
  const terminated = critical || violentOrDestructive || occurrences >= 3;

  if (!terminated) {
    return {
      terminated: false,
      occurrences,
      status: occurrences ? 'Mission continuation under increased command oversight' : 'Mission continuing',
      reason: occurrences
        ? 'Serious conduct concerns remain active, but the training mission has not reached the removal threshold.'
        : 'No command-removal threshold has been reached.'
    };
  }

  return {
    terminated: true,
    occurrences,
    status: 'Mission failure - command-directed removal and redeployment',
    reason: violentOrDestructive || critical
      ? 'The severity of the conduct requires immediate removal from normal mission activity. In this training scenario, command directs redeployment while safety, reporting, investigation, and accountability actions proceed.'
      : `The trainee accumulated ${occurrences} serious misconduct events. Repeated failure to correct behavior has exhausted command confidence and stakeholder access, so the trainee is removed from the mission and redeployed.`,
    trainingNote: 'This is a scenario outcome, not a prediction of a specific UCMJ action. Actual disposition depends on facts, authority, due process, command judgment, and applicable law and policy.'
  };
}
