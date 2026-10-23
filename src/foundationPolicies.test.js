import { FOUNDATION_REGRESSION_CASES } from './foundationRegressionCases';
import { processUnifiedAction } from './unifiedActionPipeline';

test.each(FOUNDATION_REGRESSION_CASES)('$id produces $expected', testCase => {
  const result = processUnifiedAction({
    scenarioId: 'regression-site', rawText: testCase.text,
    stakeholders: ['Host-nation counterpart'], claimedProducts: testCase.claimedProducts || []
  });
  expect(result.ok).toBe(true);
  expect(result.worldUpdate.classification).toBe(testCase.expected);
  expect(result.worldUpdate.severity).toBe(testCase.maxSeverity);
});

