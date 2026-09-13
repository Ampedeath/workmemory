import { useEffect, useState } from 'react';
import { getAiSettings, saveAiSettings } from '../services/ai';

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
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 p-4">
      <h2 className="text-lg font-semibold text-gray-900">AI Settings</h2>

      <label className="flex flex-col gap-1 text-sm text-gray-700">
        Base URL
        <input
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="https://api.groq.com/openai/v1"
          className="rounded-lg border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-gray-700">
        Model
        <input
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="llama-3.3-70b-versatile"
          className="rounded-lg border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-gray-700">
        API Key {hasApiKey && <span className="text-xs font-normal text-green-600">(configured)</span>}
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={hasApiKey ? '••••••••' : 'gsk_...'}
          className="rounded-lg border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </label>

      {message && <p className="text-sm text-gray-600">{message}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="self-end rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
}

export default Settings;
