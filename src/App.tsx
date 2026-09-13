import { useCallback, useState } from 'react';
import NoteInbox from './components/NoteInbox';
import NoteList from './components/NoteList';
import Settings from './components/Settings';
import './App.css';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const handleNoteSaved = useCallback(() => setRefreshTrigger((t) => t + 1), []);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              W
            </span>
            <span className="text-base font-semibold text-slate-900">WorkMemory</span>
          </div>
          <button
            type="button"
            onClick={() => setShowSettings((v) => !v)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
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
