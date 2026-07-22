const VERSION = '1.0.0';

const DATA = {
  environments: [
    ['permissive', 'permissive stabilization'], ['uncertain', 'uncertain stabilization'],
    ['disaster', 'disaster response'], ['competition', 'competition below armed conflict'],
    ['hostile', 'hostile and contested']
  ],
  geographies: [
    ['urban', 'dense urban district'], ['rural', 'rural agricultural district'],
    ['border', 'border community'], ['coastal', 'coastal municipality'],
    ['displacement', 'displaced-person settlement'], ['mountain', 'mountain village'],
    ['industrial', 'industrial corridor']
  ],
  sites: [
    ['clinic', 'district clinic', 'public health', '*'],
    ['water', 'water distribution facility', 'essential services', '*'],
    ['market', 'central market', 'local economy', 'urban,rural,border,coastal,displacement,mountain'],
    ['port', 'commercial port', 'transportation and commerce', 'coastal'],
    ['irrigation', 'irrigation cooperative', 'food and water security', 'rural,border,mountain'],
    ['municipal', 'municipal services office', 'governance', 'urban,coastal,industrial'],
    ['distribution', 'aid distribution point', 'humanitarian assistance', 'urban,border,coastal,displacement'],
    ['substation', 'electrical substation', 'essential services', 'urban,rural,border,coastal,mountain,industrial'],
    ['school', 'community school', 'education and community life', '*']
  ],
  missions: [
    ['civil-recon', 'Civil Reconnaissance', 'identify civil vulnerabilities and capabilities'],
    ['kle', 'Key Leader Engagement', 'build rapport and reconcile stakeholder accounts'],
    ['network', 'Civil Network Development', 'map relationships and identify coordination gaps'],
    ['infrastructure', 'Infrastructure Assessment', 'assess service capacity and second-order effects'],
    ['displacement', 'Population Displacement Assessment', 'identify needs, movement patterns, and protection concerns'],
    ['humanitarian', 'Humanitarian Assistance Coordination', 'deconflict assistance and improve local ownership'],
    ['civil-info', 'Civil Information Collection', 'validate reports and distinguish fact from influence'],
    ['governance', 'Transitional Governance Support', 'evaluate legitimacy, capacity, and representation']
  ],
  stakeholders: [
    'municipal leader', 'religious community leader', 'local police commander', 'district health director',
    'NGO field coordinator', 'business association representative', 'school administrator',
    'utility operations manager', 'displaced-community representative', 'local journalist',
    "women's council representative", 'youth organization leader'
  ],
  complications: [
    ['conflicting reports from credible sources', 'A second source disputes the timeline you were given.'],
    ['suspected diversion of limited resources', 'Inventory records no longer match what is physically present.'],
    ['a cultural misunderstanding that threatens rapport', 'A routine request is interpreted as disrespectful by part of the community.'],
    ['deteriorating security near the engagement', 'Local partners report a change in the security situation nearby.'],
    ['rapidly spreading misinformation', 'A widely shared message falsely attributes a local decision to coalition forces.'],
    ['political interference in technical decisions', 'An influential official pressures the team to exclude a rival neighborhood.'],
    ['competing organizations duplicating effort', 'Another organization announces a conflicting plan without consulting local officials.'],
    ['deep host-nation distrust of outside assistance', "A stakeholder challenges the team's motives in front of the group."],
    ['unequal access for a vulnerable population', 'The team learns that one group cannot safely reach the service site.'],
    ['outdated and incomplete civil data', 'The official population estimate is contradicted by recent movement reports.']
  ]
};

