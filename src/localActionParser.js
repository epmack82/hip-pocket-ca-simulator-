// A bounded, local language parser. Unknown clauses remain unknown; mentioning
// a word is never by itself evidence that the trainee performed that act.
const unique = values => [...new Set(values.filter(Boolean))];
const aliases = { municiple: 'municipal', municipial: 'municipal', introducions: 'introductions', introductioons: 'introductions', interpretor: 'interpreter', interperter: 'interpreter', permision: 'permission', childern: 'children', gree: 'greet' };

export function normalizeActionText(value = '') {
  return String(value).normalize('NFKC').toLowerCase().replace(/[’‘]/g, "'")
    .replace(/\bc[ -]?4\b/g, 'c4').replace(/\b[a-z]+\b/g, word => aliases[word] || word);
}

function distance(a, b) {
  let row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const next = [i];
    for (let j = 1; j <= b.length; j += 1) next[j] = Math.min(next[j - 1] + 1, row[j] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    row = next;
  }
  return row[b.length];
}

export function resolveStakeholders(text, stakeholders = []) {
  const words = normalizeActionText(text).match(/[a-z]+/g) || [];
  const scored = stakeholders.map((name, index) => {
    const title = normalizeActionText(name).match(/[a-z]+/g) || [];
    const role = title[title.length - 1];
    // A site/topic noun ("clinic service", "school records") does not name
    // its official. Require the role, with bounded typo tolerance.
    const addressed = words.includes(role) || (role?.length >= 7 && words.some(w => w.length >= 7 && distance(w, role) <= 2));
    const score = title.filter(w => w.length >= 4).reduce((sum, word) => sum + (words.includes(word) ? 3 : word.length >= 7 && words.some(w => w.length >= 7 && distance(w, word) <= 2) ? 2 : 0), 0);
    return { name, index, score: addressed ? score : 0 };
  }).filter(item => item.score >= 3).sort((a, b) => b.score - a.score || a.index - b.index);
  // Shared words such as municipal do not engage every municipal official.
  return scored.filter(item => item.score === scored[0].score).map(item => item.name);
}

const definitions = [
  ['destruction', /\b(?:set\s+fire\s+to|burn(?:ed|ing)?\s+(?:down\s+)?(?:the|a|this)|torch|destroy|demolish|blow\s+up|detonate|plant\s+(?:c4|explosives?|a\s+bomb)|smash|break\s+(?:all|each|the))\b/],
  ['violence', /\b(?:tomahawk|weapon|gun|rifle|axe)\b.{0,55}\b(?:throw|launch|swing|fire|aim)\b|\b(?:assault|shoot|stab|punch|kick|kill|beat\s+up|attack)\b|\b(?:throw|launch|swing|fire|aim)\b.{0,55}\b(?:tomahawk|weapon|gun|rifle|axe)\b/],
  ['unsafe-equipment', /\b(?:hit|play(?:ing)?\s+with|tamper\s+with|touch|pull|cut|open|climb)\b.{0,90}\b(?:wires?|light\s*bulbs?|electrical|valves?|machinery|controls?|panels?|transformer|tank|fence)\b/],
  ['intoxication', /\b(?:get|got|become|arrive|return|everyone|everybody)\b.{0,25}\b(?:drunk|hammered|wasted|intoxicated)\b|\b(?:bender|rager)\b|\b(?:light|smoke|use)\b.{0,20}\b(?:joint|blunt|weed|marijuana|cocaine|meth)\b/],
  ['substance-offer', /\b(?:offer|give|hand|pass|distribute|provide)\w*\b.{0,65}\b(?:booze|alcohol|vodka|moonshine|drugs|prescription pills)\b/],
  ['abandonment', /\b(?:skip|abandon|ditch|leave)\b.{0,25}\b(?:mission|meeting|duty|post|assignment|work)\b|\b(?:head|go)\b.{0,20}\bstrip\s+club\b/],
  ['coercion', /\b(?:arrest|detain|threaten|blackmail|bribe|force|coerce)\b/],
  ['harassment', /\b(?:harass|grope|catcall|discriminate|mock|humiliate)\b|\b(?:pressure|demand|insist)\b.{0,50}\b(?:sex|sexual|sleep with|intercourse)\b|\b(?:deny|exclude|refuse)\b.{0,60}\bbecause\b.{0,50}\b(?:religion|race|gender|disabled|ethnicity|sexual orientation)\b/],
  ['social-event', /\b(?:host|organize|throw|set\s+up|entertain|arrange)\b.{0,60}\b(?:party|banquet|rager|celebration|cookout)\b/],
  ['performance', /\b(?:rap|rapping|freestyle|dance|dancing|sing|perform)\b/],
  ['contact', /\b(?:play|join|photograph|film|touch|hug|carry|interview|escort|approach|speak|talk|give)\b.{0,80}\b(?:children|kids|students|patients|detainees|refugees|survivors|disabled|displaced|elderly|minor)\b/],
  ['interpreter-exclusion', /\b(?:leave|left|keep|send|sent|exclude)\b.{0,35}\b(?:interpreter|translator)\b.{0,45}\b(?:outside|behind|away|out|alone)\b|\bwithout\s+(?:the|my|our)\s+(?:interpreter|translator)\b/],
  ['interpreter-substitution', /\b(?:tell|ask|have|make|send|leave)\b.{0,30}\b(?:interpreter|translator)\b.{0,65}\b(?:lead|conduct|handle|do|give|talk\s+to)\b/],
  ['interpreter-support', /\b(?:use|work\s+with|involve|ask|brief|through|with|leverage|leveraging)\b.{0,35}\b(?:interpreter|translator)\b|\b(?:interpretation|back.translation|translate|short phrases)\b/],
  ['permission-request', /\b(?:ask|request|seek|obtain)\b.{0,35}\b(?:permission|consent|approval)\b/],
  ['invitation', /\b(?:invite|include|welcome)\b.{0,80}\b(?:join|conversation|discussion|meeting|engineer|administrator|teacher|nurse)\b/],
  ['introduction', /\b(?:introduc\w*|greet\w*|explain\s+(?:our|the|my)\s+(?:purpose|mission))\b/],
  ['gift', /\b(?:offer|give|present|bring|provide)\b.{0,55}\b(?:gift|token|souvenir)\b|\bpresent\s+(?:with\s+)?a\s+token\b/],
  ['inquiry', /\b(?:ask|inquire|question|listen|discuss)\b|\b(?:tell\s+(?:me|us)|what\s+(?:is|are|has)|how\s+(?:many|does|has)|who\s+(?:is|else|has))\b/],
  ['observation', /\b(?:observe|inspect|assess|walk\s+(?:through|around)|review|examine|look\s+at)\b/],
  ['validation', /\b(?:validate|verify|confirm|compare|cross.check|corroborate)\b/],
  ['coordination', /\b(?:coordinate|refer|notify|brief|route|contact|report|send\s+(?:an?\s+)?update)\b/],
  ['documentation', /\b(?:document|record|write|prepare|complete|submit|send|attach)\b/],
  ['accountability', /\b(?:apologize|apologise|acknowledge|correct|retract|take responsibility)\b/]
];

