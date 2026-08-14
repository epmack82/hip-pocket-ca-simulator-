const RAPPORT_PATTERN = /\b(?:greet|introduc|explain (?:my|our) (?:role|purpose)|build rapport|listen|ask permission|thank|respect|interpreter)\b/i;
const ASSESSMENT_PATTERN = /\b(?:assess|inspect|survey|reconnaissance|evaluate|document|write|report)\b/i;
const INQUIRY_PATTERN = /\b(?:ask|question|interview|concern|input|perspective|priority|tell me|tell us|what|why|how)\b/i;
const VALIDATION_PATTERN = /\b(?:validat|confirm|corroborat|verify|compare|record|ledger|second source|observe|photo|inventory)\b/i;
const COORDINATION_PATTERN = /\b(?:coordinat|contact|refer|connect|municipal|government|ngo|partner|authority)\b/i;

function firstRapportContinuity(text, scenario, stakeholder) {
  const location = scenario.location || 'the site';
  const interpreter = /\b(?:interpreter|translator|interpretation|translated|language)\b/i.test(text);
  const gift = /\b(?:gift|token|souvenir|present)\b/i.test(text);
  const sincerity = /\b(?:sincere|genuine|respect|warm|humble|grateful|gratitude|thank)\b/i.test(text);
  const secondary = scenario.keyStakeholders?.[1];
  const opening = interpreter
    ? `The interpreter takes a moment to shape the team's greeting for the setting rather than translating it word for word. ${stakeholder} listens, studies the team's manner, and answers with noticeably less formality.`
    : `${stakeholder} returns the team's greeting and pauses long enough to hear the purpose of the visit.`;
  const giftBeat = gift
    ? ` The offered gift creates a brief protocol check: its meaning is explained, and the team avoids presenting it as payment, leverage, or a promise. The respectful handling of the moment—not the object itself—helps preserve the opening.`
    : '';
  const humanBeat = sincerity
    ? ` The sincerity of the exchange changes the atmosphere at ${location}; nearby conversation settles as attention shifts toward the team.`
    : ` The professional introduction establishes access, although trust still has to be earned.`;
  const secondaryBeat = secondary
    ? ` The ${secondary} remains nearby and observant, but has not yet been brought into the conversation.`
    : '';
  return `${opening}${giftBeat}${humanBeat} ${stakeholder} is now prepared to discuss the local problem, but first asks what the team most needs to understand.${secondaryBeat}`;
}

function firstStakeholder(scenario = {}) {
  const stakeholder = scenario.keyStakeholders?.[0] || 'The primary stakeholder';
  return stakeholder.charAt(0).toUpperCase() + stakeholder.slice(1);
}

function dialogueStakeholder(text = '', scenario = {}) {
  const stakeholders = scenario.keyStakeholders || [];
  const actionWords = String(text).toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(Boolean);
  const scored = stakeholders.map((name, index) => {
    const titleWords = String(name).toLowerCase().split(/\s+/).filter(word => word.length >= 4);
    const score = titleWords.reduce((total, titleWord) => {
      if (actionWords.includes(titleWord)) return total + 3;
      const near = actionWords.some(word => word.length >= 6 &&
        (word.startsWith(titleWord.slice(0, Math.max(4, titleWord.length - 2))) || titleWord.startsWith(word.slice(0, Math.max(4, word.length - 2))))
      );
      return total + (near ? 2 : 0);
    }, 0);
    return { name, index, score };
  }).sort((a, b) => b.score - a.score || a.index - b.index);
  const selected = scored[0]?.score > 0 ? scored[0].name : stakeholders[0];
  return selected ? selected.charAt(0).toUpperCase() + selected.slice(1) : firstStakeholder(scenario);
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
  const stakeholder = dialogueStakeholder(text, scenario);
  const productName = result.product?.name || '';
  const actionNumber = (previousState.actions || []).length + 1;
  const priorDiscovery = (previousState.discoveries || []).slice(-1)[0];
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
    continuityNarrative = firstRapportContinuity(text, scenario, stakeholder);
  } else if (result.product) {
    continuityNarrative = `${stakeholder} sees the team convert the engagement into a ${productName || 'training product'}. Because earlier activity established some context, the document supports continuity; however, unanswered questions still require direct follow-up rather than additional paperwork alone.`;
  } else if (RAPPORT_PATTERN.test(text)) {
    continuityNarrative = `${stakeholder} becomes more comfortable with the team's presence and offers additional context. The conversation is progressing, but the team must now test important claims and connect them to the mission rather than relying on rapport alone.`;
  } else if (VALIDATION_PATTERN.test(text)) {
    continuityNarrative = priorDiscovery
      ? `${stakeholder} sees the team return to the earlier information—"${priorDiscovery}"—and attempt to test it rather than merely repeat it. The discussion now centers on whether the new source agrees, contradicts, or narrows that account.`
      : `${stakeholder} understands that the team wants to validate information, but asks which exact claim is being tested. The scene advances only when the team names the account and the independent source, record, or observation it will use.`;
  } else if (ASSESSMENT_PATTERN.test(text)) {
    continuityNarrative = `${stakeholder} watches the team move from conversation into observable assessment activity. This is no longer the arrival scene: action ${actionNumber} has added site-level information, and the stakeholder now expects the team to explain what it observed, what remains uncertain, and who needs the finding.`;
  } else if (INQUIRY_PATTERN.test(text)) {
    const newDiscovery = (result.progress?.discoveries || []).slice(-1)[0];
    continuityNarrative = newDiscovery
      ? `${stakeholder} answers the team's latest question and places a new account into the conversation: "${newDiscovery}" The engagement has advanced from introductions to information collection; the team must decide what to record, what to challenge, and what source to approach next.`
      : `${stakeholder} remains in the conversation after the team's latest question. Action ${actionNumber} has shifted the scene into information collection, but the team must ask for a specific fact, source, timeline, responsible party, or affected population to produce a usable lead.`;
  } else if (COORDINATION_PATTERN.test(text)) {
    continuityNarrative = `${stakeholder} begins explaining the local coordination pathway in response to action ${actionNumber}. The team now has an authority claim to verify and must decide who should be contacted, what can be shared, and what commitment—if any—is actually authorized.`;
  } else {
    continuityNarrative = `${stakeholder} pauses after the team chooses "${text.length > 100 ? `${text.slice(0, 97)}...` : text}". Because the purpose and expected result are unclear, no new fact or access is gained from action ${actionNumber}. The stakeholder asks a direct question: what does the team need to learn or accomplish next?`;
  }

  if (result.administrativeNote && !continuityNarrative.includes('CMOC ADMINISTRATIVE NOTE')) {
    continuityNarrative = `${continuityNarrative}${result.administrativeNote}`;
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
