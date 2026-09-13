import { invoke } from '@tauri-apps/api/core';
import type { AiSettings, DetailLevel, FormattedNote } from '../types';

interface FormatNoteInput {
  rawInput: string;
  detailLevel: DetailLevel;
}

interface SaveAiSettingsInput {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export async function formatNote(input: FormatNoteInput): Promise<FormattedNote> {
  return invoke<FormattedNote>('format_note', { payload: input });
}

export async function getAiSettings(): Promise<AiSettings> {
  return invoke<AiSettings>('get_ai_settings');
}

export async function saveAiSettings(input: SaveAiSettingsInput): Promise<void> {
  return invoke<void>('save_ai_settings', { payload: input });
}
