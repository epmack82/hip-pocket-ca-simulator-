import { firstAvailableSaveSlot, saveConfirmation } from './saveManager';

test('selects the first empty save slot without overwriting an occupied slot', () => {
  expect(firstAvailableSaveSlot([{ operator: {} }, null, null])).toBe(1);
});

test('returns -1 when all save slots are occupied', () => {
  expect(firstAvailableSaveSlot([{}, {}, {}, {}, {}])).toBe(-1);
});

test('creates a clear resume confirmation', () => {
  expect(saveConfirmation(2, { currentDay: 3, missionDuration: 7 })).toContain('Slot 3');
  expect(saveConfirmation(2, { currentDay: 3, missionDuration: 7 })).toContain('Day 3 of 7');
});
