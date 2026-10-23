import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import StudyPractice from './StudyPracticeScreen';
import { STUDY_STORAGE_KEY } from './studyPractice';
import { STUDY_LESSONS } from './studyLessons';

let container, root;
beforeEach(() => {
  localStorage.clear(); global.IS_REACT_ACT_ENVIRONMENT = true;
  global.fetch = jest.fn(() => { throw Error('No service allowed'); });
  URL.createObjectURL = jest.fn(() => 'blob:study'); URL.revokeObjectURL = jest.fn();
  jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); jest.restoreAllMocks(); });
const render = () => act(() => root.render(<StudyPractice onExit={() => {}} />));
function click(text) {
  const button = [...container.querySelectorAll('button')].find(b => b.textContent === text);
  expect(button).toBeDefined();
  act(() => button.dispatchEvent(new MouseEvent('click', { bubbles: true })));
}
function change(el, target) { act(() => Simulate.change(el, { target })); }

test('draft resumes, submission locks, retry preserves evidence, export works with no network', () => {
  localStorage.setItem('hipPocket_saves', 'mission sentinel'); render();
  click('Open: Prepare an engagement');
  click('Submit Practice for Review'); expect(container.textContent).toContain('Answer each knowledge-check');
  STUDY_LESSONS[0].questions.forEach(q => change(container.querySelector(`input[name="study-${q.id}"][value="${q.answer}"]`), {}));
  change(container.querySelector('textarea'), { value: 'Respect participation and explain the purpose.' });
  act(() => root.unmount()); root = createRoot(container); render();
  click('Continue: Prepare an engagement');
  expect(container.querySelector('textarea').value).toContain('Respect participation');
  click('Submit Practice for Review');
  expect(container.textContent).toContain('Knowledge check: 3 / 3');
  expect(container.querySelector('textarea').disabled).toBe(true);
  click('Start Another Attempt');
  expect(container.querySelector('textarea').value).toBe('');
  expect(container.querySelector('textarea').disabled).toBe(false);
  click('Back to Study Modules');
  expect(container.textContent).toContain('1 / 3');
  click('Download Study Report'); click('Download Study Evidence JSON');
  expect(URL.createObjectURL).toHaveBeenCalledTimes(2);
  expect(JSON.parse(localStorage.getItem(STUDY_STORAGE_KEY)).modules.engagement.attempts).toHaveLength(1);
  expect(localStorage.getItem('hipPocket_saves')).toBe('mission sentinel');
  expect(global.fetch).not.toHaveBeenCalled();
});

test('unreadable stored study data is not overwritten while the temporary session remains usable', () => {
  localStorage.setItem(STUDY_STORAGE_KEY, 'damaged record'); render();
  expect(container.textContent).toContain('Existing data has not been overwritten');
  click('Open: Assess a civil service');
  change(container.querySelector('textarea'), { value: 'Temporary response' });
  expect(localStorage.getItem(STUDY_STORAGE_KEY)).toBe('damaged record');
  click('Download Study Report'); expect(URL.createObjectURL).toHaveBeenCalled();
});
