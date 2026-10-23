// Original fictional practice content. No schoolhouse documents or extracted text
// are bundled here. These are transparent practice criteria, not official grading.
export const STUDY_VERSION = '1.0.0-practice';
export const STUDY_LESSONS = [
  {
    id: 'engagement', title: 'Prepare an engagement', duration: '8–10 minutes',
    objective: 'Connect purpose, rapport and interpreter support without inventing commitments.',
    concepts: [
      ['Start with purpose', 'Decide what you need to understand and why it matters. A respectful opening and local orientation can support that purpose without immediately producing a finding.'],
      ['Keep roles clear', 'An interpreter can brief you on local context and facilitate dialogue. That is different from assigning the interpreter responsibility for leading your engagement.'],
      ['Separate intent from effect', 'Trying to build goodwill does not establish that a whole community now trusts the team. Record the reactions you actually observe.']
    ],
    scene: 'Fictional exercise: your team is authorized to walk through a market and speak with willing adult vendors about access to essential goods. You have no scheduled meeting. You ask the interpreter for a local orientation, buy refreshments with personal funds, and introduce yourselves to two vendors. One smiles and agrees to talk; the other declines. No assistance has been promised.',
    questions: [
      { id: 'role', prompt: 'What does the interpreter’s orientation establish?', options: ['The interpreter has replaced the team leader.', 'The interpreter is supporting the team with local context.', 'The team has missed a scheduled meeting.'], answer: 1, feedback: 'The scene states that the interpreter provides orientation. It does not establish delegation of leadership, departure from a meeting or a missed appointment.' },
      { id: 'rapport', prompt: 'Which conclusion is supported?', options: ['The purchases improved sentiment throughout the market.', 'The vendor who declined is hostile to the team.', 'One vendor is willing to continue a conversation; broader sentiment is unknown.'], answer: 2, feedback: 'One observed response supports a narrow conclusion. Neither a purchase nor a declined conversation establishes population-wide sentiment or hostility.' },
      { id: 'next', prompt: 'Which next step best fits the stated purpose?', options: ['Explain the purpose, respect the refusal, and ask the willing vendor about access to goods.', 'Promise funding in exchange for participation.', 'Mark the entire engagement complete because refreshments were purchased.'], answer: 0, feedback: 'The exercise permits voluntary conversation. Follow the information need, respect the choice not to participate and avoid promises beyond established authority.' }
    ],
    task: 'Write a short opening and engagement plan: explain your purpose, describe the interpreter’s role, ask two useful questions, and state how you will close or follow up without promising assistance.',
    criteria: ['My purpose relates to access to essential goods.', 'The team leads; the interpreter supports communication and context.', 'I respect voluntary participation and avoid unsupported promises.', 'My questions and follow-up distinguish what we know from what we still need.'],
    example: '“We are here to understand how people are accessing essential goods. Would you be willing to speak with us?” The team leads the discussion and the interpreter supports meaning and language. Ask what has changed and who experiences the greatest access difficulties. Recap what was heard, identify what needs checking, and explain the reporting process without guaranteeing assistance.',
    referenceNote: 'Practice focus: purpose, voluntary participation, interpreter roles and evidence-limited conclusions. This fictional situation is not a Thailand-specific cultural rule.'
  },
  {
    id: 'reporting', title: 'Turn an engagement into a report', duration: '10–12 minutes',
    objective: 'Separate observation, attributed claims, analysis and actual product submission.',
    concepts: [
      ['Show where a statement comes from', 'Describe what the team observed separately from what another person reported. Preserve who said it and any limits on verification.'],
      ['Make uncertainty useful', 'Explain what a finding may mean, what remains unknown and what evidence could change your assessment. A useful report does not need false certainty.'],
      ['Submit the product, not just the claim', 'Writing “I sent the report” in an action is not the same as attaching or submitting a completed product. Check the actual submission record.']
    ],
    scene: 'Fictional exercise: at 1000, your team sees six people waiting outside a clinic. The receptionist says waits reached three hours yesterday. You have not reviewed appointment logs or interviewed patients. You draft an engagement summary, but the exercise submission panel contains no attachment. Your next report is intended to help the exercise coordinator decide whether a follow-up assessment is needed.',
    questions: [
      { id: 'observation', prompt: 'Which statement is a direct observation?', options: ['Yesterday’s wait was exactly three hours.', 'Six people were waiting outside at 1000.', 'The clinic cannot meet the district’s needs.'], answer: 1, feedback: 'The team directly observed the queue at one time. The previous day’s waiting time is an attributed statement; district-wide capability has not been established.' },
      { id: 'claim', prompt: 'How should yesterday’s waiting time be reported?', options: ['As a statement attributed to the receptionist, with verification still needed.', 'As a confirmed fact because a staff member said it.', 'Omit it because only direct observations are worth reporting.'], answer: 0, feedback: 'An attributed claim can be useful without being confirmed. Keep its source, timing and verification limits visible.' },
      { id: 'product', prompt: 'What is the correct submission status?', options: ['Complete because the learner says it was drafted.', 'Failed permanently; no correction is possible.', 'Draft mentioned; no attachment submitted yet.'], answer: 2, feedback: 'The actual submission panel has no attachment. Give the learner a chance to submit the product rather than granting completion or inventing an irreversible failure.' }
    ],
    task: 'Draft a concise summary for the exercise coordinator. Include the observation, the attributed claim, a cautious assessment, the information gap, and a follow-up that would help the coordinator decide what to do.',
    criteria: ['I identify time and source for the observation and reported claim.', 'I do not treat one queue or one account as proof of district-wide failure.', 'I explain why the information matters to the coordinator’s decision.', 'I name a useful verification step and accurately state the attachment status.'],
    example: 'At 1000 the team observed six people waiting outside the clinic. The receptionist reported waits of up to three hours the previous day; logs and patient accounts have not been checked. These limited indications warrant clarification before drawing a capacity conclusion. Request permission to review suitable non-identifying service records and seek additional perspectives. The engagement summary is drafted but not yet attached.',
    referenceNote: 'Practice focus: source attribution, uncertainty, recommendations and submission evidence. Use fictional information; do not enter real patient or contact details.'
  },
  {
    id: 'assessment', title: 'Assess a civil service', duration: '10–12 minutes',
    objective: 'Distinguish visible assets, reported readiness and evidence needed for a useful briefing.',
    concepts: [
      ['An asset is not the same as a service', 'Seeing a vehicle or an intact building establishes presence, not serviceability, staffing, availability or coverage.'],
      ['Connect evidence to a decision', 'A useful assessment explains what the evidence means for the decision being asked of the team, rather than just listing equipment.'],
      ['Use bounded recommendations', 'Recommend a proportionate next step, identify gaps and avoid declaring readiness or promising resources without supporting evidence.']
    ],
    scene: 'Fictional exercise: the coordinator asks whether a fire station could support a planned community event. You see two trucks parked in the bay. The station officer says only one is serviceable and says four staff are assigned to the station. You have not confirmed shift coverage, training, equipment checks, water access or other response commitments. There is no immediate emergency.',
    questions: [
      { id: 'assets', prompt: 'What can you conclude now?', options: ['Two response crews are available for the event.', 'The station has no usable capability.', 'Two trucks are present; readiness and availability remain only partly understood.'], answer: 2, feedback: 'Presence is observed. Serviceability and staffing are reported. Neither two ready crews nor zero capability follows from the available evidence.' },
      { id: 'gap', prompt: 'What follow-up best addresses event support?', options: ['Confirm serviceability, staffing at the event time and competing commitments through authorized coordination.', 'Rate readiness from the building’s appearance.', 'Assume four assigned staff will all be on duty.'], answer: 0, feedback: 'The relevant question is capability and availability for the event. Authorized checks and coordination address that question more directly than appearance or assumed staffing.' },
      { id: 'brief', prompt: 'Which briefing statement is most defensible?', options: ['“The station is fully ready; no further work is needed.”', '“Capability is not yet confirmed for the event; here are the evidence gaps and a proposed verification step.”', '“Two trucks guarantee sufficient support.”'], answer: 1, feedback: 'Connect the evidence and uncertainty to the coordinator’s decision. A limited assessment should lead to a bounded recommendation, not an unsupported readiness declaration.' }
    ],
    task: 'Write a brief for the coordinator: state what is observed, what is reported, what remains unknown, why the gaps matter to event support, and what you recommend next. Do not conduct or direct unsafe equipment tests.',
    criteria: ['I distinguish observed assets from reported serviceability and staffing.', 'I address availability for the event, not just total assigned resources.', 'I connect remaining gaps to the coordinator’s decision.', 'I propose authorized verification without declaring unsupported readiness.'],
    example: 'Two trucks were observed. The officer reports one is serviceable and four staff are assigned; staffing at the event time and competing commitments are unconfirmed. We cannot yet confirm event support. Coordinate with the station’s responsible authority to clarify equipment status, qualified coverage and other commitments, then update the coordinator with evidence and remaining limits.',
    referenceNote: 'Practice focus: capability, availability, attribution and decision relevance. This is not a technical safety inspection or an official readiness certification.'
  }
];
