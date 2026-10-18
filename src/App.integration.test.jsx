import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import App from './App';

let container, root;
beforeEach(() => {
  localStorage.clear();
  global.IS_REACT_ACT_ENVIRONMENT = true;
  window.scrollTo = jest.fn();
  global.fetch = jest.fn(() => { throw new Error('Gameplay must not call a service'); });
  URL.createObjectURL = jest.fn(() => 'blob:test-report');
  URL.revokeObjectURL = jest.fn();
  jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<App />));
});
afterEach(() => { act(() => root.unmount()); container.remove(); jest.restoreAllMocks(); });
const text = () => container.textContent;
function click(label) {
  const buttons = [...container.querySelectorAll('button')];
  const button = buttons.find(el => el.textContent.trim() === label) || buttons.find(el => el.textContent.trim().startsWith(label));
  if (!button) throw new Error('Missing button: ' + label + '\n' + text().slice(0, 1600));
  act(() => button.dispatchEvent(new MouseEvent('click', { bubbles: true })));
}
function enter(element, value) { act(() => Simulate.change(element, { target: { value } })); }
function start() {
  click('Start New');
  const fields = container.querySelectorAll('input');
  enter(fields[0], 'Test Soldier');
  enter(fields[1], 'TEST');
  click('Continue');
  click('CA Specialist');
  click('3-Day Mission');
  click('Skip Refreshers for Testing');
  click('Deploy');
}
function submit(value) { enter(container.querySelector('textarea'), value); click('Submit Action'); }

test('complete local playthrough, save/reload, authoritative AAR and leader exports without network', () => {
  start();
  submit('I introduce the team. I ask about current service conditions.');
  expect(text()).toContain('attributed account');
  const saved = JSON.parse(localStorage.getItem('hipPocket_saves'))[0];
  expect(saved.worldState.history).toHaveLength(1);
  expect(saved.siteStates).toEqual(saved.worldState.sites);
  const narrative = saved.lastOutcome.narrativeOutcome;
  click('Back to Location');
  expect(text()).toContain(narrative);
  click('Save & Exit');
  click('Load');
  expect(text()).toContain(narrative);
  click('Conclude Site & Continue');
  submit('I introduce the team. I ask about current service conditions.');
  click('Back to Location');
  click('Conclude Site & Continue');
  submit('I introduce the team. I ask about current service conditions.');
  click('Back to Location');
  click('Conclude Site & Continue');
  expect(text()).toContain('MISSION DEBRIEF');
  expect(text()).toContain('Readiness checks were skipped or incomplete');
  expect(text()).toContain('Not taken');
  click('Download Leader Report');
  expect(URL.createObjectURL).toHaveBeenCalled();
  click('Download Evidence JSON');
  expect(URL.createObjectURL).toHaveBeenCalledTimes(2);
  expect(global.fetch).not.toHaveBeenCalled();
  const complete = JSON.parse(localStorage.getItem('hipPocket_saves'))[0];
  expect(complete.missionRecords).toHaveLength(3);
  expect(complete.worldState.history).toHaveLength(3);
  expect(complete.sessionCompletedAt).toBeTruthy();
});

test('critical incident ends the mission and remains a failed result in the AAR', () => {
  start();
  submit('I set fire to the building.');
  expect(text()).toContain('Terminal Mission Outcome');
  click('Proceed to Mission-Failure AAR');
  expect(text()).toContain('Terminated — mission failure');
  expect(text()).toContain('Destructive conduct');
  expect(global.fetch).not.toHaveBeenCalled();
});

test('new mission after saving does not carry old incident state', () => {
  start();
  submit('I get drunk.');
  click('Save & Exit');
  click('Start New Game');
  const fields = container.querySelectorAll('input');
  enter(fields[0], 'Second Soldier');
  enter(fields[1], 'SECOND');
  click('Continue'); click('CA Specialist'); click('3-Day Mission');
  click('Skip Refreshers for Testing'); click('Deploy');
  submit('I introduce the team.');
  const saves = JSON.parse(localStorage.getItem('hipPocket_saves'));
  expect(saves[0].worldState.persistentConditions.length).toBeGreaterThan(0);
  expect(saves[1].worldState.persistentConditions).toEqual([]);
  expect(saves[1].worldState.history).toHaveLength(1);
  expect(saves[1].sessionId).not.toBe(saves[0].sessionId);
});

test('product worksheet content is preserved and blank submission earns no completion credit', () => {
  start();
  click('Create a Product');
  const productButton = [...container.querySelectorAll('button')].find(el => /Site Assessment/.test(el.textContent));
  expect(productButton).toBeDefined();
  act(() => productButton.click());
  const areas = container.querySelectorAll('textarea');
  const original = areas[areas.length - 1].value;
  click('Create');
  const save = JSON.parse(localStorage.getItem('hipPocket_saves'))[0];
  expect(save.allProducts[0].content).toBe(original);
  expect(save.allProducts[0].completionPercent).toBe(0);
  expect(Object.values(save.worldState.sites)[0].dimensionScores.productQuality).toBe(0);
});
