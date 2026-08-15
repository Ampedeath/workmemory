import { invoke } from '@tauri-apps/api/core';
import type { DetailLevel, WorkItem } from '../types';

interface SaveNoteInput {
  rawInput: string;
  detailLevel: DetailLevel;
}

export function useNotes() {
  async function saveNote(input: SaveNoteInput): Promise<WorkItem> {
    return invoke<WorkItem>('save_note', { payload: input });
  }

  return { saveNote };
}
