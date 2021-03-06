export const NoteType = {
  INFO: 'info',
  RECALL: 'recall',
  CHOICE: 'choice',
  INPUT: 'input',
};

const NoteLabel = {
  PROMPT: 'prompt',
};

export function isPromptNote(note) {
  if (!note) return false;
  return note.label && note.label.length && note.label.includes(NoteLabel.PROMPT);
}
