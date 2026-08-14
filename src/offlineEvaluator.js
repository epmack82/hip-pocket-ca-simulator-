import { buildTrainingProduct, getProductWorksheet } from './productTemplates';
import { discoverLead } from './leadEngine';

const indicators = [
  ['rapport', /greet|introduc|rapport|listen|empath|respect|interpreter|their (?:concern|input|perspective|priorit|view)|ask (?:about|for) (?:their )?(?:concern|input|perspective|priorit|view)/i],
  ['inquiry', /ask|question|interview|engage|speak|meet/i],
  ['assessment', /assess|inspect|observe|reconnaissance|survey|site/i],
  ['stakeholders', /stakeholder|network|link diagram|leader|community/i],
  ['validation', /validat|confirm|corroborat|source|compare|verify/i],
  ['documentation', /document|report|map|record|update|memo/i],
  ['coordination', /coordinat|ngo|local government|municipal|partner/i],
  ['risk', /risk|vulnerable|access|security|safety|need/i]
];

function actionFromPrompt(prompt) {
  const action = prompt.match(/TRAINEE'S ACTION: "([\s\S]*?)"\s*\n\nEvaluate/i);
  const product = prompt.match(/TRAINEE WANTS TO CREATE THIS PRODUCT: "([\s\S]*?)"(?:\n|$)/i);
  const details = prompt.match(/ADDITIONAL DETAILS FROM TRAINEE: "([\s\S]*?)"\s*\n/i);
  return { text: action?.[1] || details?.[1] || product?.[1] || prompt, productName: product?.[1] || null };
}

function cleanActionExcerpt(text = '') {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'the action entered';
  return cleaned.length > 105 ? `${cleaned.slice(0, 102)}...` : cleaned;
}

function sentenceCase(value = '') {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

const normalizeWords = value => String(value || '').toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(Boolean);

function levenshtein(left = '', right = '') {
  const rows = Array.from({ length: right.length + 1 }, (_, index) => [index]);
  rows[0] = Array.from({ length: left.length + 1 }, (_, index) => index);
  for (let row = 1; row <= right.length; row += 1) {
    for (let column = 1; column <= left.length; column += 1) {
      rows[row][column] = Math.min(
        rows[row - 1][column] + 1,
        rows[row][column - 1] + 1,
        rows[row - 1][column - 1] + (right[row - 1] === left[column - 1] ? 0 : 1)
      );
    }
  }
  return rows[right.length][left.length];
}

function addressedStakeholder(text = '', stakeholders = []) {
  const actionWords = normalizeWords(text);
  const scored = stakeholders.map((name, index) => {
    const titleWords = normalizeWords(name).filter(word => word.length >= 4);
    const score = titleWords.reduce((total, titleWord) => {
      const exact = actionWords.includes(titleWord);
      const approximate = !exact && titleWord.length >= 6 && actionWords.some(word =>
        Math.abs(word.length - titleWord.length) <= 2 && levenshtein(word, titleWord) <= 2
      );
      return total + (exact ? 3 : approximate ? 2 : 0);
    }, 0);
    return { index, name, score };
  }).sort((a, b) => b.score - a.score || a.index - b.index);
  return scored[0]?.score > 0 ? scored[0] : { index: 0, name: stakeholders[0] || 'Local stakeholder', score: 0 };
}

function claimedProductNames(text = '') {
  if (!/\b(?:prepar|complet|submit|send|attach|creat|writ|finish)(?:e|es|ed|ing)?\b/i.test(text)) return [];
  const products = [
    ['Post-KLE Report', /\b(?:post[- ]?kle|kle)\s+(?:report|record)\b/i],
    ['Stakeholder Baseball Card', /\b(?:stakeholder\s+)?baseball\s+card\b/i],
    ['Site Assessment', /\bsite\s+assessment\b/i],
    ['Daily SITREP', /\b(?:daily\s+)?sitrep\b/i],
    ['CA Operations Report', /\b(?:caoprep|ca operations report)\b/i],
    ['Link Diagram', /\blink\s+diagram\b/i],
    ['ASCOPE Worksheet', /\bascope(?:\s+worksheet)?\b/i],
    ['PMESII-PT Worksheet', /\bpmesii(?:-pt)?(?:\s+worksheet)?\b/i]
  ];
  return products.filter(([, pattern]) => pattern.test(text)).map(([name]) => name);
}

function missingProductNote(products = [], isFirstAction = false) {
  if (!products.length) return '';
  const names = products.join(', ').replace(/, ([^,]*)$/, ', and $1');
  const timing = products.flatMap(name => {
    if (/Post-KLE/i.test(name) && isFirstAction) return ['The Post-KLE Report cannot be completed before the engagement; it may only be retained as an empty draft.'];
    if (/Baseball Card/i.test(name) && isFirstAction) return ['The baseball card may be retained as a pre-mission draft, but its entries remain preliminary until verified.'];
    if (/Site Assessment/i.test(name) && isFirstAction) return ['The Site Assessment may be used as a collection plan, but it is not complete until the site is observed and its information is collected.'];
    return [];
  });
  return `\n\nCMOC ADMINISTRATIVE NOTE: Your message says ${names} ${products.length === 1 ? 'was' : 'were'} prepared, but no completed worksheet was attached. After a familiar pause in the team chat, SSG Davis replies: "Tracking. Please resend with attachments." Use Create a Product to complete and submit each worksheet. No product-quality credit was awarded.${timing.length ? ` ${timing.join(' ')}` : ''}`;
}

function rapportScene({ text, scenario, stakeholders, stakeholderInquiry }) {
  const primary = sentenceCase(stakeholders[0] || 'The primary stakeholder');
  const secondary = stakeholders[1] ? ` The ${stakeholders[1]} watches the exchange but has not yet been directly engaged.` : '';
  const location = scenario.location || 'the site';
  const usedInterpreter = /\b(?:interpreter|translator|interpretation|translated|language)\b/i.test(text);
  const offeredGift = /\b(?:gift|token|souvenir|present)\b/i.test(text);
  const sincere = /\b(?:sincere|genuine|respect|warm|humble|grateful|gratitude|thank)\b/i.test(text);
  const opening = usedInterpreter
    ? `The interpreter quietly checks the team's phrasing, then carries the introduction across in a measured tone. ${primary} listens closely rather than waiting for the translation to end.`
    : `${primary} returns the team's introduction and gives the team their full attention.`;
  const giftMoment = offeredGift
    ? ` When the gift is offered, the moment slows. The interpreter helps explain its intended meaning and the host considers whether accepting it is culturally and officially appropriate. Any rapport gained comes from the respectful explanation and attention to protocol, not from the item's value.`
    : '';
  const reaction = sincere
    ? ` The deliberate effort feels more personal than a rehearsed greeting, and the formality at ${location} begins to ease.`
    : ` The introduction establishes a professional opening without yet earning deep trust.`;
  const nextBeat = stakeholderInquiry
    ? ` With the relationship opened, ${primary} is willing to move beyond ceremony and answer the team's first focused question.`
    : ` ${primary} now waits to hear why the team came and what it hopes to understand before offering substantive information.`;
  return `${opening}${giftMoment}${reaction}${nextBeat}${secondary}`;
}

function actionAwareOutcome({ text, matched, stakeholderInquiry, validationMethod, previousState, scenario, stakeholders, engaged }) {
  const primary = sentenceCase(engaged?.name || stakeholders[0] || 'The primary stakeholder');
  const actionNumber = (previousState.actions || []).length + 1;
  const location = scenario.location || 'the site';
  const excerpt = cleanActionExcerpt(text);

  if (matched.includes('rapport') && !(previousState.actions || []).length) {
    const scene = rapportScene({ text, scenario, stakeholders, stakeholderInquiry });
    if (!stakeholderInquiry) return scene;
    const firstClaim = scenario.lead
      ? `${primary} explains that activity at the ${scenario.lead.label} may be affecting conditions here and identifies the ${scenario.lead.contact} as a possible second source.`
      : `${primary} describes a service-access concern and notes that the official account differs from what residents report.`;
    return `${scene} ${firstClaim} The account is a lead, not a confirmed fact; the team must decide what source, record, or observation could test it.`;
  }

  if (matched.includes('validation')) {
    if (!(previousState.discoveries || []).length) {
      return `On action ${actionNumber}, the team says it will validate information, but no specific claim has yet been selected. ${primary} can help identify the original source; the team should name the claim, the confirming or contradicting source, and the evidence it expects to find.`;
    }
    return validationMethod
      ? `The team uses "${excerpt}" to test an earlier account against a specific source or observable condition. ${primary} remains available while the comparison narrows what is known, what conflicts, and what must still be checked at ${location}.`
      : `The team identifies an earlier account for validation, but "${excerpt}" does not yet explain how it will be tested. Name the record, second source, observation, date, or comparison that could confirm or contradict the claim.`;
  }
  if (stakeholderInquiry || matched.includes('inquiry')) {
    const priorClaim = (previousState.discoveries || []).filter(item =>
      !/\b(?:baseline assessment|willing to continue|relationship .* requires|potential effects .* require)\b/i.test(item)
    ).slice(-1)[0];
    if (priorClaim) {
      return `${primary} treats "${excerpt}" as a follow-up to the earlier account: "${priorClaim}" The stakeholder adds context, but the answer remains one perspective. On action ${actionNumber}, the team must decide whether to seek a named second source, inspect a record, observe conditions, or document the remaining contradiction.`;
    }
    const firstClaim = scenario.lead
      ? `${primary} says activity at the ${scenario.lead.label} may be affecting conditions here and identifies the ${scenario.lead.contact} as a possible second source.`
      : `${primary} describes a service-access concern and says the official account differs from what residents report.`;
    return `${primary} responds to "${excerpt}" with a concrete account. ${firstClaim} This is a single-source claim, not a confirmed fact; record it and identify the source, record, observation, or comparison that could confirm or contradict it.`;
  }
  if (matched.includes('rapport')) {
    return `${primary} recognizes the team's effort to listen and establish a respectful working relationship. By action ${actionNumber}, access is improving; the team should now use that access to ask a focused question tied to the mission and document the answer.`;
  }
  if (matched.includes('assessment')) {
    return `The team begins examining conditions at ${location} through "${excerpt}." The action develops observable information, but the assessment will remain incomplete until the team connects those observations to stakeholder accounts, affected populations, responsible authorities, and a documented follow-up.`;
  }
  if (matched.includes('coordination')) {
    return `The team turns toward coordination through "${excerpt}." ${primary} can identify who claims authority, but the team still needs to confirm that mandate, record the coordination pathway, and establish who will take the next action.`;
  }
  if (matched.includes('documentation')) {
    return `The team records its current understanding through "${excerpt}." Documentation preserves continuity, but it cannot create facts that were never collected; unresolved claims and sources should be listed explicitly before the product is treated as complete.`;
  }
  return `${primary} does not yet understand how "${excerpt}" advances the mission at ${location}. Instead of silently resetting the scene, the stakeholder asks the team to clarify its purpose, the information it seeks, and the next observable action it intends to take.`;
}

function evaluateIgBasis(text = '', completionRatio = 0) {
  const normalized = text.replace(/\[Trainee entry required\]/gi, '').replace(/\s+/g, ' ').trim();
  const igRelevant = /\b(?:abuse of authority|reprisal|retaliation|administrative injustice|policy (?:failure|violation)|command climate|fraud|waste|mismanagement|improper conduct|unfair treatment|failure to act|request for assistance|systemic|illegal order|regulation|rights violation)\b/i.test(normalized);
  const alternateUrgentRoute = /\b(?:sexual assault|rape|suicide|immediate danger|medical emergency|active violence|murder|homicide|child abuse)\b/i.test(normalized);
  const criminalOnly = /\b(?:assault|theft|steal|drug trafficking|arson|criminal conduct)\b/i.test(normalized) && !igRelevant;
  const factualDetail = normalized.length >= 160 &&
    /\b(?:who|what|when|where|date|time|location|witness|document|email|order|message|report|record)\b/i.test(normalized);
  const vaguePersonalDispute = /\b(?:was|is|were|are)\s+(?:mean|rude|unfriendly|disrespectful)\s+to\s+(?:me|us)\b|\b(?:hurt my feelings|did not like me|didn't like me|please protect (?:me|us))\b/i.test(normalized);

  if (vaguePersonalDispute || completionRatio < 0.15 || (!igRelevant && !alternateUrgentRoute && !criminalOnly)) {
    return {
      valid: false,
      scoreCap: 10,
      narrative: vaguePersonalDispute
        ? 'The statement describes an interpersonal complaint, but “the clinic director was mean to us” and “please protect us” do not identify misconduct, an administrative injustice, abuse of authority, reprisal, a policy violation, or another supportable basis for IG assistance. IG is not a customer-service complaint channel or protection from ordinary disagreement. Record specific conduct and facts, attempt appropriate resolution when safe, and request a remedy tied to an identifiable issue.'
        : 'The worksheet is formatted as a DA Form 1559 training product, but no IG-appropriate complaint, request for assistance, or factual basis is identified. Selecting or filling a form does not create a valid complaint. State what happened, who was involved, when and where it occurred, what evidence exists, what resolution is requested, and why the matter belongs with the IG.',
      routing: 'Do not route an unsupported fictional complaint. First establish a factual basis and determine whether IG, command, legal, law enforcement/CID, SHARP, medical, or emergency channels are appropriate.'
    };
  }
  if (alternateUrgentRoute || criminalOnly) {
    return {
      valid: false,
      scoreCap: 25,
      narrative: 'The worksheet identifies a serious concern, but IG is not the only—or necessarily the first—channel. Immediate safety, medical care, SHARP/SARC/VA options, law enforcement, or Army CID may require priority action. The trainee must distinguish urgent reporting and victim-support needs from a later IG request for assistance or systemic review.',
      routing: 'Address safety and use the appropriate emergency, medical, SHARP/SARC/VA, law-enforcement, or CID channel first as applicable; an IG may assist or refer but is not a substitute for those processes.'
    };
  }
  if (!factualDetail) {
    return {
      valid: false,
      scoreCap: 45,
      narrative: 'The issue may be appropriate for IG assistance, but the worksheet does not yet provide enough specific, supportable facts. Add who, what, when, where, witnesses or records, prior attempts to resolve the matter, and the precise assistance requested.',
      routing: 'Develop the factual basis and supporting records, then verify the servicing/local IG and any parallel reporting requirements.'
    };
  }
  return {
    valid: true,
    scoreCap: 100,
    narrative: 'The worksheet identifies a potentially IG-appropriate issue and provides a factual basis for training review. The trainee should still verify the servicing office, protect sensitive information, distinguish facts from allegations, and use any required parallel safety, SHARP, legal, law-enforcement, or command channels.',
    routing: 'Route the completed real-world request to the servicing/local IG after verifying current procedures; do not transmit fictional exercise data or classified information.'
  };
}

export function evaluateOffline(prompt, scenario = {}, previousState = {}) {
  const { text, productName } = actionFromPrompt(prompt);
  const matched = indicators.filter(([, pattern]) => pattern.test(text)).map(([name]) => name);
  const stakeholderInquiry = /\b(?:concern|input|perspective|priorit|what (?:is|are|do you)|tell (?:me|us)|your view|their view|ask[\s\S]{0,45}(?:need|issue|problem|lead))\b/i.test(text);
  const validationMethod = /\b(?:record|ledger|document|second source|another source|compare|corroborat|observe|inspect|walk(?: through)?|physical|photo|date|name|receipt|inventory|independent)\b/i.test(text);
  const movedOn = /WITHOUT taking any action/i.test(prompt);
  const baseWorksheet = productName ? getProductWorksheet(productName, scenario) : '';
  const initialFields = (baseWorksheet.match(/\[Trainee entry required\]/g) || []).length;
  const remainingFields = (text.match(/\[Trainee entry required\]/g) || []).length;
  const completionRatio = initialFields ? Math.max(0, Math.min(1, (initialFields - remainingFields) / initialFields)) : 0;
  const isIgProduct = Boolean(productName && /inspector general|da\s*1559|\big action request\b|\big complaint\b/i.test(productName));
  const igReview = isIgProduct ? evaluateIgBasis(text, completionRatio) : null;
  const baseScore = movedOn ? 20 : productName
    ? Math.round(5 + completionRatio * 95)
    : Math.min(92, 38 + matched.length * 7 + (text.length > 180 ? 5 : 0));
  const score = igReview ? Math.min(baseScore, igReview.scoreCap) : baseScore;
  const stakeholders = scenario.keyStakeholders || ['Local stakeholder'];
  const engaged = addressedStakeholder(text, stakeholders.slice(0, 2));
  const relationshipShifts = Object.fromEntries(stakeholders.slice(0, 2).map((name, index) => [
    name,
    productName ? 0 : movedOn ? -2 : matched.includes('rapport') ? (index === engaged.index ? 4 : 0) : 0
  ]));
  const claimedProducts = productName ? [] : claimedProductNames(text);
  const administrativeNote = missingProductNote(claimedProducts, !(previousState.actions || []).length);
  const informationGaps = [];
  if (!matched.includes('validation')) informationGaps.push('Independent confirmation of stakeholder claims');
  if (!matched.includes('assessment')) informationGaps.push(`Current capacity and operating condition of ${scenario.location || 'the site'}`);
  if (!matched.includes('coordination')) informationGaps.push('Responsible authority and coordination pathway');
  if (!matched.includes('risk')) informationGaps.push('Population affected and consequences of service disruption');
  const discoveries = [];
  if (matched.includes('rapport')) discoveries.push(`${engaged.name} is willing to continue the engagement.`);
  if (matched.includes('assessment')) discoveries.push(`A baseline assessment of ${scenario.location || 'the site'} has begun.`);
  if (matched.includes('stakeholders')) discoveries.push('The relationship between site operations and local stakeholders requires further mapping.');
  if (matched.includes('risk')) discoveries.push(`Potential effects on ${scenario.hadrFocus || 'the population'} require prioritization.`);
  const earnedLead = discoverLead(text, scenario);
  const surfacedLeads = earnedLead ? [earnedLead] : [];
  const primaryStakeholder = sentenceCase(engaged.name || stakeholders[0] || 'The primary stakeholder');
  const stakeholderClaim = scenario.lead
    ? `${primaryStakeholder} says activity at the ${scenario.lead.label} is affecting conditions here and identifies the ${scenario.lead.contact} as someone who may have records or a different account.`
    : `${primaryStakeholder} identifies a service-access concern and says the official account does not reflect what residents are experiencing.`;
  if (stakeholderInquiry) {
    discoveries.push(stakeholderClaim);
    informationGaps.push(scenario.lead
      ? `Validate ${primaryStakeholder}'s claim with the ${scenario.lead.contact}, relevant records, and direct observation at the ${scenario.lead.label}`
      : `Validate ${primaryStakeholder}'s concern through records, direct observation, and another affected source`);
  }
  if (matched.includes('validation') && previousState.discoveries?.length) {
    discoveries.push(validationMethod
      ? `The team compares an earlier stakeholder claim with a named source or observable evidence; part of the account is corroborated while the scale and cause remain unresolved.`
      : `The team identifies an earlier stakeholder claim for validation, but must specify which source, record, observation, or comparison will test it.`);
  }
  const dimensionScores = {
    rapport: matched.includes('rapport') ? 75 : 35,
    informationCollection: matched.includes('inquiry') || matched.includes('assessment') ? 70 : 30,
    validation: matched.includes('validation') ? 75 : 25,
    productQuality: productName ? Math.max(55, score) : 20,
    coordination: matched.includes('coordination') ? 75 : 30,
    initiative: movedOn ? 10 : text.length > 100 ? 75 : 55,
    missionFocus: matched.includes('assessment') || matched.includes('documentation') ? 70 : 40
  };

  return {
    narrativeOutcome: movedOn
      ? 'The team departs without developing the available civil information. Stakeholders remain uncertain about the purpose of the visit, and important information gaps carry forward.'
      : igReview
        ? igReview.narrative
      : matched.includes('validation') && previousState.discoveries?.some(item =>
          !/\b(?:baseline assessment|willing to continue|relationship .* requires|potential effects .* require)\b/i.test(item)
        )
        ? validationMethod
          ? `The team tests an earlier claim against a specific source or observable evidence. The comparison supports part of the account but leaves the scale, cause, and responsible authority unresolved, giving the team a narrower set of follow-up questions.`
          : `${primaryStakeholder} asks how the team intends to test the earlier account: “${previousState.discoveries.slice(-1)[0]}” No conclusion changes yet, but three practical paths are available: compare the account with ${scenario.lead?.contact || 'a named independent source'}, request a relevant record with dates, or directly observe the reported condition. Choose one path and state what result would confirm or contradict the claim.`
      : `${actionAwareOutcome({ text, matched, stakeholderInquiry, validationMethod, previousState, scenario, stakeholders, engaged })}${administrativeNote}`,
    qualityScore: score,
    assessmentType: score >= 78 ? 'PLANNED' : score >= 55 ? 'DELIBERATE' : 'INITIAL',
    performanceMeasures: productName ? Math.round(completionRatio * 6) : Math.max(1, Math.min(6, matched.length)),
    relationshipShifts,
    annexCitation: 'K',
    routingRationale: igReview
      ? igReview.routing
      : 'Civil information and assessment findings should be documented through the supported Civil Affairs information-management channel and routed to the appropriate staff section by subject.',
    product: productName ? buildTrainingProduct(productName, scenario, text === productName ? '' : text) : null,
    feedbackTone: 'encouraging',
    evaluationMode: 'offline',
    productCompletionPercent: productName ? Math.round(completionRatio * 100) : null,
    claimedProducts,
    administrativeNote,
    progress: {
      discoveries,
      informationGaps,
      leads: surfacedLeads,
      completedProducts: productName ? [productName] : [],
      dimensionScores: {
        ...dimensionScores,
        productQuality: productName ? score : dimensionScores.productQuality
      }
    }
  };
}

export function createOfflineDebrief(records, products, consequences = []) {
  const scores = records.map(record => Number(record.qualityScore) || 0);
  const average = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
  const consequenceText = consequences.length
    ? ` The mission also recorded ${consequences.length} serious consequence event${consequences.length === 1 ? '' : 's'}. Harmful or unlawful conduct damaged legitimacy, relationships, interpreter support, and command trust; later corrective action may mitigate those effects but cannot erase them from the mission assessment.`
    : '';
  return `Offline after-action review: You completed ${records.length} scenario${records.length === 1 ? '' : 's'} with an average assessment score of ${average}.${consequenceText} Your strongest results came when actions clearly combined stakeholder engagement, observation, validation, and documentation. Continue separating confirmed facts from assumptions and information gaps, and identify the correct coordination or staff channel for each finding. You created ${products.length} training product${products.length === 1 ? '' : 's'}; review each for specific sources, dates, locations, and follow-on recommendations. On your next mission, deliberately seek a second credible source before finalizing conclusions. This rules-based AAR kept training available without a cloud AI provider and should be supplemented by instructor feedback.`;
}
