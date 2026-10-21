// Original fictional exercise content. No source documents or runtime AI service.
export const CLASSROOM_VERSION = '1.0';
export const CLASSROOM_THEMES = [
  { id: 'services', name: 'Essential services & unequal access',
    situation: 'Municipal utilities report that water production has recovered. Neighborhood representatives report that some households still cannot obtain reliable water. The hospital reports intermittent supply, while vendors dispute who is included in the distribution schedule.',
    reports: [
      ['Utility office', 'Reports normal plant output; has not supplied neighborhood delivery records.'],
      ['Hospital administrator', 'Reports interruptions during clinic hours; the cause has not been verified.'],
      ['Neighborhood forum', 'Reports that outlying households are missing deliveries; attendance did not include every neighborhood.'],
      ['Market association', 'Offers a delivery ledger but asks that customer identities not be circulated.'],
    ],
    decision: 'Which service-access gaps warrant the next assessment effort, and what evidence is needed before requesting technical or distribution support?',
    constraint: 'One engineer assessment appointment is available this planning cycle. Assessment does not authorize repair work.',
    inject: 'A verified delivery sample shows that plant output and household access tell different stories. Ask learners which recommendation changes and which claims still need verification.',
  },
  { id: 'displacement', name: 'Displacement & continuity of community services',
    situation: 'Families temporarily displaced by flooding are staying with host communities and in a community hall. Published service totals combine residents and new arrivals. School, clinic and municipal representatives disagree about where additional support is most urgent.',
    reports: [
      ['Municipal registry', 'Has a household count from before the flood; current coverage is unknown.'],
      ['School administrator', 'Reports reduced classroom availability and requests a discussion with families before schedules change.'],
      ['Clinic coordinator', 'Reports longer queues; cannot yet distinguish staffing shortages from increased demand.'],
      ['Host-community forum', 'Reports that some assistance notices do not reach people staying outside the community hall.'],
    ],
    decision: 'Which information gaps must be resolved to recommend equitable service access without assuming that registration totals describe everyone affected?',
    constraint: 'One medical-planning consultation is available this cycle; it does not constitute approval for a military treatment event.',
    inject: 'An updated survey includes households outside the community hall. Ask learners whether their collection plan and recommendation represented those households.',
  },
  { id: 'transition', name: 'Transition & sustainable local capacity',
    situation: 'Several repaired public facilities have reopened. Municipal leaders request an early handover announcement. Staff rosters, recurring supplies and maintenance arrangements are not yet verified. Community representatives welcome reopening but disagree about whether services are dependable.',
    reports: [
      ['Municipal executive', 'Reports that facilities are open and requests a handover announcement.'],
      ['Maintenance supervisor', 'Reports uncertainty about recurring supplies and trained relief staff.'],
      ['Community health forum', 'Reports that posted clinic hours do not always match actual access.'],
      ['Independent relief organization', 'Will share aggregate service observations but declines a public joint endorsement.'],
    ],
    decision: 'What evidence would support a responsible handover recommendation, and which unresolved capacity risks must remain visible to the commander?',
    constraint: 'Only one joint technical review can occur this cycle. A scheduled ceremony is not evidence that transition conditions are met.',
    inject: 'The facility passes a physical inspection, but the next staffing roster has unfilled shifts. Ask learners to separate physical condition from sustained service capability.',
  },
];

