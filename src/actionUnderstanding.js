export function normalizeInterpretation(value = {}, source = 'semantic') {
  const list = item => Array.isArray(item) ? item.filter(Boolean).map(String) : [];
  const allowed = (item, values, fallback) => values.includes(item) ? item : fallback;
  return {
    intent: String(value.intent || 'Unclear intent'), actions: list(value.actions), affectedPeople: list(value.affectedPeople),
    missionRelevance: allowed(value.missionRelevance, ['high', 'medium', 'low', 'none'], 'low'),
    permission: allowed(value.permission, ['established', 'missing', 'unclear', 'not-required'], 'unclear'),
    authority: allowed(value.authority, ['established', 'missing', 'unclear', 'not-required'], 'unclear'),
    protectedPopulation: allowed(value.protectedPopulation, ['none', 'children', 'patients', 'displaced', 'detainees', 'survivors', 'disabled', 'other'], 'none'),
    interpreterRole: allowed(value.interpreterRole, ['none', 'supporting', 'substituting', 'unclear'], 'none'),
    professionalRisk: allowed(value.professionalRisk, ['none', 'low', 'moderate', 'high', 'critical'], 'moderate'),
    culturalRisk: allowed(value.culturalRisk, ['none', 'low', 'moderate', 'high', 'unclear'], 'unclear'),
    attemptedOutcome: String(value.attemptedOutcome || 'The intended outcome is not explicit.'),
    likelyImmediateEffect: String(value.likelyImmediateEffect || 'The response cannot be determined confidently.'),
    ambiguities: list(value.ambiguities), confidence: Math.max(0, Math.min(100, Number(value.confidence) || 0)), source
  };
}

export function fallbackInterpretation(action = '', scenario = {}) {
  const text = String(action).trim();
  const site = `${scenario.location || ''} ${scenario.siteType || ''} ${scenario.name || ''}`;
  const children = /\b(?:child|children|student|students|kid|kids|classroom|schoolyard|school yard)\b/i.test(text) || /school/i.test(site);
  const permission = /\b(?:permission|approved|approval|consent|authorized|administrator invited|teacher invited|asked the administrator|coordinated with)\b/i.test(text);
  const performance = /\b(?:rap|rapping|freestyle|dance|dancing|perform|music|sing|concert|show)\w*\b/i.test(text);
  const intrusion = /\b(?:roll|walk|go|enter|burst|barge|march)\w*\s+(?:into|in)\b/i.test(text);
  const interpreter = /\b(?:interpreter|translator)\b/i.test(text);
  const substitution = interpreter && /\b(?:tell|ask|have|send|leave)\w*\b[\s\S]{0,45}\b(?:interpreter|translator)\b[\s\S]{0,60}\b(?:talk|lead|handle|conduct|introduc)\w*\b/i.test(text);
  const actions = [];
  if (intrusion) actions.push('Entered an occupied space without stating coordination');
  if (performance) actions.push('Initiated an unsolicited performance or entertainment activity');
  if (substitution) actions.push('Assigned the interpreter to lead an engagement');
  if (!actions.length) actions.push('Submitted an action the fallback could not reliably decompose');
  const concern = (children && performance && !permission) || substitution;
  return normalizeInterpretation({
    intent: performance ? 'Attempt to attract attention or build rapport through entertainment' : 'Intent could not be established confidently',
    actions, affectedPeople: children ? ['students or children', 'responsible school staff'] : (scenario.keyStakeholders || []).slice(0, 2),
    missionRelevance: performance ? 'low' : 'medium', permission: permission ? 'established' : (performance || intrusion ? 'missing' : 'unclear'),
    authority: 'unclear', protectedPopulation: children ? 'children' : 'none', interpreterRole: substitution ? 'substituting' : (interpreter ? 'supporting' : 'none'),
    professionalRisk: concern ? 'high' : 'moderate', culturalRisk: performance ? 'unclear' : 'low',
    attemptedOutcome: performance ? 'Impress or entertain the people present' : 'Not explicit',
    likelyImmediateEffect: concern ? 'A teammate or local official is likely to pause the action until purpose, permission, supervision, and mission relevance are established.' : 'More context is required before assigning a consequence.',
    ambiguities: ['The offline fallback cannot reliably infer tone, invitation, prior coordination, or local expectations.'], confidence: concern ? 72 : 35
  }, 'fallback');
}

export async function understandAction(action, scenario = {}, history = []) {
  try {
    const response = await fetch('https://hip-pocket-api.onrender.com/api/interpret', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, scenario, history: history.slice(-6) }) });
    const body = await response.json();
    if (!response.ok || !body.interpretation) throw new Error(body.error || 'Semantic interpreter unavailable');
    return normalizeInterpretation(body.interpretation, body.provider || 'semantic');
  } catch (error) {
    console.warn('Semantic interpretation unavailable; using conservative fallback.', error);
    return fallbackInterpretation(action, scenario);
  }
}
