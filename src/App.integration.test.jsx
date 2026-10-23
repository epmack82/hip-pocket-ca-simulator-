import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import App from './App';
import { generateMission } from './scenarioEngine';
import { conversationParagraphs } from './marketScene';

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
  // Clinic dialogue stays in the scene rather than requiring an outcome-page hop.
  if (!button && label === 'Continue Scene' && container.querySelector('[aria-label="Clinic conversation"]')) {
    expect(container.querySelector('[aria-label="Clinic conversation journal"] article')).not.toBeNull();
    return;
  }
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
  click('3-Day Drill Weekend');
  click('Skip Refreshers for Testing');
  click('Plan Your First Move');
  if (!planningOnly) chooseSite();
}
function submit(value) { enter(container.querySelector('textarea'), value); click('Submit Action'); }

test('clinic dialogue choices stay in scene and journal survives save/reload', () => {
  start(true);
  const radio = [...container.querySelectorAll('input[name="destination"]')].find(el => /clinic/i.test(el.getAttribute('aria-label')));
  expect(radio).toBeDefined();
  act(() => Simulate.change(radio));
  click('Travel to Selected Site');
  expect(container.querySelector('[aria-label="Clinic conversation"]')).not.toBeNull();
  click('What has changed here?');
  expect(container.querySelector('[aria-label="Clinic conversation journal"] article')).not.toBeNull();
  expect(text()).toContain('Revisit earlier topic');
  click('Save & Exit'); click('Load');
  expect(text()).toContain('Revisit earlier topic');
  expect(container.querySelector('[aria-label="Clinic conversation journal"]').textContent).toContain('current service conditions');
  expect(global.fetch).not.toHaveBeenCalled();
});

