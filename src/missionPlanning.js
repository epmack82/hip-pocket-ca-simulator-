// Pre-visit information is deliberately separate from the arrival scene and
// authored findings. These are leads for planning, not verified observations.
const briefs = {
  school: ['Education contacts have raised questions about access to school and continuity of teaching.', 'School access can reveal how disruption affects children, families, and community services.'],
  water: ['Local reporting raises questions about the reliability of water distribution.', 'Water access affects household needs, public health, and other essential services.'],
  clinic: ['Health contacts have requested a clearer picture of access to clinic services.', 'Service figures alone may not explain which people can obtain care.'],
  market: ['Business contacts have requested an assessment of trading conditions.', 'Market access connects household livelihoods, supply, and local recovery.'],
  port: ['Transport contacts have raised questions about cargo movement and port capacity.', 'Port operations can affect supplies and services beyond the immediate site.'],
  irrigation: ['Agricultural contacts have requested follow-up on irrigation access.', 'Water allocation may affect food production and farming livelihoods.'],
  municipal: ['Local officials have requested an assessment of municipal service access.', 'Understanding local authority and capacity helps identify coordination gaps.'],
  distribution: ['Aid contacts have requested a review of distribution and access.', 'The team needs to understand who assistance reaches and who may be missed.'],
  substation: ['Utility contacts have requested follow-up on electrical service reliability.', 'Power interruptions can affect other essential services and nearby communities.']
};

export function siteOrientation(scenario = {}) {
  const [report, relevance] = briefs[scenario.metadata?.site || scenario.siteType] || [
    'Initial reporting identifies this location as a possible source of civil information.',
    'The visit can help clarify local needs, capabilities, and follow-up requirements.'
  ];
  const objective = scenario.metadata?.trainingObjective;
  return {
    report, relevance,
    contact: scenario.keyStakeholders?.[0] || 'Contact to be confirmed',
    purpose: objective ? objective.charAt(0).toUpperCase() + objective.slice(1) + '.' : 'Understand local conditions, whose perspectives are missing, and what requires independent confirmation.',
    // Older saves retain the combined narrative; split for display without
    // modifying the saved scene or the identity of its generated location.
    arrival: /market/i.test(`${scenario.metadata?.site || ''} ${scenario.siteType || ''} ${scenario.location || ''}`)
      ? 'A delivery engine rattles at the edge of the market. Handcarts squeeze between shoppers; somewhere beneath the awnings, two vendors bargain over a crate. Several shutters are down, but from the entrance you cannot tell why. Your team steps clear of the traffic. No one has stopped working to receive you.\n\nYour contact notes list Mali, the market association chair. Near the loading area, a woman with a folder is speaking to a vendor. She may be the person you came to find—you will need to ask. Your interpreter waits beside you, ready to help you introduce the team.\n\nYou can approach someone, ask who coordinates the market, or take a look around the public trading area first. The conversation has not begun; your next move is yours.'
      : String(scenario.narrative || '').split(/\n\nYour task is to\b/)[0]
  };
}

export function concludedSiteIds(scenarios = [], records = []) {
  return new Set(records.map((record, index) => record.scenarioId || record.siteProgress?.scenarioId || scenarios[index]?.id).filter(Boolean));
}

export function remainingSites(scenarios = [], records = []) {
  const concluded = concludedSiteIds(scenarios, records);
  return scenarios.map((scenario, index) => ({ scenario, index })).filter(({ scenario }) => !concluded.has(scenario.id));
}

export function knownPlanningLeads(sites = {}) {
  return Object.entries(sites).flatMap(([scenarioId, site]) => (site.leads || [])
    .filter(lead => lead.status !== 'completed')
    .map(lead => ({ ...lead, originScenarioId: scenarioId })));
}
