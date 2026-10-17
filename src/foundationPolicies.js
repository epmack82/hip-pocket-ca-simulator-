const stakeholder = record => record.context.stakeholders[0] || 'Local stakeholder';
const evidence = record => record.rawText;
const actionIds = record => record.understanding.actions.map(action => action.id);

function finding(record, values) {
  return [{
    id: values.id,
    severity: values.severity,
    evidence: evidence(record),
    rejectedActs: values.rejected ? actionIds(record) : [],
    effects: values.effects || [],
    relationshipChanges: values.relationshipDelta ? [{
      participant: stakeholder(record),
      delta: values.relationshipDelta,
      reasonCode: values.id,
      evidence: evidence(record)
    }] : [],
    scoreChanges: (values.scoreChanges || []).map(change => ({ ...change, reasonCode: values.id, evidence: evidence(record) })),
    persistentConditions: values.persistentConditions || [],
    coaching: values.coaching || []
  }];
}

export function seriousMisconductPolicy(record) {
  const text = record.rawText.toLowerCase();
  const destruction = /\b(?:burn|burned|burnt|set\s+(?:fire|ablaze)|torch|destroy|demolish|blow\s+up|explosive|c4|grenade)\b/.test(text);
  const violence = /\b(?:assault|attack|beat|shoot|stab|kill|murder|strike|tomahawk|weapon|open\s+fire)\b/.test(text);
  if (!destruction && !violence) return [];
  return finding(record, {
    id: destruction ? 'destruction-or-arson' : 'violence-or-weapon-use', severity: 'critical', rejected: true,
    effects: ['The engagement stops immediately. Local authorities secure the area while the chain of command initiates an incident response and removes the team from normal mission activity.'],
    relationshipDelta: -30,
    scoreChanges: [{ dimension: 'professionalism', delta: -40 }, { dimension: 'missionFocus', delta: -40 }],
    persistentConditions: [{ id: 'command-investigation', status: 'active', sourceAction: record.id }],
    coaching: ['This is not treated as colorful improvisation. It creates safety, legal, diplomatic, and mission-command consequences that persist beyond the turn.']
  });
}

export function intoxicationAndDrugPolicy(record) {
  const text = record.rawText.toLowerCase();
  const intoxication = /\b(?:get|got|become|became|arrive|arrived|show\s+up|showed\s+up)\s+(?:very\s+)?(?:drunk|hammered|wasted|intoxicated)|\bbender\b|\blight(?:ing)?\s+(?:up\s+)?(?:a\s+)?(?:joint|blunt)|\bsmok(?:e|ing)\s+(?:a\s+)?(?:joint|weed|marijuana)|\buse\s+(?:cocaine|meth|drugs)\b/.test(text);
  const distribution = /\b(?:offer|give|hand|pass|distribute|provide|bring)\w*\b.{0,55}\b(?:booze|alcohol|vodka|moonshine|drugs|prescription|pills)\b/.test(text);
  if (!intoxication && !distribution) return [];
  return finding(record, {
    id: distribution ? 'substance-distribution' : 'duty-impairment', severity: 'serious', rejected: true,
    effects: ['The stakeholder ends the substantive discussion and the team leadership intervenes. The incident is documented and follow-on access is restricted pending command review.'],
    relationshipDelta: -15,
    scoreChanges: [{ dimension: 'professionalism', delta: -25 }, { dimension: 'rapport', delta: -15 }],
    persistentConditions: [{ id: 'impaired-duty-incident', status: 'active', sourceAction: record.id }],
    coaching: ['Alcohol or drug misuse during an engagement is a readiness and discipline issue, not rapport building. Repeated misconduct escalates rather than resetting.']
  });
}

export function interpreterControlPolicy(record) {
  const text = record.rawText.toLowerCase();
  const excluded = /\b(?:leave|left|keep|kept|send|sent)\b.{0,40}\b(?:interpreter|translator)\b.{0,45}\b(?:outside|behind|away|out|alone)|\bwithout\s+(?:the|my|our)\s+(?:interpreter|translator)\b/.test(text);
  const substituted = /\b(?:tell|ask|have|make|send)\b.{0,30}\b(?:interpreter|translator)\b.{0,60}\b(?:lead|conduct|handle|do|give)\b.{0,30}\b(?:meeting|kle|engagement|introduction|introductions)\b/.test(text);
  if (!excluded && !substituted) return [];
  return finding(record, {
    id: excluded ? 'interpreter-deliberately-excluded' : 'interpreter-substituted-for-soldier', severity: 'concern', rejected: true,
    effects: [excluded
      ? 'The private conversation cannot proceed as intended because shared meaning and an accountable record of the exchange are no longer reliable.'
      : 'The interpreter pauses rather than assuming responsibility for the Soldier-led engagement. Team leadership redirects the Soldier to personally establish purpose and ownership.'],
    relationshipDelta: -5,
    scoreChanges: [{ dimension: 'coordination', delta: -12 }, { dimension: 'rapport', delta: -5 }],
    coaching: ['The interpreter facilitates language and cultural meaning. The Soldier remains responsible for the engagement, observes reactions, verifies meaning, and protects sensitive information appropriately.']
  });
}

