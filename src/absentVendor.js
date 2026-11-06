import { isMarket } from './marketScene';

// Original authored exercise branch. Not a cultural or doctrinal assertion.
const steps = {
  contact: { id: 'absent-vendor-contact', title: 'Check whether an owner can speak', detail: 'Follow up the coordination request through Mali.', text: 'I follow up with Mali to check whether an absent stallholder is willing to speak with us.',
    story: 'Mali asks you to wait while she makes a call. When she returns, she does not hand you the phone immediately.\n\nMali (market association chair) says, “Anong can speak briefly by phone. She wants to know who you are and whether this is about taking away her stall. Please explain your purpose before asking about her circumstances.”\n\nOne owner is reachable. This is an invitation to introduce yourselves, not consent to inspect her home, business records, or finances.' },
  introduce: { id: 'absent-vendor-introduction', title: 'Introduce the team and ask to continue', detail: 'Explain the visit without promising assistance or speaking for the licensing office.', text: 'I introduce our team to Anong by phone, explain that we are learning about market access, and ask if she is willing to continue.',
    story: 'The voice on the phone is cautious. Anong listens to your explanation without interrupting; only when you finish does she answer.\n\nAnong (absent stallholder) says, “All right. I can tell you about my stall. But please do not tell the office I have given it up. Not opening is not the same as wanting to leave.”\n\nShe agrees to this conversation. The other absent owners have not spoken for themselves.' },
  circumstances: { id: 'absent-vendor-circumstances', title: 'Ask what is keeping her stall closed', detail: 'Hear her circumstances before choosing an explanation.', text: 'I ask Anong what is keeping her stall closed and what she wants our team to understand.',
    claim: 'Anong says she cannot currently afford both replacement stock and transport, and wants to retain her allocated stall. She does not know why other owners are absent.',
    story: 'Anong starts to answer, stops, then begins again.\n\nAnong (absent stallholder) says, “People see the shutters and think I have stopped trying. I have to pay to bring goods in, and I need goods worth bringing. Right now I cannot manage both. I still want that space. I cannot tell you what happened to the others.”\n\nHer account suggests a household business constraint, not proof that the road is blocked. It also does not establish whether the same constraint affects anyone else.' },
  followup: { id: 'absent-vendor-followup', title: 'Ask what could help test her account', detail: 'Invite a next step without demanding private records.', text: 'I ask Anong what information she would be comfortable sharing later to help us understand the stock and transport costs.',
    claim: 'Anong is willing to discuss costs again if the purpose and participants are agreed first; no figures or records have been supplied.',
    story: 'There is a longer silence this time. You leave it open.\n\nAnong (absent stallholder) says, “I could talk through the costs another time. Tell me who would be there and what you would use them for before I agree to share anything. I do not want my private business becoming market gossip.”\n\nYou have a possible next step, not an appointment or a set of verified figures. Decide whether to carry that request forward in your product.' }
};

export function absentVendorChoices(scenario, site = {}, world = {}) {
  if (!isMarket(scenario) || world.interpreterStatus === 'excluded' || (world.persistentConditions || []).some(c => c.status !== 'resolved')) return [];
  if (!(site.followUpRequests || []).some(r => /absent stallholders/i.test(r.description))) return [];
  const done = new Set((site.history || []).map(update => update.classification));
  const next = Object.values(steps).find(step => !done.has(step.id));
  return next ? [next] : [];
}

export function resolveAbsentVendor(input, scenario, world) {
  if (input.kind !== 'action') return null;
  return absentVendorChoices(scenario, world.sites?.[input.scenarioId], world).find(step => step.text === input.rawText) || null;
}

export function absentVendorFinding(step, record) {
  return { id: step.id, severity: 'none', acceptedActs: ['act-1'], effects: [step.story],
    discoveries: step.claim ? [{ id: `${record.scenarioId}:${step.id}`, text: step.claim, source: 'Anong (absent stallholder)', reliability: 'claim' }] : [],
    gaps: step.claim ? { opened: ['Independent confirmation of Anong’s stock and transport constraints', 'Whether other absent owners face similar or different circumstances'], advanced: [], resolved: [] } : {} };
}
