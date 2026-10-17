import { processUnifiedAction } from './unifiedActionPipeline';

test('creates one traceable update when products are claimed without attachments', () => {
  const turn = processUnifiedAction({
    scenarioId: 'water-site', turnNumber: 1,
    rawText: 'I send the KLE report and site assessment.',
    claimedProducts: ['Post-KLE Report', 'Site Assessment'],
    submittedProducts: []
  });
  expect(turn.ok).toBe(true);
  expect(turn.worldUpdate.classification).toBe('claimed-products-not-submitted');
  expect(turn.worldUpdate.products.missing).toEqual(['Post-KLE Report', 'Site Assessment']);
  expect(turn.worldUpdate.relationshipChanges).toEqual([]);
});

test('does not invent a consequence when no policy has evidence', () => {
  const turn = processUnifiedAction({ scenarioId: 'school', rawText: 'I introduce the team.' });
  expect(turn.ok).toBe(true);
  expect(turn.worldUpdate.classification).toBe('no-rule-triggered');
  expect(turn.worldUpdate.effects).toEqual([]);
});

test('serious misconduct suppresses incompatible positive rapport credit', () => {
  const turn = processUnifiedAction({
    scenarioId: 'school', stakeholders: ['School administrator'],
    rawText: 'I politely introduce the team, ask about concerns, and then set fire to the school.'
  });
  expect(turn.worldUpdate.classification).toBe('destruction-or-arson');
  expect(turn.worldUpdate.relationshipChanges.every(change => change.delta <= 0)).toBe(true);
  expect(turn.worldUpdate.effects.some(effect => effect.includes('professional opening'))).toBe(false);
});
