import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import TravelMap, { travelPoints } from './TravelMap';
const scenarios = Array.from({ length: 18 }, (_, i) => ({ id: `site-${i}`, location: `Site ${i}, District` }));
test('exercise positions remain stable and unique for longer missions', () => {
  const points = travelPoints(scenarios);
  expect(new Set(points.map(p => `${p.x},${p.y}`)).size).toBe(18);
  expect(travelPoints(scenarios.slice(0, 6))).toEqual(points.slice(0, 6));
});
test('map shows current team location and keeps concluded sites unavailable', () => {
  const html = renderToStaticMarkup(<TravelMap scenarios={scenarios} records={[{ scenarioId: 'site-0' }]} selected="site-2" onSelect={() => {}} />);
  expect(html).toContain('TEAM HERE');
  expect(html).toContain('aria-disabled="true"');
  expect(html).toContain('North is up');
  expect(html).toContain('Fictional layout, not to scale');
  expect(html).toContain('Map destination: Site 17, District');
  expect(html).not.toContain('numbered destinations');
});
