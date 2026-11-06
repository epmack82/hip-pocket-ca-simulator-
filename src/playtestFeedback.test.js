import { parseLocalAction } from './localActionParser';
import { siteOrientation } from './missionPlanning';
import { briefAllowsTravel, restoreCapabilitiesBrief } from './CapabilitiesBrief';
import { marketInvestigationChoices } from './MarketInvestigation';

const scenario = { id: 'market-feedback', siteType: 'market', location: 'Central Market', keyStakeholders: ['market association chair'] };
test('the exact invitation accepts everyday walking language without treating hypothetical or negated walking as action', () => {
  for (const text of ['Im going to walk the back rows!', 'I walk the rear rows.']) {
    expect(parseLocalAction(text, scenario).actions.flatMap(a => a.kinds)).toContain('observation');
  }
  for (const text of ['I will not walk the back rows.', 'What if I walk the back rows?']) {
    expect(parseLocalAction(text, scenario).actions.flatMap(a => a.kinds)).not.toContain('observation');
  }
});
test('quick start survives save restoration without claiming a completed brief', () => {
  const restored = restoreCapabilitiesBrief({ capabilitiesBrief: { skipped: true, completed: false } });
  expect(briefAllowsTravel(restored)).toBe(true);
  expect(restored.completed).toBe(false);
});
test('old market arrival quotes get a speaker and missing voices are offered from arrival', () => {
  const result = siteOrientation({ ...scenario, narrative: 'Arrival.\n\n“Business looks normal from the road. Walk the back rows before you decide that it is.” Nearby, the vendor waits.' });
  expect(result.arrival).toContain('contact notes list Mali');
  expect(result.arrival).not.toContain('says');
  expect(result.arrival).not.toContain('Business looks normal');
  expect(marketInvestigationChoices(scenario).some(c => c.id === 'introduce')).toBe(true);
  expect(marketInvestigationChoices(scenario).some(c => c.id === 'absent')).toBe(true);
});
