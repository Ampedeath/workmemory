import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { DetailLevel, NoteStatus, TabName, WorkItem } from '../types';

interface SaveNoteInput {
  rawInput: string;
  detailLevel: DetailLevel;
}

export function useNotes() {
  const saveNote = useCallback(async (input: SaveNoteInput): Promise<WorkItem> => {
    return invoke<WorkItem>('save_note', { payload: input });
  }, []);

  const listNotes = useCallback(async (tab: TabName): Promise<WorkItem[]> => {
    return invoke<WorkItem[]>('list_notes', { tab });
  }, []);

  const updateNoteStatus = useCallback(async (id: string, status: NoteStatus): Promise<void> => {
    return invoke<void>('update_note_status', { payload: { id, status } });
  }, []);

  return { saveNote, listNotes, updateNoteStatus };
}
