import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import MarketEvidenceExhibit, { marketExhibit } from './MarketEvidenceExhibit';
import { processUnifiedAction } from './unifiedActionPipeline';
const scenario = { id: 'exhibit', siteType: 'market', location: 'Central Market', keyStakeholders: ['market association chair'] };
function act(rawText, worldState = {}) { return processUnifiedAction({ id: `turn-${worldState.history?.length || 0}`, kind: 'action', rawText, scenarioId: scenario.id, scenario, worldState }); }

test('register exhibit is unavailable until a genuine comparison and survives serialization', () => {
  expect(marketExhibit(scenario)).toBeNull();
  const first = act('I ask Mali about current trading conditions.');
  expect(marketExhibit(scenario, first.nextWorld.sites.exhibit)).toBeNull();
  const compared = act('I compare the reported trading conditions with the stall register.', first.nextWorld);
  const site = JSON.parse(JSON.stringify(compared.nextWorld.sites.exhibit));
  const html = renderToStaticMarkup(<MarketEvidenceExhibit scenario={scenario} site={site} />);
  expect(html).toContain('Stall register');
  expect(html).toContain('No direct observation');
  const observed = act('I observe the stalls from the public trading area.', compared.nextWorld);
  const updated = renderToStaticMarkup(<MarketEvidenceExhibit scenario={scenario} site={observed.nextWorld.sites.exhibit} />);
  expect(updated).toContain('Your observation');
  expect(updated).not.toContain('No direct observation');
});

test('other evidence and other locations cannot unlock the exhibit', () => {
  expect(marketExhibit(scenario, { evidence: [{ id: 'unrelated', reliability: 'partially-supported' }] })).toBeNull();
  expect(marketExhibit({ id: 'exhibit', siteType: 'school' }, { evidence: [{ id: 'exhibit-service-access:comparison' }] })).toBeNull();
});
