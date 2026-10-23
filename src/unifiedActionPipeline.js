import { createActionRecord, validateActionRecord } from './actionRecord';
import { applyWorldUpdate, createWorldUpdate, validateWorldUpdate } from './worldUpdate';
import { FOUNDATION_POLICIES } from './foundationPolicies';
import { parseLocalAction } from './localActionParser';
import { worksheetCompletion } from './worksheetCompletion';
import { evaluateOffline } from './offlineEvaluator';
import { authorMarketReactions, marketFollowUps } from './marketScene';

const severityRank = { none: 0, coaching: 1, concern: 2, serious: 3, critical: 4 };
const unique = values => [...new Set((values || []).filter(Boolean))];

function productAttachmentPolicy(record) {
  const submitted = new Set(record.evidence.submittedProducts);
  const missing = record.evidence.claimedProducts.filter(name => !submitted.has(name));
  if (!missing.length) return [];
  return [{
    id: 'claimed-products-not-submitted', severity: 'coaching', evidence: record.rawText,
    effects: ['CMOC replies: “Tracking ' + missing.join(', ') + ' in your message, but the attachments did not come through. Please resend using Create a Product.” The documents are not recorded as submitted.'],
    products: { missing },
    coaching: ['Use Create a Product to record the product type, recipient, purpose and key finding. Mentioning a report in an action does not attach it; full template practice is available separately.'],
    scoreChanges: [{ dimension: 'productQuality', delta: 0, reasonCode: 'product-not-attached', evidence: record.rawText }]
  }];
}
export const DEFAULT_ACTION_POLICIES = [...FOUNDATION_POLICIES, productAttachmentPolicy];

function productFinding(record, input, world) {
  if (input.missionProduct) {
    const brief = input.missionProduct;
    if (![brief.name, brief.recipient, brief.purpose, brief.keyFinding].every(value => typeof value === 'string' && value.trim())) throw new Error('Product type, recipient, purpose and key finding are required.');
    if (brief.name !== input.productName || !(input.scenario?.suggestedProducts || ['Field report']).includes(brief.name)) throw new Error('Choose a product offered for this scene.');
    const previous = world.sites?.[record.scenarioId]?.dimensionScores?.productQuality || 0;
    return {
      id: 'mission-product-recorded', severity: 'none', evidence: record.rawText,
      creditKey: record.scenarioId + ':mission-product',
      effects: ['Your ' + brief.name + ' is added to the exercise record for ' + brief.recipient.trim() + '. The purpose and key finding travel with it. The team now has something concrete to hand over, rather than a promise that a report will follow.\n\nThe content remains your assessment. Recording it does not confirm the finding, authorize the proposed action, or send a document outside this simulation.'],
      products: { accepted: [brief.name] },
      scoreChanges: [{ dimension: 'productQuality', delta: Math.max(0, 100 - previous), reasonCode: 'mission-product-participation', evidence: record.rawText }],
      product: { ...brief, mode: 'mission-brief', name: brief.name, content: record.rawText, citationStandard: 'Short mission brief — participation only; full template and accuracy not assessed' },
      coaching: ['A useful handover names the audience, purpose, key finding and uncertainty. Review the content with your leader; detailed template practice is separate.']
    };
  }
  // The legacy evaluator is used ONLY for worksheet completion and IG routing.
  // Its narrative/rapport/progress cannot mutate the world.
  const result = evaluateOffline('TRAINEE WANTS TO CREATE THIS PRODUCT: "' + input.productName + '"\nADDITIONAL DETAILS FROM TRAINEE: "' + record.rawText + '"\n', input.scenario || {}, {});
  const previousScore = world.sites?.[record.scenarioId]?.dimensionScores?.productQuality || 0;
  const existing = world.history?.some(update => update.product?.name === input.productName && update.scenarioId === record.scenarioId);
  const completion = worksheetCompletion(input.productName, input.scenario, record.rawText).percent;
  const score = completion;
  return {
    id: 'worksheet-submitted', severity: 'none', evidence: record.rawText,
    effects: ['CMOC receives ' + input.productName + '. ' + completion + '% of the worksheet fields are filled. ' +
      (completion < 100 ? 'Unfilled sections remain visible in the product. ' : '') +
      'This measures completion; factual accuracy still needs source review.' + (/1559|inspector general/i.test(input.productName) ? ' ' + result.narrativeOutcome : '')],
    products: completion < 100 ? { incomplete: [input.productName] } : { accepted: [input.productName] },
    scoreChanges: [{ dimension: 'productQuality', delta: existing ? Math.max(0, score - previousScore) : score - previousScore, reasonCode: 'worksheet-completion', evidence: record.rawText }],
    product: { ...result.product, completionScore: score, completionPercent: completion },
    coaching: [result.routingRationale]
  };
}