const regions = ['Aster Valley', 'Lark River District', 'Cedar Coast'];
const taskForces = ['Task Force Lantern', 'Task Force Harbor', 'Task Force Orchard'];
const hash = text => {
  let result = 2166136261;
  for (let i = 0; i < text.length; i += 1) result = Math.imul(result ^ text.charCodeAt(i), 16777619);
  return result >>> 0;
};
const clean = (value, limit) => String(value || '').trim().slice(0, limit);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function generateClassroomOpord(options = {}) {
  const seed = clean(options.seed, 60) || 'classroom-001';
  const theme = CLASSROOM_THEMES.find(item => item.id === options.theme) || CLASSROOM_THEMES[0];
  const value = hash(seed);
  const region = regions[value % regions.length];
  const taskForce = taskForces[Math.floor(value / 7) % taskForces.length];
  const firstReview = ['Day 2, 1200', 'Day 2, 1600', 'Day 3, 0900'][Math.floor(value / 11) % 3];
  // Rotate the disclosed coordination window: changes a planning tradeoff, not just a place name.
  const partnerWindow = ['Municipal officials can meet on Day 1; community representatives are available on Day 2.',
    'Community representatives can meet on Day 1; the municipal service review is on Day 2.',
    'The technical advisor is available on Day 1; both municipal and community forums are on Day 2.'][Math.floor(value / 17) % 3];
  const packet = {
    version: CLASSROOM_VERSION, seed, theme: theme.id, themeName: theme.name,
    className: clean(options.className, 90), region, taskForce, firstReview, partnerWindow,
    id: `PE-${hash(`${CLASSROOM_VERSION}|${seed}|${theme.id}`).toString(16).toUpperCase().padStart(8, '0')}`,
    situation: theme.situation, reports: theme.reports, decision: theme.decision,
    constraint: theme.constraint, inject: theme.inject,
    mission: `${taskForce} supports a host-nation-led civil recovery exercise in ${region} to improve understanding of essential-service access, coordinate authorized support and recommend conditions for responsible transition. This is a fictional staff exercise, not an operational tasking order.`,
    intent: 'Help the commander understand who can actually access essential services, where local capacity is insufficient, and which support requests are justified. Preserve local ownership and avoid promises beyond established authority.',
    keyTasks: ['Develop a sourced picture of service access and institutional capacity.',
      'Include affected communities and distinguish conflicting accounts from verified findings.',
      'Coordinate technical and support requests through the appropriate staff and local authorities.',
      'Identify unresolved risks and evidence needed for transition.'],
    endState: 'Civil authorities and follow-on partners receive an attributed assessment, accepted responsibilities and visible unresolved risks; recommendations distinguish confirmed capacity from assumptions.',
    phases: [
      { name: 'I · Prepare', purpose: 'Understand the mission, establish liaison and identify priority information gaps.', decision: 'Which civil information is needed first, and who can provide or verify it?' },
      { name: 'II · Assess', purpose: 'Compare official service reports with technical observations and community access.', decision: 'Which discrepancies change the assessment priorities?' },
      { name: 'III · Coordinate', purpose: 'Develop and compare authorized support options with responsible organizations.', decision: 'What should the commander request, defer or refer, and why?' },
      { name: 'IV · Transition', purpose: 'Review sustained local capability, accepted responsibilities and residual risks.', decision: 'What can be handed over, and what requires continued attention?' },
    ],
    organizations: [
      ['Headquarters / civil-military staff', 'Integrates civil reporting into the commander’s decision brief and manages requests for support.'],
      ['North District Support Group', 'Coordinates with outlying communities and municipal service offices.'],
      ['Central District Support Group', 'Coordinates with the hospital, market and municipal administration.'],
      ['Community Liaison Group', 'Maintains contact with less-represented communities and voluntary civil partners.'],
      ['Engineer advisory element', 'Provides requested technical assessments; cannot independently commit reconstruction resources.'],
      ['Medical planning element', 'Advises on service capability and referral coordination; does not automatically provide civilian treatment.'],
      ['Sustainment element', 'Reviews feasibility of approved transport and supply requests; availability is not authorization.'],
      ['Host-nation authorities and independent civil partners', 'Retain their own responsibilities and may decline proposed activities. They are not subordinate to the task force.'],
    ],
  };
  return packet;
}

export function classroomQuestions(packet) {
  return [
    { title: '1 · Connect Civil Affairs to the mission', prompt: 'Select two key tasks CA can support. For each, explain the civil problem, the contribution CA can make, and the command decision it informs.', rows: 6 },
    { title: '2 · Plan across the phases', prompt: 'For each phase, propose a CA task, a partner or supporting element, an information requirement and evidence that the task achieved its intended purpose.', labels: packet.phases.map(phase => phase.name), rows: 3 },
    { title: '3 · Prioritize three teams', prompt: 'Recommend a support priority for CAT 1, CAT 2 and CAT 3 among the district groups, liaison group or a coordinated assessment need. Explain what remains uncovered and when you would reconsider. This is a recommendation, not authority to change command relationships.', labels: ['CAT 1', 'CAT 2', 'CAT 3', 'Deferred need / reassessment trigger'], rows: 3 },
    { title: '4 · Brief a capability and a decision', prompt: `Prepare a short capabilities-and-recommendation brief for the commander’s first review (${packet.firstReview}). Address: ${packet.decision} Include support requested, limits, one alternative and a tradeoff.`, rows: 6 },
    { title: '5 · Check evidence and authority', prompt: 'Identify two attributed claims, a way to verify each, and one assumption. Identify a proposed action that needs additional approval. Explain who should receive your assessment and why.', rows: 6 },
    { title: '6 · Define success and handover', prompt: 'Propose one indicator of task completion and one indicator of improved service access or local capability. State what evidence, responsibility acceptance and remaining risks you would present before transition.', rows: 6 },
  ];
}

