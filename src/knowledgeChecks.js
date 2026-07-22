const annexQuestions = [
  {
    id: 'annex-purpose',
    prompt: 'What is the primary purpose of Annex K in an Army plan or order?',
    options: ['Describe how civil affairs operations support the concept of operations', 'Replace the base order', 'Record individual training scores'],
    answer: 0,
    review: 'Review the mission and commander’s intent sections: Annex K describes how CA operations support the larger plan or order.'
  },
  {
    id: 'annex-priority',
    prompt: 'Before departing, what should the team connect its collection and engagements to?',
    options: ['Commander’s intent, assigned tasks, and information requirements', 'Only the site’s physical condition', 'Whichever product is easiest to complete'],
    answer: 0,
    review: 'Review the mission directive and commander’s intent. Collection and products must support an actual decision or requirement.'
  },
  {
    id: 'annex-change',
    prompt: 'If conditions or orders change after the Annex K was issued, what should the team do?',
    options: ['Confirm the current guidance and adjust while documenting assumptions', 'Ignore all changes', 'Treat the Annex K as optional'],
    answer: 0,
    review: 'Annex K remains essential context, but the team must confirm current guidance, FRAGOs, authorities, and constraints.'
  },
  {
    id: 'annex-products',
    prompt: 'Why should expected products and reporting channels be reviewed before the mission?',
    options: ['So collected information reaches the people and decisions it is meant to support', 'So every site receives the same score', 'So the team can avoid stakeholder engagement'],
    answer: 0,
    review: 'Review expected products and reporting. Information has limited value if it is not documented and routed to the appropriate user.'
  }
];

const ascopeQuestions = [
  {
    id: 'ascope-letters',
    prompt: 'What does ASCOPE represent?',
    options: ['Areas, Structures, Capabilities, Organizations, People, Events', 'Actions, Security, Command, Operations, Plans, Effects', 'Areas, Systems, Culture, Order, Politics, Economy'],
    answer: 0,
    review: 'ASCOPE: Areas, Structures, Capabilities, Organizations, People, and Events.'
  },
  {
    id: 'ascope-use',
    prompt: 'Which ASCOPE variable best fits a local water utility’s ability to provide service?',
    options: ['Capabilities', 'Events', 'Areas'],
    answer: 0,
    review: 'Capabilities considers functions and services available to the population. The facility itself may also be considered under Structures.'
  },
  { id: 'ascope-area', prompt: 'A neighborhood is cut off by a flooded bridge. Which ASCOPE variable most directly captures the affected geographic space and access boundary?', options: ['Areas', 'Organizations', 'Events'], answer: 0, review: 'Areas includes geographic, political, administrative, and social boundaries and their effects.' },
  { id: 'ascope-structure', prompt: 'A damaged school building is being considered as an emergency shelter. Which ASCOPE variable addresses the physical facility?', options: ['Structures', 'People', 'Capabilities'], answer: 0, review: 'Structures covers existing infrastructure and physical facilities; its ability to shelter people is also examined as a capability.' },
  { id: 'ascope-organization', prompt: 'A local farmers’ cooperative controls access to irrigation equipment. Which ASCOPE variable captures the cooperative itself?', options: ['Organizations', 'Areas', 'Events'], answer: 0, review: 'Organizations includes formal and informal civil groups and institutions.' },
  { id: 'ascope-people', prompt: 'The team identifies displaced families who cannot safely reach an aid point. Which ASCOPE variable centers this population?', options: ['People', 'Structures', 'Events'], answer: 0, review: 'People examines populations, leaders, demographic groups, and their conditions or relationships.' },
  { id: 'ascope-event', prompt: 'An approaching religious festival will change traffic, crowds, and local operating hours. Which ASCOPE variable applies most directly?', options: ['Events', 'Capabilities', 'Organizations'], answer: 0, review: 'Events includes routine, planned, cyclical, and disruptive activities that affect the civil environment.' },
  { id: 'ascope-cross', prompt: 'A clinic building exists but has no trained staff. Which two ASCOPE variables should the team deliberately distinguish?', options: ['Structures and Capabilities', 'Areas and Events', 'People and Areas'], answer: 0, review: 'The clinic is a Structure; its ability to deliver care is a Capability. A complete assessment often connects multiple variables.' }
];

