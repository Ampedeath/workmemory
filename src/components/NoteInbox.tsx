import { useRef, useState } from 'react';
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
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 p-4">
      <textarea
        ref={textareaRef}
        autoFocus
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={isBusy || stage === 'preview'}
        placeholder="Що сталось? (Ctrl+Enter — обробити через AI)"
        className="h-40 w-full resize-none rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      />

      <div className="flex items-center justify-between">
        <DetailLevelToggle
          value={detailLevel}
          onChange={setDetailLevel}
        />
        <span
          className={`text-xs ${
            isOverLimit ? 'font-semibold text-red-600' : isNearLimit ? 'text-orange-500' : 'text-gray-400'
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
        <div className="flex flex-col gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-blue-700">AI-результат — перевір і збережи</p>

          <label className="flex flex-col gap-1 text-sm text-gray-700">
            Title
            <input
              value={preview.title}
              onChange={(e) => setPreview({ ...preview, title: e.target.value })}
              className="rounded-lg border border-gray-300 p-2 text-sm"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-gray-700">
            Type
            <select
              value={preview.type}
              onChange={(e) => setPreview({ ...preview, type: e.target.value as NoteType })}
              className="rounded-lg border border-gray-300 p-2 text-sm"
            >
              {NOTE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm text-gray-700">
            Due at (ISO 8601 UTC, або порожньо)
            <input
              value={preview.dueAt}
              onChange={(e) => setPreview({ ...preview, dueAt: e.target.value })}
              placeholder="2026-08-24T10:00:00Z"
              className="rounded-lg border border-gray-300 p-2 text-sm"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-gray-700">
            Action
            <input
              value={preview.action}
              onChange={(e) => setPreview({ ...preview, action: e.target.value })}
              className="rounded-lg border border-gray-300 p-2 text-sm"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-gray-700">
            Tags (через кому, до 3)
            <input
              value={preview.tags}
              onChange={(e) => setPreview({ ...preview, tags: e.target.value })}
              className="rounded-lg border border-gray-300 p-2 text-sm"
            />
          </label>

          {detailLevel === 'Detailed' && (
            <label className="flex flex-col gap-1 text-sm text-gray-700">
              Context
              <textarea
                value={preview.context}
                onChange={(e) => setPreview({ ...preview, context: e.target.value })}
                className="h-20 resize-none rounded-lg border border-gray-300 p-2 text-sm"
              />
            </label>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleCancelPreview}
              disabled={stage !== 'preview'}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmSave}
              disabled={stage !== 'preview'}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
          className="self-end rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {stage === 'formatting' ? 'Обробка через AI...' : stage === 'saving' ? 'Збереження...' : 'Format'}
        </button>
      )}
    </div>
  );
}

export default NoteInbox;
