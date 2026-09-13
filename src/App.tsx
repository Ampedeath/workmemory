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
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto flex w-full max-w-2xl justify-end p-4 pb-0">
        <button
          type="button"
          onClick={() => setShowSettings((v) => !v)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          {showSettings ? '← Back' : 'Settings'}
        </button>
      </div>

      {showSettings ? (
        <Settings />
      ) : (
        <>
          <NoteInbox onSaved={handleNoteSaved} />
          <NoteList refreshTrigger={refreshTrigger} />
        </>
      )}
    </main>
  );
}

export default App;
