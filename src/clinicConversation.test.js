import { processUnifiedAction } from './unifiedActionPipeline';
import { clinicAnswer } from './clinicConversation';

test('clinic question addresses every requested subject without granting access', () => {
  const turn = processUnifiedAction({ scenarioId: 'clinic', location: 'district clinic', siteType: 'clinic', stakeholders: ['senior nurse', 'clinic director'], rawText: 'Ask senior nurse what has changed, who is affected, who else has relevant information, and what records may exist.' });
  const response = turn.worldUpdate.effects.join(' ');
  expect(response).toContain('daily total');
  expect(response).toContain('leave before being seen');
  expect(response).toContain('clinic director');
  expect(response).toContain('aggregate service log');
  expect(response).toContain('not permission');
});

test('clinic answer does not add unasked subjects or leak into other sites', () => {
  expect(clinicAnswer('what records exist', { siteType: 'clinic' }, 'Nurse')).not.toContain('becoming harder');
  expect(clinicAnswer('what records exist', { siteType: 'school' }, 'Teacher')).toBeNull();
});

test('festival question is recognized without inventing attendance or rewards', () => {
  const turn = processUnifiedAction({ scenarioId: 'clinic', stakeholders: ['senior nurse'], rawText: 'id like to see if you have a local festival we can attend? are their any parties?' });
  expect(turn.worldUpdate.effects.join(' ')).toContain('check with the organizers');
  expect(turn.worldUpdate.relationshipChanges).toEqual([]);
  expect(turn.worldUpdate.scoreChanges).toEqual([]);
});
