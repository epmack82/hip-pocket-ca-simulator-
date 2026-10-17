import { createActionRecord, validateActionRecord } from './actionRecord.js';
import { createWorldUpdate, validateWorldUpdate } from './worldUpdate.js';
import { FOUNDATION_POLICIES } from './foundationPolicies.js';

const severityRank = { none: 0, coaching: 1, concern: 2, serious: 3, critical: 4 };
const unique = values => [...new Set((values || []).filter(Boolean))];

function productAttachmentPolicy(record) {
  const submitted = new Set(record.evidence.submittedProducts);
  const missing = record.evidence.claimedProducts.filter(name => !submitted.has(name));
  if (!missing.length) return [];
  return [{
    id: 'claimed-products-not-submitted',
    severity: 'coaching',
    evidence: record.rawText,
    effects: [`The trainee referenced ${missing.join(', ')}, but no completed template was attached.`],
    products: { missing },
    coaching: ['Use Create a Product, complete the relevant fields, and submit the worksheet before claiming the product as delivered.'],
    scoreChanges: [{ dimension: 'productQuality', delta: 0, reasonCode: 'product-not-attached', evidence: record.rawText }]
  }];
}

export const DEFAULT_ACTION_POLICIES = [...FOUNDATION_POLICIES, productAttachmentPolicy];

function reduceFindings(record, findings = []) {
  const ordered = [...findings].sort((a, b) => (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0));
  const strongest = ordered[0];
  const strongestRank = severityRank[strongest?.severity] || 0;
  // A material concern suppresses incompatible positive/coaching credit from
  // the same act. Multiple material concerns may still accumulate because
  // each must remain visible and traceable in the authoritative update.
  const operative = strongestRank >= severityRank.concern
    ? ordered.filter(item => (severityRank[item.severity] || 0) >= severityRank.concern)
    : ordered;
  const relationshipChanges = [];
  const scoreChanges = [];
  const effects = [];
  const coaching = [];
  const products = { accepted: [], missing: [], incomplete: [], rejected: [] };

  operative.forEach(finding => {
    effects.push(...(finding.effects || []));
    coaching.push(...(finding.coaching || []));
    relationshipChanges.push(...(finding.relationshipChanges || []));
    scoreChanges.push(...(finding.scoreChanges || []));
    Object.keys(products).forEach(key => products[key].push(...(finding.products?.[key] || [])));
  });
  Object.keys(products).forEach(key => { products[key] = unique(products[key]); });

  return createWorldUpdate({
    actionRecordId: record.id,
    classification: strongest?.id || 'no-rule-triggered',
    severity: strongest?.severity || 'none',
    acceptedActs: strongest ? [] : record.understanding.actions.map(action => action.id),
    rejectedActs: operative.flatMap(finding => finding.rejectedActs || []),
    effects: unique(effects),
    relationshipChanges,
    products,
    scoreChanges,
    coaching: unique(coaching)
  });
}

export function processUnifiedAction(input = {}, policies = DEFAULT_ACTION_POLICIES) {
  const actionRecord = createActionRecord(input);
  const recordValidation = validateActionRecord(actionRecord);
  if (!recordValidation.valid) {
    return { ok: false, actionRecord, worldUpdate: null, errors: recordValidation.errors };
  }

  const findings = policies.flatMap(policy => policy(actionRecord, input.worldState || {}) || []);
  const worldUpdate = reduceFindings(actionRecord, findings);
  const updateValidation = validateWorldUpdate(worldUpdate, actionRecord);
  return {
    ok: updateValidation.valid,
    actionRecord,
    worldUpdate,
    findings,
    errors: updateValidation.errors
  };
}
