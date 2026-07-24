const CATEGORY_RULES = [
  {
    id: 'destructive-misconduct',
    label: 'Destruction, violence, or reckless endangerment',
    pattern: /\b(set|start|light|torch)(?:s|ting)?\s+(?:a\s+)?fire\b|\barson\b|\bburn(?:ed|ing)?\s+(?:a\s+|the\s+)?(?:vehicle|building|property)\b|\b(?:destroy|vandaliz|attack|assault|shoot|kill)(?:s|ed|ing)?\b/i
  },
  {
    id: 'false-accusation',
    label: 'False accusation or scapegoating',
    pattern: /\b(?:frame|falsely accuse)(?:s|d|ing)?\b|\bblam(?:e|ed|ing)\b[\s\S]{0,80}\b(?:civilian|local|interpreter|stakeholder|resident|host nation)\b/i
  },
  {
    id: 'funds-and-intoxication',
    label: 'Misuse of funds or mission-compromising intoxication',
    pattern: /\bslush fund\b|\b(?:funds?|money)\b[\s\S]{0,80}\b(?:party|alcohol|beer|liquor|get everyone drunk)\b|\bget(?:s|ting)?\s+(?:everyone|the locals|stakeholders)\s+drunk\b|\bintoxicat(?:e|ed|ing|ion)\b/i
  },
  {
    id: 'corruption-or-coercion',
    label: 'Corruption, theft, coercion, or intimidation',
    pattern: /\b(?:steal|stole|embezzl|misappropriat|brib|extort|coerc|intimidat|threaten)(?:e|es|ed|ing|ion)?\b/i
  },
  {
    id: 'mission-abandonment',
    label: 'Deliberate abandonment of the mission or assigned engagement',
    pattern: /\b(?:abandon|ditch|blow off|walk away from|leave)\s+(?:the\s+)?(?:mission|task|assignment|engagement|stakeholders?)\b|\bignore\s+(?:everyone|the\s+(?:team|stakeholders?|mission|task|assignment))\b[\s\S]{0,100}\b(?:go|head|leave|depart)\b|\b(?:go|head|leave|depart)(?:s|ed|ing)?\s+(?:to|for)\s+(?:the\s+)?(?:strip club|bar|casino|party|personal entertainment)\b/i
  }
];

const REMEDIATION_PATTERN = /\b(?:report(?:ed|ing)?\s+(?:my|the|this)\s+(?:conduct|incident|action)|confess|accept responsibility|take responsibility|apologiz|make restitution|cooperate with (?:the )?investigation|notify (?:the )?(?:chain of command|commander|cmoc)|correct the record)\b/i;

