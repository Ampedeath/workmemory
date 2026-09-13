import { useEffect, useState } from 'react';
import { getAiSettings, saveAiSettings } from '../services/ai';

const INPUT_CLASS =
  'rounded-lg border border-slate-300 p-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500';

function Settings() {
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadSettings();
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

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">AI Settings</h2>

      <label className="flex flex-col gap-1 text-sm text-slate-700">
        Base URL
        <input
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="https://api.groq.com/openai/v1"
          className={`${INPUT_CLASS} placeholder:text-slate-400`}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-slate-700">
        Model
        <input
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="openai/gpt-oss-20b"
          className={`${INPUT_CLASS} placeholder:text-slate-400`}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-slate-700">
        API Key {hasApiKey && <span className="text-xs font-normal text-emerald-600">(configured)</span>}
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={hasApiKey ? '••••••••' : 'gsk_...'}
          className={`${INPUT_CLASS} placeholder:text-slate-400`}
        />
      </label>

      {message && <p className="text-sm text-slate-600">{message}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="self-end rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? 'Saving...' : 'Save'}
      </button>
    </section>
  );
}

export default Settings;