const SITE_CONTEXT = {
  clinic: {
    stakeholders: ['clinic director', 'senior nurse', 'community health volunteer', 'district health officer'],
    opening: 'The sharp scent of disinfectant reaches you before the clinic comes fully into view. Families wait beneath a patched awning while a nurse moves quickly between the doorway and a crowded treatment room.',
    welcome: 'The clinic director meets your team beside a desk stacked with handwritten patient logs.',
    line: 'We are still operating, but that does not mean we are keeping up.',
    secondReason: 'has come to compare the clinic’s account with conditions reported in surrounding neighborhoods'
  },
  water: {
    stakeholders: ['utility operations manager', 'municipal engineer', 'public health officer', 'neighborhood representative'],
    opening: 'Pumps thrum behind the concrete walls of the water facility, occasionally interrupted by the hard rattle of an aging valve. Residents wait outside with containers despite the posted distribution schedule.',
    welcome: 'The utility operations manager wipes dust from a maintenance ledger and gestures toward the treatment line.',
    line: 'The system runs every day. The question is who receives enough when pressure drops.',
    secondReason: 'represents communities reporting inconsistent access and has asked to observe the visit'
  },
  market: {
    stakeholders: ['market association chair', 'produce vendor', 'municipal licensing officer', 'transport cooperative representative'],
    opening: 'The market is loud with bargaining, handcarts, and delivery engines, but several stalls remain shuttered in the busiest row. Vendors glance toward your team while continuing to work.',
    welcome: 'The market association chair greets you near the loading area with a folder of complaints tucked under one arm.',
    line: 'Business looks normal from the road. Walk the back rows before you decide that it is.',
    secondReason: 'depends on the market for daily income and disputes the official explanation for the closed stalls'
  },
  port: {
    stakeholders: ['port director', 'harbor master', 'customs supervisor', 'dockworkers representative'],
    opening: 'Diesel exhaust and salt air hang over the port as cranes pause above a line of backed-up cargo. Crews continue working, but every delay seems to draw another supervisor to the quay.',
    welcome: 'The port director meets you at the edge of the controlled area with a manifest in hand.',
    line: 'Cargo is moving, but not at the rate the reports suggest.',
    secondReason: 'is responsible for the people or process most affected by the current delays'
  },
  irrigation: {
    stakeholders: ['irrigation cooperative chair', 'canal maintenance supervisor', 'smallholder farmer representative', 'district agricultural officer'],
    opening: 'A narrow canal cuts through dry fields toward the irrigation cooperative, its waterline visibly below the stain marks on the concrete. Several farmers have gathered near a locked control gate.',
    welcome: 'The cooperative chair walks out to meet you carrying allocation sheets marked with recent corrections.',
    line: 'There is enough water on paper. The fields are telling a different story.',
    secondReason: 'has come because water allocations directly affect the next planting cycle'
  },
  municipal: {
    stakeholders: ['municipal administrator', 'public works director', 'neighborhood council representative', 'civil registry supervisor'],
    opening: 'The municipal office is busy with residents moving between service windows, each carrying forms, receipts, or handwritten requests. A generator hums unevenly behind the building.',
    welcome: 'The municipal administrator welcomes your team in a meeting room where unresolved cases are stacked along one wall.',
    line: 'The offices are open. Capacity is another question.',
    secondReason: 'has requested the meeting after repeated service delays affected their community'
  },
  distribution: {
    stakeholders: ['distribution site manager', 'NGO field coordinator', 'community representative', 'warehouse custodian'],
    opening: 'A line curves around the aid distribution point while volunteers call household numbers over the noise. Pallets are being opened faster than the paperwork can be reconciled.',
    welcome: 'The distribution site manager steps away from the registration table to brief your team.',
    line: 'We can move supplies quickly, or account for every discrepancy. Today we are struggling to do both.',
    secondReason: 'is present to monitor whether assistance is reaching the intended population'
  },
  substation: {
    stakeholders: ['substation supervisor', 'municipal electrical engineer', 'hospital facilities manager', 'neighborhood representative'],
    opening: 'The electrical substation vibrates with a low mechanical hum. One fenced section is quiet, and fresh repair marks stand out against older weathered equipment.',
    welcome: 'The substation supervisor meets you outside the safety boundary and begins with the loads the facility can still carry.',
    line: 'The lights are on now. That is not the same as saying the system is stable.',
    secondReason: 'relies on this substation for a critical service and wants the downstream risk understood'
  },
  school: {
    stakeholders: ['school administrator', 'parent association representative', 'municipal education officer', 'senior teacher'],
    opening: 'Children’s voices drift from open classroom windows as your team enters the school courtyard. A teacher redirects a game away from a section of cracked pavement while parents wait near the front office.',
    welcome: 'The school administrator meets you with an enrollment ledger and a ring of well-used keys.',
    line: 'The school is still teaching, but every week we solve another problem that is not in the lesson plan.',
    secondReason: 'asked to attend because families have raised concerns that do not appear in the school’s official reporting'
  }
};

