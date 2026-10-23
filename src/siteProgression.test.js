import { advanceSiteState, buildValidationBrief, createSiteState, followLead, siteStatusSummary } from './siteProgression';

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
  expect(siteStatusSummary(state, scenario)).toContain('1 field action completed at district clinic');
  expect(siteStatusSummary(state, scenario)).toContain('Command view');
  expect(siteStatusSummary(state, scenario)).not.toContain('progressed beyond your initial arrival');
});

test('mission status gives a command-facing field and collection summary instead of repeating evaluator prose', () => {
  const state = {
    ...createSiteState(scenario),
    actions: ['Asked questions'],
    lastUpdate: 'Your approach incorporated inquiry. Local stakeholders provide an initial response, but their accounts still require validation. A stronger follow-on action would explicitly address rapport and assessment while distinguishing facts from assumptions.',
    informationGaps: ['Confirm the claim']
  };
  expect(siteStatusSummary(state, scenario)).toContain('Collection remains incomplete');
  expect(siteStatusSummary(state, scenario)).toContain('1 information gap');
  expect(siteStatusSummary(state, scenario)).not.toContain('their accounts still require validation');
  expect(siteStatusSummary(state, scenario)).not.toContain('A stronger follow-on action');
  expect(siteStatusSummary(state, scenario)).not.toContain('Your approach incorporated inquiry');
});

test('a surfaced lead can be marked for investigation', () => {
  const state = { ...createSiteState(scenario), leads: [{ id: 'lead-1', label: 'Municipal office', status: 'open' }] };
  expect(followLead(state, 'lead-1').leads[0].status).toBe('being investigated');
});

test('validation brief connects claims, gaps, and open leads', () => {
  const brief = buildValidationBrief({
    discoveries: [
      'A baseline assessment has begun.',
      'The district health officer says the municipal services office controls the repair schedule.'
    ],
    informationGaps: ['Confirm the repair schedule through municipal records'],
    leads: [{ id: 'lead-1', label: 'municipal services office', status: 'open' }]
  });
  expect(brief.claims[0]).toContain('district health officer says');
  expect(brief.gaps[0]).toContain('Confirm');
  expect(brief.leads[0].label).toBe('municipal services office');
});
