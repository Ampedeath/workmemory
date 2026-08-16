import { useCallback, useEffect, useState } from 'react';
import NoteCard from './NoteCard';
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
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 p-4">
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-sm font-medium ${
              activeTab === tab
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-gray-400">Завантаження...</p>}
      {!isLoading && items.length === 0 && <p className="text-sm text-gray-400">Порожньо</p>}

      <div className="flex flex-col gap-2">
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
    </div>
  );
}

export default NoteList;
