// Authored fictional exercise material. Assertions stay attributed to their
// source until the player obtains the corresponding observation or record.
const profiles = {
  school: {
    claim: 'Several families have stopped using the rear entrance since the pavement cracked; attendance totals do not explain which children are affected.',
    reply: 'The attendance book tells you who was absent. It does not tell you why their family could not get them here.',
    observation: 'From the supervised courtyard route, the team sees cracked pavement at the rear entrance and pupils being redirected to the front gate.',
    record: 'The attendance ledger records absences but no reasons. It supports a need for follow-up, not a conclusion that the entrance caused every absence.',
    issue: 'Whether access problems explain the reported absences', permission: 'The administrator agrees to a staff-accompanied walk of the courtyard; classrooms and student interviews require separate coordination.'
  },
  water: {
    claim: 'Residents at the far end of the distribution line report interruptions despite a schedule showing daily service.',
    reply: 'A pump running here does not tell you whether a family at the end of the line filled its containers.',
    observation: 'The team sees residents waiting with empty containers beside the posted distribution schedule. This is a snapshot, not a measurement of daily capacity.',
    record: 'The operations ledger records pump operation but not delivery at individual neighborhoods. The downstream service claim remains only partly tested.',
    issue: 'Which neighborhoods receive insufficient water and when', permission: 'The manager agrees to an escorted observation from the marked visitor route. Operational controls remain with facility staff.'
  },
  substation: {
    claim: 'The facility reports normal operation while downstream users describe intermittent service.', reply: 'The lights being on now does not establish that the supply was stable all day.',
    observation: 'From the designated visitor area, the team sees a fenced section out of service. No one manipulates electrical equipment.',
    record: 'The maintenance log records an outage window. It does not establish the duration of disruption at every downstream facility.',
    issue: 'The effect of outages on downstream essential services', permission: 'The supervisor approves observation from the designated visitor area with an escort; the energized enclosure remains restricted.'
  },
  clinic: {
    claim: 'The clinic remains open, but families report delays that the daily treatment total does not capture.', reply: 'We count the patients we see. Those who leave the queue never appear in that total.',
    observation: 'Families wait outside the treatment area while staff move between rooms. The team does not enter consultations or access patient identifiers.',
    record: 'An aggregate service log shows daily visits but not patients who left before treatment. The unmet demand remains uncertain.',
    issue: 'Who is missing from the clinic service figures', permission: 'The director permits a staff-accompanied walk of public areas. Consultations and identifiable patient records are outside that permission.'
  },
  market: {
    claim: 'Some stalls remain closed even though the official market summary describes normal trading.', reply: 'Ask who can afford to reopen, and who is missing from the meeting.',
    observation: 'Several stalls in the back row are closed while trading continues near the main entrance.',
    record: 'The stall register lists allocated spaces; it does not prove that each stall is trading or explain the closures.',
    issue: 'Why listed stalls are closed and whose livelihoods are affected', permission: 'The chair agrees to a walk through public trading areas; private stockrooms require the individual vendor’s consent.'
  },
  default: {
    claim: 'The official service summary does not capture delays described by people using the site.', reply: 'Please distinguish what our office records from what residents experience.',
    observation: 'The team observes a queue at the public service point. The observation establishes conditions during this visit only.',
    record: 'The local service record counts completed work but does not quantify unmet requests or explain the delay.',
    issue: 'The difference between reported service and actual access', permission: 'The host agrees to a staff-accompanied visit of public areas; restricted spaces require separate approval.'
  }
};

// Original fictional perspectives. None establishes the cause of a closure.
const marketVoices = {
  'produce vendor': {
    claim: 'From my stall I see trade near the entrance, but some back-row stalls stay closed. I cannot tell you why their owners have not reopened.',
    reply: 'Please speak to those owners before writing that their situation is the same as mine. An allocated stall and a working livelihood are different things.'
  },
  'transport cooperative representative': {
    claim: 'Goods are moving through the main entrance, but that does not tell us whether every vendor can bring stock to market. I cannot account for each closed stall.',
    reply: 'Separate the route being open from a vendor being able to use it. Ask the vendors about their own journeys before deciding transport explains the closures.'
  },
  'market association chair': {
    claim: 'The summary says trading is normal, yet some stalls remain closed. I want the people absent from this conversation to have a chance to explain their situation.',
    reply: 'Please do not turn my account into everyone’s agreement. Compare the register with what you see, then hear from the people whose stalls are closed.'
  },
  'municipal licensing officer': {
    claim: 'Our register lists allocated spaces. An entry is not a daily attendance check, and it does not explain why a stall might be closed.',
    reply: 'I can explain what that record measures, but I cannot supply a reason it never recorded. Keep the allocation figures separate from observations of trading.'
  }
};

export function knowledgeFor(scenario = {}, speaker = '') {
  const site = `${scenario.siteType || ''} ${scenario.location || ''}`.toLowerCase();
  const key = ['school', 'water', 'substation', 'clinic', 'market'].find(name => site.includes(name)) || 'default';
  return { ...profiles[key], ...(key === 'market' ? marketVoices[speaker] : {}), id: `${scenario.id || 'site'}-service-access` };
}

export const sentenceCase = value => String(value || 'Local stakeholder').replace(/^./, c => c.toUpperCase());