function reduceFindings(record, findings, world) {
  const ordered = [...findings].sort((a, b) => (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0));
  const strongest = ordered[0];
  const concern = (severityRank[strongest?.severity] || 0) >= severityRank.concern;
  // Administrative attachment feedback survives conduct concerns; incompatible
  // positive changes do not. Every retained delta still names its own evidence.
  const operative = concern ? ordered.filter(f => severityRank[f.severity] >= severityRank.concern || f.id === 'claimed-products-not-submitted') : ordered;
  const site = world.sites?.[record.scenarioId] || {};
  const update = createWorldUpdate({ actionRecordId: record.id, scenarioId: record.scenarioId,
    classification: strongest?.id || 'unresolved-action', severity: strongest?.severity || 'none' });
  const awarded = new Set(site.creditKeys || []);
  for (const finding of operative) {
    const repeatedCredit = finding.creditKey && awarded.has(finding.creditKey);
    if (finding.creditKey) awarded.add(finding.creditKey);
    ['effects', 'coaching', 'teamReactions', 'localReactions', 'discoveries', 'persistentConditions', 'conditionChanges', 'permissions', 'engagedParticipants', 'acceptedActs', 'rejectedActs'].forEach(key => {
      update[key].push(...(finding[key] || []));
    });
    if (!repeatedCredit) {
      update.relationshipChanges.push(...(finding.relationshipChanges || []));
      update.scoreChanges.push(...(finding.scoreChanges || []));
    }
    if (finding.creditKey) update.creditKeys.push(finding.creditKey);
    Object.keys(update.products).forEach(key => update.products[key].push(...(finding.products?.[key] || [])));
    Object.keys(update.gaps).forEach(key => update.gaps[key].push(...(finding.gaps?.[key] || [])));
    Object.keys(update.leads).forEach(key => update.leads[key].push(...(finding.leads?.[key] || [])));
    if (finding.interpreterStatus) update.interpreterStatus = finding.interpreterStatus;
    if (finding.product) update.product = finding.product;
  }
  update.effects = unique(update.effects);
  update.teamReactions = unique(update.teamReactions);
  update.coaching = unique(update.coaching);
  if (update.effects.length && ['action', 'lead'].includes(record.kind) && record.understanding.ambiguities.length) {
    update.effects.push('Not yet resolved: “' + record.understanding.ambiguities.join('”; “') + '”. These details have not been assigned a consequence or credit.');
  }
  const previous = (world.persistentConditions || []).filter(c => ['serious', 'critical'].includes(c.severity));
  const seriousTurns = new Set([...previous, ...update.persistentConditions.filter(c => ['serious', 'critical'].includes(c.severity))].map(c => c.sourceAction || c.id)).size;
  if (update.severity === 'critical' || seriousTurns >= 3) update.missionOutcome = {
    terminated: true, status: 'Mission ended — command-directed removal',
    reason: update.severity === 'critical' ? 'The critical incident ends normal mission activity.' : 'Repeated serious incidents have exhausted access and command confidence.'
  };
  if (!update.effects.length) {
    const unknown = record.understanding.ambiguities?.[0] || record.rawText;
    update.effects.push('The team records your action: “' + unknown + '”. Its effect is unresolved. No score, relationship change, or new fact is assigned. Specify the person, observable action, and intended subject so the scene can respond accurately.');
    update.coaching.push('This is an interpretation limitation, not a finding of misconduct.');
  }
  const prior = (world.persistentConditions || []).filter(c => c.status !== 'resolved');
  if (prior.length && !concern) update.localReactions.push('Earlier events still shape this visit: ' + unique(prior.map(c => c.title)).join('; ') + '. A courteous exchange does not restore lost access or erase the incident record.');
  // Record actual applied changes, including a requested penalty at the floor.
  // Displayed deltas and the evidence ledger must match the resulting world.
  const scores = { ...site.dimensionScores };
  update.scoreChanges = update.scoreChanges.map(change => {
    const before = scores[change.dimension] ?? 0;
    const after = Math.max(0, Math.min(100, before + change.delta));
    scores[change.dimension] = after;
    return { ...change, requestedDelta: change.delta, delta: after - before, before, after };
  });
  const relationships = { ...world.relationships };
  update.relationshipChanges = update.relationshipChanges.map(change => {
    const before = relationships[change.participant] ?? 50;
    const after = Math.max(0, Math.min(100, before + change.delta));
    relationships[change.participant] = after;
    return { ...change, requestedDelta: change.delta, delta: after - before, before, after };
  });
  return update;
}

