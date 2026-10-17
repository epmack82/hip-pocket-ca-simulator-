import { applyWorldUpdate, createWorldUpdate, validateWorldUpdate } from './worldUpdate';

test('requires traceable relationship changes and applies them once', () => {
  const record = { id: 'school-turn-1' };
  const update = createWorldUpdate({
    actionRecordId: record.id,
    relationshipChanges: [{ participant: 'School administrator', delta: -5, reasonCode: 'permission-missing', evidence: 'Action 1' }]
  });
  expect(validateWorldUpdate(update, record).valid).toBe(true);
  expect(applyWorldUpdate({ relationships: { 'School administrator': 50 } }, update).relationships['School administrator']).toBe(45);
});

