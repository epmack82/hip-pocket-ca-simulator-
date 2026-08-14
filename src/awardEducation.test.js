import { gradeAwardPractice, RECOGNITION_LEVELS, ELIGIBILITY_REFERENCES } from './awardEducation';

test('contains performance recognition and separate eligibility references', () => {
  expect(RECOGNITION_LEVELS.map(item => item.id)).toEqual(expect.arrayContaining(['aam', 'arcom', 'msm', 'none']));
  expect(ELIGIBILITY_REFERENCES.some(([name]) => name.includes('Humanitarian'))).toBe(true);
  expect(ELIGIBILITY_REFERENCES.some(([name]) => name.includes('Foreign'))).toBe(true);
});

test('rewards an aligned and evidence-based practice recommendation', () => {
  const result = gradeAwardPractice({
    level: 'aam',
    achievement: 'Led and validated three civil assessments that identified a critical water-access gap.',
    impact: 'Enabled the supported headquarters to restore service for 2,400 residents and reduced duplicate assistance.',
    scope: 'Performed across three locations during a seven-day partner mission with the CAT.',
    support: 'CAOPREP, SITREP, assessment products, mission orders, photographs, and partner witness statements.'
  }, { level: 'AAM-level performance for command consideration' });
  expect(result.aligned).toBe(true);
  expect(result.score).toBe(100);
});

test('explains why duty descriptions without impact are weak', () => {
  const result = gradeAwardPractice({
    level: 'arcom',
    achievement: 'Did the mission.',
    impact: 'Worked hard.',
    scope: 'During deployment.',
    support: ''
  }, { level: 'Certificate of Achievement-level training recognition' });
  expect(result.aligned).toBe(false);
  expect(result.score).toBeLessThan(50);
  expect(result.feedback.join(' ')).toContain('mission impact');
});
