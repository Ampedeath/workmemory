import { useEffect, useState } from 'react';
import { getAiSettings, saveAiSettings } from '../services/ai';
import { getAutostartEnabled, getTheme, setAutostartEnabled, setTheme as saveTheme } from '../services/settings';
import { applyTheme } from '../utils/theme';
import ThemeToggle from './ThemeToggle';
import type { ThemePreference } from '../types';

const INPUT_CLASS =
  'rounded-lg border border-slate-300 p-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100';

function Settings() {
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [autostart, setAutostart] = useState(false);
  const [isTogglingAutostart, setIsTogglingAutostart] = useState(false);
  const [theme, setThemeState] = useState<ThemePreference>('system');

  useEffect(() => {
    void loadSettings();
    void getAutostartEnabled().then(setAutostart);
    void getTheme().then(setThemeState);
  }, []);

  async function loadSettings() {
    const settings = await getAiSettings();
    setBaseUrl(settings.baseUrl);
    setModel(settings.model);
    setHasApiKey(settings.hasApiKey);
  }

  async function handleSave() {
    setIsSaving(true);
    setMessage(null);
    try {
      await saveAiSettings({ baseUrl, apiKey, model });
      setApiKey('');
      setMessage('Saved.');
      await loadSettings();
    } catch {
      setMessage('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleAutostart() {
    const next = !autostart;
    setIsTogglingAutostart(true);
    try {
      await setAutostartEnabled(next);
      setAutostart(next);
    } catch {
      // leave the toggle at its previous state on failure
    } finally {
      setIsTogglingAutostart(false);
    }
  }

  async function handleThemeChange(next: ThemePreference) {
    setThemeState(next);
    applyTheme(next);
    try {
      await saveTheme(next);
    } catch {
      // theme still applied for this session even if persisting failed
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">General</h2>

        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-700 dark:text-slate-300">Theme</span>
          <ThemeToggle value={theme} onChange={(next) => void handleThemeChange(next)} />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm text-slate-700 dark:text-slate-300">Launch on system startup</span>
            <span className="text-xs text-slate-400">Start WorkMemory automatically when you log in</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={autostart}
            onClick={() => void handleToggleAutostart()}
            disabled={isTogglingAutostart}
            className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors disabled:opacity-50 ${
              autostart ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                autostart ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">AI Settings</h2>

        <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-300">
          Base URL
          <input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.groq.com/openai/v1"
            className={`${INPUT_CLASS} placeholder:text-slate-400`}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-300">
          Model
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="openai/gpt-oss-20b"
            className={`${INPUT_CLASS} placeholder:text-slate-400`}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-300">
          API Key {hasApiKey && <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400">(configured)</span>}
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={hasApiKey ? '••••••••' : 'gsk_...'}
            className={`${INPUT_CLASS} placeholder:text-slate-400`}
          />
        </label>

        {message && <p className="text-sm text-slate-600 dark:text-slate-400">{message}</p>}

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="self-end rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </section>
    </div>
  );
}

export default Settings;