export function extractTraineeAction(prompt = '') {
  const action = prompt.match(/TRAINEE'S ACTION: "([\s\S]*?)"\s*\n\nEvaluate/i);
  return action?.[1]?.trim() || '';
}

export function detectMisconduct(prompt = '', scenario = {}) {
  const action = extractTraineeAction(prompt);
  if (!action) return null;
  const matched = CATEGORY_RULES.filter(rule => rule.pattern.test(action));
  if (!matched.length) return null;

  const stakeholders = (scenario.keyStakeholders || []).slice(0, 2);
  const abandonmentOnly = matched.every(rule => rule.id === 'mission-abandonment');
  const relationshipShifts = abandonmentOnly
    ? {
        'Ahmad (Interpreter)': -8,
        'SSG Davis (CMOC)': -15,
        ...Object.fromEntries(stakeholders.map(name => [name, -10]))
      }
    : {
        'Ahmad (Interpreter)': -35,
        'SSG Davis (CMOC)': -40,
        ...Object.fromEntries(stakeholders.map(name => [name, -25]))
      };
  const narrative = abandonmentOnly
    ? `The team turns away from the assigned engagement for personal activity unrelated to the mission. ${stakeholders[0] || 'The waiting stakeholders'} sees the team leave without explanation, reducing confidence that future commitments will be honored. The missed engagement and failure to remain mission-focused are reported to CMOC, while the interpreter can no longer facilitate the meeting because the team has departed.`
    : 'The action causes an immediate breakdown in trust and mission legitimacy. The interpreter steps away from the team, unwilling to be associated with the conduct and concerned that continued participation could create personal risk. Local stakeholders withdraw cooperation, while CMOC and the chain of command halt normal engagement activity so the incident, resulting harm, and required accountability can be addressed.';
  const persistentEffects = abandonmentOnly
    ? [
        'The scheduled engagement was missed or disrupted.',
        'Local stakeholders are less confident that the team will honor commitments.',
        'CMOC requires an explanation and renewed mission focus.',
        'Information and relationship opportunities at this location were lost.'
      ]
    : [
        'Interpreter support is unavailable because of safety, trust, and association concerns.',
        'Local stakeholders are reluctant to engage or share information.',
        'CMOC and the chain of command require accountability and incident reporting.',
        'Civilian harm, property damage, or false reporting must be addressed as applicable.'
      ];

  return {
    id: `MISCONDUCT-${matched.map(rule => rule.id).join('-')}`,
    severity: matched.length >= 2 || matched.some(rule => rule.id === 'destructive-misconduct') ? 'critical' : 'serious',
    title: abandonmentOnly ? 'Deliberate mission abandonment' : 'Mission-compromising misconduct',
    categories: matched.map(rule => rule.label),
    relationshipShifts,
    narrative,
    persistentEffects,
    routingRationale: abandonmentOnly
      ? 'Notify CMOC of the missed engagement, document lost access and information requirements, and re-establish mission priorities before resuming activity.'
      : 'Immediately notify the chain of command and appropriate authorities; preserve facts, address safety and harm, correct false reporting, and do not continue routine engagement as though the incident did not occur.',
    status: 'active',
    sourceAction: action
  };
}

export function isRemedialAction(prompt = '') {
  const action = extractTraineeAction(prompt);
  return Boolean(action && REMEDIATION_PATTERN.test(action));
}

export function mergeConsequences(existing = [], detected, remedial = false) {
  let updated = existing.map(item => remedial && item.status === 'active'
    ? { ...item, status: 'mitigating', mitigationNote: 'The trainee began accountability and corrective action; consequences remain part of the mission record.' }
    : item);
  if (detected && !updated.some(item => item.id === detected.id)) updated = [...updated, detected];
  return updated;
}

export function applyConsequenceRules(result = {}, prompt = '', scenario = {}, existing = []) {
  const detected = detectMisconduct(prompt, scenario);
  const remedial = !detected && existing.length > 0 && isRemedialAction(prompt);
  const consequences = mergeConsequences(existing, detected, remedial);

  if (detected) {
    return {
      consequences,
      detected,
      result: {
        ...result,
        narrativeOutcome: detected.narrative,
        qualityScore: 0,
        assessmentType: 'OTHER',
        performanceMeasures: 0,
        relationshipShifts: detected.relationshipShifts,
        annexCitation: 'none',
        routingRationale: detected.routingRationale,
        product: null,
        feedbackTone: 'direct',
        progress: {
          discoveries: ['Trust and mission legitimacy have been severely damaged by the team action.'],
          informationGaps: ['Command disposition and investigative findings', 'Extent of civilian and property harm', 'Requirements for correction, restitution, and renewed access'],
          leads: [],
          completedProducts: [],
          dimensionScores: {
            rapport: 0,
            informationCollection: 0,
            validation: 0,
            productQuality: 0,
            coordination: 0,
            initiative: 0,
            missionFocus: 0
          }
        }
      }
    };
  }

  if (!existing.length) return { consequences, detected: null, result };

  const active = consequences.some(item => item.status === 'active');
  const prefix = remedial
    ? 'You begin the required accountability process by reporting the incident and accepting responsibility. This is necessary corrective action, but it does not erase the harm or immediately restore trust.'
    : active
      ? 'The earlier misconduct continues to shape the mission. Interpreter support remains unavailable, CMOC oversight is elevated, and local stakeholders approach the team cautiously.'
      : 'Corrective action is underway, but the earlier incident remains part of the mission record and stakeholder trust is still damaged.';
  const positiveRelationshipCap = remedial ? 2 : active ? 0 : 1;
  const relationshipShifts = Object.fromEntries(
    Object.entries(result.relationshipShifts || {}).map(([name, value]) => [name, Math.min(positiveRelationshipCap, Number(value) || 0)])
  );
  const qualityScore = result.product
    ? result.qualityScore
    : Math.max(0, (Number(result.qualityScore) || 0) - (active ? 10 : 5));

  return {
    consequences,
    detected: null,
    result: {
      ...result,
      narrativeOutcome: `${prefix}\n\n${result.narrativeOutcome || ''}`.trim(),
      qualityScore,
      relationshipShifts
    }
  };
}

export function consequenceSummary(consequences = []) {
  return consequences.flatMap(item => [
    `${item.title} (${item.status})`,
    ...item.persistentEffects.map(effect => `- ${effect}`)
  ]).join('\n');
}