const list = values => `<ul>${values.map(item => `<li>${escape(item)}</li>`).join('')}</ul>`;
const table = (headers, rows) => `<table><thead><tr>${headers.map(h => `<th scope="col">${escape(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${escape(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
const lines = count => `<div class="answer-lines" aria-label="Space for written response">${'<div>&nbsp;</div>'.repeat(count)}</div>`;
const footer = packet => `<footer>${escape(packet.id)} · Seed: ${escape(packet.seed)} · Exercise v${escape(packet.version)} · Fictional training material</footer>`;
const sheet = (packet, title, content) => `<section class="sheet"><header><span>HIP POCKET / CLASSROOM EXERCISE</span><span>${escape(packet.id)}</span></header><h1>${escape(title)}</h1>${content}${footer(packet)}</section>`;

export function classroomOpordHtml(packet, audience = 'student') {
  if (!['student', 'facilitator'].includes(audience)) throw new Error('Choose student or facilitator output.');
  const common = `<p class="meta">${escape(packet.themeName)} · ${escape(packet.region)}${packet.className ? ` · ${escape(packet.className)}` : ''}</p>`;
  let body;
  if (audience === 'student') {
    body = sheet(packet, 'OPORD reading & CA integration', `${common}
      <p class="notice">Simplified fictional exercise. Not an official OPORD format, current doctrine, legal authority or real-world tasking. No Annex K is supplied: propose CA contributions; do not assume new authority.</p>
      <p class="student-id">Name / team: __________________________________ &nbsp; Date: ______________</p>
      <h2>Task organization & planning limits</h2><p>${escape(packet.taskForce)} has one CA company headquarters / coordination cell and three teams: CAT 1, CAT 2 and CAT 3. The company remains together administratively; learners recommend support priorities, not formal attachment orders. Each CAT can lead one primary assessment or engagement per day in this exercise. Travel and preparation are included; do not treat this as a real-world staffing standard.</p>
      <h2>1. Situation</h2><p>${escape(packet.situation)}</p>
      ${table(['Reporting source', 'Initial account — not independently confirmed'], packet.reports)}
      <h2>2. Mission</h2><p>${escape(packet.mission)}</p>
      <h2>3. Execution — commander’s intent</h2><p>${escape(packet.intent)}</p>${list(packet.keyTasks)}
      <p><strong>Desired end state:</strong> ${escape(packet.endState)}</p>`);
    body += sheet(packet, 'Phases, partners & constraints', `${common}
      ${table(['Phase', 'Purpose', 'Decision to inform'], packet.phases.map(p => [p.name, p.purpose, p.decision]))}
      <h2>Tasks and coordination responsibilities</h2>${table(['Organization', 'Role in this exercise'], packet.organizations)}
      <h2>Coordinating instructions / support boundaries</h2>${list([
        `First command review: ${packet.firstReview}. All times are exercise-local. Phases are condition-based; the review time is not a handover deadline.`,
        packet.partnerWindow, packet.constraint,
        'Routine observation and voluntary engagement within the exercise remit are authorized. Obtain host consent for entry and participation; do not infer authority for restricted access, work on infrastructure or collection of unnecessary personal data.',
        'Route funding, contracting, reconstruction, public commitments and changes to support priorities through the designated headquarters approval process. A request is not an approval.',
        'Flag urgent civilian-safety concerns promptly to the appropriate exercise authority. Record source, uncertainty, proposed follow-up and who owns the next action.',
      ])}`);
    const questions = classroomQuestions(packet);
    body += sheet(packet, 'Student worksheet · Analysis & priorities', `${common}${questions.slice(0, 3).map(q => `<article class="question"><h2>${escape(q.title)}</h2><p>${escape(q.prompt)}</p>${q.labels ? q.labels.map(label => `<h3>${escape(label)}</h3>${lines(q.rows)}`).join('') : lines(q.rows)}</article>`).join('')}`);
    body += sheet(packet, 'Student worksheet · Brief & defend', `${common}${questions.slice(3).map(q => `<article class="question"><h2>${escape(q.title)}</h2><p>${escape(q.prompt)}</p>${lines(q.rows)}</article>`).join('')}`);
  } else {
    body = sheet(packet, 'Draft facilitator discussion guide', `${common}
      <p class="notice"><strong>NOT AN APPROVED ANSWER KEY.</strong> Instructor validation pending. These are discussion prompts, not model answers, a rubric, passing thresholds or an automated grade. Obtain and reconcile the colleague’s key before using this as a scored assessment.</p>
      <h2>Match the student packet</h2><p>Use packet ${escape(packet.id)}, seed ${escape(packet.seed)}, exercise version ${escape(packet.version)}. Retain both files together. A different theme or seed may change facts, windows and the appropriate reasoning.</p>
      <h2>What the packet establishes</h2>${list([
        `${packet.taskForce} has one CA company HQ and three CATs; each has one primary activity per day for this exercise.`,
        `The first review is ${packet.firstReview}. ${packet.partnerWindow}`,
        packet.constraint,
        'The initial reports are attributed accounts, not established truth. No Annex K is supplied, and learners do not receive independent fiscal or contracting authority.',
      ])}
      <h2>Review the reasoning, not a preferred unit match</h2>${table(['Worksheet', 'Questions for instructor discussion'], [
        ['1 · Mission connection', 'Does the learner connect a civil concern to a key task and a decision, rather than simply list CA activities?'],
        ['2 · Phase plan', 'Does the contribution change as the exercise moves from preparation to assessment, coordination and transition? Are information gaps and responsible partners explicit?'],
        ['3 · Three teams', 'Is the proposed distribution feasible within the disclosed capacity and meeting windows? Which need is deferred? What would justify a change? Several allocations may be defensible.'],
        ['4 · Commander brief', 'Does the brief explain capability limits, a recommendation, another option, tradeoffs and the support or decision requested?'],
        ['5 · Evidence / authority', 'Are accounts attributed and assumptions labeled? Is verification proportionate? Does the learner distinguish coordination requests from approved commitments?'],
        ['6 · Handover', 'Does the learner distinguish doing an activity from improving conditions? Are continuing capability, accepted responsibility and residual risk addressed?'],
      ])}`);
    body += sheet(packet, 'Optional discussion extension', `${common}<h2>Introduce only after the initial brief</h2><p>${escape(packet.inject)}</p>
      <p>This extension is not part of the original student facts. Announce it to all groups at the same point; do not penalize students retroactively for not knowing it.</p>
      <h2>Build the next scene from a decision</h2>${list([
        'Ask each group to identify the next person or organization it needs to engage and the specific information sought.',
        'Have the counterpart explain a capacity limit, competing need or reason for declining a proposal; do not invent a violation the learner never committed.',
        'Record what changed, what is still unconfirmed and what the group must carry into its next recommendation.',
        'Invite a revised brief. Distinguish new evidence from a change in preference, and retain unfinished tasks for the handover.',
      ])}<h2>Instructor notes / local answer-key review</h2>${lines(12)}
      <p class="notice">Local review only. No student results are collected or sent automatically. This generator uses original fictional material and does not certify doctrinal proficiency.</p>`);
  }
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(packet.id)} — ${audience === 'student' ? 'Student handout' : 'Draft facilitator guide'}</title><style>
    *{box-sizing:border-box}body{margin:0;background:#e8edf0;color:#172735;font:10.5pt/1.4 Arial,sans-serif}.sheet{max-width:8.5in;margin:20px auto;padding:.5in;background:white}header,footer{display:flex;justify-content:space-between;color:#496171;font-size:8pt;border-bottom:1px solid #9babb4;padding-bottom:7px}footer{border-bottom:0;border-top:1px solid #9babb4;margin-top:20px;padding-top:8px;display:block}h1{font-size:22pt;line-height:1.1;margin:18px 0 9px}h2{font-size:12pt;margin:18px 0 7px}h3{font-size:10pt;margin:10px 0 3px}p{margin:8px 0}.meta{color:#496171;font-size:9pt}.notice{border:1px solid #72818a;padding:10px;font-size:9pt}.student-id{margin:18px 0}table{width:100%;border-collapse:collapse;margin:10px 0;font-size:9pt}th,td{text-align:left;vertical-align:top;padding:7px;border:1px solid #a3b0b8}th{background:#eef2f3}tr{break-inside:avoid}thead{display:table-header-group}ul{padding-left:20px}li{margin:5px 0}.answer-lines div{height:.24in;border-bottom:1px solid #bdc6cb}.question{break-inside:avoid}h1,h2,h3{break-after:avoid}@page{size:auto;margin:.5in}@media print{body{background:white}.sheet{margin:0;padding:0;max-width:none;break-after:page}.sheet:last-child{break-after:auto}.notice,th{print-color-adjust:exact}}
  </style></head><body>${body}</body></html>`;
}

export function printClassroomPacket(html) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return false;
  try {
    printWindow.opener = null;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    return true;
  } catch {
    printWindow.close();
    return false;
  }
}
