import { useEffect, useState } from 'react';
import { useNotes } from '../hooks/useNotes';
import type { NoteType, WorkItem } from '../types';
import { datetimeLocalToIsoUtc, isoUtcToDatetimeLocal } from '../utils/datetime';

const NOTE_TYPES: NoteType[] = ['Reminder', 'Task', 'Investigation', 'Note', 'Waiting', 'Decision'];

const INPUT_CLASS =
  'rounded-lg border border-slate-300 p-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100';

interface NoteDetailProps {
  item: WorkItem;
  onClose: () => void;
  onSaved: () => void;
}

function NoteDetail({ item, onClose, onSaved }: NoteDetailProps) {
  const [title, setTitle] = useState(item.title);
  const [type, setType] = useState<NoteType>(item.type);
  const [dueAt, setDueAt] = useState(isoUtcToDatetimeLocal(item.dueAt));
  const [action, setAction] = useState(item.action ?? '');
  const [tags, setTags] = useState(item.tags.join(', '));
  const [context, setContext] = useState(item.context ?? '');
  const [showRaw, setShowRaw] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { updateNote } = useNotes();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      await updateNote({
        id: item.id,
        title,
        type,
        dueAt: datetimeLocalToIsoUtc(dueAt),
        action: action.trim() || null,
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        context: item.detailLevel === 'Detailed' ? context.trim() || null : null,
      });
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : typeof e === 'string' ? e : 'Failed to save note.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col gap-3 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Note details</h2>

        <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-300">
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={INPUT_CLASS} />
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-300">
          Type
          <select value={type} onChange={(e) => setType(e.target.value as NoteType)} className={INPUT_CLASS}>
            {NOTE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-300">
          Due at
          <input
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            className={INPUT_CLASS}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-300">
          Action
          <input value={action} onChange={(e) => setAction(e.target.value)} className={INPUT_CLASS} />
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-300">
          Tags (comma-separated)
          <input value={tags} onChange={(e) => setTags(e.target.value)} className={INPUT_CLASS} />
        </label>

        {item.detailLevel === 'Detailed' && (
          <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-300">
            Context
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className={`h-20 resize-none ${INPUT_CLASS}`}
            />
          </label>
        )}

        <div className="flex flex-col gap-1 text-sm text-slate-700">
          <button
            type="button"
            onClick={() => setShowRaw((v) => !v)}
            className="self-start text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            {showRaw ? '▾ Hide original text' : '▸ Show original text'}
          </button>
          {showRaw && (
            <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-2 text-xs text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              {item.rawInput}
            </p>
          )}
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NoteDetail;
