const TYPO_ALIASES = new Map([
  ['alchohol', 'alcohol'], ['alchol', 'alcohol'], ['liqour', 'liquor'],
  ['moonshien', 'moonshine'], ['mooshine', 'moonshine'],
  ['tomahak', 'tomahawk'], ['tomahwk', 'tomahawk'],
  ['electical', 'electrical'], ['electricty', 'electricity'],
  ['equipement', 'equipment'], ['intoxicted', 'intoxicated'],
  ['marajuana', 'marijuana'], ['mariquana', 'marijuana'],
  ['threten', 'threaten'], ['assualt', 'assault'], ['explsive', 'explosive']
]);

const normalize = value => String(value || '')
  .toLowerCase()
  .replace(/[’‘]/g, "'")
  .replace(/[^a-z0-9'\s-]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const normalizeTypos = value => normalize(value)
  .split(' ')
  .map(token => TYPO_ALIASES.get(token) || token)
  .join(' ');

const hasAny = (text, patterns) => patterns.some(pattern => pattern.test(text));

const REPORTING_CONTEXT = [
  /\b(?:ask|investigat|document|report|assess|confirm|verify|discuss|warn|brief|observe|record|identify)\b/,
  /\b(?:reports?|concerns?|allegations?|incident|misuse|effects?|risk|pattern)\b/
];

const AUTHORIZED_CONTEXT = [
  /\b(?:command|commander|legal|funding|fiscal|contracting|host nation|site leadership)\b.{0,45}\b(?:approv|authoriz|coordinate|review)/,
  /\b(?:approv|authoriz|coordinate|review)(?:e|es|ed|ing|al)?\b.{0,45}\b(?:command|commander|legal|funding|fiscal|contracting|host nation|site leadership)/
];

const MISSION_PURPOSE = [
  /\b(?:mission|training|engagement|assessment|kle|information|objective|commander'?s intent|rapport)\b.{0,50}\b(?:purpose|support|advance|require|objective|outcome)/,
  /\b(?:purpose|support|advance|require|objective|outcome)\b.{0,50}\b(?:mission|training|engagement|assessment|kle|information|commander'?s intent|rapport)/
];

const CONCEPTS = [
  {
    id: 'unsafe-infrastructure-tampering',
    label: 'Unsafe or unauthorized tampering with infrastructure or equipment',
    severity: 'critical',
    signals: [
      /\b(?:play|mess|tamper|experiment)(?:s|ed|ing)?\b.{0,35}\b(?:wires?|cables?|panels?|switches|breakers?|transformers?|equipment|machinery|controls?)\b/,
      /\b(?:hit|strike|smash|break|whack|swing at)(?:s|ed|ing)?\b.{0,45}\b(?:lights?|bulbs?|wires?|cables?|panels?|switches|equipment|machinery|transformers?|tanks?|pipes?|facility)\b/,
      /\b(?:cut|pull|disconnect|rewire|open|remove)(?:s|ed|ing)?\b.{0,35}\b(?:live )?(?:wires?|cables?|panels?|switches|breakers?|equipment|controls?)\b/
    ],
    exemptions: [...REPORTING_CONTEXT, ...AUTHORIZED_CONTEXT]
  },
  {
    id: 'weapon-misuse-concept',
    label: 'Weapon misuse, violent intimidation, or reckless projectile use',
    severity: 'critical',
    signals: [
      /\b(?:throw|launch|hurl|swing|brandish|whip out|draw)(?:s|n|ed|ing)?\b.{0,35}\b(?:tomahawk|axe|hatchet|knife|machete|weapon|firearm|gun)\b/,
      /\b(?:tomahawk|axe|hatchet|knife|machete|weapon|firearm|gun)\b.{0,30}\b(?:at|toward|into|against)\b/
    ],
    exemptions: REPORTING_CONTEXT
  },
  {
    id: 'stakeholder-disrespect-concept',
    label: 'Disrespect, contempt, or deliberate insult toward a stakeholder',
    severity: 'serious',
    signals: [
      /\b(?:thank|tell)(?:s|ed|ing)?\b.{0,30}\b(?:host|stakeholder|poc|official|leader|them|him|her)\b.{0,20}\bfor nothing\b/,
      /\b(?:insult|mock|ridicule|berate|curse at|cuss out|humiliate)(?:s|ed|ing)?\b.{0,40}\b(?:host|stakeholder|poc|official|leader|local|them|him|her)\b/
    ],
    exemptions: REPORTING_CONTEXT
  },
  {
    id: 'unauthorized-alcohol-distribution',
    label: 'Unauthorized distribution of alcohol during a stakeholder engagement',
    severity: 'serious',
    signals: [
      /\b(?:pass around|share|serve|offer|give|hand out|distribute|bring)(?:s|d|ed|ing)?\b.{0,45}\b(?:moonshine|hooch|booze|vodka|liquor|beer|alcohol|whiskey|rum)\b/,
      /\b(?:moonshine|hooch|booze|vodka|liquor|beer|alcohol|whiskey|rum)\b.{0,40}\b(?:host|local|stakeholder|poc|official|leader|staff|everyone)\b/
    ],
    exemptions: REPORTING_CONTEXT
  },
  {
    id: 'unauthorized-social-event',
    label: 'Unapproved social event, entertainment, gift, or expenditure risk',
    severity: 'questionable',
    signals: [
      /\b(?:set up|arrange|organize|host|throw|hold|plan|pay for|fund|sponsor)\b.{0,55}\b(?:party|rager|bash|blowout|celebration|reception|cookout|bbq|barbecue|banquet|night out|entertainment|entertain|outing|festival)/,
      /\b(?:show (?:them|everyone)|give (?:them|everyone))\b.{0,35}\b(?:a good time|how americans party)/,
      /\b(?:gift|present|souvenir|token)\b.{0,45}\b(?:staff|official|leader|stakeholder|poc|community)/
    ],
    exemptions: [...AUTHORIZED_CONTEXT, ...MISSION_PURPOSE]
  },
  {
    id: 'mission-abandonment-concept',
    label: 'Deliberate abandonment of the mission or assigned engagement',
    severity: 'serious',
    signals: [
      /\b(?:skip|ditch|abandon|blow off|ignore|leave|walk away|forget)\b.{0,40}\b(?:mission|task|work|assignment|engagement|meeting|site|stakeholder|everyone|it|this)/,
      /\b(?:go|head|leave|depart)\b.{0,25}\b(?:bar|club|casino|party|home|vacation|personal entertainment)/,
      /\b(?:hang out|relax|have fun|take the day off)\b.{0,45}\b(?:instead|rather than|not do|no work)/,
      /\b(?:go on|start|begin|continue)\b.{0,25}\b(?:all-day|multi-day|[2-9]|two|three|four|five|six|seven)\b.{0,20}\b(?:day|night)?\b.{0,15}\bbender\b/,
      /\b(?:high[ -]?tail|hightail|bug out|take off|flee|make (?:a )?run for it|get out of dodge|disappear)\b/
    ]
  },
  {
    id: 'intoxication-concept',
    label: 'Misuse of funds or mission-compromising intoxication',
    severity: 'serious',
    signals: [
      /\b(?:drink|get|become|return|arrive|show up|party)\b.{0,35}\b(?:drunk|hammered|wasted|intoxicated)/,
      /\b(?:rager|bender|drinking spree|booze cruise|pub crawl)\b/,
      /\b(?:smoke|light|use)\b.{0,20}\b(?:joint|blunt|weed|marijuana|cannabis)/,
      /\b(?:offer|serve|give|hand out|bring)\b.{0,35}\b(?:booze|vodka|liquor|beer|alcohol)\b.{0,45}\b(?:local|stakeholder|official|leader|poc|staff)/
    ],
    exemptions: REPORTING_CONTEXT
  },
  {
    id: 'unauthorized-promise-concept',
    label: 'Unauthorized promise of assistance, funding, material, or a specific outcome',
    severity: 'serious',
    signals: [
      /\b(?:i|we|our team)\b.{0,12}\b(?:promise|guarantee|commit)/,
      /\b(?:i|we|our team)(?: will|'ll)\b.{0,25}\b(?:fund|pay|build|repair|replace|buy|purchase|deliver|provide|donate|supply|give|get you)/
    ],
    exemptions: [/\b(?:cannot|can't|will not|won't|do not|don't|never)\b.{0,16}\b(?:promise|guarantee|commit)/, ...AUTHORIZED_CONTEXT]
  },
  {
    id: 'coercion-concept',
    label: 'Corruption, theft, coercion, or intimidation',
    severity: 'critical',
    signals: [
      /\b(?:threaten|intimidate|coerce|extort|bribe|steal|embezzle|force)\b/,
      /\b(?:arrest|detain|interrogate|search)\b.{0,45}\b(?:everyone|people|locals|without|until they)/
    ],
    exemptions: REPORTING_CONTEXT
  },
  {
    id: 'destructive-concept',
    label: 'Destruction, violence, or reckless endangerment',
    severity: 'critical',
    signals: [
      /\b(?:burn|torch|destroy|vandalize|attack|assault|shoot|kill|set fire|start fire)\b/,
      /\b(?:damage|wreck)\b.{0,30}\b(?:vehicle|building|property|equipment|facility)/,
      /\b(?:plant|place|attach|hide|set|rig)\b.{0,30}\b(?:c-?4|explosive|bomb|ied|charge|dynamite)\b/,
      /\b(?:detonate|explode|blow up|bomb)\b.{0,40}\b(?:tank|facility|building|vehicle|bridge|dam|school|clinic|port|utility|infrastructure|pipeline|substation)/
    ],
    exemptions: REPORTING_CONTEXT
  }
];

export function classifyBehavior(action = '') {
  const text = normalizeTypos(action);
  if (!text) return [];

  return CONCEPTS.flatMap(concept => {
    if (!hasAny(text, concept.signals)) return [];
    if (concept.exemptions && hasAny(text, concept.exemptions)) return [];
    return [{
      id: concept.id,
      label: concept.label,
      severity: concept.severity,
      evidence: concept.signals.filter(pattern => pattern.test(text)).length,
      source: 'behavior-concept'
    }];
  });
}

export function behaviorRisk(action = '') {
  const classifications = classifyBehavior(action);
  const rank = { questionable: 1, serious: 2, critical: 3 };
  const severity = classifications.reduce(
    (highest, item) => rank[item.severity] > rank[highest] ? item.severity : highest,
    'questionable'
  );
  return { classifications, severity, detected: classifications.length > 0 };
}