const pmesiiQuestions = [
  {
    id: 'pmesii-letters',
    prompt: 'What does PMESII-PT represent?',
    options: ['Political, Military, Economic, Social, Information, Infrastructure, Physical Environment, Time', 'People, Mission, Equipment, Security, Intelligence, Infrastructure, Planning, Training', 'Political, Medical, Economic, Security, Interagency, Information, Population, Terrain'],
    answer: 0,
    review: 'PMESII-PT: Political, Military, Economic, Social, Information, Infrastructure, Physical Environment, and Time.'
  },
  {
    id: 'framework-combine',
    prompt: 'Why use ASCOPE and PMESII-PT together?',
    options: ['To examine civil variables and the wider operational systems and effects around them', 'To generate a score automatically', 'To replace source validation'],
    answer: 0,
    review: 'The frameworks help organize analysis from different perspectives; they do not replace judgment, validation, or commander guidance.'
  },
  { id: 'pmesii-political', prompt: 'A mayor redirects resources toward political supporters despite published priorities. Which PMESII-PT variable is most directly involved?', options: ['Political', 'Infrastructure', 'Time'], answer: 0, review: 'Political examines governance, authority, legitimacy, policy, and competition for influence.' },
  { id: 'pmesii-economic', prompt: 'Market closures are eliminating household income and disrupting food prices. Which PMESII-PT variable is primary?', options: ['Economic', 'Military', 'Physical Environment'], answer: 0, review: 'Economic examines production, distribution, livelihoods, markets, resources, and financial activity.' },
  { id: 'pmesii-social', prompt: 'Assistance is increasing tension between two identity groups. Which PMESII-PT variable should organize this analysis?', options: ['Social', 'Infrastructure', 'Time'], answer: 0, review: 'Social examines identity, culture, institutions, demographics, relationships, and social conditions.' },
  { id: 'pmesii-information', prompt: 'A false message about coalition intentions is spreading through local radio and messaging apps. Which variable applies?', options: ['Information', 'Economic', 'Physical Environment'], answer: 0, review: 'Information examines narratives, media, access, communication systems, perception, and influence.' },
  { id: 'pmesii-infrastructure', prompt: 'Loss of electrical power is shutting down water pumps and clinic refrigeration. Which variable is the starting point?', options: ['Infrastructure', 'Political', 'Social'], answer: 0, review: 'Infrastructure examines the systems and facilities that support society and their dependencies.' },
  { id: 'pmesii-physical', prompt: 'Seasonal flooding changes access routes and displaces river communities. Which PMESII-PT variable captures the environmental condition?', options: ['Physical Environment', 'Military', 'Information'], answer: 0, review: 'Physical Environment includes terrain, weather, climate, natural resources, and other environmental conditions.' },
  { id: 'pmesii-time', prompt: 'A repair will succeed only if completed before monsoon season. Which PMESII-PT variable is essential to the assessment?', options: ['Time', 'Political', 'Social'], answer: 0, review: 'Time examines timing, duration, tempo, seasons, deadlines, and historical effects.' },
  { id: 'pmesii-military', prompt: 'Security-force checkpoints are changing civilian movement and access to services. Which PMESII-PT variable applies directly?', options: ['Military', 'Economic', 'Time'], answer: 0, review: 'Military examines military and security actors, capabilities, posture, and effects on the operational environment.' }
];

function hash(value) {
  return [...String(value)].reduce((total, character) => ((total * 33) ^ character.charCodeAt(0)) >>> 0, 5381);
}

function seededOrder(items, seed) {
  return [...items].sort((left, right) => hash(`${seed}|${left.id}`) - hash(`${seed}|${right.id}`));
}

function randomizeOptions(question, seed) {
  const correct = question.options[question.answer];
  const options = [...question.options].sort((left, right) => hash(`${seed}|${left}`) - hash(`${seed}|${right}`));
  return { ...question, options, answer: options.indexOf(correct) };
}

export function getKnowledgeQuestions(phase, attempt = 1, missionSeed = 'HIP-TRAINING') {
  const selectionSeed = `${missionSeed}|${phase}|ATTEMPT-${attempt}`;
  const offset = (attempt - 1) * 2;
  const selected = phase === 'annex'
    ? seededOrder(annexQuestions, `${missionSeed}|ANNEX`).slice(offset, offset + 2)
    : [
        ...seededOrder(ascopeQuestions, `${missionSeed}|ASCOPE`).slice(offset, offset + 2),
        ...seededOrder(pmesiiQuestions, `${missionSeed}|PMESII`).slice(offset, offset + 2)
      ];
  return seededOrder(selected, `${selectionSeed}|MIX`).map(question => randomizeOptions(question, selectionSeed));
}

export function gradeKnowledgeQuestions(questions, answers) {
  const missed = questions.filter(question => Number(answers[question.id]) !== question.answer);
  return { passed: missed.length === 0, missed };
}