function hashSeed(value) {
  let h = 1779033703 ^ value.length;
  for (let i = 0; i < value.length; i += 1) {
    h = Math.imul(h ^ value.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (h ^ (h >>> 16)) >>> 0;
}

function randomFor(seed) {
  let state = hashSeed(`${VERSION}|${seed}`);
  return () => {
    let t = (state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (items, rng) => items[Math.floor(rng() * items.length)];
function sample(items, count, rng) {
  const pool = [...items];
  return Array.from({ length: Math.min(count, pool.length) }, () => pool.splice(Math.floor(rng() * pool.length), 1)[0]);
}

export function createMissionSeed() {
  const bytes = new Uint32Array(2);
  if (window.crypto?.getRandomValues) window.crypto.getRandomValues(bytes);
  else { bytes[0] = Date.now(); bytes[1] = Math.floor(Math.random() * 0xffffffff); }
  return `HIP-${bytes[0].toString(36)}-${bytes[1].toString(36)}`.toUpperCase();
}

export function generateScenario(seed, { day = 1, duration = 3, role = 'sgt' } = {}) {
  const normalized = String(seed).trim().toUpperCase();
  if (!normalized) throw new Error('Scenario seed is required');
  const rng = randomFor(`${normalized}|${role}`);
  const geography = pick(DATA.geographies, rng);
  const validSites = DATA.sites.filter(site => site[3] === '*' || site[3].split(',').includes(geography[0]));
  const site = pick(validSites, rng);
  const relatedSite = pick(validSites.filter(candidate => candidate[0] !== site[0]), rng);
  const environment = pick(DATA.environments, rng);
  const mission = pick(DATA.missions, rng);
  const difficulty = role === 'chief' ? 4 : role === 'sgt' ? 3 : role === 'canco' ? 2 : 1;
  const siteContext = SITE_CONTEXT[site[0]];
  const localStakeholders = sample(siteContext.stakeholders, Math.min(2 + difficulty, 4), rng);
  const supplementalStakeholders = sample(DATA.stakeholders.filter(name => !localStakeholders.includes(name)), 1, rng);
  const stakeholders = [...localStakeholders, ...supplementalStakeholders].slice(0, Math.min(2 + difficulty, 5));
  const complications = sample(DATA.complications, Math.min(1 + Math.floor(difficulty / 2), 3), rng);
  const complexityMultiplier = 1 + (day / duration) * 0.4;
  const standard = `Assess the ${site[1]} using ASCOPE and PMESII-PT; distinguish facts, assumptions, and information gaps; validate reporting with more than one source; document civil vulnerabilities, local capabilities, and recommended follow-on actions.`;
  const opening = `${siteContext.opening} ${siteContext.welcome}\n\n“${siteContext.line}” Nearby, the ${stakeholders[1]} ${siteContext.secondReason}. ${complications[0][1]}`;
  return {
    id: normalized,
    seed: normalized,
    generatorVersion: VERSION,
    name: `${mission[1]} — ${site[1]}`,
    location: `${site[1]}, ${geography[1]}`,
    hadrFocus: site[2],
    narrative: `${opening}\n\nYour task is to ${mission[2]}. Initial reporting points to ${complications[0][0]}, but the people available to speak with you do not agree on the cause, urgency, or best response. What you establish here—and what you choose to verify—will shape the rest of the mission.`,
    keyStakeholders: stakeholders,
    lead: {
      id: `${normalized}-LEAD-1`,
      label: relatedSite[1],
      source: stakeholders[0],
      contact: SITE_CONTEXT[relatedSite[0]].stakeholders[0],
      reason: `${stakeholders[0]} indicates that activity at the ${relatedSite[1]} may affect conditions at this location.`,
      discoveryText: `When you ask who else influences the problem, the ${stakeholders[0]} pauses and lowers their voice. “You should speak with the ${SITE_CONTEXT[relatedSite[0]].stakeholders[0]} at the ${relatedSite[1]}. What happens there reaches us before anyone puts it in an official report.”`,
      scene: `${SITE_CONTEXT[relatedSite[0]].opening} Your team arrives with only the name provided by the ${stakeholders[0]} and a connection that has not yet been verified. ${SITE_CONTEXT[relatedSite[0]].welcome}`,
      openingLine: SITE_CONTEXT[relatedSite[0]].line,
      tension: complications[Math.min(1, complications.length - 1)][1],
      originLocation: site[1],
      returnPrompt: `The information from the ${relatedSite[1]} changes how the team understands conditions at the ${site[1]}. You will need to decide what is confirmed, what remains only a claim, and whether the original stakeholders should be re-engaged.`
    },
    suggestedProducts: [`${site[1]} Site Assessment`, 'KLE Record', 'SITREP', 'Link Diagram', 'Stakeholder Baseball Card', 'ASCOPE Worksheet', 'PMESII-PT Worksheet'],
    referenceStandards: {
      planned: `PLANNED ASSESSMENT: ${standard} Produce a comprehensive assessment and coordination recommendation.`,
      deliberate: `DELIBERATE ASSESSMENT: ${standard} Record the most significant limitations and route them appropriately.`,
      initial: `INITIAL ASSESSMENT: Establish a reliable baseline, identify urgent concerns, and define requirements for follow-on collection.`
    },
    injects: complications.map((item, index) => ({ id: `${normalized}-${index + 1}`, text: item[1] })),
    day,
    complexityMultiplier,
    difficultyContext: day === 1 ? 'Introduction' : day === duration ? 'Final Assessment' : 'Ongoing',
    metadata: { environment: environment[0], geography: geography[0], site: site[0], mission: mission[0] }
  };
}

export function generateMission({ seed, days, role }) {
  if (!Number.isInteger(days) || days < 1 || days > 29) throw new Error('Mission length must be between 1 and 29 days');
  return Array.from({ length: days }, (_, index) => generateScenario(`${seed}-DAY-${index + 1}`, { day: index + 1, duration: days, role }));
}
