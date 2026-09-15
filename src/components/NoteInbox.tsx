import { useEffect, useRef, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import DetailLevelToggle from './DetailLevelToggle';
import { useNotes } from '../hooks/useNotes';
import { formatNote } from '../services/ai';
import type { DetailLevel, NoteType } from '../types';

const MAX_CHARS = 2000;
const WARNING_THRESHOLD = 1850;
const NOTE_TYPES: NoteType[] = ['Reminder', 'Task', 'Investigation', 'Note', 'Waiting', 'Decision'];

function errorMessage(e: unknown): string {
  if (typeof e === 'string') return e;
  if (e instanceof Error) return e.message;
  return 'Unknown error';
}

type Stage = 'editing' | 'formatting' | 'preview' | 'saving';

interface PreviewFields {
  title: string;
  type: NoteType;
  dueAt: string;
  action: string;
  tags: string;
  context: string;
}

interface NoteInboxProps {
  onSaved?: () => void;
}

const INPUT_CLASS =
  'rounded-lg border border-slate-300 p-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500';

function NoteInbox({ onSaved }: NoteInboxProps) {
  const [text, setText] = useState('');
  const [detailLevel, setDetailLevel] = useState<DetailLevel>('Quick');
  const [stage, setStage] = useState<Stage>('editing');
  const [preview, setPreview] = useState<PreviewFields | null>(null);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { saveNote } = useNotes();

  const charCount = text.length;
  const isOverLimit = charCount >= MAX_CHARS;
  const isNearLimit = charCount >= WARNING_THRESHOLD;

  useEffect(() => {
    const unlisten = listen('focus-note-inbox', () => {
      textareaRef.current?.focus();
    });
    return () => {
      void unlisten.then((fn) => fn());
    };
  }, []);

  function resetForm() {
    setText('');
    setPreview(null);
    setError(null);
    setStage('editing');
    textareaRef.current?.focus();
  }

  async function handleFormat() {
    if (!text.trim() || isOverLimit || stage !== 'editing') return;
    setStage('formatting');
    setError(null);
    try {
      const result = await formatNote({ rawInput: text, detailLevel });
      setPreview({
        title: result.title,
        type: result.type,
        dueAt: result.dueAt ?? '',
        action: result.action ?? '',
        tags: result.tags.join(', '),
        context: result.context ?? '',
      });
      setStage('preview');
    } catch (e) {
      setError(errorMessage(e));
      setStage('editing');
    }
  }

  async function handleConfirmSave() {
    if (!preview) return;
    setStage('saving');
    try {
      await saveNote({
        rawInput: text,
        detailLevel,
        title: preview.title,
        type: preview.type,
        dueAt: preview.dueAt.trim() || null,
        action: preview.action.trim() || null,
        tags: preview.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        context: detailLevel === 'Detailed' ? preview.context.trim() || null : null,
      });
      resetForm();
      onSaved?.();
    } catch (e) {
      setError(errorMessage(e));
      setStage('preview');
    }
  }

  async function handleSaveRaw() {
    if (!text.trim() || isOverLimit) return;
    setStage('saving');
    try {
      await saveNote({ rawInput: text, detailLevel });
      resetForm();
      onSaved?.();
    } catch (e) {
      setError(errorMessage(e));
      setStage('editing');
    }
  }

  function handleCancelPreview() {
    setPreview(null);
    setStage('editing');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      void handleFormat();
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    if (e.target.value.length <= MAX_CHARS) {
      setText(e.target.value);
    }
  }

  const isBusy = stage === 'formatting' || stage === 'saving';

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">New note</h2>

      <textarea
        ref={textareaRef}
        autoFocus
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={isBusy || stage === 'preview'}
        placeholder="Enter your note... (Ctrl+Enter to process with AI)"
        className="h-40 w-full resize-none rounded-lg border border-slate-300 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
      />

      <div className="flex items-center justify-between">
        <DetailLevelToggle value={detailLevel} onChange={setDetailLevel} />
        <span
          className={`text-xs ${
            isOverLimit ? 'font-semibold text-red-600' : isNearLimit ? 'text-orange-500' : 'text-slate-400'
          }`}
        >
          {charCount} / {MAX_CHARS}
        </span>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-lg bg-red-50 p-3 text-sm text-red-600">
          <span>{error}</span>
          {stage === 'editing' && (
            <button
              type="button"
              onClick={handleSaveRaw}
              className="whitespace-nowrap font-medium underline hover:no-underline"
            >
              Save as raw note
            </button>
          )}
        </div>
      )}

      {stage === 'preview' && preview && (
        <div className="flex flex-col gap-3 rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
            AI result — review and save
          </p>

          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Title
            <input
              value={preview.title}
              onChange={(e) => setPreview({ ...preview, title: e.target.value })}
              className={INPUT_CLASS}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Type
            <select
              value={preview.type}
              onChange={(e) => setPreview({ ...preview, type: e.target.value as NoteType })}
              className={INPUT_CLASS}
            >
              {NOTE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Due at (ISO 8601 UTC, or leave empty)
            <input
              value={preview.dueAt}
              onChange={(e) => setPreview({ ...preview, dueAt: e.target.value })}
              placeholder="2026-08-24T10:00:00Z"
              className={`${INPUT_CLASS} placeholder:text-slate-400`}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Action
            <input
              value={preview.action}
              onChange={(e) => setPreview({ ...preview, action: e.target.value })}
              className={INPUT_CLASS}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Tags (comma-separated, up to 3)
            <input
              value={preview.tags}
              onChange={(e) => setPreview({ ...preview, tags: e.target.value })}
              className={INPUT_CLASS}
            />
          </label>

          {detailLevel === 'Detailed' && (
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Context
              <textarea
                value={preview.context}
                onChange={(e) => setPreview({ ...preview, context: e.target.value })}
                className={`h-20 resize-none ${INPUT_CLASS}`}
              />
            </label>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleCancelPreview}
              disabled={stage !== 'preview'}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmSave}
              disabled={stage !== 'preview'}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {stage !== 'preview' && (
        <button
          type="button"
          onClick={handleFormat}
          disabled={!text.trim() || isOverLimit || isBusy}
          className="self-end rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {stage === 'formatting' ? 'Processing with AI...' : stage === 'saving' ? 'Saving...' : 'Format'}
        </button>
      )}
    </section>
  );
}

export default NoteInbox;
