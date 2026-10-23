function traineeAction(prompt = '') {
  return prompt.match(/TRAINEE'S ACTION: "([\s\S]*?)"\s*\n\nEvaluate/i)?.[1] || prompt;
}

const ACCURACY_VALIDATION = /\b(?:short(?:er)? (?:sentence|statement|phrase)|plain language|one (?:question|point) at a time|repeat back|back[- ]translat|confirm (?:what|meaning|understanding)|check understanding|clarif|verify|validate|second (?:interpreter|translator|source)|independent (?:speaker|source|translation)|observe (?:reaction|body language|nonverbal)|ask (?:the )?stakeholder (?:to )?(?:repeat|confirm))\b/i;
const ACCURACY_BLAME = /\b(?:translator|interpreter)\b[\s\S]{0,55}\b(?:lying|spy|traitor|enemy|working against|detain|arrest|fire him|threaten)\b/i;
const OPSEC_DISCLOSURE = /\b(?:tell|send|share|give|provide)\b[\s\S]{0,55}\b(?:whereabouts|location|route|schedule|next meeting|who we are meeting|contact names?|hotel|lodging)\b/i;
const OPSEC_RESPONSE = /\b(?:do not share|decline|need[- ]to[- ]know|limit disclosure|protect|opsec|force protection|report|document|notify|inform|elevate|security officer|chain of command|cmoc|s2|counterintelligence|verify (?:the )?request)\b/i;

function mergeProgress(result, additions) {
  const progress = result.progress || {};
  return {
    ...result,
    progress: {
      ...progress,
      discoveries: [...new Set([...(progress.discoveries || []), ...(additions.discoveries || [])])],
      informationGaps: [...new Set([...(progress.informationGaps || []), ...(additions.informationGaps || [])])],
      dimensionScores: { ...(progress.dimensionScores || {}), ...(additions.dimensionScores || {}) }
    }
  };
}

export function applyInterpreterRules(result = {}, prompt = '', scenario = {}) {
  const inject = scenario.interpreterInject;
  if (!inject) return { result, event: null };
  const action = traineeAction(prompt);
  const shifts = { ...(result.relationshipShifts || {}) };

  if (inject.type === 'accuracy' && ACCURACY_BLAME.test(action)) {
    shifts['Interpreter'] = Math.min(Number(shifts.Interpreter) || 0, -12);
    const adjusted = mergeProgress({
      ...result,
      qualityScore: Math.min(Number(result.qualityScore) || 0, 35),
      relationshipShifts: shifts,
      narrativeOutcome: 'The team treats an unverified translation concern as proof of hostile intent. The accusation damages interpreter trust and distracts from the original engagement; the cause of the inconsistent meaning remains unconfirmed.',
      continuityNarrative: 'The interpreter becomes guarded after being accused without evidence. Local participants are now watching the team’s internal tension as closely as the substance of the meeting.'
    }, {
      discoveries: ['A possible interpretation problem was handled as an accusation before it was verified.'],
      informationGaps: ['Whether the discrepancy reflects proficiency, terminology, stress, misunderstanding, coercion, or deliberate distortion'],
      dimensionScores: { validation: 20, rapport: 20, missionFocus: 35 }
    });
    return { result: adjusted, event: { type: inject.type, outcome: 'unverified-accusation' } };
  }

  if (inject.type === 'accuracy' && ACCURACY_VALIDATION.test(action)) {
    shifts.Interpreter = Math.max(Number(shifts.Interpreter) || 0, 3);
    const stakeholder = scenario.keyStakeholders?.[0] || 'primary stakeholder';
    const adjusted = mergeProgress({
      ...result,
      relationshipShifts: shifts,
      narrativeOutcome: `You slow the exchange, use shorter statements, and confirm meaning rather than blaming the interpreter. When the ${stakeholder} restates the key point, an important difference emerges between what the team said and what the room initially understood. The cause still requires respectful verification.`,
      continuityNarrative: `The meeting resumes at a more deliberate pace. The ${stakeholder} now confirms key points directly, while the team treats interpretation as information that must be checked rather than an invisible guarantee of accuracy.`
    }, {
      discoveries: ['A material difference exists between the team’s intended message and the meaning first received by the room.'],
      informationGaps: ['Whether the discrepancy reflects limited proficiency, specialized terminology, misunderstanding, coercion, or deliberate distortion', 'Which earlier statements or agreements require revalidation'],
      dimensionScores: { validation: 85, rapport: 78, informationCollection: 78 }
    });
    return { result: adjusted, event: { type: inject.type, outcome: 'respectful-validation' } };
  }

  if (inject.type === 'force-protection' && OPSEC_DISCLOSURE.test(action) && !OPSEC_RESPONSE.test(action)) {
    shifts.Interpreter = Math.min(Number(shifts.Interpreter) || 0, -4);
    shifts['SSG Davis (CMOC)'] = -12;
    const adjusted = mergeProgress({
      ...result,
      qualityScore: Math.min(Number(result.qualityScore) || 0, 30),
      relationshipShifts: shifts,
      narrativeOutcome: 'The team releases movement or engagement details without establishing a need to know. The information request remains unexplained, and the disclosure creates an avoidable force-protection vulnerability.',
      continuityNarrative: 'The requested details are now outside the team’s control. CMOC requires the team to document what was disclosed, to whom, and what future activities may be affected.'
    }, {
      discoveries: ['Potentially sensitive movement or engagement information was disclosed without validating the requester or need to know.'],
      informationGaps: ['Identity and purpose of the requester', 'Extent of onward dissemination', 'Whether routes, meetings, contacts, or force-protection measures must change'],
      dimensionScores: { validation: 15, coordination: 25, missionFocus: 25 }
    });
    return { result: adjusted, event: { type: inject.type, outcome: 'unnecessary-disclosure' } };
  }

  if (inject.type === 'force-protection' && OPSEC_RESPONSE.test(action)) {
    shifts.Interpreter = Math.max(Number(shifts.Interpreter) || 0, 4);
    shifts['SSG Davis (CMOC)'] = Math.max(Number(shifts['SSG Davis (CMOC)']) || 0, 4);
    const adjusted = mergeProgress({
      ...result,
      relationshipShifts: shifts,
      narrativeOutcome: 'The team avoids unnecessary disclosure, thanks the interpreter for raising the concern, records the requests, and routes the matter for verification through the appropriate force-protection or command channel. No accusation is made before the facts are established.',
      continuityNarrative: 'The interpreter understands what information is need-to-know and continues supporting the engagement. The repeated requests are being assessed separately without allowing them to derail the meeting.'
    }, {
      discoveries: ['Repeated requests sought details about team movements, meetings, or local contacts beyond an established need to know.'],
      informationGaps: ['Identity, authority, purpose, and pattern behind the requests', 'Whether other teams or interpreters received similar requests'],
      dimensionScores: { validation: 82, coordination: 88, missionFocus: 82, rapport: 75 }
    });
    return { result: adjusted, event: { type: inject.type, outcome: 'protected-and-reported' } };
  }

  return {
    result: mergeProgress(result, {
      informationGaps: [inject.type === 'accuracy'
        ? 'Whether the interpreted meaning accurately reflects the team’s statement'
        : 'Purpose and authority behind requests for team whereabouts or meeting information']
    }),
    event: null
  };
}
