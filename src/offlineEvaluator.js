import { buildTrainingProduct, getProductWorksheet } from './productTemplates';
import { discoverLead } from './leadEngine';

const indicators = [
  ['rapport', /greet|introduc|rapport|listen|empath|respect|interpreter/i],
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

export function evaluateOffline(prompt, scenario = {}) {
  const { text, productName } = actionFromPrompt(prompt);
  const matched = indicators.filter(([, pattern]) => pattern.test(text)).map(([name]) => name);
  const movedOn = /WITHOUT taking any action/i.test(prompt);
  const baseWorksheet = productName ? getProductWorksheet(productName, scenario) : '';
  const initialFields = (baseWorksheet.match(/\[Trainee entry required\]/g) || []).length;
  const remainingFields = (text.match(/\[Trainee entry required\]/g) || []).length;
  const completionRatio = initialFields ? Math.max(0, Math.min(1, (initialFields - remainingFields) / initialFields)) : 0;
  const score = movedOn ? 20 : productName
    ? Math.round(5 + completionRatio * 95)
    : Math.min(92, 38 + matched.length * 7 + (text.length > 180 ? 5 : 0));
  const stakeholders = scenario.keyStakeholders || ['Local stakeholder'];
  const relationshipShifts = Object.fromEntries(stakeholders.slice(0, 2).map(name => [name, productName ? 0 : movedOn ? -2 : matched.includes('rapport') ? 4 : 1]));
  const gaps = indicators.map(([name]) => name).filter(name => !matched.includes(name));
  const strengthText = productName
    ? `You completed approximately ${Math.round(completionRatio * 100)}% of the available worksheet fields.`
    : matched.length
    ? `Your approach incorporated ${matched.slice(0, 3).join(', ')}.`
    : 'Your action established an initial presence but did not describe a structured assessment approach.';
  const improvementText = gaps.length
    ? `A stronger follow-on action would explicitly address ${gaps.slice(0, 2).join(' and ')} while distinguishing facts from assumptions.`
    : 'Continue by confirming priorities with independent sources and documenting recommended follow-on actions.';
  const informationGaps = [];
  if (!matched.includes('validation')) informationGaps.push('Independent confirmation of stakeholder claims');
  if (!matched.includes('assessment')) informationGaps.push(`Current capacity and operating condition of ${scenario.location || 'the site'}`);
  if (!matched.includes('coordination')) informationGaps.push('Responsible authority and coordination pathway');
  if (!matched.includes('risk')) informationGaps.push('Population affected and consequences of service disruption');
  const discoveries = [];
  if (matched.includes('rapport')) discoveries.push(`${stakeholders[0]} is willing to continue the engagement.`);
  if (matched.includes('assessment')) discoveries.push(`A baseline assessment of ${scenario.location || 'the site'} has begun.`);
  if (matched.includes('stakeholders')) discoveries.push('The relationship between site operations and local stakeholders requires further mapping.');
  if (matched.includes('risk')) discoveries.push(`Potential effects on ${scenario.hadrFocus || 'the population'} require prioritization.`);
  const earnedLead = discoverLead(text, scenario);
  const surfacedLeads = earnedLead ? [earnedLead] : [];
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
      : `${strengthText} Local stakeholders provide an initial response, but their accounts still require validation. ${improvementText}`,
    qualityScore: score,
    assessmentType: score >= 78 ? 'PLANNED' : score >= 55 ? 'DELIBERATE' : 'INITIAL',
    performanceMeasures: productName ? Math.round(completionRatio * 6) : Math.max(1, Math.min(6, matched.length)),
    relationshipShifts,
    annexCitation: 'K',
    routingRationale: 'Civil information and assessment findings should be documented through the supported Civil Affairs information-management channel and routed to the appropriate staff section by subject.',
    product: productName ? buildTrainingProduct(productName, scenario, text === productName ? '' : text) : null,
    feedbackTone: 'encouraging',
    evaluationMode: 'offline',
    productCompletionPercent: productName ? Math.round(completionRatio * 100) : null,
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

export function createOfflineDebrief(records, products) {
  const scores = records.map(record => Number(record.qualityScore) || 0);
  const average = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
  return `Offline after-action review: You completed ${records.length} scenario${records.length === 1 ? '' : 's'} with an average assessment score of ${average}. Your strongest results came when actions clearly combined stakeholder engagement, observation, validation, and documentation. Continue separating confirmed facts from assumptions and information gaps, and identify the correct coordination or staff channel for each finding. You created ${products.length} training product${products.length === 1 ? '' : 's'}; review each for specific sources, dates, locations, and follow-on recommendations. On your next mission, deliberately seek a second credible source before finalizing conclusions. This rules-based AAR kept training available without a cloud AI provider and should be supplemented by instructor feedback.`;
}
