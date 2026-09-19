import { useCallback, useEffect, useState } from 'react';
import NoteInbox from './components/NoteInbox';
import NoteList from './components/NoteList';
import Settings from './components/Settings';
import { getTheme } from './services/settings';
import { applyTheme } from './utils/theme';
import './App.css';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const handleNoteSaved = useCallback(() => setRefreshTrigger((t) => t + 1), []);

  useEffect(() => {
    void getTheme().then(applyTheme);
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              W
            </span>
            <span className="text-base font-semibold text-slate-900 dark:text-slate-100">WorkMemory</span>
          </div>
          <button
            type="button"
            onClick={() => setShowSettings((v) => !v)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          >
            {showSettings ? '← Back' : 'Settings'}
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-2xl flex-col gap-6 p-4 sm:p-6">
        {showSettings ? (
          <Settings />
        ) : (
          <>
            <NoteInbox onSaved={handleNoteSaved} />
            <NoteList refreshTrigger={refreshTrigger} />
          </>
        )}
      </div>
    </main>
  );
}

export default App;
