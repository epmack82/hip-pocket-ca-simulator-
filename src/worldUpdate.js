export const WORLD_UPDATE_VERSION = 2;
export const RUBRIC_VERSION = 'local-evidence-2';
export const SCORE_DIMENSIONS = [
  ['rapport', 'Rapport and inclusion'], ['professionalism', 'Professional judgment'],
  ['informationCollection', 'Information collection'], ['validation', 'Validation'],
  ['productQuality', 'Reporting practice'], ['coordination', 'Coordination'],
  ['initiative', 'Initiative'], ['missionFocus', 'Mission focus']
];
const unique = values => [...new Set(values || [])];
const clamp = value => Math.max(0, Math.min(100, value));
const mergeById = (before = [], after = []) => [...new Map([...before, ...after].map(item => [item.id, item])).values()];

export function createWorldUpdate(input = {}) {
  return {
    schemaVersion: WORLD_UPDATE_VERSION, actionRecordId: input.actionRecordId,
    scenarioId: input.scenarioId, classification: input.classification || 'unresolved',
    severity: input.severity || 'none', acceptedActs: [], rejectedActs: [], effects: [],
    relationshipChanges: [], teamReactions: [], localReactions: [], discoveries: [],
    gaps: { opened: [], advanced: [], resolved: [] }, leads: { opened: [], changed: [] },
    products: { accepted: [], missing: [], incomplete: [], rejected: [] },
    scoreChanges: [], persistentConditions: [], conditionChanges: [], engagedParticipants: [],
    permissions: [], creditKeys: [], missionOutcome: null, coaching: [], ...input
  };
}

export function validateWorldUpdate(update, record) {
  const errors = [];
  if (update?.schemaVersion !== WORLD_UPDATE_VERSION) errors.push('Unsupported WorldUpdate version');
  if (!update?.actionRecordId) errors.push('WorldUpdate requires an ActionRecord id');
  if (record?.id && update?.actionRecordId !== record.id) errors.push('WorldUpdate references the wrong ActionRecord');
  for (const change of update?.relationshipChanges || []) {
    if (!change.participant || !Number.isFinite(change.delta) || !change.reasonCode || !change.evidence) errors.push('Relationship change requires participant, numeric delta, reason code, and evidence');
  }
  for (const change of update?.scoreChanges || []) {
    if (!SCORE_DIMENSIONS.some(([key]) => key === change.dimension) || !Number.isFinite(change.delta) || !change.reasonCode || !change.evidence) errors.push('Score change requires a supported dimension, numeric delta, reason code, and evidence');
  }
  return { valid: !errors.length, errors };
}

export function applyWorldUpdate(world = {}, update, record = {}) {
  const checked = validateWorldUpdate(update, record);
  if (!checked.valid) throw new Error(checked.errors.join('; '));
  if ((world.history || []).some(item => item.actionRecordId === update.actionRecordId)) return world;
  const relationships = { ...(world.relationships || {}) };
  update.relationshipChanges.forEach(change => {
    const current = Number.isFinite(relationships[change.participant]) ? relationships[change.participant] : 50;
    relationships[change.participant] = clamp(current + change.delta);
  });
  const previous = world.sites?.[update.scenarioId] || {};
  const dimensionScores = { ...Object.fromEntries(SCORE_DIMENSIONS.map(([key]) => [key, 0])), ...previous.dimensionScores };
  update.scoreChanges.forEach(change => { dimensionScores[change.dimension] = clamp(dimensionScores[change.dimension] + change.delta); });
  const conditions = mergeById(world.persistentConditions, update.persistentConditions).map(condition => {
    const change = update.conditionChanges.find(item => item.id === condition.id);
    return change ? { ...condition, status: change.status } : condition;
  });
  const conditionsHere = conditions.filter(c => c.sourceScenario === update.scenarioId);
  const narration = [...update.effects, ...update.teamReactions, ...update.localReactions].filter(Boolean).join('\n\n');
  const conversation = (record.understanding?.actions || []).filter(act => update.acceptedActs.includes(act.id) &&
    act.kinds?.some(kind => ['introduction', 'invitation', 'inquiry', 'permission-request'].includes(kind)));
  const site = {
    ...previous, scenarioId: update.scenarioId, engineVersion: WORLD_UPDATE_VERSION,
    stage: update.severity === 'critical' ? 'terminated' : 'engagement',
    actions: [...(previous.actions || []), record.rawText || update.classification],
    actionCount: (previous.actionCount || previous.actions?.length || 0) + 1,
    claims: mergeById(previous.claims, update.discoveries.filter(d => d.reliability === 'claim')),
    evidence: mergeById(previous.evidence, update.discoveries),
    discoveries: unique([...(previous.discoveries || []), ...update.discoveries.map(d => d.source + ': ' + d.text)]),
    informationGaps: unique([...(previous.informationGaps || ['Current service conditions and population affected', 'Independent confirmation of stakeholder claims', 'Responsible authority and follow-up coordination']), ...update.gaps.opened]).filter(gap => !update.gaps.resolved.includes(gap)),
    advancedGaps: unique([...(previous.advancedGaps || []), ...update.gaps.advanced]),
    leads: mergeById(previous.leads, [...update.leads.opened, ...update.leads.changed]),
    followUpRequests: mergeById(previous.followUpRequests, update.followUpRequests),
    completedProducts: unique([...(previous.completedProducts || []), ...update.products.accepted]),
    engagedParticipants: unique([...(previous.engagedParticipants || []), ...update.engagedParticipants]),
    conversationTarget: conversation.length ? conversation[conversation.length - 1].target : previous.conversationTarget,
    permissions: unique([...(previous.permissions || []), ...update.permissions]),
    creditKeys: unique([...(previous.creditKeys || []), ...update.creditKeys]),
    dimensionScores, persistentConditions: conditionsHere,
    continuityNarrative: narration, lastUpdate: narration, lastActionId: update.actionRecordId,
    history: [...(previous.history || []), update], visits: previous.visits || 1
  };
  return {
    ...world, schemaVersion: WORLD_UPDATE_VERSION, relationships, persistentConditions: conditions,
    discoveries: mergeById(world.discoveries, update.discoveries),
    sites: { ...(world.sites || {}), [update.scenarioId]: site },
    history: [...(world.history || []), update],
    actionRecords: [...(world.actionRecords || []), record],
    interpreterStatus: update.interpreterStatus || world.interpreterStatus || 'available',
    missionOutcome: update.missionOutcome || world.missionOutcome || null
  };
}

export function migrateWorldState({ world, siteStates = {}, relationships = {}, missionConsequences = [] } = {}) {
  if (world?.schemaVersion === WORLD_UPDATE_VERSION) return world;
  return {
    schemaVersion: WORLD_UPDATE_VERSION, sites: { ...siteStates }, relationships: { ...relationships },
    persistentConditions: missionConsequences.map(c => ({ ...c, sourceScenario: c.sourceScenario || 'legacy', ruleId: c.ruleId || c.id })),
    history: [], actionRecords: [], legacyHistory: Object.keys(siteStates).length > 0,
    interpreterStatus: 'available', missionOutcome: null
  };
}

