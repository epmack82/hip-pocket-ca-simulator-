const blank = '[Trainee entry required]';

function header(title, scenario) {
  return `${title}
TRAINING PRODUCT — UNCLASSIFIED FICTIONAL SCENARIO
${'='.repeat(64)}
Report ID: ${scenario.seed || scenario.id || blank}
Mission Day: ${scenario.day || blank}
Location: ${scenario.location || blank}
Assessment Focus: ${scenario.hadrFocus || blank}
Prepared By: ${blank}
Date-Time Group: ${blank}`;
}

function scenarioFacts(scenario) {
  const metadata = scenario.metadata || {};
  return `Operational Environment: ${metadata.environment || blank}
Geographic Setting: ${metadata.geography || blank}
Facility/Site: ${metadata.site || blank}
Mission Activity: ${metadata.mission || blank}
Known Stakeholders: ${(scenario.keyStakeholders || []).join('; ') || blank}`;
}

function siteAssessment(scenario, traineeDetails) {
  return `${header(`${(scenario.metadata?.site || 'CIVIL').toUpperCase()} SITE ASSESSMENT`, scenario)}

1. PURPOSE AND SUPPORTED OBJECTIVE
Purpose: Assess civil conditions, capabilities, vulnerabilities, and effects associated with this site.
Supported commander's objective: ${blank}
Trainee notes: ${traineeDetails || blank}

2. SITE IDENTIFICATION
${scenarioFacts(scenario)}
Grid/coordinates: ${blank}
Owner or responsible authority: ${blank}
Primary point of contact: ${blank}

3. ASCOPE OBSERVATIONS
Areas: Boundaries, access routes, affected neighborhoods — ${blank}
Structures: Condition, capacity, damage, accessibility — ${blank}
Capabilities: Services the site can currently provide — ${blank}
Organizations: Government, private, NGO, or community roles — ${blank}
People: Populations served, excluded, displaced, or at risk — ${blank}
Events: Deadlines, seasonal effects, disruptions, or planned activity — ${blank}

4. CAPACITY AND OPERATING CONDITION
Normal capacity: ${blank}
Current capacity: ${blank}
Staffing and skill availability: ${blank}
Equipment and supply status: ${blank}
Operating hours or service schedule: ${blank}

5. DEPENDENCIES AND SECOND-ORDER EFFECTS
Power/fuel dependency: ${blank}
Water/sanitation dependency: ${blank}
Transportation/access dependency: ${blank}
Communications dependency: ${blank}
Effect on the population if service fails: ${blank}

6. VULNERABILITIES AND RISKS
Immediate life, health, or safety concern: ${blank}
Vulnerable or underserved groups: ${blank}
Security or access concern: ${blank}
Potential unintended consequence of assistance: ${blank}

7. INFORMATION VALIDATION
Confirmed facts and sources: ${blank}
Assumptions: ${blank}
Conflicting reports: ${blank}
Information gaps and collection requirements: ${blank}

8. ASSESSMENT AND RECOMMENDATIONS
Overall assessment: ${blank}
Recommended immediate action: ${blank}
Recommended follow-on coordination: ${blank}
Measure of performance: ${blank}
Measure of effectiveness: ${blank}

9. ROUTING AND ATTACHMENTS
Recommended staff/partner routing: S-9 / CIM Cell, then functional staff by subject
Photos, sketch, map, interview notes, or source list attached: ${blank}
Instructor review: REQUIRED BEFORE TREATING AS A COMPLETED PRODUCT`;
}

function stakeholderMap(scenario, traineeDetails) {
  const rows = (scenario.keyStakeholders || [blank]).map((name, index) =>
    `${index + 1}. ${name}
   Role/organization: ${blank}
   Interests and objectives: ${blank}
   Influence: LOW / MEDIUM / HIGH — ${blank}
   Position toward mission: SUPPORTIVE / NEUTRAL / OPPOSED / UNKNOWN
   Relationships/dependencies: ${blank}
   Engagement approach and next action: ${blank}`
  ).join('\n\n');
  return `${header('CIVIL STAKEHOLDER MAP', scenario)}

1. NETWORK PURPOSE
Decision or problem supported: ${blank}
Trainee framing notes: ${traineeDetails || blank}

2. KNOWN ACTORS
${rows}

3. NETWORK ASSESSMENT
Key connector or bridge: ${blank}
Potential spoiler or source of resistance: ${blank}
Underrepresented population or missing voice: ${blank}
Information pathway and trusted messenger: ${blank}
Coordination gap: ${blank}

4. ENGAGEMENT PLAN
Priority engagement: ${blank}
Information to confirm: ${blank}
Commitments or authorities requiring approval: ${blank}
Measure of relationship change: ${blank}

Instructor review: REQUIRED BEFORE TREATING AS A COMPLETED PRODUCT`;
}

