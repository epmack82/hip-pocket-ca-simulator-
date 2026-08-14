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
Requests, proposed actions, or authorities requiring coordination/approval: ${blank}
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
  return `${header('POST-KLE REPORT - TRAINING WORKSHEET', scenario)}

REFERENCE BASIS: GTA 90-01-019, Afghan Key Leader Engagement Pocket Reference (January 2010). Adapt cultural details to the current operational environment.

1. ENGAGEMENT DETAILS
Meeting leader and contact information: ${blank}
U.S./team attendees and assigned roles: ${blank}
Host-nation / partner attendees: ${blank}
Key leader attendees, positions, and organizations: ${blank}
Date-time and location: ${blank}

2. OBJECTIVE AND PREPARATION
Desired effect and supporting objective: ${blank}
Leader's capability, influence, agenda, motivations, interests, and network: ${blank}
Previous engagements and agreements reviewed: ${blank}
Cultural, protocol, interpreter, and communication considerations: ${blank}
Questions, contingencies, authorized talking points, and matters requiring coordination or approval: ${blank}

3. ENGAGEMENT
Items of discussion and who raised each topic: ${blank}
Key statements, observations, and nonverbal indicators: ${blank}
Requests, stated intentions, or reported agreements by each party (do not promise assistance or outcomes): ${blank}
Contact method established for continued communication: ${blank}

4. POST-ENGAGEMENT ASSESSMENT
Overall assessment and progress toward the desired effect: ${blank}
Confirmed facts and claims requiring validation: ${blank}
Relationship, cooperation, access, or local ownership gained/lost: ${blank}
Information of potential intelligence or operational value: ${blank}
Additional observations and relevant actor links: ${blank}

5. FOLLOW-THROUGH
Open action item / owner / suspense: ${blank}
Future KLE recommendation and proposed purpose: ${blank}
Reporting, database, and coordination action: ${blank}

Training note: KLE is cyclical - identify, prepare, execute, report, and reengage. Final report routing and format follow unit SOP and mission requirements.`;
}

