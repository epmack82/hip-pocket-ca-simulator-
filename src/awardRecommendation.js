import { totalConsequenceOccurrences } from './missionOutcome';

const average = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

export function recommendTrainingRecognition(records = [], products = [], consequences = [], profile = {}, disposition = {}) {
  const scores = records.map(record => Number(record.qualityScore)).filter(Number.isFinite);
  const avgScore = average(scores);
  const occurrences = totalConsequenceOccurrences(consequences);
  const activeMisconduct = consequences.some(item => item.status === 'active');
  const completed = records.length;
  const dimensionScores = (profile.dimensions || []).map(item => Number(item.score)).filter(Number.isFinite);
  const lowestDimension = dimensionScores.length ? Math.min(...dimensionScores) : 0;
  const evidence = `${completed} completed location${completed === 1 ? '' : 's'}, ${products.length} product${products.length === 1 ? '' : 's'}, ${Math.round(avgScore)} average assessment score`;
  const base = {
    regulatoryBasis: 'AR 600-8-22 (Military Awards), 30 July 2025',
    disclaimer: 'Fictional training recommendation only. This is not an award, entitlement, DA Form 638, approval decision, or personnel action. Actual recognition requires a qualified recommender, documented impact, command review, and approval by the proper authority.',
    evidence
  };

  if (disposition.terminated || activeMisconduct || occurrences) {
    return {
      ...base,
      level: 'No favorable recognition recommended',
      category: 'Mission failure / conduct disqualification',
      rationale: `${occurrences} serious misconduct occurrence${occurrences === 1 ? '' : 's'} remained in the mission record. Favorable recognition is not appropriate for this training performance.`,
      nextStep: 'Complete the AAR, accountability requirements, and remedial training. Recognition is not used to offset misconduct.'
    };
  }
  if (completed >= 7 && avgScore >= 94 && products.length >= 5 && lowestDimension >= 85) {
    return { ...base, level: 'MSM-level performance for command consideration', category: 'Exceptional meritorious service or achievement', rationale: `Exceptional, sustained performance across broad mission scope: ${evidence}, with no assessed dimension below ${lowestDimension}.`, nextStep: 'A real recommendation would still require specific, measurable organizational impact and the appropriate approval authority.' };
  }
  if (completed >= 5 && avgScore >= 88 && products.length >= 4 && lowestDimension >= 75) {
    return { ...base, level: 'ARCOM-level performance for command consideration', category: 'Meritorious service or achievement', rationale: `Sustained high performance and mission impact: ${evidence}.`, nextStep: 'Document specific achievements, effects, and scope; command determines whether any decoration is appropriate.' };
  }
  if (completed >= 3 && avgScore >= 78 && products.length >= 2 && lowestDimension >= 60) {
    return { ...base, level: 'AAM-level performance for command consideration', category: 'Meritorious achievement', rationale: `Strong mission performance with useful products and consistent basic skills: ${evidence}.`, nextStep: 'A real recommendation must identify specific meritorious achievement and measurable contribution.' };
  }
  if (completed >= 2 && avgScore >= 65) {
    return { ...base, level: 'Certificate of Achievement-level training recognition', category: 'Commendable training achievement', rationale: `The trainee completed the mission at a commendable developmental level: ${evidence}.`, nextStep: 'Local commanders establish certificate procedures; this simulator does not issue an official certificate.' };
  }
  return { ...base, level: 'Certificate of Participation / completion recognition', category: 'Training participation', rationale: `The trainee participated and completed ${completed} location${completed === 1 ? '' : 's'}, but the record does not demonstrate decoration-level impact.`, nextStep: 'Use the AAR development priorities for another playthrough; participation recognition is not a military decoration.' };
}
