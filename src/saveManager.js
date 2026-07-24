export function firstAvailableSaveSlot(saveSlots = []) {
  return saveSlots.findIndex(slot => slot === null || slot === undefined);
}

export function saveConfirmation(slotNumber, save = {}) {
  const day = save.currentDay || 1;
  const duration = save.missionDuration || '?';
  return `Mission saved to Slot ${slotNumber + 1} on Day ${day} of ${duration}. Select Load to continue later.`;
}
