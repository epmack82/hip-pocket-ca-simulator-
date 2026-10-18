import { processUnifiedAction, outcomeFromTurn } from './unifiedActionPipeline';
import { applyWorldUpdate, migrateWorldState } from './worldUpdate';
import { parseLocalAction } from './localActionParser';
import { getProductWorksheet } from './productTemplates';
import { worksheetCompletion } from './worksheetCompletion';

const school = { id: 'school', siteType: 'school', location: 'community school', keyStakeholders: ['senior teacher', 'school administrator'] };
const water = { id: 'water', siteType: 'water', location: 'water facility', keyStakeholders: ['utility operations manager', 'municipal engineer'] };
function act(rawText, worldState = {}, scenario = school, extra = {}) {
  return processUnifiedAction({ id: 'turn-' + ((worldState.history || []).length + 1), rawText, scenarioId: scenario.id, scenario, stakeholders: scenario.keyStakeholders, worldState, ...extra });
}

test.each([
  'I do not set fire to the school.',
  "I won't attack the teacher.",
  'I report that someone threatened the administrator to command.',
  'What if I burn down the building?',
  'I decide not to attack the teacher.',
  'The host says someone will attack the school.',
  "I confirm that we won't bribe the host.",
  'I break the ice with a greeting.',
  'I kick the soccer ball.',
  'I shoot a photo of the building.',
  'I ask about the attack on the school.',
  'I will provide an update to CMOC after validating the school report.'
])('does not punish a report, negation, hypothetical, or routine update: %s', text => {
  const turn = act(text);
  expect(turn.ok).toBe(true);
  expect(turn.worldUpdate.persistentConditions).toHaveLength(0);
  expect(turn.worldUpdate.scoreChanges.every(c => c.delta >= 0)).toBe(true);
});

test('unknown action is honestly unresolved and has no fabricated effects', () => {
  const turn = act('I contemplate the purple widget.');
  expect(turn.worldUpdate.classification).toBe('unresolved-action');
  expect(turn.worldUpdate.scoreChanges).toEqual([]);
  expect(turn.worldUpdate.discoveries).toEqual([]);
  expect(turn.worldUpdate.effects.join(' ')).toContain('unresolved');
});

test('misspelled secondary stakeholder receives the invitation and credit', () => {
  const turn = act('I apologize to the municiple engineer and invite them to join our conversation.', {}, water);
  expect(turn.worldUpdate.effects.join(' ')).toMatch(/Municipal engineer.*joins/);
  expect(turn.worldUpdate.relationshipChanges.map(c => c.participant)).toEqual(['municipal engineer']);
});

test('site-topic words do not redirect a conversation to another official', () => {
  const clinic = { id: 'clinic', siteType: 'clinic', location: 'district clinic', keyStakeholders: ['clinic director', 'senior nurse'] };
  const first = act('I introduce the team to the senior nurse and ask permission to continue. I ask about delays in clinic service.', {}, clinic);
  expect(first.worldUpdate.discoveries[0].source).toBe('senior nurse');
  expect(first.nextWorld.sites.clinic.conversationTarget).toBe('senior nurse');
  const second = act('I ask about changes in clinic service.', first.nextWorld, clinic);
  expect(second.worldUpdate.discoveries[0].source).toBe('senior nurse');
  const third = act('I invite the clinic director to join our conversation. I ask about clinic service.', second.nextWorld, clinic);
  expect(third.worldUpdate.discoveries[0].source).toBe('clinic director');
});

test('interpreter exclusion cannot narrate translation or give positive credit', () => {
  const turn = act('I greet the host and offer a gift. I take the POC for tea and leave my interpreter outside so he cannot overhear.', {}, water);
  expect(turn.worldUpdate.classification).toBe('interpreter-deliberately-excluded');
  expect(turn.nextWorld.interpreterStatus).toBe('excluded');
  expect(turn.worldUpdate.scoreChanges.every(c => c.delta <= 0)).toBe(true);
  expect(outcomeFromTurn(turn).narrativeOutcome).not.toContain('translates the introduction');
  const next = act('I ask the manager about water service.', turn.nextWorld, water);
  expect(next.worldUpdate.discoveries).toEqual([]);
  expect(next.worldUpdate.effects.join(' ')).toMatch(/remains excluded/);
});

