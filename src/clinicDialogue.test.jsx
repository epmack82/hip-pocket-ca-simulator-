import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ClinicConversationPanel from './ClinicConversationPanel';
import { clinicTopics } from './clinicDialogue';
import { processUnifiedAction } from './unifiedActionPipeline';
const scenario = { id: 'clinic-dialogue', metadata: { site: 'clinic' }, location: 'district clinic', keyStakeholders: ['senior nurse', 'clinic director'] };
const run = (text, worldState = {}) => processUnifiedAction({ id: 'turn-' + (worldState.history?.length || 0), scenarioId: scenario.id, scenario, rawText: text, worldState });

test.each(scenario.keyStakeholders.flatMap(person => clinicTopics.map(topic => [person, topic])))('every offered topic works for %s: %o', (person, topic) => {
  const turn = run(`I ask the ${person} ${topic.question}.`);
  expect(turn.ok).toBe(true);
  expect(turn.worldUpdate.classification).toBe('focused-inquiry');
  expect(turn.nextWorld.sites[scenario.id].clinicTurns[0].topics).toContain(topic.id);
  expect(turn.worldUpdate.effects.join(' ')).not.toContain('effect is unresolved');
});
test('different viewpoints and topic memory survive serialization', () => {
  const first = run('I ask the senior nurse what has changed.');
  const second = run('I ask the clinic director what has changed.', JSON.parse(JSON.stringify(first.nextWorld)));
  expect(second.worldUpdate.effects.join(' ')).toContain('what the clinic accomplished');
  const repeat = run('I ask the senior nurse what has changed.', second.nextWorld);
  expect(repeat.worldUpdate.effects.join(' ')).toContain('My account has not changed');
  const html = renderToStaticMarkup(<ClinicConversationPanel scenario={scenario} site={repeat.nextWorld.sites[scenario.id]} onSay={() => {}} />);
  expect(html).toContain('Help me understand your different accounts');
  expect(html).toContain('Revisit earlier topic');
});
test('unheard perspectives stay locked and misconduct does not create dialogue progress', () => {
  const html = renderToStaticMarkup(<ClinicConversationPanel scenario={scenario} onSay={() => {}} />);
  expect(html).not.toContain('Help me understand your different accounts');
  const turn = run('I ask the senior nurse what has changed. I set fire to the clinic.');
  expect(turn.worldUpdate.clinicTurns).toEqual([]);
  expect(turn.nextWorld.missionOutcome.terminated).toBe(true);
});
