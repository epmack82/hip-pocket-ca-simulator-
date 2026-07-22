export const DIMENSIONS = [
  ['rapport', 'Rapport'],
  ['informationCollection', 'Information collection'],
  ['validation', 'Validation'],
  ['productQuality', 'Product quality'],
  ['coordination', 'Coordination'],
  ['initiative', 'Initiative'],
  ['missionFocus', 'Mission focus']
];

const unique = items => [...new Set((items || []).filter(Boolean))];

export function createSiteState(scenario = {}) {
  return {
    scenarioId: scenario.id,
    stage: 'arrival',
    actions: [],
    discoveries: [],
    informationGaps: [],
    leads: [],
    completedProducts: [],
    dimensionScores: Object.fromEntries(DIMENSIONS.map(([key]) => [key, 0])),
    lastUpdate: '',
    visits: 1
  };
}

export function advanceSiteState(previous, result = {}, summaryLabel, scenario = {}) {
  const base = previous || createSiteState(scenario);
  const progress = result.progress || {
    discoveries: result.narrativeOutcome ? [result.narrativeOutcome] : [],
    informationGaps: ['Independent confirmation of key claims', 'Documented follow-on coordination requirement'],
    leads: [],
    dimensionScores: {
      missionFocus: Number(result.qualityScore) || 0,
      productQuality: result.product ? Number(result.qualityScore) || 0 : 0
    }
  };
  const incomingLeads = (progress.leads || []).map(lead => ({ ...lead, status: lead.status || 'open' }));
  const leadsById = new Map([...base.leads, ...incomingLeads].map(lead => [lead.id || lead.label, lead]));
  const productName = result.product?.name;
  const actions = unique([...base.actions, summaryLabel]);
  const scores = { ...base.dimensionScores };
  Object.entries(progress.dimensionScores || {}).forEach(([key, value]) => {
    scores[key] = Math.max(scores[key] || 0, Number(value) || 0);
  });

  return {
    ...base,
    stage: actions.length >= 3 ? 'developed' : 'engagement',
    actions,
    discoveries: unique([...base.discoveries, ...(progress.discoveries || [])]),
    informationGaps: unique(progress.informationGaps || base.informationGaps),
    leads: [...leadsById.values()],
    completedProducts: unique([...base.completedProducts, ...(progress.completedProducts || []), productName]),
    dimensionScores: scores,
    lastUpdate: result.leadReturnNarrative
      ? `${result.narrativeOutcome || ''} ${result.leadReturnNarrative}`.trim()
      : result.narrativeOutcome || base.lastUpdate,
    visits: (base.visits || 1) + 1
  };
}

export function siteStatusSummary(state, scenario = {}) {
  if (!state?.actions?.length) return scenario.narrative || '';
  const stageText = state.stage === 'developed'
    ? 'You have developed a working picture of this location.'
    : 'The engagement has progressed beyond your initial arrival.';
  const remaining = state.informationGaps.length
    ? `There are still ${state.informationGaps.length} identified information gap${state.informationGaps.length === 1 ? '' : 's'} to address.`
    : 'No explicit information gaps are currently recorded, though conclusions should still be validated.';
  return `${stageText} ${state.lastUpdate} ${remaining}`;
}

export function followLead(state, leadId) {
  return {
    ...state,
    leads: state.leads.map(lead => lead.id === leadId ? { ...lead, status: 'being investigated' } : lead)
  };
}