test('market map selection, named hosts and open requests persist through app save/load', () => {
  start(true);
  const marker = container.querySelector('.atlas-node');
  act(() => marker.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  expect(marker.classList.contains('is-selected')).toBe(true);
  expect(container.querySelector('input[name="destination"]').checked).toBe(true);
  click('Travel to Selected Site');
  expect(container.querySelector('img[src="/art/market-arrival-v1.png"]')).not.toBeNull();
  submit('I greet Niran. I schedule a meeting with Niran to discuss service conditions.');
  expect(text()).toContain('Niran (transport cooperative representative)');
  expect(text()).toContain('Requested — not confirmed');
  click('Continue Scene');
  expect(text()).toContain('Directly engaged');
  click('Save & Exit');
  click('Load');
  expect(text()).toContain('Your open requests');
  const saved = JSON.parse(localStorage.getItem('hipPocket_saves'))[0];
  const site = Object.values(saved.worldState.sites)[0];
  expect(site.followUpRequests).toHaveLength(1);
  expect(site.engagedParticipants).toContain('transport cooperative representative');
  expect(global.fetch).not.toHaveBeenCalled();
});

test('command brief follows the chosen destination, survives save/load and can be revised from another site', () => {
  start();
  submit('I ask the market association chair about current service conditions.');
  click('Continue Scene');
  const savedBefore = JSON.parse(localStorage.getItem('hipPocket_saves'))[0];
  const origin = savedBefore.missionScenarios[savedBefore.scenarioIndex];
  const destination = savedBefore.missionScenarios.find(s => s.id !== origin.id);
  click('Brief Command');
  enter(container.querySelector('[data-testid="command-recommendation"]'), 'Compare this account with access at the next site.');
  enter(container.querySelector('[data-testid="command-uncertainty"]'), 'Only one source has reported this so far.');
  const check = container.querySelector('.command-evidence input');
  expect(check).not.toBeNull();
  act(() => Simulate.change(check, { target: { checked: true } }));
  enter(container.querySelector('[aria-label="Proposed follow-up destination"]'), destination.id);
  click('Record Command Brief');
  expect(text()).toContain('Collection priority recorded');
  const savedAfter = JSON.parse(localStorage.getItem('hipPocket_saves'))[0];
  expect(savedAfter.worldState.history).toEqual(savedBefore.worldState.history);
  expect(savedAfter.worldState.relationships).toEqual(savedBefore.worldState.relationships);
  expect(savedAfter.worldState.commandBriefs).toHaveLength(1);
  click('Save & Exit'); click('Load');
  expect(text()).toContain('Collection priority recorded');
  click('Conclude Site & Continue');
  expect(text()).toContain('Command brief follow-up');
  const radio = container.querySelector(`input[name="destination"][value="${destination.id}"]`);
  act(() => Simulate.change(radio));
  click('Travel to Selected Site');
  expect(text()).toContain('This visit connects to your earlier brief');
  submit(`I ask the ${destination.keyStakeholders[0]} about current service conditions.`);
  if (!container.querySelector('[aria-label="Clinic conversation"]')) click('Continue Scene');
  expect(text()).toContain('New material available');
  click('Revise command-1');
  enter(container.querySelector('[data-testid="command-recommendation"]'), 'Request a review of the two accounts before committing assistance.');
  enter(container.querySelector('[aria-label="Decision requested"]'), 'technical');
  const checks = container.querySelectorAll('.command-evidence input');
  act(() => Simulate.change(checks[checks.length - 1], { target: { checked: true } }));
  click('Record Command Brief');
  expect(text()).toContain('Referred for feasibility review');
  expect(text()).toContain('Earlier briefs retained (1)');
  click('Save & Exit'); click('Load');
  const final = JSON.parse(localStorage.getItem('hipPocket_saves'))[0];
  expect(final.worldState.commandBriefs).toHaveLength(2);
  expect(final.worldState.commandBriefs[1].supersedes).toBe('command-1');
  expect(final.worldState.commandBriefs[0].recommendation).toBe('Compare this account with access at the next site.');
  click('Conclude Site & Continue');
  chooseSite();
  submit('I introduce the team. I ask about current service conditions.');
  click('Continue Scene');
  click('Conclude Site & Continue');
  expect(text()).toContain('MISSION DEBRIEF');
  expect(text()).toContain('Command handover');
  expect(text()).toContain('Referred for feasibility review');
  expect(text()).toContain('What must carry forward');
  click('Download Evidence JSON');
  expect(URL.createObjectURL).toHaveBeenCalled();
  expect(global.fetch).not.toHaveBeenCalled();
});

test('classroom generator prints matching separate packets without changing a mission or calling a service', () => {
  start(); click('Save & Exit');
  const mission = localStorage.getItem('hipPocket_saves');
  click('Open Classroom OPORD Exercise');
  expect(text()).toContain('Read the mission.');
  expect(text()).toContain('Answer key pending');
  enter(container.querySelector('#classroom-theme'), 'transition');
  enter(container.querySelector('#classroom-seed'), 'Major-review-1');
  expect([...container.querySelectorAll('button')].find(b => b.textContent === 'Print Student Handout').disabled).toBe(true);
  click('Generate Packet');
  expect(text()).toContain('Transition & sustainable local capacity');
  click('Preview Student Handout');
  const preview = container.querySelector('iframe');
  expect(preview.getAttribute('sandbox')).toBe('');
  expect(preview.getAttribute('srcdoc')).toContain('Major-review-1');
  expect(preview.getAttribute('srcdoc')).not.toContain('Draft facilitator discussion guide');
  const win = { document: { open: jest.fn(), write: jest.fn(), close: jest.fn() }, focus: jest.fn(), print: jest.fn(), close: jest.fn() };
  jest.spyOn(window, 'open').mockReturnValue(win);
  click('Print Student Handout');
  expect(win.print).toHaveBeenCalledTimes(1);
  expect(win.document.write.mock.calls[0][0]).toContain('Student worksheet');
  click('Print Draft Facilitator Guide');
  expect(win.document.write.mock.calls[1][0]).toContain('NOT AN APPROVED ANSWER KEY');
  window.open.mockReturnValue(null);
  click('Print Student Handout');
  expect(text()).toContain('print window was blocked');
  click('Download Student Handout');
  expect(URL.createObjectURL).toHaveBeenCalled();
  click('Generate New Variant');
  expect(container.querySelector('#classroom-seed').value).not.toBe('Major-review-1');
  expect(text()).toContain('New variant generated');
  click('← Hip Pocket home');
  expect(localStorage.getItem('hipPocket_saves')).toBe(mission);
  expect(global.fetch).not.toHaveBeenCalled();
});

test('study is available before mission setup and leaves an existing mission unchanged', () => {
  start(); click('Save & Exit');
  const mission = localStorage.getItem('hipPocket_saves');
  click('Open Study & Staff Practice');
  expect(text()).toContain('Prepare. Think. Brief.');
  click('Open: Prepare an engagement');
  enter(container.querySelector('textarea'), 'My independent study notes.');
  click('← Hip Pocket home');
  expect(localStorage.getItem('hipPocket_saves')).toBe(mission);
  click('Load');
  expect(text()).toContain('Your Purpose Here');
  expect(global.fetch).not.toHaveBeenCalled();
});

test('complete local playthrough, save/reload, authoritative AAR and leader exports without network', () => {
  start();
  submit('I introduce the team. I ask about current service conditions.');
  expect(text()).toContain('attributed account');
  const saved = JSON.parse(localStorage.getItem('hipPocket_saves'))[0];
  expect(saved.worldState.history).toHaveLength(1);
  expect(saved.siteStates).toEqual(saved.worldState.sites);
  const narrative = saved.lastOutcome.narrativeOutcome;
  click('Continue Scene');
  expect(JSON.parse(localStorage.getItem('hipPocket_saves'))[0].screen).toBe('scenarioScreen');
  conversationParagraphs(narrative).forEach(part => expect(text()).toContain(part.text));
  click('Save & Exit');
  click('Load');
  conversationParagraphs(narrative).forEach(part => expect(text()).toContain(part.text));
  click('Conclude Site & Continue');
  chooseSite();
  submit('I introduce the team. I ask about current service conditions.');
  click('Continue Scene');
  click('Conclude Site & Continue');
  chooseSite();
  submit('I introduce the team. I ask about current service conditions.');
  click('Continue Scene');
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
  click('Continue'); click('CA Specialist'); click('3-Day Drill Weekend');
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
  submit('I introduce the team.'); click('Continue Scene'); click('Conclude Site & Continue');
  expect(text()).toContain('Plan Your Next Move');
  expect([...container.querySelectorAll('input[name="destination"]')].map(el => el.value)).not.toContain(selectedId);
  expect(container.querySelectorAll('input[name="destination"]')).toHaveLength(5);
  click('Save & Exit'); click('Load');
  expect(text()).toContain('Plan Your Next Move');
  expect(container.querySelectorAll('input[name="destination"]')).toHaveLength(5);
  chooseSite(1);
  expect(JSON.parse(localStorage.getItem('hipPocket_saves'))[0].scenarioIndex).toBe(1);
  expect(text()).toContain('Day 2 of 3');
});

test('an earlier save resumes its current site and offers planning after conclusion', () => {
  start(); submit('I introduce the team.'); click('Continue Scene'); click('Save & Exit');
  const saves = JSON.parse(localStorage.getItem('hipPocket_saves'));
  delete saves[0].routeDecisions;
  delete saves[0].planningSelection;
  delete saves[0].planningRationale;
  localStorage.setItem('hipPocket_saves', JSON.stringify(saves));
  act(() => root.unmount());
  root = createRoot(container);
  act(() => root.render(<App />));
  click('Load');
  expect(text()).toMatch(/Continuity Scene|The story continues/);
  expect(text()).not.toContain('Plan Your First Move');
  click('Conclude Site & Continue');
  expect(text()).toContain('Plan Your Next Move');
  expect(container.querySelectorAll('input[name="destination"]')).toHaveLength(5);
});

test('skipped sites return to planning and consequences survive changing destinations', () => {
  start();
  click('Move to Next Location'); click('Continue');
  expect(text()).toContain('Plan Your Next Move');
  chooseSite(1);
  submit('I get drunk.'); click('Continue Scene'); click('Conclude Site & Continue');
  expect(text()).toContain('The mission carries forward');
  expect(text()).toContain('Duty impairment');
  const before = JSON.parse(localStorage.getItem('hipPocket_saves'))[0];
  expect(before.currentDay).toBe(3);
  expect(container.querySelectorAll('input[name="destination"]')).toHaveLength(4);
  chooseSite();
  const after = JSON.parse(localStorage.getItem('hipPocket_saves'))[0];
  expect(after.worldState).toEqual(before.worldState);
  expect(text()).toContain('Duty impairment');
});

test('mission product dialog records a short brief and credits participation, not template completion', () => {
  start(); click('Create a Product');
  expect(container.querySelector('dialog[open]')).toBeTruthy();
  const fields = container.querySelectorAll('dialog textarea');
  enter(fields[0], 'S-9');
  enter(fields[1], 'Prioritize follow-up');
  enter(fields[2], 'Host reports uneven access; still unverified.');
  act(() => Simulate.submit(container.querySelector('dialog form')));
  expect(text()).toContain('Mission product recorded');
  expect(text()).not.toContain('Worksheet Completion Score');
  const save = JSON.parse(localStorage.getItem('hipPocket_saves'))[0];
  expect(save.allProducts[0].mode).toBe('mission-brief');
  expect(save.allProducts[0].content).toContain('Host reports uneven access');
  expect(save.allProducts[0].completionPercent).toBeUndefined();
  expect(Object.values(save.worldState.sites)[0].dimensionScores.productQuality).toBe(100);
  expect(text()).toContain('Your submitted action');
});

test('flagged feedback and full submission survive saving and reloading the outcome', () => {
  start(); const original = 'I introduce the team. I ask about current service conditions.';
  submit(original);
  expect(container.querySelector('[aria-label="Your submitted action"]').textContent).toContain(original);
  click('Flag This Response'); click('Save Flag'); click('Save & Exit'); click('Load');
  expect(text()).toContain('Your submitted action');
  const save = JSON.parse(localStorage.getItem('hipPocket_saves'))[0];
  expect(save.playtestTurns[0].testerFeedback.inaccurate).toBe(true);
  expect(save.playtestTurns[0].playerAction).toBe(original);
});

test('Team Chief plan begins before preparation and draft survives reload', () => {
  click('Start New');
  const fields = container.querySelectorAll('input');
  enter(fields[0], 'Chief'); enter(fields[1], 'LEAD'); click('Continue');
  expect(text()).toContain('DIFFICULTY');
  click('Team Chief');
  expect(text()).not.toContain('7-Day');
  click('3-Day Drill Weekend');
  expect(text()).toContain('Before the team steps off');
  const areas = container.querySelectorAll('textarea');
  [...areas].forEach((field, i) => enter(field, 'Plan item ' + i));
  click('Save & Exit'); click('Load');
  expect(container.querySelector('textarea').value).toBe('Plan item 0');
  click('Record Plan & Continue Preparation');
  expect(JSON.parse(localStorage.getItem('hipPocket_saves'))[0].chiefPlan.completed).toBe(true);
  click('Skip Refreshers for Testing'); click('Plan Your First Move');
  expect(text()).toContain('Your pre-deployment recommendation');
  expect(container.querySelectorAll('input[name="destination"]')).toHaveLength(6);
});

test('template workshop draft is separate from mission scoring', () => {
  click('Open Study & Staff Practice'); click('Open Template Workshop');
  enter(container.querySelector('#workshop-draft'), 'My fictional assessment draft');
  click('← Study & Staff Practice'); click('Open Template Workshop');
  expect(container.querySelector('#workshop-draft').value).toBe('My fictional assessment draft');
  expect(localStorage.getItem('hipPocket_saves')).toBeNull();
  click('Download Template Draft');
  expect(URL.createObjectURL).toHaveBeenCalled();
});

test('legacy seven-day mission retains its exact scenario pool and visit allowance', () => {
  start(); click('Save & Exit');
  const saves = JSON.parse(localStorage.getItem('hipPocket_saves'));
  const legacy = generateMission({ seed: 'legacy-seven', days: 7, role: 'specialist' });
  saves[0].missionDuration = 7; saves[0].missionSeed = 'legacy-seven'; saves[0].missionScenarios = legacy;
  delete saves[0].visitLimit; delete saves[0].chiefPlan;
  localStorage.setItem('hipPocket_saves', JSON.stringify(saves));
  act(() => root.unmount()); root = createRoot(container); act(() => root.render(<App />));
  click('Load'); click('Save & Exit');
  const loaded = JSON.parse(localStorage.getItem('hipPocket_saves'))[0];
  expect(loaded.missionScenarios).toEqual(legacy); expect(loaded.visitLimit).toBe(7);
});
