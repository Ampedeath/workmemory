import { useCallback, useEffect, useState } from 'react';
import NoteCard from './NoteCard';
import NoteLegend from './NoteLegend';
import { useNotes } from '../hooks/useNotes';
import type { TabName, WorkItem } from '../types';

const TABS: TabName[] = ['Today', 'Upcoming', 'Waiting', 'Later', 'Archive'];

interface NoteListProps {
  refreshTrigger: number;
}

function NoteList({ refreshTrigger }: NoteListProps) {
  const [activeTab, setActiveTab] = useState<TabName>('Today');
  const [items, setItems] = useState<WorkItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { listNotes, updateNoteStatus } = useNotes();

  const loadNotes = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await listNotes(activeTab);
      setItems(data);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, listNotes]);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes, refreshTrigger]);

  async function handleStatusChange(id: string, status: 'Done' | 'Archived' | 'Deleted') {
    await updateNoteStatus(id, status);
    void loadNotes();
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <NoteLegend />
      </div>

      {isLoading && <p className="text-sm text-slate-400">Loading...</p>}
      {!isLoading && items.length === 0 && <p className="text-sm text-slate-400">No notes yet.</p>}

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <NoteCard
            key={item.id}
            item={item}
            onMarkDone={(id) => handleStatusChange(id, 'Done')}
            onArchive={(id) => handleStatusChange(id, 'Archived')}
            onDelete={(id) => handleStatusChange(id, 'Deleted')}
          />
        ))}
      </div>
    </section>
  );
}

export default NoteList;
