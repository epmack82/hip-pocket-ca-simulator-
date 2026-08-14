import { determineMissionDisposition } from './missionOutcome';
import { classifyBehavior } from './behaviorClassifier';

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
    pattern: /\bslush fund\b|\b(?:funds?|money)\b[\s\S]{0,80}\b(?:party|alcohol|beer|booze|liquor|get everyone drunk)\b|\bget(?:s|ting)?\s+(?:everyone|the locals|stakeholders)\s+(?:drunk|hammered|wasted)\b|\b(?:host|throw|hold)(?:s|ed|ing)?\b[\s\S]{0,60}\b(?:bbq|barbecue|party|cookout)\b[\s\S]{0,60}\b(?:drunk|hammered|wasted|alcohol|booze|beer|liquor)\b|\b(?:light|smoke)(?:s|ed|ing)?\s+(?:a\s+)?(?:joint|blunt)\b|\b(?:use|smoke)(?:s|d|ing)?\s+(?:marijuana|cannabis|weed)\b|\bintoxicat(?:e|ed|ing|ion)\b|\b(?:arriv|return|show)(?:e|es|ed|ing)?(?:\s+back)?[\s\S]{0,45}\b(?:drunk|intoxicated)\b|\b(?:am|was|were|being|remain(?:s|ed|ing)?)\s+(?:visibly\s+)?(?:drunk|intoxicated)\b|\b(?:offer|give|hand)(?:s|ed|ing)?\b[\s\S]{0,50}\b(?:alcohol|beer|booze|liquor|vodka)\b[\s\S]{0,50}\b(?:local|poc|point of contact|stakeholder|host|official|leader)\b/i
  },
  {
    id: 'corruption-or-coercion',
    label: 'Corruption, theft, coercion, or intimidation',
    pattern: /\b(?:steal|stole|embezzl|misappropriat|brib|extort|coerc|intimidat|threaten)(?:e|es|ed|ing|ion)?\b|\b(?:open|start|run|operate|establish)(?:s|ed|ing)?\s+(?:a\s+)?(?:gambling ring|illegal casino|criminal enterprise|drug trafficking operation)\b|\b(?:start|begin|go around)\s+arresting\b|\buse\s+(?:physical\s+)?force\s+to\s+(?:expose|intimidate|coerce|question|interrogate|make|force)\b/i
  },
  {
    id: 'mission-abandonment',
    label: 'Deliberate abandonment of the mission or assigned engagement',
    pattern: /\b(?:abandon|ditch|blow off|walk away from|leave|skip)\s+(?:the\s+)?(?:mission|task|assignment|engagement|meeting|site|stakeholders?)\b|\b(?:skip|blow off)\s+(?:it|this)\b[\s\S]{0,100}\b(?:get drunk|drink|bar|casino|party|strip club|personal entertainment|go home)\b|\bignore\s+(?:everyone|the\s+(?:team|stakeholders?|mission|task|assignment))\b[\s\S]{0,100}\b(?:go|head|leave|depart)\b|\b(?:go|head|leave|depart)(?:s|ed|ing)?\s+(?:to|for)\s+(?:the\s+)?(?:strip club|bar|casino|party|personal entertainment)\b|\bhang out\b[\s\S]{0,70}\binstead of\b[\s\S]{0,40}\b(?:work|mission|task|engagement|meeting|assessment)\b/i
  },
  {
    id: 'unauthorized-promise',
    label: 'Unauthorized promise of assistance, funding, material, or a specific outcome',
    pattern: /\b(?:i|we|our team)\s+(?:promise|guarantee|commit(?:ted)?\s+to)\b|\b(?:i|we|our team)(?:\s+will|'ll)\s+(?:(?:fund|pay for|build|repair|replace|purchase|buy|donate)\b|(?:provide|deliver|supply|give|get you|make sure you get)\b[\s\S]{0,60}\b(?:assistance|support|funds?|money|materials?|resources?|equipment|supplies|window|door|roof|vehicle|medicine|food|water|project|renovation)\b)|\b(?:tell|assure)(?:ed|ing)?\b[\s\S]{0,80}\b(?:we|i|our team)(?:\s+will|'ll|\s+would)\s+(?:provide|deliver|fund|pay for|build|repair|replace|purchase|buy|donate|supply|give|get)\b/i
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
  const exactMatches = CATEGORY_RULES.filter(rule => rule.pattern.test(action));
  const conceptMatches = classifyBehavior(action)
    .filter(concept => !exactMatches.some(rule => rule.label === concept.label))
    .map(concept => ({ ...concept, pattern: null }));
  const matched = [...exactMatches, ...conceptMatches];
  if (!matched.length) return null;

  const stakeholders = (scenario.keyStakeholders || []).slice(0, 2);
  const abandonmentOnly = matched.every(rule => rule.id === 'mission-abandonment');
  const promiseOnly = matched.every(rule => rule.id === 'unauthorized-promise');
  const intoxicationOnly = matched.every(rule => ['funds-and-intoxication', 'intoxication-concept', 'unauthorized-alcohol-distribution'].includes(rule.id));
  const criminalEnterpriseOnly = matched.every(rule => rule.id === 'corruption-or-coercion') &&
    /\b(?:gambling ring|illegal casino|criminal enterprise|drug trafficking operation)\b/i.test(action);
  const socialEventOnly = matched.every(rule => rule.id === 'unauthorized-social-event');
  const hasSocialEvent = matched.some(rule => rule.id === 'unauthorized-social-event');
  const hasIntoxication = matched.some(rule => ['funds-and-intoxication', 'intoxication-concept'].includes(rule.id));
  const hasAbandonment = matched.some(rule => ['mission-abandonment', 'mission-abandonment-concept'].includes(rule.id));
  const hasDestruction = matched.some(rule => ['destructive-misconduct', 'destructive-concept'].includes(rule.id));
  const unsafeTampering = matched.some(rule => rule.id === 'unsafe-infrastructure-tampering');
  const weaponMisuse = matched.some(rule => rule.id === 'weapon-misuse-concept');
  const stakeholderDisrespect = matched.some(rule => rule.id === 'stakeholder-disrespect-concept');
  const alcoholDistribution = matched.some(rule => rule.id === 'unauthorized-alcohol-distribution');
  const extendedPartyBender = hasSocialEvent && hasIntoxication && hasAbandonment;
  const explosiveSabotage = hasDestruction && /\b(?:c-?4|explosive|bomb|ied|charge|dynamite|detonate|blow up)\b/i.test(action);
  const returnedIntoxicated = /\b(?:arriv|return|show)(?:e|es|ed|ing)?(?:\s+back)?[\s\S]{0,45}\b(?:drunk|intoxicated)\b/i.test(action);
  const relationshipShifts = socialEventOnly
    ? {
        'Ahmad (Interpreter)': -1,
        'SSG Davis (CMOC)': -6,
        ...Object.fromEntries(stakeholders.map(name => [name, -3]))
      }
    : abandonmentOnly
    ? {
        'Ahmad (Interpreter)': -8,
        'SSG Davis (CMOC)': -15,
        ...Object.fromEntries(stakeholders.map(name => [name, -10]))
      }
    : promiseOnly
      ? {
          'Ahmad (Interpreter)': -3,
          'SSG Davis (CMOC)': -20,
          ...Object.fromEntries(stakeholders.map(name => [name, -8]))
        }
    : intoxicationOnly
      ? {
          'Ahmad (Interpreter)': -15,
          'SSG Davis (CMOC)': -30,
          ...Object.fromEntries(stakeholders.map(name => [name, -20]))
        }
      : {
        'Ahmad (Interpreter)': -35,
        'SSG Davis (CMOC)': -40,
        ...Object.fromEntries(stakeholders.map(name => [name, -25]))
      };
  const narrative = weaponMisuse
    ? `${stakeholders[0] || 'The local point of contact'} sees a weapon produced and thrown or brandished near personnel and critical equipment. The engagement stops immediately; people move to safety, host-nation security and the chain of command are notified, and the team loses access to the site pending investigation. This is treated as a safety and force-protection incident, not initiative or assessment.`
    : unsafeTampering
    ? `${stakeholders[0] || 'The facility representative'} immediately stops the team from striking, manipulating, or experimenting with operating equipment. Unqualified contact with electrical or utility systems risks injury, equipment damage, service interruption, and harm to the population that depends on the site. No assessment credit or rapport is earned; the event is documented and command must address the safety violation before access can be reconsidered.`
    : stakeholderDisrespect && alcoholDistribution
    ? `${stakeholders[0] || 'The local point of contact'} understands “thanks for nothing” as a deliberate insult, then sees unauthorized alcohol passed around during the official engagement. The combination damages professional credibility and places local participants in an uncomfortable cultural, safety, and consent situation. The meeting ends, no rapport is gained, and CMOC must address both the conduct and the relationship damage.`
    : stakeholderDisrespect
    ? `${stakeholders[0] || 'The local point of contact'} recognizes the remark as contempt rather than rapport. The stakeholder becomes less willing to share information, and the team loses access it had not yet earned. The insult is recorded as a professionalism and relationship-management failure; recovery requires a direct, credible correction and changed behavior, not another demand for cooperation.`
    : explosiveSabotage
    ? `${stakeholders[0] || 'The local point of contact'} recognizes the act as an attempted explosive attack against critical civilian infrastructure, not a Civil Affairs activity. Personnel are moved away from the threatened area, emergency and explosive-ordnance procedures begin, and the facility may be shut down—potentially disrupting essential services to the population. The attempt to flee compounds the action by abandoning the mission and accountability. The engagement ends immediately, command and appropriate security authorities are notified, and the team is removed from the mission pending investigation and disposition.`
    : extendedPartyBender
    ? `${stakeholders[0] || 'The local point of contact'} understands the proposed rager and multi-day bender as replacing the assigned engagement with an unapproved intoxication-centered event. The proposal creates immediate discipline, safety, consent, cultural, funding, force-protection, and favoritism concerns while abandoning the mission and its information requirements. No rapport is gained. CMOC stops the activity, documents the incident, and removes the team from stakeholder contact pending command disposition.`
    : socialEventOnly
    ? `${stakeholders[0] || 'The local point of contact'} pauses when the team proposes a social event for selected staff. Before treating it as rapport building, the team must establish its mission purpose, approval authority, funding source, cultural appropriateness, inclusion and favoritism effects, security requirements, and whether anyone could interpret the event as a gift, promise, or exchange for cooperation. No relationship gain is awarded yet. CMOC asks the team to clarify those points or choose a lower-risk engagement method tied directly to the information requirement.`
    : abandonmentOnly
    ? `The team turns away from the assigned engagement for personal activity unrelated to the mission. ${stakeholders[0] || 'The waiting stakeholders'} sees the team leave without explanation, reducing confidence that future commitments will be honored. The missed engagement and failure to remain mission-focused are reported to CMOC, while the interpreter can no longer facilitate the meeting because the team has departed.`
    : promiseOnly
      ? `The stakeholder understands the team’s statement as a firm commitment of U.S. support. No verified authority, funding source, procurement path, or delivery timeline exists, but the expectation is now part of the relationship and may spread through the community. CMOC must clarify what was said, correct the expectation, and manage the resulting trust, equity, and command-support implications. Personal payment or an informal workaround would not retroactively authorize the promise and could create additional ethical, fiscal, and precedent concerns.`
    : intoxicationOnly
      ? returnedIntoxicated
        ? `${stakeholders[0] || 'The local point of contact'} sees the team return visibly intoxicated and offer alcohol during the engagement. The meeting ends rather than continuing under unsafe and unprofessional conditions. The offer does not build rapport; it places the local contact in an uncomfortable position, damages confidence in the team, and is reported to CMOC. The team is removed from normal engagement activity while leadership addresses safety, accountability, and whether access to this stakeholder can be recovered.`
        : `${stakeholders[0] || 'The local point of contact'} sees the team replace the assigned engagement with an alcohol-centered social event intended to make participants intoxicated. The activity does not build legitimate rapport; it creates safety, discipline, consent, cultural, and command concerns while leaving mission requirements unfinished. CMOC ends the activity and begins accountability and relationship-repair actions.`
      : criminalEnterpriseOnly
        ? `The proposal to establish an illegal gambling or criminal enterprise immediately ends the legitimate engagement. ${stakeholders[0] || 'The local point of contact'} withdraws rather than becoming associated with the activity, and the incident is reported through command and appropriate law-enforcement channels. The action creates legal, force-protection, corruption, exploitation, and host-nation relationship risks; it cannot be treated as initiative or rapport building.`
      : 'The action causes an immediate breakdown in trust and mission legitimacy. The interpreter steps away from the team, unwilling to be associated with the conduct and concerned that continued participation could create personal risk. Local stakeholders withdraw cooperation, while CMOC and the chain of command halt normal engagement activity so the incident, resulting harm, and required accountability can be addressed.';
  const persistentEffects = explosiveSabotage
    ? [
        'The stakeholder engagement ends immediately and the threatened site enters emergency response procedures.',
        'Potential disruption of essential civilian services and population harm must be assessed.',
        'Command, security, explosive-ordnance, law-enforcement, and host-nation coordination may be required.',
        'The team is removed from normal mission activity pending investigation and command disposition.'
      ]
    : extendedPartyBender
    ? [
        'The assigned engagement and its information requirements were abandoned.',
        'No rapport credit is awarded for an unapproved intoxication-centered event.',
        'CMOC and the chain of command require immediate safety, discipline, fiscal, and accountability action.',
        'Stakeholder access and confidence require reassessment before another team attempts re-engagement.'
      ]
    : socialEventOnly
    ? [
        'No rapport credit is awarded until purpose, authority, funding, and cultural suitability are established.',
        'Selected invitations may create perceptions of favoritism, exclusion, or an implied exchange for access.',
        'CMOC requires clarification before resources or the unit name are committed.',
        'Adding intoxication, unauthorized spending, promises, or mission abandonment will escalate the consequence.'
      ]
    : abandonmentOnly
    ? [
        'The scheduled engagement was missed or disrupted.',
        'Local stakeholders are less confident that the team will honor commitments.',
        'CMOC requires an explanation and renewed mission focus.',
        'Information and relationship opportunities at this location were lost.'
      ]
    : promiseOnly
      ? [
          'The stakeholder and community may now expect delivery of the promised support.',
          'Failure to deliver can damage trust in the team, command, and future engagements.',
          'CMOC must document the statement, verify authorities and resources, and correct expectations.',
          'The promise may create equity, precedent, procurement, funding, and coordination problems.',
          'Personal funds or informal acquisition do not make the original commitment authorized.'
        ]
    : intoxicationOnly
      ? [
          'The current engagement ends without completing its information requirements.',
          'The local point of contact is less willing to meet with or vouch for the team.',
          'CMOC and team leadership require a safety and accountability response.',
          'Future access may require a sober replacement team and deliberate relationship repair.'
        ]
      : criminalEnterpriseOnly
        ? [
            'The legitimate stakeholder engagement ends immediately.',
            'The action is reported to the chain of command and appropriate law-enforcement authorities.',
            'Local partners avoid association with the team because of legal, corruption, and reputation risks.',
            'Mission access and force-protection posture require command reassessment.'
          ]
      : [
        'Interpreter support is unavailable because of safety, trust, and association concerns.',
        'Local stakeholders are reluctant to engage or share information.',
        'CMOC and the chain of command require accountability and incident reporting.',
        'Civilian harm, property damage, or false reporting must be addressed as applicable.'
      ];

  return {
    id: `MISCONDUCT-${matched.map(rule => rule.id).join('-')}`,
    severity: socialEventOnly ? 'questionable' : matched.length >= 2 || matched.some(rule => ['destructive-misconduct', 'destructive-concept', 'coercion-concept'].includes(rule.id)) ? 'critical' : 'serious',
    title: socialEventOnly
      ? 'Unapproved social-event proposal requires clarification'
      : abandonmentOnly
      ? 'Deliberate mission abandonment'
      : promiseOnly
        ? 'Unauthorized promise or commitment'
        : intoxicationOnly
          ? 'Intoxication during a stakeholder engagement'
          : criminalEnterpriseOnly
            ? 'Proposed criminal enterprise'
          : 'Mission-compromising misconduct',
    categories: matched.map(rule => rule.label),
    relationshipShifts,
    narrative,
    persistentEffects,
    routingRationale: socialEventOnly
      ? 'Do not commit resources or represent the event as approved. Identify the mission purpose, approval authority, lawful funding source, attendees, cultural and security considerations, and the specific result expected; coordinate through CMOC before proceeding.'
      : abandonmentOnly
      ? 'Notify CMOC of the missed engagement, document lost access and information requirements, and re-establish mission priorities before resuming activity.'
      : promiseOnly
        ? 'Immediately document exactly what was said and understood; notify CMOC and the chain of command; verify authorities, funding, and coordination channels; and correct stakeholder expectations without making a replacement promise.'
      : intoxicationOnly
        ? 'End the engagement safely, notify CMOC and team leadership, document what occurred, and do not treat alcohol or continued contact as a rapport technique. Re-entry requires command direction and deliberate relationship repair.'
        : criminalEnterpriseOnly
          ? 'End the activity, preserve the exact facts, notify the chain of command, and coordinate with appropriate law-enforcement and legal authorities. Do not continue the engagement or solicit local participation.'
        : 'Immediately notify the chain of command and appropriate authorities; preserve facts, address safety and harm, correct false reporting, and do not continue routine engagement as though the incident did not occur.',
    progressDiscovery: socialEventOnly
      ? 'A proposed staff social event has not yet been connected to mission purpose, authority, funding, or an appropriate engagement outcome.'
      : promiseOnly
      ? 'A stakeholder now believes the team committed to provide assistance or a specific outcome.'
      : intoxicationOnly
        ? 'The engagement ended after the team returned intoxicated and offered alcohol to the local point of contact.'
        : criminalEnterpriseOnly
          ? 'The legitimate engagement ended after the team proposed an illegal gambling or criminal enterprise.'
        : 'Trust and mission legitimacy have been severely damaged by the team action.',
    progressGaps: socialEventOnly
      ? ['Mission purpose and expected information outcome', 'Approval authority and lawful funding source', 'Cultural, inclusion, favoritism, consent, and security considerations', 'Lower-risk alternatives for building rapport']
      : promiseOnly
      ? ['Exact words used and what the stakeholder understood', 'Actual authority, funding, and delivery capability', 'Who else has been told about the promise', 'Plan to correct expectations and preserve the relationship']
      : ['Command disposition and investigative findings', 'Extent of civilian and property harm', 'Requirements for correction, restitution, and renewed access'],
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
  if (detected) {
    const priorIndex = updated.findIndex(item => item.id === detected.id);
    if (priorIndex >= 0) {
      const prior = updated[priorIndex];
      updated[priorIndex] = {
        ...prior,
        occurrenceCount: (prior.occurrenceCount || 1) + 1,
        lastSourceAction: detected.sourceAction,
        escalationNote: 'The same category of misconduct was repeated and produced additional mission consequences.',
        status: 'active'
      };
    } else {
      updated = [...updated, { ...detected, occurrenceCount: 1, lastSourceAction: detected.sourceAction }];
    }
  }
  return updated;
}

export function applyConsequenceRules(result = {}, prompt = '', scenario = {}, existing = []) {
  const detected = detectMisconduct(prompt, scenario);
  const remedial = !detected && existing.length > 0 && isRemedialAction(prompt);
  const consequences = mergeConsequences(existing, detected, remedial);

  if (detected) {
    const priorOccurrences = existing.reduce((total, item) => total + (item.occurrenceCount || 1), 0);
    const escalationPrefix = existing.some(item => item.status === 'active')
      ? `This is not an isolated lapse. It is misconduct event ${priorOccurrences + 1} and compounds ${priorOccurrences === 1 ? 'the earlier event' : `${priorOccurrences} earlier events`}, further reducing stakeholder access and increasing command intervention.\n\n`
      : '';
    const escalationMultiplier = Math.min(2, 1 + priorOccurrences * 0.2);
    const escalatedRelationshipShifts = Object.fromEntries(
      Object.entries(detected.relationshipShifts).map(([name, value]) => [name, Math.round(value * escalationMultiplier)])
    );
    const negativeScore = detected.severity === 'critical'
      ? -100
      : detected.severity === 'questionable'
        ? Math.max(-60, -10 - priorOccurrences * 10)
        : Math.max(-100, -25 - priorOccurrences * 20);
    const disposition = determineMissionDisposition(consequences);
    return {
      consequences,
      detected,
      result: {
        ...result,
        narrativeOutcome: `${escalationPrefix}${detected.narrative}`,
        qualityScore: negativeScore,
        assessmentType: 'OTHER',
        performanceMeasures: 0,
        relationshipShifts: escalatedRelationshipShifts,
        annexCitation: 'none',
        routingRationale: detected.routingRationale,
        product: null,
        feedbackTone: 'direct',
        missionDisposition: disposition,
        missionTerminated: disposition.terminated,
        progress: {
          discoveries: [detected.progressDiscovery],
          informationGaps: detected.progressGaps,
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
    `${item.title} (${item.status}; ${item.occurrenceCount || 1} occurrence${(item.occurrenceCount || 1) === 1 ? '' : 's'})`,
    ...item.persistentEffects.map(effect => `- ${effect}`)
  ]).join('\n');
}