function civilInformationUpdate(scenario, traineeDetails) {
  return `${header('CIVIL INFORMATION UPDATE', scenario)}

1. SUMMARY
What changed and why it matters: ${traineeDetails || blank}

2. CONFIRMED CIVIL FACTS
Who: ${blank}
What: ${blank}
Where: ${scenario.location || blank}
When: ${blank}
Why/how: ${blank}
Source and reliability: ${blank}

3. ASCOPE / PMESII-PT RELEVANCE
Relevant civil variables: ${blank}
Effect on civil population: ${blank}
Effect on supported mission: ${blank}

4. ASSESSMENT
Capabilities: ${blank}
Vulnerabilities: ${blank}
Emerging trend or indicator: ${blank}
Assumptions and conflicting information: ${blank}

5. INFORMATION GAPS
Priority question: ${blank}
Best collection source: ${blank}
Required by: ${blank}

6. RECOMMENDATION AND ROUTING
Recommended action: ${blank}
Responsible organization/staff: ${blank}
Coordination required: ${blank}

Instructor review: REQUIRED BEFORE TREATING AS A COMPLETED PRODUCT`;
}

function recommendationMemo(scenario, traineeDetails) {
  return `${header('RECOMMENDED FOLLOW-ON ACTIONS MEMORANDUM', scenario)}

SUBJECT: Follow-on actions for ${scenario.location || blank}

1. PURPOSE
Provide prioritized, supportable recommendations based on current civil information.

2. SITUATION
Known condition: ${scenario.narrative || blank}
Additional trainee observation: ${traineeDetails || blank}

3. KEY FINDINGS
a. Confirmed capability: ${blank}
b. Priority vulnerability: ${blank}
c. Relevant stakeholder/network issue: ${blank}
d. Information gap affecting the decision: ${blank}

4. RECOMMENDED ACTIONS
Priority 1 — Action / owner / suspense: ${blank}
Priority 2 — Action / owner / suspense: ${blank}
Priority 3 — Action / owner / suspense: ${blank}

5. RISK AND MITIGATION
Risk of action: ${blank}
Risk of inaction: ${blank}
Mitigation: ${blank}

6. MEASURES
Measure of performance: ${blank}
Measure of effectiveness: ${blank}

7. COORDINATION AND ROUTING
Host-nation/local coordination: ${blank}
Interagency/NGO coordination: ${blank}
Recommended staff routing: ${blank}

Instructor review: REQUIRED BEFORE TREATING AS A COMPLETED PRODUCT`;
}

function kleRecord(scenario) {
  return `${header('KEY LEADER ENGAGEMENT (KLE) RECORD — TRAINING WORKSHEET', scenario)}

1. ENGAGEMENT DETAILS
Key leader / position / organization: ${blank}
Date-time and location: ${blank}
Team members / interpreter: ${blank}
Purpose tied to mission or commander's intent: ${blank}

2. PREPARATION
Leader's known background, interests, and influence: ${blank}
Desired information or outcome: ${blank}
Cultural and protocol considerations: ${blank}
Questions planned: ${blank}

3. ENGAGEMENT
Key points stated by the leader: ${blank}
Team responses and questions: ${blank}
Observed concerns, tone, or nonverbal indicators: ${blank}
Commitments made by either party: ${blank}

4. ASSESSMENT
Confirmed facts and sources: ${blank}
Claims requiring validation: ${blank}
Relationship or access gained/lost: ${blank}
Relevant links to other actors or organizations: ${blank}

5. FOLLOW-THROUGH
Required action / owner / suspense: ${blank}
Recommended follow-on engagement: ${blank}
Reporting and coordination channel: ${blank}

Training aid: adapt to unit SOP and mission requirements; this is not represented as a prescribed Army form.`;
}

function sitrep(scenario) {
  return `${header('SITUATION REPORT (SITREP) — TRAINING WORKSHEET', scenario)}

REPORTING PERIOD: ${blank}

1. SITUATION / SIGNIFICANT CHANGES
What changed, where, and when: ${blank}

2. CIVIL CONDITIONS
Population effects, capabilities, vulnerabilities, and key events: ${blank}

3. ACTIVITIES COMPLETED
Engagements, assessments, coordination, and products: ${blank}

4. RESULTS AND ASSESSMENT
Confirmed results and significance to the supported mission: ${blank}

5. ISSUES / INFORMATION GAPS / RISKS
Items requiring confirmation, decision, or assistance: ${blank}

6. PLANNED ACTIONS
Next action / owner / suspense: ${blank}

Training aid: final fields and routing must follow the supported headquarters' reporting instructions and unit SOP.`;
}

function frameworkWorksheet(title, labels, scenario) {
  return `${header(`${title} — TRAINING WORKSHEET`, scenario)}

Supported decision or mission question: ${blank}
Source(s), date collected, and reliability: ${blank}

${labels.map(([term, explanation], index) => `${index + 1}. ${term.toUpperCase()} — ${explanation}\nObservations: ${blank}\nEffects / significance: ${blank}`).join('\n\n')}

Cross-variable relationships and trends: ${blank}
Assumptions and information gaps: ${blank}
Recommended collection or coordination: ${blank}`;
}

