import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import FundamentalsQuiz from './FundamentalsQuiz';
import { FUNDAMENTALS_QUESTIONS as questions, gradeFundamentals } from './fundamentalsQuestionBank';
test('requires all answers and grades the complete test', () => {
  expect(() => gradeFundamentals({})).toThrow('Answer every question');
  expect(gradeFundamentals(Object.fromEntries(questions.map(q => [q.id, q.answer]))).every(i => i.correct)).toBe(true);
});
test('answers and explanations remain hidden until submission and retry is blank', () => {
  localStorage.clear(); global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div'); document.body.appendChild(container); const root = createRoot(container);
  act(() => root.render(<FundamentalsQuiz onExit={() => {}} />));
  expect(container.querySelector('[aria-label="Test results"]')).toBeNull();
  expect(container.querySelectorAll('input:checked')).toHaveLength(0);
  questions.forEach(q => act(() => Simulate.change(container.querySelectorAll(`input[name="fundamentals-${q.id}"]`)[q.answer])));
  act(() => Simulate.submit(container.querySelector('form')));
  expect(container.textContent).toContain('6 / 6 correct');
  expect(container.textContent).toContain(questions[0].feedback);
  act(() => [...container.querySelectorAll('button')].find(b => b.textContent === 'Start Fresh Attempt').click());
  expect(container.querySelectorAll('input:checked')).toHaveLength(0);
  expect(container.querySelector('[aria-label="Test results"]')).toBeNull();
  expect(JSON.parse(localStorage.getItem('hipPocket_fundamentals_v1'))).toHaveLength(1);
  act(() => root.unmount()); container.remove();
});