function sitrep(scenario) {
  return `${header('DAILY SITREP - NINE-LINE TRAINING WORKSHEET', scenario)}

REFERENCE BASIS: User-provided unit SITREP example dated 15FEB26. This is a unit-example training format, not represented as a universally prescribed Army form.

LINE 1 - DTG / REPORTING PERIOD: ${blank}
LINE 2 - UNIT / TEAM: ${blank}
LINE 3 - CURRENT LOCATION: ${scenario.location || blank}
LINE 4 - CURRENT OPERATIONS: Who did what, when, where, why, results, assessment, and required follow-through - ${blank}
LINE 5 - NEXT 24-HOUR OPERATIONS: Task, purpose, person/entity, location, and intended effect - ${blank}
LINE 6 - LOSSES / SIGNIFICANT ISSUES: ${blank}
LINE 7 - REQUESTS FOR INFORMATION / SUPPORT: ${blank}
LINE 8 - CIVIL RECON / KLE / PRODUCT DEVELOPMENT PLAN: ${blank}
LINE 9 - CRITICAL EQUIPMENT AND PACING ITEMS: COMMS ${blank}; MED ${blank}; VEHICLE ${blank}; OTHER ${blank}

Accuracy check: Separate confirmed facts, assessments, and planned actions. Final line definitions and routing follow the supported headquarters' reporting instructions and unit SOP.`;
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

REFERENCE BASIS: User-provided Civil Affairs baseball-card example. This is a unit-example training format, not represented as a prescribed Army form.

Name: ${blank}
Role / title: ${blank}
Organization and affiliated organizations: ${blank}
Photo or identifying reference: ${blank}
Ethnicity / tribe / clan / family / religion (only when mission-relevant and authorized): ${blank}
Political affiliation (only when mission-relevant and authorized): ${blank}
Education / professional background: ${blank}
Motivations: ${blank}
Grievances: ${blank}
Goals: ${blank}
Resources: ${blank}
Associates and relationship links: ${blank}
Long-term influence: YES / NO / UNKNOWN - ${blank}
Access: YES / NO / UNKNOWN - ${blank}
Relevance: YES / NO / UNKNOWN - ${blank}
Reported agreements, requests, or stated intentions (identify source and authority; do not imply a U.S. commitment): ${blank}
Previous engagements / notes: ${blank}
Recommended engagement approach and next action: ${blank}

Training aid: collect and handle personal information only under applicable policy and mission authority.`;
}

function caOperationsReport(scenario) {
  return `${header('CIVIL AFFAIRS OPERATIONS REPORT (CAOPREP) - TRAINING WORKSHEET', scenario)}

REFERENCE BASIS: User-provided CAOPREP template dated 02MAY2021. This is a command/unit example and must be adapted to current reporting guidance.

1. REPORT METADATA
Report name / subject / keywords: ${blank}
Team leader and members: ${blank}
Coalition / host-nation partners: ${blank}
Mission start and end DTG: ${blank}
Country / province / city or village: ${blank}

2. EXECUTIVE SUMMARY
One- or two-sentence searchable headline: ${blank}
Executive summary: ${blank}

3. BACKGROUND AND PURPOSE
What triggered the mission and intended benefits: ${blank}
Mission statement and supported line(s) of effort: ${blank}
Information gaps intended to address: ${blank}
Tasks to be completed: ${blank}

4. LOCATIONS AND SIGNIFICANT EVENTS
Grid / location / description: ${blank}
Detailed active-voice narrative - where the team went, what it did, who it engaged, and what was expressed or observed: ${blank}

5. ANALYSIS AND RESULTS
Team analysis and comments: ${blank}
Tasks accomplished: ${blank}
Topics discussed, who initiated them, and participants: ${blank}
Information gaps filled and new gaps identified: ${blank}

6. CONTACTS, ORGANIZATIONS, AND NETWORKS
New contacts / baseball cards required: ${blank}
Updates to prior contacts: ${blank}
Organizations interacted with: ${blank}
New social-network links or access opportunities: ${blank}

7. OPPORTUNITIES AND FOLLOW-ON
Opportunities / projects identified and potential impacts: ${blank}
Other information contributing to situational awareness: ${blank}
Follow-on mission requirements and suggestions: ${blank}

8. ATTACHMENTS AND ROUTING
Photos / captions / supporting assessments: ${blank}
Point of contact and required routing: ${blank}`;
}

function inspectorGeneralActionRequest(scenario) {
  return `${header('DA FORM 1559 - INSPECTOR GENERAL ACTION REQUEST - TRAINING WORKSHEET', scenario)}

IMPORTANT TRAINING NOTICE
This is a fictional practice worksheet. DO NOT submit fictional scenario information, invented names, or exercise details to a real Inspector General office.
Reference basis: DA Form 1559 (APR 2021) and AR 20-1.

ROUTING DECISION - CHOOSE THE APPROPRIATE PATH FIRST
- Immediate danger, ongoing violence, or urgent medical need: move to safety and contact emergency services / military or civilian law enforcement as appropriate.
- Sexual assault: contact a Sexual Assault Response Coordinator (SARC), Victim Advocate (VA), healthcare provider, or the DoD Safe Helpline (877-995-5247 / safehelpline.org) to understand Restricted and Unrestricted reporting choices. An IG worksheet is not a substitute for confidential victim advocacy.
- Suspected criminal conduct: preserve safety and facts; contact the appropriate law-enforcement or Army CID channel. An IG may assist or refer, but is not the emergency response.
- Systemic command problems, abuse of authority, reprisal concerns, administrative injustice, policy failures, or requests for assistance: contact the servicing/local IG. USARC guidance recommends the local IG first.
- USARC IG published submission address: usarmy.usarc.usarc-hq.list.ig@army.mil. Verify the current address and servicing office before any real submission.
- Never submit classified information through ordinary email or this training application.

1. REQUESTER INFORMATION
Last, first, middle initial: ${blank}
Grade / rank: ${blank}
DoD ID: ${blank}
Component / duty status: ${blank}
Preferred contact telephone: ${blank}
Email address(es): ${blank}
Unit and complete military address / unit POC telephone: ${blank}
Preferred mailing address, if different: ${blank}

2. SPECIFIC ACTION REQUESTED
What do you want the IG to do for you? State a clear, supportable requested action: ${blank}

3. PRIOR CONTACT
Have you contacted your chain of command or another agency? YES / NO: ${blank}
Explain either answer, including who, when, method, and response: ${blank}
If you did not use the chain, explain safety, conflict-of-interest, reprisal, confidentiality, or other concern: ${blank}

4. INFORMATION PERTAINING TO THE REQUEST
Who was involved (names, grades, roles, organizations): ${blank}
What occurred - separate personally observed facts from reports or assumptions: ${blank}
When it occurred (dates / times / sequence): ${blank}
Where it occurred: ${blank}
Applicable order, policy, authority, duty, or standard if known: ${blank}
Witnesses and what each may know: ${blank}
Documents, messages, photographs, records, or other supporting material: ${blank}
Harm, impact, or continuing risk: ${blank}
Corrective action already attempted and result: ${blank}

5. RELEASE CONSENT - DISCUSS THE CONSEQUENCES OF EACH CHOICE
Consent / do not consent to release personal information outside IG channels but within DoD channels: ${blank}
Consent / do not consent to release supporting documents outside IG channels but within DoD channels: ${blank}
Training note: withholding consent may limit resolution. Do not promise confidentiality; ask the IG to explain applicable protections and disclosure limits.

6. CERTIFICATION
Signature: ${blank}
Date (YYYYMMDD): ${blank}

QUALITY CHECK BEFORE A REAL SUBMISSION
- Is the form signed and dated?
- Is the requested action clear?
- Are facts, dates, names, sources, and assumptions distinguished?
- Are relevant supporting documents identified and unaltered?
- Is the correct servicing office confirmed?
- Has classified, medical, victim, or other sensitive information been handled only through authorized channels?

TRAINING ROUTING RESULT
Recommended training review: servicing/local IG or instructor, with separate emergency, SHARP, medical, legal, law-enforcement, or CID routing when applicable.`;
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
  if (/caoprep|civil affairs operations report/.test(normalized)) return caOperationsReport(scenario);
  if (/inspector general|da\s*1559|\big action request\b|\big complaint\b/.test(normalized)) return inspectorGeneralActionRequest(scenario);
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
  } else if (/caoprep|civil affairs operations report/.test(normalized)) {
    type = 'CA Operations Report';
  } else if (/inspector general|da\s*1559|\big action request\b|\big complaint\b/.test(normalized)) {
    type = 'Inspector General Action Request';
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
    recipient: /inspector general|da\s*1559|\big action request\b|\big complaint\b/.test(normalized)
      ? 'Servicing/local Inspector General (training only; verify current real-world routing)'
      : 'S-9 / CIM Cell (training routing; adjust by subject)',
    citationStandard: /inspector general|da\s*1559|\big action request\b|\big complaint\b/.test(normalized)
      ? 'DA Form 1559 (APR 2021) and AR 20-1; separate emergency, SHARP, medical, legal, law-enforcement, or CID routing may apply'
      : 'Training template informed by ASCOPE and PMESII-PT; instructor validation required',
    templateVersion: '1.0'
  };
}