export function parseLocalAction(rawText = '', scenario = {}, world = {}) {
  const text = normalizeActionText(rawText);
  const stakeholders = scenario.keyStakeholders || [];
  const globalTargets = resolveStakeholders(text, stakeholders);
  const clauses = text.split(/(?:[.!?;\n]+|\b(?:and\s+then|then|while|but)\b|\band\s+(?=(?:i|we)\s))/).map(s => s.trim()).filter(Boolean);
  const actions = [];
  let conversationTarget = world.sites?.[scenario.id]?.conversationTarget || stakeholders[0] || 'Local stakeholder';
  if (globalTargets.length === 1) conversationTarget = globalTargets[0];
  clauses.forEach((clause, sequence) => {
    const targets = resolveStakeholders(clause, stakeholders);
    const thirdParty = /^(?:the\s+)?(?:host|teacher|administrator|interpreter|translator|he|she|they|another soldier)\s+(?:says?|reports?|threatens?|attacks?|asks?|offers?|burns?|plays?|leaves?)\b/.test(clause);
    const reporting = thirdParty || /^(?:i |we |the team )?(?:report|document|ask about|ask whether|ask if|investigate|record|warn about|prevent)\b/.test(clause);
    const negated = /^(?:i |we |the team )?(?:(?:do|will|would|can|should)\s+not|don't|won't|never|refuse to|decide not to|choose not to)\b/.test(clause);
    const hypothetical = /^(?:what if|if|suppose|hypothetically)\b/.test(clause);
    const conditional = /\b(?:only (?:after|with|if)|once .{0,35}(?:grants|agrees)|if .{0,35}(?:agrees|approves))\b/.test(clause);
    const denied = /\b(?:without|no|denied|refused)\s+(?:the\s+)?(?:permission|consent|approval)|\bnot\s+(?:approved|authorized)\b/.test(clause);
    const granted = !denied && !conditional && /\bwith\s+(?:(?:the|their|explicit|prior|administrator's|teacher's|guardian's|parent's)\s+)*(?:permission|consent|approval)|\b(?:administrator|teacher|guardian|parent|manager|host)\s+(?:has\s+)?(?:agreed|approved|invited|granted)|\b(?:approved|authorized|invited)\s+(?:visit|activity|session|event)\b/.test(clause);
    const kinds = definitions.filter(([kind, re]) => {
      const match = clause.match(re);
      if (!match) return false;
      const before = clause.slice(0, match.index);
      if (/\b(?:not|never|won't|don't)\s+(?:\w+\s+){0,2}$/.test(before)) return false;
      if (kind === 'violence' && /\b(?:kick|shoot)\b/.test(match[0]) && /\b(?:soccer|football|ball|photo|picture|video|basket)\b/.test(clause) && !/\b(?:person|teacher|administrator|host|child|children|patient|guard|soldier)\b/.test(clause.slice(match.index + match[0].length, match.index + match[0].length + 35))) return false;
      if (kind === 'destruction' && /\b(?:break the ice|destroy (?:the )?(?:rumor|rumour|myth)|burn (?:the )?midnight oil)\b/.test(clause)) return false;
      return true;
    }).map(([kind]) => kind);
    const promise = /\b(?:promise|guarantee|(?:i|we|the army|the team)\s+will\s+(?:buy|build|bring|deliver|fix|fund|replace|provide|pay))\b/.test(clause)
      && /\b(?:assistance|support|money|funds|supplies|equipment|school|clinic|water|window|building|truck|repair|buy|build|pay)\b/.test(clause)
      && !/\b(?:cannot|can't|no|never|not to|not authorized to)\s+(?:make\s+)?(?:promise|guarantee|provide|commit)|\b(?:provide|deliver)\s+(?:an?\s+)?(?:update|report|brief)\b/.test(clause);
    if (promise) kinds.push('promise');
    // A polite question about permission is not completed inspection or contact.
    const request = kinds.includes('permission-request') || /^(?:i |we )?(?:ask|request)\b.{0,70}\b(?:to (?:inspect|observe|play|interview)|may (?:i|we)|can (?:i|we))\b/.test(clause);
    const protectedPopulation = /\b(?:children|kids|students|minors?|schoolyard|classroom)\b/.test(clause) ? 'children'
      : /\b(?:patients?|detainees?|refugees?|survivors?|disabled|displaced|elderly)\b/.test(clause) ? 'vulnerable people' : 'none';
    const suppressed = kind => (negated || hypothetical || reporting) && !['coordination', 'inquiry', 'documentation'].includes(kind);
    const operative = unique(kinds.filter(kind => !suppressed(kind)));
    if (request && !operative.includes('permission-request')) operative.push('permission-request');
    const role = operative.includes('interpreter-exclusion') ? 'excluded' : operative.includes('interpreter-substitution') ? 'substituting' : operative.includes('interpreter-support') ? 'supporting' : 'not-mentioned';
    const target = targets[0] || conversationTarget;
    if (targets.length === 1 && !reporting && !negated && !hypothetical) conversationTarget = target;
    actions.push({ id: `act-${sequence + 1}`, description: clause, actor: thirdParty ? 'reported-third-party' : 'trainee', target, targets, sequence: sequence + 1,
      kinds: operative, negated, reporting, hypothetical, conditional, request, permission: granted ? 'stated' : denied ? 'denied' : request ? 'requested' : 'unclear', protectedPopulation, interpreterRole: role,
      confidence: operative.length ? 85 : 25,
      method: /\b(?:records?|ledger|log|inventory|register|second source|another source|independent|direct observation|physical|dates?)\b/.test(clause),
      topic: /\b(?:capacity|condition|water|sanitation|risk|concern|need|problem|issue|priorit|staff|service|change|resource|attendance|enrollment|supply|delay|record|who else)\w*\b/.test(clause)
    });
  });
  const active = actions.filter(a => !a.negated && !a.hypothetical);
  const role = ['excluded', 'substituting', 'supporting'].find(r => active.some(a => a.interpreterRole === r)) || 'not-mentioned';
  const productDefinitions = [
    ['Post-KLE Report', /\b(?:post[- ]?)?kle\s+(?:report|record)\b/], ['Stakeholder Baseball Card', /\bbaseball\s+card\b/],
    ['Site Assessment', /\bsite\s+assessment\b/], ['Daily SITREP', /\bsitrep\b/], ['CA Operations Report', /\bcaoprep\b/],
    ['ASCOPE Worksheet', /\bascope\b/], ['PMESII-PT Worksheet', /\bpmesii[- ]?pt\b/], ['Link Diagram', /\blink\s+diagram\b/]
  ];
  const productText = active.filter(a => !a.reporting && /\b(?:prepare|complete|submit|send|attach|create|write)\w*\b/.test(a.description)).map(a => a.description).join(' ');
  return { source: 'local', intent: active.flatMap(a => a.kinds).join(', ') || 'Unresolved action', actions, participants: unique(active.flatMap(a => a.targets)),
    interpreterRole: role, permission: active.some(a => a.permission === 'denied') ? 'denied' : active.some(a => a.permission === 'stated') ? 'stated' : active.some(a => a.request) ? 'requested' : 'unclear',
    professionalRisk: active.some(a => a.kinds.some(k => ['destruction', 'violence'].includes(k))) ? 'critical' : active.some(a => a.kinds.some(k => ['intoxication', 'harassment', 'coercion', 'unsafe-equipment'].includes(k))) ? 'high' : 'context-dependent',
    protectedPopulation: active.find(a => a.protectedPopulation !== 'none')?.protectedPopulation || 'none',
    missionRelevance: active.some(a => a.topic) ? 'high' : 'unknown', confidence: actions.length ? Math.min(...actions.map(a => a.confidence)) : 0,
    claimedProducts: productDefinitions.filter(([, re]) => re.test(productText)).map(([name]) => name),
    ambiguities: actions.filter(a => !a.kinds.length && !a.negated).map(a => a.description),
    previousInterpreterStatus: world.interpreterStatus || 'available'
  };
}
