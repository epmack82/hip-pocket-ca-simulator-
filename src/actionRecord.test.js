import { createActionRecord, validateActionRecord } from './actionRecord';

test('keeps raw text and separates claimed from submitted products', () => {
  const record = createActionRecord({
    scenarioId: 'school', turnNumber: 1, rawText: 'I submitted a KLE report',
    claimedProducts: ['Post-KLE Report'], submittedProducts: []
  });
  expect(validateActionRecord(record).valid).toBe(true);
  expect(record.evidence.claimedProducts).toEqual(['Post-KLE Report']);
  expect(record.evidence.submittedProducts).toEqual([]);
});

