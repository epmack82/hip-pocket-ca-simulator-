import { buildTrainingProduct } from './productTemplates';

const scenario = {
  seed: 'HIP-DAM-1', day: 2, location: 'Karsen Dam, mountain district', hadrFocus: 'essential services',
  narrative: 'The dam provides water and power to two districts.',
  keyStakeholders: ['Dam manager', 'District engineer'],
  metadata: { environment: 'uncertain', geography: 'mountain', site: 'dam', mission: 'infrastructure' }
};

test('creates a populated site-assessment format', () => {
  const product = buildTrainingProduct('Site Assessment', scenario, 'Observed cracking near the spillway.');
  expect(product.content).toContain('DAM SITE ASSESSMENT');
  expect(product.content).toContain('Karsen Dam');
  expect(product.content).toContain('ASCOPE OBSERVATIONS');
  expect(product.content).toContain('Observed cracking near the spillway.');
});

test('creates distinct stakeholder and civil-information formats', () => {
  expect(buildTrainingProduct('Stakeholder map', scenario).content).toContain('KNOWN ACTORS');
  expect(buildTrainingProduct('Civil information update', scenario).content).toContain('CONFIRMED CIVIL FACTS');
});

test('keeps KLE, SITREP, link diagram, and framework products distinct', () => {
  expect(buildTrainingProduct('KLE Record', scenario).content).toContain('KEY LEADER ENGAGEMENT');
  expect(buildTrainingProduct('SITREP', scenario).content).toContain('REPORTING PERIOD');
  expect(buildTrainingProduct('Link Diagram', scenario).content).toContain('NETWORK ASSESSMENT');
  expect(buildTrainingProduct('ASCOPE Worksheet', scenario).content).toContain('AREAS');
  expect(buildTrainingProduct('PMESII-PT Worksheet', scenario).content).toContain('POLITICAL');
});