export function protectedPopulationPolicy(record) {
  const text = record.rawText.toLowerCase();
  const protectedPerson = /\b(?:child|children|kid|kids|minor|student|students|patient|patients|detainee|detainees|refugee|refugees|survivor|survivors|disabled|displaced)\b/.test(text);
  const directContact = /\b(?:play|join|photograph|film|record|touch|hug|carry|give|hand|interview|question|take|escort|approach|talk|speak)\w*\b/.test(text);
  const permission = /\b(?:permission|consent|approval|approved|authorized|teacher agreed|administrator agreed|parent agreed|guardian agreed|invited)\b/.test(text);
  if (!protectedPerson || !directContact || permission) return [];
  return finding(record, {
    id: 'protected-contact-without-permission', severity: 'serious', rejected: true,
    effects: ['A teammate intervenes before the uncoordinated contact proceeds. The responsible local authority retains supervision and asks the team to coordinate its purpose and safeguards first.'],
    relationshipDelta: -8,
    scoreChanges: [{ dimension: 'professionalism', delta: -18 }, { dimension: 'coordination', delta: -15 }],
    coaching: ['Interaction with protected or vulnerable people requires mission relevance, permission from the responsible authority, appropriate supervision, and local safeguarding awareness.']
  });
}

export function unsafeFacilityPolicy(record) {
  const text = record.rawText.toLowerCase();
  const manipulation = /\b(?:hit|smash|break|play(?:ing)?\s+with|touch|pull|cut|open|climb|enter)\b.{0,60}\b(?:wire|wires|electrical|light\s*bulb|tank|valve|machinery|equipment|controls?|panel|transformer|dam)\b|\b(?:wire|wires|electrical|tank|valve|machinery|equipment|controls?|panel|transformer)\b.{0,50}\b(?:hit|smash|break|play|touch|pull|cut|open|climb)\b/.test(text);
  const authorized = /\b(?:authorized|permission|approved|escorted|operator directs|supervisor directs|lockout|tagout|qualified technician)\b/.test(text);
  if (!manipulation || authorized) return [];
  return finding(record, {
    id: 'unsafe-facility-interference', severity: 'serious', rejected: true,
    effects: ['Facility personnel stop the action and move the team away from operational equipment. The visit shifts from assessment to safety and access-control concerns.'],
    relationshipDelta: -10,
    scoreChanges: [{ dimension: 'professionalism', delta: -20 }, { dimension: 'missionFocus', delta: -15 }],
    coaching: ['Observe, ask, document, and coordinate qualified inspection. Do not manipulate host-nation equipment without authority, technical qualification, and facility safety controls.']
  });
}

export function improperPromisePolicy(record) {
  const text = record.rawText.toLowerCase();
  const promise = /\b(?:i|we|the team|the army|america|americans)\s+(?:promise|guarantee|will\s+(?:buy|build|bring|deliver|fix|fund|replace|provide|pay)|can\s+definitely)\b/.test(text);
  if (!promise) return [];
  return finding(record, {
    id: 'unauthorized-commitment', severity: 'serious', rejected: true,
    effects: ['The statement creates an expectation the team is not authorized or resourced to fulfill. The commitment is reported to command and must be corrected with the stakeholder before it hardens into a perceived obligation.'],
    relationshipDelta: -8,
    scoreChanges: [{ dimension: 'professionalism', delta: -18 }, { dimension: 'coordination', delta: -12 }],
    persistentConditions: [{ id: 'unresolved-unauthorized-promise', status: 'active', sourceAction: record.id }],
    coaching: ['Never promise assistance or support. Acknowledge the concern, collect requirements, explain limits, route the request, and follow up without creating a commitment.']
  });
}

export function constructiveEngagementPolicy(record) {
  const text = record.rawText.toLowerCase();
  const introduction = /\b(?:introduce|introduction|greet|greeting|explain\s+(?:our|the)\s+(?:purpose|mission)|thank)\w*\b/.test(text);
  const inquiry = /\b(?:ask|listen|concern|input|perspective|priority|need|question)\w*\b/.test(text);
  const respect = /\b(?:respect|cultural|protocol|appropriate|permission|consent)\w*\b/.test(text);
  if (!(introduction && (inquiry || respect))) return [];
  return finding(record, {
    id: 'constructive-engagement-opening', severity: 'none', rejected: false,
    effects: ['The stakeholder understands why the team is present and remains engaged. The professional opening creates access for a focused question, but it does not by itself confirm any civil information.'],
    relationshipDelta: 4,
    scoreChanges: [{ dimension: 'rapport', delta: 8 }, { dimension: 'professionalism', delta: 5 }],
    coaching: ['Use the access you earned to ask a mission-focused question, identify the source of the answer, and determine what would confirm or contradict it.']
  });
}

export const FOUNDATION_POLICIES = [
  seriousMisconductPolicy,
  intoxicationAndDrugPolicy,
  protectedPopulationPolicy,
  unsafeFacilityPolicy,
  interpreterControlPolicy,
  improperPromisePolicy,
  constructiveEngagementPolicy
];