export function processUnifiedAction(input = {}, policies = DEFAULT_ACTION_POLICIES) {
  const world = input.worldState || {};
  if (world.missionOutcome?.terminated) return { ok: false, errors: ['This mission has ended. Review the AAR or start a new mission.'] };
  const scenario = input.scenario || { id: input.scenarioId, location: input.location, siteType: input.siteType, keyStakeholders: input.stakeholders || [] };
  const interpretation = input.interpretation || (['product', 'skip'].includes(input.kind)
    ? { source: 'structured-ui', intent: input.kind, actions: [{ description: input.kind === 'product' ? 'Submit worksheet: ' + input.productName : 'Leave without engagement', actor: 'trainee', kinds: [input.kind], confidence: 100 }] }
    : parseLocalAction(input.rawText, scenario, world));
  const actionRecord = createActionRecord({ ...input, interpretation });
  actionRecord.context = { ...actionRecord.context, ...scenario, id: actionRecord.scenarioId, stakeholders: input.stakeholders || scenario.keyStakeholders || [] };
  const recordValidation = validateActionRecord(actionRecord);
  if (!recordValidation.valid) return { ok: false, actionRecord, worldUpdate: null, errors: recordValidation.errors };
  let findings = input.kind === 'product' ? [productFinding(actionRecord, input, world)]
    : input.kind === 'skip' ? [{
      id: 'departed-without-engagement', severity: 'none', effects: ['The team leaves without engaging. The host has received no explanation of the visit, and the site’s information requirements remain open.']
    }] : policies.flatMap(policy => policy(actionRecord, world) || []);
  findings = authorMarketReactions(actionRecord, findings, world);
  const worldUpdate = reduceFindings(actionRecord, findings, world);
  worldUpdate.followUpRequests = marketFollowUps(actionRecord, worldUpdate);
  if (input.activeLead && worldUpdate.severity === 'none' && worldUpdate.discoveries.length) {
    worldUpdate.leads.changed.push({ ...input.activeLead, status: 'completed' });
    worldUpdate.effects.push('The team records this source visit against the developed lead. The account remains attributed; visiting a second person does not by itself prove the original claim.');
  }
  const updateValidation = validateWorldUpdate(worldUpdate, actionRecord);
  const nextWorld = updateValidation.valid ? applyWorldUpdate(world, worldUpdate, actionRecord) : null;
  return { ok: updateValidation.valid, actionRecord, worldUpdate, findings, nextWorld, interpretation, errors: updateValidation.errors };
}

// The UI consumes a projection of the decision, never another evaluator.
export function outcomeFromTurn(turn) {
  const update = turn.worldUpdate;
  const site = turn.nextWorld.sites[update.scenarioId];
  const scores = Object.values(site.dimensionScores);
  const qualityScore = Math.round(scores.reduce((sum, n) => sum + n, 0) / scores.length);
  return {
    narrativeOutcome: site.continuityNarrative, continuityNarrative: site.continuityNarrative,
    qualityScore, assessmentType: 'EVIDENCE-BASED', performanceMeasures: scores.filter(n => n > 0).length,
    relationshipShifts: update.relationshipChanges.reduce((out, c) => ({ ...out, [c.participant]: (out[c.participant] || 0) + c.delta }), {}),
    annexCitation: 'K', routingRationale: update.coaching.join(' '), coachingInsight: update.coaching.join(' '),
    feedbackTone: update.severity === 'none' ? 'encouraging' : 'direct',
    product: update.product || null, productCompletionPercent: update.product?.completionPercent ?? null,
    evaluationMode: 'local-unified', actionInterpretation: ['action', 'lead'].includes(turn.actionRecord.kind) ? turn.interpretation : null,
    missionTerminated: Boolean(turn.nextWorld.missionOutcome?.terminated), missionDisposition: turn.nextWorld.missionOutcome,
    progress: { discoveries: site.discoveries, informationGaps: site.informationGaps, leads: site.leads, completedProducts: site.completedProducts, dimensionScores: site.dimensionScores },
    actionRecord: turn.actionRecord, worldUpdate: update
  };
}
