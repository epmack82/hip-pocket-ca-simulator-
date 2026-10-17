export const WORLD_UPDATE_VERSION = 1;

export function createWorldUpdate(input = {}) {
  return {
    schemaVersion: WORLD_UPDATE_VERSION,
    actionRecordId: input.actionRecordId,
    classification: input.classification || 'unresolved',
    severity: input.severity || 'none',
    acceptedActs: input.acceptedActs || [],
    rejectedActs: input.rejectedActs || [],
    effects: input.effects || [],
    relationshipChanges: input.relationshipChanges || [],
    teamReactions: input.teamReactions || [],
    localReactions: input.localReactions || [],
    discoveries: input.discoveries || [],
    gaps: input.gaps || { opened: [], advanced: [], resolved: [] },
    leads: input.leads || { opened: [], changed: [] },
    products: input.products || { accepted: [], missing: [], incomplete: [], rejected: [] },
    scoreChanges: input.scoreChanges || [],
    persistentConditions: input.persistentConditions || [],
    missionOutcome: input.missionOutcome || null,
    coaching: input.coaching || []
  };
}

export function validateWorldUpdate(update, record) {
  const errors = [];
  if (update?.schemaVersion !== WORLD_UPDATE_VERSION) errors.push('Unsupported WorldUpdate version');
  if (!update?.actionRecordId) errors.push('WorldUpdate requires an ActionRecord id');
  if (record?.id && update?.actionRecordId !== record.id) errors.push('WorldUpdate references the wrong ActionRecord');
  (update?.relationshipChanges || []).forEach((change, index) => {
    if (!change.participant) errors.push(`Relationship change ${index + 1} requires a participant`);
    if (!Number.isFinite(change.delta)) errors.push(`Relationship change ${index + 1} requires a numeric delta`);
    if (!change.reasonCode) errors.push(`Relationship change ${index + 1} requires a reason code`);
    if (!change.evidence) errors.push(`Relationship change ${index + 1} requires evidence`);
  });
  (update?.scoreChanges || []).forEach((change, index) => {
    if (!change.dimension || !change.reasonCode || !change.evidence) {
      errors.push(`Score change ${index + 1} requires dimension, reason code, and evidence`);
    }
  });
  return { valid: errors.length === 0, errors };
}

export function applyWorldUpdate(world = {}, update) {
  const relationships = { ...(world.relationships || {}) };
  update.relationshipChanges.forEach(change => {
    const current = Number(relationships[change.participant]) || 50;
    relationships[change.participant] = Math.max(0, Math.min(100, current + change.delta));
  });
  return {
    ...world,
    relationships,
    discoveries: [...(world.discoveries || []), ...update.discoveries],
    persistentConditions: [...(world.persistentConditions || []), ...update.persistentConditions],
    history: [...(world.history || []), update],
    missionOutcome: update.missionOutcome || world.missionOutcome || null
  };
}

