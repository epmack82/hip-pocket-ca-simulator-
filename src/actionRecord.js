const allowed = (value, choices, fallback) => choices.includes(value) ? value : fallback;
const list = value => Array.isArray(value) ? value.filter(Boolean) : [];

export const ACTION_RECORD_VERSION = 1;

export function createActionRecord(input = {}) {
  const rawText = String(input.rawText || '').trim();
  const interpretation = input.interpretation || {};
  const actions = list(interpretation.actions).map((action, index) => ({
    ...(typeof action === 'object' ? action : {}),
    id: `act-${index + 1}`,
    description: String(typeof action === 'string' ? action : action.description || ''),
    actor: typeof action === 'object' ? action.actor || 'trainee' : 'trainee',
    target: typeof action === 'object' ? action.target || null : null,
    sequence: index + 1,
    confidence: Number(typeof action === 'object' ? action.confidence : interpretation.confidence) || 0
  }));

  return {
    schemaVersion: ACTION_RECORD_VERSION,
    id: input.id || `${input.scenarioId || 'scenario'}-turn-${Number(input.turnNumber) || 1}`,
    scenarioId: input.scenarioId || null,
    seed: input.seed || null,
    turnNumber: Number(input.turnNumber) || 1,
    kind: input.kind || 'action',
    rawText,
    context: {
      location: input.location || null,
      siteType: input.siteType || null,
      stakeholders: list(input.stakeholders),
      teamMembers: list(input.teamMembers),
      country: input.country || null
    },
    understanding: {
      intent: interpretation.intent || null,
      missionRelevance: allowed(interpretation.missionRelevance, ['none', 'low', 'medium', 'high'], 'unknown'),
      actions: actions.length ? actions : [{
        id: 'act-1', description: rawText, actor: 'trainee', target: null, sequence: 1, confidence: 0
      }],
      participants: list(interpretation.participants),
      permission: allowed(interpretation.permission, ['stated', 'requested', 'missing', 'denied', 'unclear'], 'unclear'),
      protectedPopulation: interpretation.protectedPopulation || 'none',
      interpreterRole: interpretation.interpreterRole || 'not-mentioned',
      professionalRisk: allowed(interpretation.professionalRisk, ['none', 'low', 'moderate', 'high', 'critical'], 'unknown'),
      confidence: Number(interpretation.confidence) || 0,
      source: interpretation.source || 'offline-fallback',
      ambiguities: list(interpretation.ambiguities)
    },
    evidence: {
      claimedProducts: list(input.claimedProducts || interpretation.claimedProducts),
      submittedProducts: list(input.submittedProducts),
      priorClaims: list(input.priorClaims),
      statedPermissions: list(input.statedPermissions),
      commitments: list(input.commitments)
    }
  };
}

export function validateActionRecord(record) {
  const errors = [];
  if (record?.schemaVersion !== ACTION_RECORD_VERSION) errors.push('Unsupported ActionRecord version');
  if (!record?.id) errors.push('ActionRecord requires an id');
  if (!record?.rawText) errors.push('ActionRecord requires raw trainee text');
  if (!record?.understanding?.actions?.length) errors.push('ActionRecord requires at least one understood action');
  return { valid: errors.length === 0, errors };
}
