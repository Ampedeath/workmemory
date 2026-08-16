import { useCallback, useState } from 'react';
import NoteInbox from './components/NoteInbox';
import NoteList from './components/NoteList';
import './App.css';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const handleNoteSaved = useCallback(() => setRefreshTrigger((t) => t + 1), []);

  return (
    <main className="min-h-screen bg-gray-50">
      <NoteInbox onSaved={handleNoteSaved} />
      <NoteList refreshTrigger={refreshTrigger} />
    </main>
  );
}

export default App;
