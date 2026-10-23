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

test('keeps source-grounded KLE, SITREP, CAOPREP, and analysis products distinct', () => {
  expect(buildTrainingProduct('KLE Record', scenario).content).toContain('GTA 90-01-019');
  expect(buildTrainingProduct('SITREP', scenario).content).toContain('LINE 9 - CRITICAL EQUIPMENT');
  expect(buildTrainingProduct('CA Operations Report (CAOPREP)', scenario).content).toContain('Information gaps filled');
  expect(buildTrainingProduct('Stakeholder Baseball Card', scenario).content).toContain('Long-term influence');
  expect(buildTrainingProduct('Link Diagram', scenario).content).toContain('NETWORK ASSESSMENT');
  expect(buildTrainingProduct('ASCOPE Worksheet', scenario).content).toContain('AREAS');
  expect(buildTrainingProduct('PMESII-PT Worksheet', scenario).content).toContain('POLITICAL');
});

test('creates a DA Form 1559 training worksheet with safe routing distinctions', () => {
  const product = buildTrainingProduct('Inspector General Action Request (DA Form 1559)', scenario);
  expect(product.type).toBe('Inspector General Action Request');
  expect(product.content).toContain('SPECIFIC ACTION REQUESTED');
  expect(product.content).toContain('INFORMATION PERTAINING TO THE REQUEST');
  expect(product.content).toContain('Sexual Assault Response Coordinator');
  expect(product.content).toContain('Restricted and Unrestricted reporting choices');
  expect(product.content).toContain('DO NOT submit fictional scenario information');
  expect(product.content).toContain('usarmy.usarc.usarc-hq.list.ig@army.mil');
  expect(product.recipient).toContain('Servicing/local Inspector General');
  expect(product.citationStandard).toContain('DA Form 1559');
});