function baseballCard(scenario) {
  return `${header('STAKEHOLDER BASEBALL CARD — TRAINING WORKSHEET', scenario)}

Name / title / organization: ${blank}
Photo or identifying reference: ${blank}
Location and contact/access method: ${blank}
Role and formal authorities: ${blank}
Informal influence and key relationships: ${blank}
Interests, priorities, and stated objectives: ${blank}
Position toward the mission: SUPPORTIVE / NEUTRAL / OPPOSED / UNKNOWN — ${blank}
Cultural, protocol, and communication considerations: ${blank}
Previous engagements and commitments: ${blank}
Information reliability / source notes: ${blank}
Recommended engagement approach and next action: ${blank}

Training aid: collect and handle personal information only under applicable policy and mission authority.`;
}

const ascopeLabels = [
  ['Areas', 'physical, political, administrative, or social areas'],
  ['Structures', 'existing infrastructure and physical structures'],
  ['Capabilities', 'functions and services available to the population'],
  ['Organizations', 'civil groups and institutions'],
  ['People', 'populations, leaders, and relevant demographic groups'],
  ['Events', 'routine, planned, cyclical, or disruptive activities']
];

const pmesiiLabels = [
  ['Political', 'governance, authority, legitimacy, and political dynamics'],
  ['Military', 'military and security actors and effects'],
  ['Economic', 'resources, livelihoods, markets, and finance'],
  ['Social', 'identity, culture, networks, and social conditions'],
  ['Information', 'information sources, narratives, access, and influence'],
  ['Infrastructure', 'systems and facilities supporting society'],
  ['Physical Environment', 'terrain, weather, climate, and natural conditions'],
  ['Time', 'timing, tempo, seasons, deadlines, and historical effects']
];

export function getProductWorksheet(productName, scenario = {}) {
  const normalized = productName.toLowerCase();
  if (/site assessment|facility assessment|infrastructure assessment/.test(normalized)) return siteAssessment(scenario, '');
  if (/civil reconnaissance report|civil recon report/.test(normalized)) return civilInformationUpdate(scenario, '');
  if (/key leader|\bkle\b/.test(normalized)) return kleRecord(scenario);
  if (/sitrep|situation report/.test(normalized)) return sitrep(scenario);
  if (/link diagram|stakeholder map|network map/.test(normalized)) return stakeholderMap(scenario, '');
  if (/baseball card/.test(normalized)) return baseballCard(scenario);
  if (/ascope/.test(normalized)) return frameworkWorksheet('ASCOPE', ascopeLabels, scenario);
  if (/pmesii/.test(normalized)) return frameworkWorksheet('PMESII-PT', pmesiiLabels, scenario);
  if (/civil information update|civinfo/.test(normalized)) return civilInformationUpdate(scenario, '');
  if (/recommend|memo|follow-on/.test(normalized)) return recommendationMemo(scenario, '');
  return `${header(`${productName.toUpperCase()} — CUSTOM TRAINING WORKSHEET`, scenario)}\n\nPurpose: ${blank}\nRequired content: ${blank}\nSources and validation: ${blank}\nAssessment: ${blank}\nRecommended action and routing: ${blank}`;
}

export function productCompletion(content = '') {
  const fields = (content.match(/\[Trainee entry required\]/g) || []).length;
  const entered = (content.match(/\[Trainee entry required\]/g) || []).length === 0 ? 1 : 0;
  return { remainingFields: fields, hasTraineeInput: entered || !content.includes(blank) };
}

export function buildTrainingProduct(productName, scenario = {}, traineeDetails = '') {
  const normalized = productName.toLowerCase();
  const details = traineeDetails.trim();
  let content = details.includes('TRAINING PRODUCT') || details.includes('TRAINING WORKSHEET')
    ? details
    : `${getProductWorksheet(productName, scenario)}${details ? `\n\nTRAINEE SUPPLEMENT:\n${details}` : ''}`;
  let type;
  if (/key leader|\bkle\b/.test(normalized)) {
    type = 'KLE Record';
  } else if (/stakeholder|network|link diagram|baseball card/.test(normalized)) {
    type = 'Network Product';
  } else if (/sitrep|situation report/.test(normalized)) {
    type = 'SITREP';
  } else if (/ascope|pmesii/.test(normalized)) {
    type = 'Analysis Worksheet';
  } else if (/information update|civil information|civinfo/.test(normalized)) {
    type = 'Report';
  } else if (/recommend|memo|follow-on|plan/.test(normalized)) {
    type = 'Memo';
  } else if (/assessment/.test(normalized)) {
    type = 'Assessment';
  } else {
    type = 'Other Training Product';
  }
  return {
    name: productName,
    type,
    content,
    recipient: 'S-9 / CIM Cell (training routing; adjust by subject)',
    citationStandard: 'Training template informed by ASCOPE and PMESII-PT; instructor validation required',
    templateVersion: '1.0'
  };
}
