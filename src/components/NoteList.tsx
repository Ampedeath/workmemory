import { useCallback, useEffect, useMemo, useState } from 'react';
import NoteCard from './NoteCard';
import NoteDetail from './NoteDetail';
import NoteLegend from './NoteLegend';
import { useFilter } from '../hooks/useFilter';
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
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [openItem, setOpenItem] = useState<WorkItem | null>(null);
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

  const searchedItems = useFilter(items, query);

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    for (const item of searchedItems) {
      for (const tag of item.tags) set.add(tag);
    }
    return Array.from(set).sort();
  }, [searchedItems]);

  const visibleItems = selectedTag
    ? searchedItems.filter((item) => item.tags.includes(selectedTag))
    : searchedItems;

  async function handleStatusChange(id: string, status: 'Done' | 'Archived' | 'Deleted') {
    await updateNoteStatus(id, status);
    void loadNotes();
  }

  function toggleTag(tag: string) {
    setSelectedTag((current) => (current === tag ? null : tag));
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <NoteLegend />
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search notes..."
        className="rounded-lg border border-slate-300 p-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
      />

      {availableTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {availableTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                selectedTag === tag
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {isLoading && <p className="text-sm text-slate-400">Loading...</p>}
      {!isLoading && visibleItems.length === 0 && <p className="text-sm text-slate-400">No notes yet.</p>}

      <div className="flex flex-col gap-3">
        {visibleItems.map((item) => (
          <NoteCard
            key={item.id}
            item={item}
            onOpen={setOpenItem}
            onMarkDone={(id) => handleStatusChange(id, 'Done')}
            onArchive={(id) => handleStatusChange(id, 'Archived')}
            onDelete={(id) => handleStatusChange(id, 'Deleted')}
          />
        ))}
      </div>

      {openItem && (
        <NoteDetail item={openItem} onClose={() => setOpenItem(null)} onSaved={() => void loadNotes()} />
      )}
    </section>
  );
}

export default NoteList;
