const RAPPORT_PATTERN = /\b(?:greet|introduc|explain (?:my|our) (?:role|purpose)|build rapport|listen|ask permission|thank|respect|interpreter)\b/i;
const ASSESSMENT_PATTERN = /\b(?:assess|inspect|survey|reconnaissance|evaluate|document|write|report)\b/i;

function firstStakeholder(scenario = {}) {
  return scenario.keyStakeholders?.[0] || 'The primary stakeholder';
}

function actionText(summaryLabel = '') {
  const match = summaryLabel.match(/^Action:\s*"([\s\S]*)"$/i);
  return match?.[1] || summaryLabel;
}

function relationshipPenalty(scenario, amount) {
  return Object.fromEntries((scenario.keyStakeholders || []).slice(0, 2).map(name => [name, amount]));
}

export function applyActionOrderRules(result = {}, previousState = {}, summaryLabel = '', scenario = {}) {
  const isFirstAction = !(previousState.actions || []).length;
  const text = actionText(summaryLabel);
  const stakeholder = firstStakeholder(scenario);
  const productName = result.product?.name || '';
  let continuityNarrative = result.narrativeOutcome || scenario.narrative || '';
  let sequencingDeltas = {};
  let sequencingNote = '';

  if (result.qualityScore === 0 && /misconduct|trust|command review/i.test(result.narrativeOutcome || '')) {
    continuityNarrative = `${stakeholder} steps away as word of the incident spreads. The conversation at this location stops being a routine engagement; attention shifts to safety, accountability, and command review.`;
  } else if (isFirstAction && result.product && /post-kle|kle record/i.test(productName)) {
    continuityNarrative = `${stakeholder} watches you begin a post-engagement report before an engagement has actually occurred. With no introduction, stated purpose, or conversation to anchor the document, the stakeholder excuses themselves and becomes less willing to invest time in the team.`;
    sequencingDeltas = relationshipPenalty(scenario, -5);
    sequencingNote = 'A Post-KLE report cannot substitute for conducting the engagement it is meant to record.';
  } else if (isFirstAction && result.product && /site assessment|facility assessment|infrastructure assessment/i.test(productName)) {
    continuityNarrative = `${stakeholder} initially waits for you to explain who you are and why you came. As you turn immediately to the assessment worksheet without first establishing rapport or permission, the stakeholder returns to other duties; access remains possible, but the team has made a poor first impression and lost an opportunity for guided context.`;
    sequencingDeltas = relationshipPenalty(scenario, -4);
    sequencingNote = 'The worksheet captures structure, but the sequence weakened access and stakeholder cooperation.';
  } else if (isFirstAction && result.product) {
    continuityNarrative = `${stakeholder} sees the team begin producing ${productName || 'a report'} before conducting a meaningful introduction or exchange. The stakeholder does not leave entirely, but attention and willingness to assist begin to fade while the team focuses inward on paperwork.`;
    sequencingDeltas = relationshipPenalty(scenario, -2);
    sequencingNote = 'Product development should be grounded in engagement, observation, and validated information.';
  } else if (isFirstAction && ASSESSMENT_PATTERN.test(text) && !RAPPORT_PATTERN.test(text)) {
    continuityNarrative = `${stakeholder} expected an introduction and an explanation of the visit. When the team begins inspecting and documenting the site without first establishing purpose or permission, the stakeholder becomes guarded and limits the context offered, leaving the assessment technically started but socially weakened.`;
    sequencingDeltas = relationshipPenalty(scenario, -3);
    sequencingNote = 'Beginning assessment activity without rapport or permission reduced stakeholder openness.';
  } else if (isFirstAction && RAPPORT_PATTERN.test(text)) {
    continuityNarrative = `${stakeholder} responds to the team's introduction and remains engaged. The reason for the visit is now understood, creating space for more specific questions, observation, and validation without making the interaction feel extractive.`;
  } else if (result.product) {
    continuityNarrative = `${stakeholder} sees the team convert the engagement into a ${productName || 'training product'}. Because earlier activity established some context, the document supports continuity; however, unanswered questions still require direct follow-up rather than additional paperwork alone.`;
  } else if (RAPPORT_PATTERN.test(text)) {
    continuityNarrative = `${stakeholder} becomes more comfortable with the team's presence and offers additional context. The conversation is progressing, but the team must now test important claims and connect them to the mission rather than relying on rapport alone.`;
  } else if (ASSESSMENT_PATTERN.test(text)) {
    continuityNarrative = `${stakeholder} allows the assessment to continue but watches how the team uses the information already provided. The site picture is becoming clearer, while unresolved questions about authority, impact, and validation remain open.`;
  } else {
    continuityNarrative = `${stakeholder} reacts to the team's latest decision and adjusts their willingness to participate. The engagement remains open, but what happens next will depend on whether the team explains its purpose, listens, validates claims, and follows through.`;
  }

  const relationshipShifts = { ...(result.relationshipShifts || {}) };
  Object.entries(sequencingDeltas).forEach(([name, amount]) => {
    relationshipShifts[name] = Math.min(Number(relationshipShifts[name]) || 0, amount);
  });

  return {
    ...result,
    relationshipShifts,
    sequencingNote,
    continuityNarrative
  };
}

export function currentContinuityNarrative(state = {}, scenario = {}) {
  return state.continuityNarrative || scenario.narrative || '';
}
