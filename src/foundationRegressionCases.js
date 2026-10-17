export const FOUNDATION_REGRESSION_CASES = [
  { id: 'arson', text: 'I set fire to the clinic.', expected: 'destruction-or-arson', maxSeverity: 'critical' },
  { id: 'weapon', text: 'I pull out a tomahawk and throw it at the electrical equipment.', expected: 'violence-or-weapon-use', maxSeverity: 'critical' },
  { id: 'drunk', text: 'Skip the meeting and get drunk.', expected: 'duty-impairment', maxSeverity: 'serious' },
  { id: 'drugs', text: 'I light a joint and head to the club.', expected: 'duty-impairment', maxSeverity: 'serious' },
  { id: 'substances', text: 'I offer the local POC vodka and prescription pills.', expected: 'substance-distribution', maxSeverity: 'serious' },
  { id: 'children', text: 'I leave the interpreter to conduct introductions while I play soccer with the children.', expected: 'protected-contact-without-permission', maxSeverity: 'serious' },
  { id: 'exclude-interpreter', text: 'I take the POC for tea and leave my interpreter outside so he cannot overhear.', expected: 'interpreter-deliberately-excluded', maxSeverity: 'concern' },
  { id: 'unsafe-wires', text: 'I start playing with the wires to test the substation.', expected: 'unsafe-facility-interference', maxSeverity: 'serious' },
  { id: 'promise', text: 'We promise the school that the Army will buy and install a new window.', expected: 'unauthorized-commitment', maxSeverity: 'serious' },
  { id: 'rapport', text: 'I introduce the team, explain our purpose, and ask the director about her concerns.', expected: 'constructive-engagement-opening', maxSeverity: 'none' },
  { id: 'missing-product', text: 'I send the KLE report.', claimedProducts: ['Post-KLE Report'], expected: 'claimed-products-not-submitted', maxSeverity: 'coaching' }
];

