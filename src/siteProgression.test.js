import { advanceSiteState, createSiteState, followLead, siteStatusSummary } from './siteProgression';

const scenario = { id: 'HIP-1', narrative: 'You arrive.', location: 'district clinic' };

test('site progress remembers actions, findings, gaps, leads, products, and scores', () => {
  const result = {
    narrativeOutcome: 'The clinic director agrees to share records.',
    product: { name: 'Site Assessment' },
    progress: {
      discoveries: ['The director will share records.'],
      informationGaps: ['Independent confirmation'],
      leads: [{ id: 'lead-1', label: 'Municipal office' }],
      dimensionScores: { rapport: 75 }
    }
  };
  const state = advanceSiteState(createSiteState(scenario), result, 'Conducted KLE', scenario);
  expect(state.stage).toBe('engagement');
  expect(state.actions).toContain('Conducted KLE');
  expect(state.completedProducts).toContain('Site Assessment');
  expect(state.dimensionScores.rapport).toBe(75);
  expect(siteStatusSummary(state, scenario)).toContain('clinic director agrees');
  expect(siteStatusSummary(state, scenario)).not.toContain('progressed beyond your initial arrival');
});

test('a surfaced lead can be marked for investigation', () => {
  const state = { ...createSiteState(scenario), leads: [{ id: 'lead-1', label: 'Municipal office', status: 'open' }] };
  expect(followLead(state, 'lead-1').leads[0].status).toBe('being investigated');
});
