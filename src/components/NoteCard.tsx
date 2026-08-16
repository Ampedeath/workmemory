import type { NoteType, WorkItem } from '../types';

const TYPE_DOT_COLOR: Record<NoteType, string> = {
  Investigation: 'bg-orange-500',
  Reminder: 'bg-blue-500',
  Task: 'bg-green-500',
  Waiting: 'bg-yellow-500',
  Decision: 'bg-purple-500',
  Note: 'bg-gray-400',
};

interface NoteCardProps {
  item: WorkItem;
  onMarkDone: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

function NoteCard({ item, onMarkDone, onArchive, onDelete }: NoteCardProps) {
  const isOverdue = item.status === 'Active' && item.dueAt !== null && new Date(item.dueAt) < new Date();
  const isActive = item.status === 'Active';

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-3 ${
        isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
      }`}
    >
      <span className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${TYPE_DOT_COLOR[item.type]}`} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{item.title}</p>
        {item.dueAt && (
          <p className={`text-xs ${isOverdue ? 'font-medium text-red-600' : 'text-gray-400'}`}>
            {new Date(item.dueAt).toLocaleString()}
          </p>
        )}
      </div>

      <div className="flex flex-shrink-0 gap-1">
        {isActive && (
          <>
            <button
              type="button"
              onClick={() => onMarkDone(item.id)}
              title="Mark as Done"
              className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
            >
              ✓
            </button>
            <button
              type="button"
              onClick={() => onArchive(item.id)}
              title="Archive"
              className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
            >
              🗄
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          title="Delete"
          className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-red-100 hover:text-red-600"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default NoteCard;
