const discoveryPattern = /depend|connection|connected|relationship|network|supplier|support|fund|responsib|authority|upstream|downstream|who else|where (?:it|they|this)|root cause|source of|follow[- ]?on|referr/i;

export function discoverLead(actionText, scenario = {}) {
  if (!scenario.lead || !discoveryPattern.test(actionText || '')) return null;
  return { ...scenario.lead, status: 'open' };
}

export function evaluateLeadInvestigation(actionText, lead = {}, scenario = {}) {
  const text = actionText || '';
  const rapport = /introduc|greet|listen|rapport|respect|explain|interpreter/i.test(text);
  const validation = /validat|verify|confirm|corroborat|compare|record|document|source/i.test(text);
  const observation = /inspect|observe|assess|walk|review|look|visit/i.test(text);
  const coordination = /coordinat|refer|follow|contact|notify|connect/i.test(text);
  const strengths = [rapport && 'established access', observation && 'examined conditions directly', validation && 'tested the original claim', coordination && 'identified a coordination path'].filter(Boolean);
  const finding = validation
    ? `The ${lead.contact} provides records and an account that partially corroborate the link to the ${lead.originLocation}, while leaving the scale of the effect unresolved.`
    : `The ${lead.contact} describes a plausible connection to the ${lead.originLocation}, but the account remains a single-source claim.`;
  const consequence = observation
    ? `A visible mismatch between routine operations and the official description gives the team a specific issue to carry back.`
    : `Without direct observation, the team must decide whether another visit or source is necessary before treating the connection as fact.`;
  const qualityScore = 42 + (rapport ? 12 : 0) + (observation ? 14 : 0) + (validation ? 18 : 0) + (coordination ? 10 : 0);
  const informationGaps = [];
  if (!validation) informationGaps.push(`Independent confirmation of the ${lead.label} account`);
  if (!observation) informationGaps.push(`Direct observation of conditions at the ${lead.label}`);
  if (!coordination) informationGaps.push(`Ownership and follow-through between the ${lead.label} and ${lead.originLocation}`);

  return {
    narrativeOutcome: `“${lead.openingLine}” The ${lead.contact} studies your team’s reaction before continuing. ${finding} ${consequence}`,
    qualityScore: Math.min(94, qualityScore),
    assessmentType: qualityScore >= 78 ? 'PLANNED' : qualityScore >= 58 ? 'DELIBERATE' : 'INITIAL',
    performanceMeasures: strengths.length,
    relationshipShifts: { [lead.contact || 'Lead contact']: rapport ? 4 : 1 },
    annexCitation: 'K',
    routingRationale: 'The lead finding returns to the originating site record and remains separated into confirmed information, claims, and gaps.',
    product: null,
    feedbackTone: 'encouraging',
    evaluationMode: 'offline-lead',
    progress: {
      discoveries: [finding, consequence],
      informationGaps,
      leads: [{ ...lead, status: 'completed' }],
      completedProducts: [],
      dimensionScores: {
        rapport: rapport ? 78 : 40,
        informationCollection: observation ? 82 : 52,
        validation: validation ? 86 : 35,
        coordination: coordination ? 78 : 38,
        initiative: 80,
        missionFocus: 72
      }
    },
    leadReturnNarrative: lead.returnPrompt
  };
}
