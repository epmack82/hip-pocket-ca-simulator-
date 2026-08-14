import { createTeamRoster } from './teamNarrative.js';

function extractAction(prompt = '') {
  const match = String(prompt).match(/TRAINEE'S ACTION: "([\s\S]*?)"\s*\n\nEvaluate/i);
  return (match?.[1] || prompt || '').trim();
}

function stakeholderName(scenario = {}) {
  return scenario.keyStakeholders?.[0] || 'The local point of contact';
}

function sentenceName(value = '') {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function permissionIsStated(text) {
  return /\b(?:ask(?:ed|ing)?|request(?:ed|ing)?|receive(?:d)?|obtain(?:ed|ing)?|with|given|grant(?:ed)?)\b[\s\S]{0,55}\b(?:permission|approval|consent|authorization|administrator|teacher|guardian|parent|supervision)\b|\b(?:administrator|teacher|guardian|parent)\b[\s\S]{0,40}\b(?:agree(?:d)?|approve(?:d)?|permit(?:ted)?|invite(?:d)?|authorize(?:d)?)\b/i.test(text);
}

function interpreterSubstitution(text) {
  return /\b(?:tell|ask|have|send|direct)(?:s|ing|ed)?\s+(?:my|our|the)\s+(?:interpreter|translator)\b[\s\S]{0,80}\b(?:talk|speak|meet|brief|introduc|conduct|handle|engage|question)\b[\s\S]{0,100}\bwhile\s+(?:i|we)\b/i.test(text)
    || /\b(?:interpreter|translator)\b[\s\S]{0,55}\b(?:handle|conduct|lead|do)\b[\s\S]{0,45}\b(?:introduction|meeting|engagement|kle|interview)\b/i.test(text);
}

function interpreterSupport(text) {
  return /\b(?:use|using|leverage|leveraging|work with|through)\b[\s\S]{0,35}\b(?:interpreter|translator)\b[\s\S]{0,70}\b(?:translate|interpret|phrasing|language|cultural|introduc|explain|ask)\b/i.test(text);
}

function protectedContact(text, scenario = {}) {
  const schoolContext = /school|education|student/i.test(`${scenario.location || ''} ${scenario.siteType || ''} ${scenario.name || ''}`);
  const population = /\b(?:child|children|student|students|kid|kids|minor|minors|youth|patient|patients|injured|survivor|survivors|refugee|refugees|detainee|detainees|disabled|displaced)\b/i.test(text);
  const interaction = /\b(?:play|join|photograph|film|record|touch|hug|lift|carry|give|hand|distribute|interview|question|take|escort|enter|approach|talk|speak)\w*\b/i.test(text);
  return interaction && (population || (schoolContext && /\b(?:yard|playground|classroom|soccer|football|game)\b/i.test(text)));
}

function abandonedPrimaryEngagement(text) {
  return /\bwhile\s+(?:i|we)\s+(?:go|leave|head|play|walk|wander|depart|hang out)\b|\b(?:leave|send)\s+(?:my|our|the)\s+(?:interpreter|translator)\b[\s\S]{0,50}\b(?:alone|to handle|to conduct|to talk|to speak)\b/i.test(text);
}

function teamResponder(seed, playerRole, names, severity) {
  const roster = createTeamRoster(seed || 'HIP', playerRole, names || {});
  const preferred = severity === 'serious' ? ['chief', 'sgt', 'canco', 'specialist'] : ['sgt', 'chief', 'canco', 'specialist'];
  return preferred.map(key => roster.find(member => member.key === key && !member.isPlayer)).find(Boolean)
    || roster.find(member => !member.isPlayer);
}

export function adjudicateAction(prompt = '', scenario = {}, context = {}) {
  const action = extractAction(prompt);
  if (!action) return null;

  const substitution = interpreterSubstitution(action);
  const appropriateInterpreterUse = interpreterSupport(action) && !substitution;
  const protectedInteraction = protectedContact(action, scenario);
  const permission = permissionIsStated(action);
  const abandonment = substitution && abandonedPrimaryEngagement(action);
  const issues = [];

  if (substitution) issues.push({ id: 'interpreter-substitution', severity: abandonment ? 'serious' : 'questionable' });
  if (abandonment) issues.push({ id: 'engagement-abandonment', severity: 'serious' });
  if (protectedInteraction && !permission) issues.push({ id: 'protected-contact-without-permission', severity: 'serious' });
  const interpreted = context.interpretation;
  const semanticProtectedConcern = interpreted
    && interpreted.protectedPopulation !== 'none'
    && interpreted.permission === 'missing'
    && ['high', 'critical'].includes(interpreted.professionalRisk)
    && interpreted.confidence >= 65;
  const semanticProfessionalConcern = interpreted
    && ['high', 'critical'].includes(interpreted.professionalRisk)
    && interpreted.missionRelevance === 'none'
    && interpreted.confidence >= 75;
  if (semanticProtectedConcern && !issues.some(issue => issue.id === 'protected-contact-without-permission')) {
    issues.push({ id: 'protected-contact-without-permission', severity: 'serious' });
  }
  if (semanticProfessionalConcern && !issues.length) {
    issues.push({ id: 'contextual-professional-risk', severity: 'serious' });
  }
  if (!issues.length) return appropriateInterpreterUse ? { classification: 'appropriate', issues: [], action } : null;

  const severity = issues.some(issue => issue.severity === 'serious') ? 'serious' : 'questionable';
  const teammate = teamResponder(context.seed, context.playerRole, context.teamNames, severity);
  const teammateLabel = teammate?.display || 'The team sergeant';
  const stakeholder = stakeholderName(scenario);
  const place = scenario.location || scenario.siteType || 'the site';
  const childIssue = issues.some(issue => issue.id === 'protected-contact-without-permission');
  const interpretedActions = interpreted?.actions?.length ? interpreted.actions.join('; ').toLowerCase() : '';

  const opening = childIssue
    ? `${teammateLabel} intervenes before the uncoordinated activity goes any further. The system understood the attempted action as ${interpretedActions || 'direct interaction with a protected population'}, but the team has not established permission from the school or responsible adult. ${sentenceName(stakeholder)} notices the disruption and waits for the team to regain control of its visit.`
    : `${teammateLabel} steps in when the interpreter is left to conduct the official engagement. The interpreter can carry language and cultural meaning, but cannot replace the Soldier as the relationship owner, decision-maker, or accountable representative.`;
  const localReaction = childIssue
    ? `The activity at ${place} pauses rather than being treated as successful rapport. Staff keep the students under supervision while the teammate redirects the Soldier to the host, acknowledges the interruption, and asks whether a later, mission-relevant cultural or recreational exchange would be appropriate.`
    : `${sentenceName(stakeholder)} waits for the Soldier to return, state the team's purpose, and personally lead the discussion. The interpreter remains available to facilitate, but the missed opening has created uncertainty about who is responsible for the visit.`;
  const coaching = childIssue
    ? 'Protected-population coaching: rapport with children can be appropriate when it supports the mission, but coordinate with the responsible authority first, remain with the official engagement, use the interpreter as support, and follow local safeguarding and supervision expectations.'
    : 'Interpreter coaching: lead the engagement yourself. Brief the interpreter, speak through them in short segments, watch both the stakeholder and the interpretation, confirm meaning, and retain responsibility for every question, statement, and commitment.';

  return {
    classification: severity,
    issues,
    action,
    outcome: 'interrupted-and-redirected',
    teammate: teammate ? { key: teammate.key, display: teammate.display } : null,
    narrative: `${opening} ${localReaction}`,
    coaching,
    relationshipShifts: Object.fromEntries([
      [stakeholder, childIssue ? -5 : -3],
      ['Interpreter Support', abandonment ? -4 : -2],
      [teammateLabel, abandonment ? -3 : -1]
    ]),
    scoreCap: childIssue ? 35 : 50,
    discovery: childIssue
      ? 'A teammate interrupted an uncoordinated interaction with a protected population and returned responsibility to the official host engagement.'
      : 'A teammate corrected an attempt to make the interpreter responsible for leading the official engagement.',
    gaps: childIssue
      ? ['Permission and safeguarding conditions for any interaction with children', 'Direct Soldier-led engagement with the school representative']
      : ['Clear Soldier ownership of the engagement', 'Interpreter brief, translation checks, and confirmation of meaning']
  };
}

export function applyActionAdjudication(result = {}, prompt = '', scenario = {}, context = {}) {
  // Preserve any stronger consequence already assigned for violence, destruction,
  // intoxication, coercion, or other mission-ending misconduct.
  if (result.missionTerminated || (result.feedbackTone === 'direct' && Number(result.qualityScore) < 0)) {
    return { result, adjudication: null };
  }
  const adjudication = adjudicateAction(prompt, scenario, context);
  if (!adjudication || adjudication.classification === 'appropriate') return { result, adjudication };
  const shifts = { ...(result.relationshipShifts || {}) };
  Object.entries(adjudication.relationshipShifts).forEach(([name, value]) => {
    shifts[name] = Math.min(Number(shifts[name]) || 0, value);
  });
  return {
    adjudication,
    result: {
      ...result,
      narrativeOutcome: adjudication.narrative,
      coachingInsight: adjudication.coaching,
      actionAdjudication: adjudication,
      qualityScore: Math.min(Number(result.qualityScore) || 0, adjudication.scoreCap),
      performanceMeasures: 0,
      relationshipShifts: shifts,
      feedbackTone: 'direct',
      product: null,
      progress: {
        ...(result.progress || {}),
        discoveries: [adjudication.discovery],
        informationGaps: adjudication.gaps,
        leads: [],
        completedProducts: [],
        dimensionScores: {
          ...(result.progress?.dimensionScores || {}),
          rapport: 0,
          coordination: 0,
          missionFocus: 0
        }
      }
    }
  };
}
