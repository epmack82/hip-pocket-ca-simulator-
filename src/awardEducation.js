export const RECOGNITION_LEVELS = [
  {
    id: 'participation',
    label: 'Participation / local completion recognition',
    use: 'Training completion or participation that does not demonstrate decoration-level achievement.',
    caution: 'Not a military decoration.'
  },
  {
    id: 'certificate',
    label: 'Certificate of Achievement-level recognition',
    use: 'Commendable achievement or faithful service below the standard required for a military decoration.',
    caution: 'Local procedures and approval authority apply.'
  },
  {
    id: 'aam',
    label: 'Army Achievement Medal (AAM)-level',
    use: 'A specific meritorious achievement or service of a lesser degree than required for an ARCOM.',
    caution: 'Routine duty completion alone is insufficient.'
  },
  {
    id: 'arcom',
    label: 'Army Commendation Medal (ARCOM)-level',
    use: 'Meritorious achievement or service with meaningful mission or organizational impact.',
    caution: 'The recommendation should establish scope, effect, and why the performance was distinctive.'
  },
  {
    id: 'msm',
    label: 'Meritorious Service Medal (MSM)-level',
    use: 'Outstanding noncombat meritorious achievement or service with exceptional sustained scope and impact.',
    caution: 'A short exercise or routine assignment normally cannot establish this level by itself.'
  },
  {
    id: 'none',
    label: 'No favorable recognition',
    use: 'The record does not support favorable recognition or contains unresolved serious misconduct.',
    caution: 'An award is not used to offset misconduct.'
  }
];

export const ELIGIBILITY_REFERENCES = [
  ['Humanitarian Service Medal (HSM)', 'Requires direct participation in an officially approved humanitarian operation and its published dates, location, and criteria. Humanitarian work alone does not establish eligibility.'],
  ['Armed Forces Service Medal (AFSM)', 'Requires a designated significant operation and qualifying participation. National or international exercises alone are not qualifying operations.'],
  ['NATO / United Nations medals', 'Require service in an approved operation under the applicable international authority and the required certificate or official documentation.'],
  ['Foreign decorations and badges', 'The host nation must actually confer the award. Acceptance, retention, and uniform wear require Army review; some awards are retention-only.'],
  ['Campaign, expeditionary, and overseas recognition', 'Depends on designated operations, areas, dates, orders, tour credit, and duty status rather than an AAR performance score.'],
  ['Unit awards', 'Require official recognition of the qualifying unit and period; individual performance does not independently create eligibility.'],
  ['Military Outstanding Volunteer Service Medal', 'Recognizes qualifying sustained voluntary community service, not assigned mission duties merely described as humanitarian.']
];

function expectedLevelId(recommendation = {}) {
  const level = recommendation.level || '';
  if (/No favorable/i.test(level)) return 'none';
  if (/MSM/i.test(level)) return 'msm';
  if (/ARCOM/i.test(level)) return 'arcom';
  if (/AAM/i.test(level)) return 'aam';
  if (/Achievement/i.test(level)) return 'certificate';
  return 'participation';
}

export function gradeAwardPractice(practice = {}, recommendation = {}) {
  const selected = practice.level || '';
  const achievement = (practice.achievement || '').trim();
  const impact = (practice.impact || '').trim();
  const scope = (practice.scope || '').trim();
  const support = (practice.support || '').trim();
  const expected = expectedLevelId(recommendation);
  const measurable = /\b\d+(?:\.\d+)?%?\b|\b(?:increased|reduced|improved|restored|enabled|prevented|completed|validated|identified|coordinated)\b/i.test(impact);
  const specificAchievement = achievement.length >= 45 && /\b(?:led|created|developed|coordinated|assessed|validated|resolved|established|produced|identified|improved|prevented)\b/i.test(achievement);
  const clearScope = scope.length >= 30 && /\b(?:day|week|month|location|site|team|unit|organization|mission|operation|country|partner)\b/i.test(scope);
  const documented = support.length >= 25 && /\b(?:order|report|sitrep|caoprep|witness|record|email|message|photo|evaluation|product|roster|memorandum|certificate)\b/i.test(support);
  const aligned = selected === expected;
  const score = (aligned ? 35 : selected ? 15 : 0) + (specificAchievement ? 20 : achievement ? 8 : 0) +
    (measurable ? 20 : impact ? 8 : 0) + (clearScope ? 15 : scope ? 6 : 0) + (documented ? 10 : support ? 4 : 0);
  const selectedLabel = RECOGNITION_LEVELS.find(item => item.id === selected)?.label || 'No level selected';
  const expectedLabel = RECOGNITION_LEVELS.find(item => item.id === expected)?.label || recommendation.level;

  return {
    score,
    aligned,
    selectedLabel,
    expectedLabel,
    feedback: [
      aligned
        ? 'Your proposed level aligns with the simulator’s training recommendation.'
        : `Compare your selection with ${expectedLabel}. The award level must follow demonstrated scope and impact, not rank or a desire to recognize everyone equally.`,
      specificAchievement
        ? 'The achievement describes a specific contribution.'
        : 'Rewrite the achievement around what the Soldier personally did beyond merely occupying the position or completing assigned duties.',
      measurable
        ? 'The impact includes a result that can be evaluated.'
        : 'Add measurable or observable mission impact: who benefited, what changed, what risk was reduced, or what decision was enabled.',
      clearScope
        ? 'The scope and duration help establish the appropriate level.'
        : 'State the period, locations, organizations affected, responsibility, and whether the achievement was a single act or sustained service.',
      documented
        ? 'The recommendation identifies supporting evidence.'
        : 'Identify records or witnesses that substantiate the achievement, such as orders, reports, products, evaluations, rosters, or partner feedback.'
    ]
  };
}
