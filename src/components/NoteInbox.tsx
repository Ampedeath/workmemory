import { useRef, useState } from 'react';
import DetailLevelToggle from './DetailLevelToggle';
import { useNotes } from '../hooks/useNotes';
import type { DetailLevel } from '../types';

const MAX_CHARS = 2000;
const WARNING_THRESHOLD = 1850;

interface NoteInboxProps {
  onSaved?: () => void;
}

function NoteInbox({ onSaved }: NoteInboxProps) {
  const [text, setText] = useState('');
  const [detailLevel, setDetailLevel] = useState<DetailLevel>('Quick');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { saveNote } = useNotes();

  const charCount = text.length;
  const isOverLimit = charCount >= MAX_CHARS;
  const isNearLimit = charCount >= WARNING_THRESHOLD;

  async function handleSave() {
    if (!text.trim() || isOverLimit || isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      await saveNote({ rawInput: text, detailLevel });
      setText('');
      textareaRef.current?.focus();
      onSaved?.();
    } catch {
      setError('Не вдалося зберегти нотатку. Спробуй ще раз.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      void handleSave();
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    if (e.target.value.length <= MAX_CHARS) {
      setText(e.target.value);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 p-4">
      <textarea
        ref={textareaRef}
        autoFocus
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={isSaving}
        placeholder="Що сталось? (Ctrl+Enter — зберегти)"
        className="h-40 w-full resize-none rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      />

      <div className="flex items-center justify-between">
        <DetailLevelToggle value={detailLevel} onChange={setDetailLevel} />
        <span
          className={`text-xs ${
            isOverLimit ? 'font-semibold text-red-600' : isNearLimit ? 'text-orange-500' : 'text-gray-400'
          }`}
        >
          {charCount} / {MAX_CHARS}
        </span>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={!text.trim() || isOverLimit || isSaving}
        className="self-end rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? 'Збереження...' : 'Зберегти'}
      </button>
    </div>
  );
}

export default NoteInbox;