test('child contact plus interpreter substitution produces both consequences, not rapport', () => {
  const turn = act('I tell my interpreter to talk to the school administrator while I go play soccer with the children.');
  expect(turn.worldUpdate.persistentConditions.map(c => c.ruleId)).toEqual(expect.arrayContaining(['protected-contact-without-permission', 'interpreter-substituted-for-soldier']));
  expect(turn.worldUpdate.relationshipChanges.every(c => c.delta < 0)).toBe(true);
  expect(turn.worldUpdate.teamReactions.length).toBeGreaterThan(0);
});

test.each(['children', 'patients', 'refugees', 'detainees', 'survivors', 'elderly'])('uncoordinated contact with %s requires context and permission', group => {
  expect(act('I interview the ' + group + '.').worldUpdate.classification).toBe('protected-contact-without-permission');
});

test('requesting permission does not grant protected contact or execute it', () => {
  const first = act('I ask the administrator for permission to play soccer with the children.');
  expect(first.worldUpdate.persistentConditions).toEqual([]);
  expect(first.nextWorld.sites.school.permissions).not.toContain('supervised-contact');
  expect(first.worldUpdate.effects.join(' ')).toContain('consent has not yet been granted');
  const second = act('I play soccer with the children.', first.nextWorld);
  expect(second.worldUpdate.classification).toBe('protected-contact-without-permission');
});

test('stated permission and supervised contact is acknowledged as stated, not misconduct', () => {
  const turn = act("With the teacher's permission, I play soccer with the children while staff supervise.");
  expect(turn.worldUpdate.persistentConditions).toEqual([]);
  expect(turn.worldUpdate.effects.join(' ')).toContain('stated permission');
});

test('permission to continue the conversation does not authorize site entry', () => {
  const turn = act('I introduce the team and ask permission to continue.');
  expect(turn.nextWorld.sites.school.permissions).toEqual([]);
  expect(turn.worldUpdate.effects.join(' ')).toContain('permits conversation');
});

test('structured buttons are not misclassified as ambiguous prose', () => {
  const turn = act('Depart without engaging at this location.', {}, school, { kind: 'skip' });
  expect(turn.worldUpdate.effects.join(' ')).not.toContain('Not yet resolved');
  expect(outcomeFromTurn(turn).actionInterpretation).toBeNull();
});

test('permission later in the sentence cannot retroactively authorize earlier observation', () => {
  const turn = act('I observe the facility. I ask permission to observe the visitor route.', {}, water);
  expect(turn.worldUpdate.effects[0]).toContain('public area');
});

test('politeness cannot cancel a critical act in a mixed submission', () => {
  const turn = act('I introduce the team. Then I set fire to the school.');
  expect(turn.worldUpdate.scoreChanges.every(c => c.delta <= 0)).toBe(true);
  expect(turn.nextWorld.missionOutcome.terminated).toBe(true);
  expect(act('I greet the teacher.', turn.nextWorld).ok).toBe(false);
});

test('same-turn repeated openings and repeated turns do not farm scores', () => {
  const first = act('I greet the teacher. I greet the teacher.');
  expect(first.worldUpdate.relationshipChanges).toHaveLength(1);
  const second = act('I greet the teacher.', first.nextWorld);
  expect(second.worldUpdate.scoreChanges).toEqual([]);
  expect(second.nextWorld.sites.school.dimensionScores).toEqual(first.nextWorld.sites.school.dimensionScores);
});

test('negative changes reduce accumulated grades and zero relationships stay zero', () => {
  const first = act('I introduce the team.', { relationships: { 'senior teacher': 0 } });
  expect(first.nextWorld.relationships['senior teacher']).toBe(4);
  const second = act('I play soccer with the children.', first.nextWorld);
  expect(second.nextWorld.sites.school.dimensionScores.rapport).toBeLessThan(first.nextWorld.sites.school.dimensionScores.rapport);
  expect(second.nextWorld.relationships['senior teacher']).toBe(0);
});

test('one record is applied exactly once and survives serialization', () => {
  const turn = act('I introduce the team.');
  const loaded = migrateWorldState({ world: JSON.parse(JSON.stringify(turn.nextWorld)) });
  expect(applyWorldUpdate(loaded, turn.worldUpdate, turn.actionRecord)).toBe(loaded);
  expect(outcomeFromTurn(turn).narrativeOutcome).toBe(loaded.sites.school.continuityNarrative);
});

