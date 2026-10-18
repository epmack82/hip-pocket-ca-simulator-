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
function chooseSite(index = 0) {
  const radio = container.querySelectorAll('input[name="destination"]')[index];
  expect(radio).toBeDefined();
  act(() => Simulate.change(radio));
  click('Travel to Selected Site');
}
function start(planningOnly = false) {
  click('Start New');
  const fields = container.querySelectorAll('input');
  enter(fields[0], 'Test Soldier');
  enter(fields[1], 'TEST');
  click('Continue');
  click('CA Specialist');
  click('3-Day Mission');
  click('Skip Refreshers for Testing');
  click('Plan Your First Move');
  if (!planningOnly) chooseSite();
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
  chooseSite();
  submit('I introduce the team. I ask about current service conditions.');
  click('Back to Location');
  click('Conclude Site & Continue');
  chooseSite();
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
  expect(complete.routeDecisions).toHaveLength(3);
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
  click('Skip Refreshers for Testing'); click('Plan Your First Move'); chooseSite();
  submit('I introduce the team.');
  const saves = JSON.parse(localStorage.getItem('hipPocket_saves'));
  expect(saves[0].worldState.persistentConditions.length).toBeGreaterThan(0);
  expect(saves[1].worldState.persistentConditions).toEqual([]);
  expect(saves[1].worldState.history).toHaveLength(1);
  expect(saves[1].sessionId).not.toBe(saves[0].sessionId);
});

test('planning draft survives reload and a non-first choice becomes the actual first visit', () => {
  start(true);
  expect(text()).toContain('you have not arrived at a field location yet');
  expect(text()).not.toContain('Arrival —');
  expect([...container.querySelectorAll('button')].find(button => button.textContent === 'Travel to Selected Site').disabled).toBe(true);
  const initial = JSON.parse(localStorage.getItem('hipPocket_saves'))[0];
  const selectedId = container.querySelectorAll('input[name="destination"]')[2].value;
  act(() => Simulate.change(container.querySelectorAll('input[name="destination"]')[2]));
  enter(container.querySelector('#planning-rationale'), 'Clarify essential service access first.');
  click('Save & Exit'); click('Load');
  expect(text()).toContain('Plan Your First Move');
  expect(container.querySelector('input:checked').value).toBe(selectedId);
  expect(container.querySelector('#planning-rationale').value).toBe('Clarify essential service access first.');
  click('Travel to Selected Site');
  const save = JSON.parse(localStorage.getItem('hipPocket_saves'))[0];
  expect(save.scenarioIndex).toBe(2);
  expect(save.currentDay).toBe(1);
  expect(save.missionScenarios).toEqual(initial.missionScenarios);
  expect(save.worldState).toEqual(initial.worldState);
  expect(save.routeDecisions[0].scenarioId).toBe(selectedId);
  expect(text()).toContain('Your reasoning: Clarify essential service access first.');
  expect(text().indexOf('Your Purpose Here')).toBeLessThan(text().indexOf('Arrival — At Your Chosen Location'));
  expect(text()).not.toContain('Your task is to');
  submit('I introduce the team.'); click('Back to Location'); click('Conclude Site & Continue');
  expect(text()).toContain('Plan Your Next Move');
  expect([...container.querySelectorAll('input[name="destination"]')].map(el => el.value)).not.toContain(selectedId);
  expect(container.querySelectorAll('input[name="destination"]')).toHaveLength(2);
  click('Save & Exit'); click('Load');
  expect(text()).toContain('Plan Your Next Move');
  expect(container.querySelectorAll('input[name="destination"]')).toHaveLength(2);
  chooseSite(1);
  expect(JSON.parse(localStorage.getItem('hipPocket_saves'))[0].scenarioIndex).toBe(1);
  expect(text()).toContain('Day 2 of 3');
});

test('an earlier save resumes its current site and offers planning after conclusion', () => {
  start(); submit('I introduce the team.'); click('Back to Location'); click('Save & Exit');
  const saves = JSON.parse(localStorage.getItem('hipPocket_saves'));
  delete saves[0].routeDecisions;
  delete saves[0].planningSelection;
  delete saves[0].planningRationale;
  localStorage.setItem('hipPocket_saves', JSON.stringify(saves));
  act(() => root.unmount());
  root = createRoot(container);
  act(() => root.render(<App />));
  click('Load');
  expect(text()).toContain('Continuity Scene');
  expect(text()).not.toContain('Plan Your First Move');
  click('Conclude Site & Continue');
  expect(text()).toContain('Plan Your Next Move');
  expect(container.querySelectorAll('input[name="destination"]')).toHaveLength(2);
});

test('skipped sites return to planning and consequences survive changing destinations', () => {
  start();
  click('Move to Next Location'); click('Continue');
  expect(text()).toContain('Plan Your Next Move');
  chooseSite(1);
  submit('I get drunk.'); click('Back to Location'); click('Conclude Site & Continue');
  expect(text()).toContain('The mission carries forward');
  expect(text()).toContain('Duty impairment');
  const before = JSON.parse(localStorage.getItem('hipPocket_saves'))[0];
  expect(before.currentDay).toBe(3);
  expect(container.querySelectorAll('input[name="destination"]')).toHaveLength(1);
  chooseSite();
  const after = JSON.parse(localStorage.getItem('hipPocket_saves'))[0];
  expect(after.worldState).toEqual(before.worldState);
  expect(text()).toContain('Duty impairment');
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
