import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import FieldNotebook from './FieldNotebook';
import { generateScenario } from './scenarioEngine';
import { processUnifiedAction, outcomeFromTurn } from './unifiedActionPipeline';
const scenario = generateScenario('market-prototype', { featuredMarket: true, role: 'specialist' });
scenario.keyStakeholders = ['market association chair', 'produce vendor'];
test('reported gift typo receives a clarification without inventing acceptance', () => {
  const rawText = "I ask Mali about current trading conditions and who is affected. I leverage our translator to help ensure we are being culturally sensitive. we also give a give of thanks for Mali's time";
  const turn = processUnifiedAction({ id: 'typo', kind: 'action', rawText, scenario, scenarioId: scenario.id, worldState: {} });
  expect(turn.ok).toBe(true);
  const text = outcomeFromTurn(turn).narrativeOutcome;
  expect(text).toContain('What did you have in mind?');
  expect(text).not.toContain('The summary says');
  expect(text).not.toContain('shifts attention');
  expect(turn.worldUpdate.giftResponses).toEqual([]);
});
test('market notebook is closed by default and labels accounts as unconfirmed', () => {
  const html = renderToStaticMarkup(<FieldNotebook scenario={scenario} site={{}} orientation={{ purpose: 'Listen' }} validation={{ claims: ['Reported claim'], gaps: [], leads: [] }} scenarios={[scenario]} records={[]} sites={{}} dimensions={[]} />);
  expect(html).not.toContain(' open=""');
  expect(html).toContain('Attributed accounts — not independently confirmed');
  expect(html).toContain('Reported claim');
});