test('consequences persist across locations and apology starts mitigation without erasure', () => {
  const first = act('I get drunk.');
  const second = act('I apologize and notify command of my conduct.', first.nextWorld, water);
  expect(second.nextWorld.persistentConditions[0].status).toBe('mitigating');
  expect(second.worldUpdate.localReactions.join(' ')).toContain('Earlier events');
  expect(second.nextWorld.sites.school.dimensionScores.professionalism).toBe(0);
});

test('three serious turns end the mission, multiple findings in one turn do not count as three turns', () => {
  let world = {};
  for (let i = 0; i < 3; i++) {
    const turn = act('I get drunk.', world);
    expect(turn.ok).toBe(true);
    world = turn.nextWorld;
    expect(Boolean(world.missionOutcome?.terminated)).toBe(i === 2);
  }
});

test('focused inquiry produces a stable attributed claim; a comparison is partial evidence', () => {
  const first = act('I introduce the team. I ask the teacher about attendance and access.');
  expect(first.worldUpdate.discoveries[0].reliability).toBe('claim');
  const second = act('I compare that claim with the attendance records.', first.nextWorld);
  expect(second.worldUpdate.discoveries.some(d => d.reliability === 'partially-supported')).toBe(true);
  expect(second.worldUpdate.effects.join(' ')).toContain('not a conclusion');
});

test('vague validation cannot invent evidence', () => {
  const turn = act('I validate the claim.');
  expect(turn.worldUpdate.discoveries).toEqual([]);
  expect(turn.worldUpdate.scoreChanges).toEqual([]);
});

test('a product claim has no attachment or completion credit', () => {
  const turn = act('I prepared a KLE report, baseball card, and site assessment.');
  expect(turn.worldUpdate.products.missing).toHaveLength(3);
  expect(turn.nextWorld.sites.school.completedProducts).toEqual([]);
  expect(turn.nextWorld.sites.school.dimensionScores.productQuality).toBe(0);
});

test('deleting placeholders does not earn worksheet credit', () => {
  const blank = getProductWorksheet('Site Assessment', school);
  expect(worksheetCompletion('Site Assessment', school, blank).percent).toBe(0);
  expect(worksheetCompletion('Site Assessment', school, blank.replaceAll('[Trainee entry required]', '')).percent).toBe(0);
  expect(worksheetCompletion('Site Assessment', school, 'I completed everything.').percent).toBe(0);
  expect(worksheetCompletion('Site Assessment', school, blank.replaceAll('[Trainee entry required]', 'Documented observation, source and date.')).percent).toBe(100);
});

test('submitted worksheet and projection agree on completion', () => {
  const rawText = getProductWorksheet('Site Assessment', school).replaceAll('[Trainee entry required]', 'Entry for leader review.');
  const turn = act(rawText, {}, school, { kind: 'product', productName: 'Site Assessment' });
  expect(turn.ok).toBe(true);
  expect(turn.worldUpdate.product.completionPercent).toBe(100);
  expect(turn.nextWorld.sites.school.completedProducts).toContain('Site Assessment');
});

test('lead selection alone never completes a lead, a real source reply records the visit', () => {
  const lead = { id: 'clinic-lead', contact: 'clinic director', label: 'clinic', status: 'open' };
  const first = act('I greet the director.', {}, { ...school, keyStakeholders: ['clinic director'] }, { kind: 'lead', activeLead: lead });
  expect(first.worldUpdate.leads.changed).toEqual([]);
  const second = act('I ask about current service conditions.', first.nextWorld, { ...school, keyStakeholders: ['clinic director'] }, { kind: 'lead', activeLead: lead });
  expect(second.worldUpdate.leads.changed[0].status).toBe('completed');
});

test('local parser keeps unknown clauses visible', () => {
  const result = parseLocalAction('I greet the teacher. I contemplate the widget.', school);
  expect(result.ambiguities).toContain('i contemplate the widget');
  expect(act('I greet the teacher. I contemplate the widget.').worldUpdate.effects.join(' ')).toContain('Not yet resolved');
});

test('bounded deltas expose a requested penalty but do not invent a negative applied score', () => {
  const turn = act('I get drunk.');
  const change = turn.worldUpdate.scoreChanges.find(c => c.dimension === 'professionalism');
  expect(change.requestedDelta).toBeLessThan(0);
  expect(change.delta).toBe(0);
  expect(change.after).toBe(turn.nextWorld.sites.school.dimensionScores.professionalism);
});
