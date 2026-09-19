import { invoke } from '@tauri-apps/api/core';
import type { ThemePreference } from '../types';

export async function getAutostartEnabled(): Promise<boolean> {
  return invoke<boolean>('get_autostart_enabled');
}

export async function setAutostartEnabled(enabled: boolean): Promise<void> {
  return invoke<void>('set_autostart_enabled', { enabled });
}

export async function getTheme(): Promise<ThemePreference> {
  return invoke<ThemePreference>('get_theme');
}

export async function setTheme(theme: ThemePreference): Promise<void> {
  return invoke<void>('set_theme', { theme });
}
