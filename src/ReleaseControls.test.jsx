import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import SavedMissionMenu from './SavedMissionMenu';
import TravelMap from './TravelMap';

let container, root;
beforeEach(() => { global.IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
test('saved menu starts collapsed and preserves original slot indices', () => {
  const onLoad = jest.fn(), onDelete = jest.fn();
  act(() => root.render(<SavedMissionMenu slots={[null, { currentDay: 2, missionDuration: 3, playerRole: 'chief' }]} describe={() => ({ location: 'Clinic', timeAgo: 'Just now' })} onLoad={onLoad} onDelete={onDelete} />));
  expect(container.querySelector('details').open).toBe(false);
  act(() => container.querySelector('summary').click());
  expect(container.querySelector('details').open).toBe(true);
  act(() => container.querySelector('button').click());
  expect(onLoad).toHaveBeenCalledWith(1);
  act(() => container.querySelector('[aria-label="Delete saved mission 2"]').click());
  expect(onDelete).toHaveBeenCalledWith(1);
});
test('map supports keyboard selection and rejects concluded and read-only changes', () => {
  const onSelect = jest.fn();
  const props = { scenarios: [{ id: 'a', location: 'Market' }, { id: 'b', location: 'Clinic' }], records: [{ scenarioId: 'a' }], selected: 'b', onSelect };
  act(() => root.render(<TravelMap {...props} />));
  let pins = container.querySelectorAll('[role="button"]');
  act(() => Simulate.keyDown(pins[1], { key: 'Enter' }));
  expect(onSelect).toHaveBeenCalledWith('b');
  onSelect.mockClear();
  act(() => Simulate.click(pins[0]));
  expect(onSelect).not.toHaveBeenCalled();
  act(() => root.render(<TravelMap {...props} readOnly />));
  pins = container.querySelectorAll('[role="button"]');
  act(() => Simulate.keyDown(pins[1], { key: ' ' }));
  expect(onSelect).not.toHaveBeenCalled();
});
