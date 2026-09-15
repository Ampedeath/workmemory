import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { DetailLevel, NoteStatus, NoteType, TabName, WorkItem } from '../types';

interface SaveNoteInput {
  rawInput: string;
  detailLevel: DetailLevel;
  title?: string;
  type?: NoteType;
  dueAt?: string | null;
  action?: string | null;
  tags?: string[];
  context?: string | null;
}

interface UpdateNoteInput {
  id: string;
  title: string;
  type: NoteType;
  dueAt: string | null;
  action: string | null;
  tags: string[];
  context: string | null;
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

  const updateNote = useCallback(async (input: UpdateNoteInput): Promise<WorkItem> => {
    return invoke<WorkItem>('update_note', { payload: input });
  }, []);

  return { saveNote, listNotes, updateNoteStatus, updateNote };
}
