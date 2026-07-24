const clamp = value => Math.max(0, Math.min(100, Math.round(value || 0)));
const average = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

const DIMENSION_DEFINITIONS = [
  ['connect', 'Connect', 'Rapport, respect, credibility, and stakeholder trust'],
  ['listen', 'Listen', 'Inquiry, attentiveness, and following stakeholder interests'],
  ['understand', 'Understand', 'Observation, analysis, validation, and separating facts from assumptions'],
  ['navigate', 'Navigate', 'Networks, influence, culture, access, and relevant leads'],
  ['coordinate', 'Coordinate', 'Team, CMOC, staff, partner, and authority integration'],
  ['judgment', 'Exercise Judgment', 'Ethics, restraint, resources, risk, and second-order effects'],
  ['deliver', 'Deliver', 'Products, reporting, routing, and follow-through'],
  ['missionFocus', 'Stay Mission-Focused', 'Annex K, commander intent, requirements, and priorities']
];

function dimensionAverage(records, key) {
  return average(records
    .map(record => Number(record.siteProgress?.dimensionScores?.[key]))
    .filter(Number.isFinite));
}

function allActions(records) {
  return records.flatMap(record => (record.siteProgress?.actions || []).map(action => ({
    action,
    location: record.location || record.scenarioName
  })));
}

function evidenceFor(actions, patterns, fallback) {
  const match = actions.find(({ action }) => patterns.some(pattern => pattern.test(action)));
  return match ? `${match.action} (${match.location})` : fallback;
}

function readinessScore(readinessResults = {}) {
  const results = Object.values(readinessResults);
  if (!results.length) return 0;
  return clamp(average(results.map(result => {
    if (result.firstAttemptPassed) return 100;
    if (result.completedPassed) return 80;
    return 60;
  })));
}

export function buildEngagementProfile(records = [], products = [], consequences = [], readinessResults = {}) {
  const actions = allActions(records);
  const completedLeads = records.flatMap(record => record.siteProgress?.leads || []).filter(lead => lead.status === 'completed').length;
  const consequencePenalty = consequences.reduce((sum, consequence) => sum + (consequence.status === 'active' ? 35 : 20), 0);
  const rapport = dimensionAverage(records, 'rapport');
  const collection = dimensionAverage(records, 'informationCollection');
  const validation = dimensionAverage(records, 'validation');
  const coordination = dimensionAverage(records, 'coordination');
  const initiative = dimensionAverage(records, 'initiative');
  const missionFocus = dimensionAverage(records, 'missionFocus');
  const productQuality = dimensionAverage(records, 'productQuality');

  const scores = {
    connect: rapport,
    listen: average([rapport, collection]),
    understand: average([collection, validation]),
    navigate: average([rapport, initiative]) + Math.min(15, completedLeads * 5),
    coordinate: coordination,
    judgment: average([missionFocus, validation, coordination]) - consequencePenalty,
    deliver: products.length ? average([productQuality, Math.min(100, 45 + products.length * 10)]) : productQuality,
    missionFocus
  };

  const evidence = {
    connect: evidenceFor(actions, [/greet|introduc|rapport|listen|respect|empath/i], 'No strong rapport-building evidence was recorded.'),
    listen: evidenceFor(actions, [/ask|question|listen|interview|engage|speak|meet/i], 'No sustained inquiry or listening evidence was recorded.'),
    understand: evidenceFor(actions, [/assess|inspect|observ|validat|confirm|source|compare|verify/i], 'Limited assessment or validation evidence was recorded.'),
    navigate: evidenceFor(actions, [/stakeholder|network|leader|lead|community|relationship/i], completedLeads ? `${completedLeads} developed lead${completedLeads === 1 ? '' : 's'} completed.` : 'No completed network lead was recorded.'),
    coordinate: evidenceFor(actions, [/coordinat|cmoc|s-9|ngo|government|partner|authority/i], 'No explicit coordination action was recorded.'),
    judgment: consequences.length ? `${consequences.length} consequence event${consequences.length === 1 ? '' : 's'} affected mission legitimacy and trust.` : evidenceFor(actions, [/risk|authority|permission|constraint|safety|ethical/i], 'No major misconduct was recorded; explicit authority and risk checks were limited.'),
    deliver: products.length ? `${products.length} training product${products.length === 1 ? '' : 's'} created.` : 'No training product was completed.',
    missionFocus: evidenceFor(actions, [/mission|annex|intent|requirement|objective|priority/i], 'Few actions explicitly connected activity to Annex K or commander intent.')
  };

  const dimensions = DIMENSION_DEFINITIONS.map(([key, label, description]) => ({
    key,
    label,
    description,
    score: clamp(scores[key]),
    evidence: evidence[key]
  }));
  const sorted = [...dimensions].sort((left, right) => right.score - left.score);
  const spread = sorted[0].score - sorted[sorted.length - 1].score;
  const overall = clamp(average(dimensions.map(item => item.score)));

  const tendencyScores = [
    ['Relationship Builder', average([scores.connect, scores.listen])],
    ['Civil Analyst', scores.understand],
    ['Network Mapper', scores.navigate],
    ['Integrator', scores.coordinate],
    ['Mission Steward', average([scores.judgment, scores.missionFocus])],
    ['Adaptive Operator', spread <= 15 ? overall + 8 : overall - spread / 2]
  ].sort((left, right) => right[1] - left[1]);

  const confidence = actions.length >= 10 ? 'Well-observed' : actions.length >= 5 ? 'Developing' : 'Provisional';
  const confidenceExplanation = `${actions.length} recorded action${actions.length === 1 ? '' : 's'} across ${records.length} completed location${records.length === 1 ? '' : 's'}.`;
  const strongest = sorted.slice(0, 2);
  const priorities = sorted.slice(-2).reverse();

  return {
    tendency: tendencyScores[0][0],
    tendencyStatement: `During this mission, you most often operated as a ${tendencyScores[0][0]}.`,
    confidence,
    confidenceExplanation,
    overall,
    readinessScore: readinessScore(readinessResults),
    dimensions,
    strongest,
    priorities,
    nextChallenge: priorities.length
      ? `Choose a mission that forces deliberate practice in ${priorities.map(item => item.label.toLowerCase()).join(' and ')}.`
      : 'Continue practicing across varied mission conditions.'
  };
}

export function buildDecisionTimeline(records = []) {
  return records.flatMap(record => (record.siteProgress?.actions || []).map((action, index) => ({
    location: record.location || record.scenarioName,
    action,
    order: index + 1
  })));
}
