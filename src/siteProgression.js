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
    continuityNarrative: '',
    sequencingNote: '',
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
    continuityNarrative: result.continuityNarrative || base.continuityNarrative,
    sequencingNote: result.sequencingNote || base.sequencingNote,
    dimensionScores: scores,
    lastUpdate: result.leadReturnNarrative
      ? `${result.narrativeOutcome || ''} ${result.leadReturnNarrative}`.trim()
      : result.narrativeOutcome || base.lastUpdate,
    visits: (base.visits || 1) + 1
  };
}

export function siteStatusSummary(state, scenario = {}) {
  if (!state?.actions?.length) return scenario.narrative || '';
  const discoveries = state.discoveries?.length || 0;
  const products = state.completedProducts?.length || 0;
  const openLeads = (state.leads || []).filter(lead => lead.status !== 'completed').length;
  const gaps = state.informationGaps?.length || 0;
  const scored = DIMENSIONS
    .map(([key, label]) => ({ label, score: Number(state.dimensionScores?.[key]) || 0 }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);
  const strongest = scored[0];
  const weakest = scored.length > 1 ? scored[scored.length - 1] : null;
  const fieldWork = `${state.actions.length} field action${state.actions.length === 1 ? '' : 's'} completed at ${scenario.location || 'this location'}; ${discoveries} finding${discoveries === 1 ? '' : 's'} recorded${products ? ` and ${products} product${products === 1 ? '' : 's'} completed` : ''}.`;
  const collection = gaps
    ? `Collection remains incomplete: ${gaps} information gap${gaps === 1 ? '' : 's'} and ${openLeads} open lead${openLeads === 1 ? '' : 's'} require a decision.`
    : `No explicit information gaps remain${openLeads ? `, though ${openLeads} developed lead${openLeads === 1 ? '' : 's'} remains open` : ''}.`;
  const commandView = strongest
    ? `Command view: strongest demonstrated area is ${strongest.label.toLowerCase()} (${strongest.score})${weakest && weakest.label !== strongest.label ? `; the clearest development need is ${weakest.label.toLowerCase()} (${weakest.score})` : ''}.`
    : 'Command view: insufficient observed activity for a meaningful performance trend.';
  return `${fieldWork} ${collection} ${commandView}`;
}

export function buildValidationBrief(state = {}) {
  const discoveries = state.discoveries || [];
  const claimIndicators = /\b(?:says|claim|account|report|identif|indicat|disput|alleg|believ|according)\b/i;
  const claims = discoveries.filter(item => claimIndicators.test(item));
  return {
    claims: claims.length ? claims : discoveries.slice(-1),
    gaps: state.informationGaps || [],
    leads: (state.leads || []).filter(lead => lead.status !== 'completed')
  };
}

export function followLead(state, leadId) {
  return {
    ...state,
    leads: state.leads.map(lead => lead.id === leadId ? { ...lead, status: 'being investigated' } : lead)
  };
}
