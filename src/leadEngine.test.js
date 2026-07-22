import { discoverLead, evaluateLeadInvestigation } from './leadEngine';

const scenario = { lead: { id: 'lead-1', label: 'water facility', contact: 'utility manager', originLocation: 'market', openingLine: 'The records are incomplete.', returnPrompt: 'Return with the finding.' } };

test('lead must be earned through a relevant line of inquiry', () => {
  expect(discoverLead('I greet everyone and inspect the building.', scenario)).toBeNull();
  expect(discoverLead('I ask who supplies the site and what other organizations it depends on.', scenario)?.id).toBe('lead-1');
});

test('lead investigation creates story findings and return context', () => {
  const result = evaluateLeadInvestigation('I introduce myself, inspect the records, and verify the claim with another source.', scenario.lead, scenario);
  expect(result.narrativeOutcome).toContain('utility manager');
  expect(result.progress.discoveries.length).toBeGreaterThan(0);
  expect(result.leadReturnNarrative).toContain('Return');
});
