import type { NoteType, WorkItem } from '../types';

export const TYPE_COLOR: Record<NoteType, { dot: string; accent: string }> = {
  Investigation: { dot: 'bg-orange-500', accent: 'border-l-orange-400' },
  Reminder: { dot: 'bg-blue-500', accent: 'border-l-blue-400' },
  Task: { dot: 'bg-green-500', accent: 'border-l-green-400' },
  Waiting: { dot: 'bg-yellow-500', accent: 'border-l-yellow-400' },
  Decision: { dot: 'bg-purple-500', accent: 'border-l-purple-400' },
  Note: { dot: 'bg-slate-400', accent: 'border-l-slate-300' },
};

interface NoteCardProps {
  item: WorkItem;
  onOpen: (item: WorkItem) => void;
  onMarkDone: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

function NoteCard({ item, onOpen, onMarkDone, onArchive, onDelete }: NoteCardProps) {
  const isOverdue = item.status === 'Active' && item.dueAt !== null && new Date(item.dueAt) < new Date();
  const isActive = item.status === 'Active';

  return (
    <div
      onClick={() => onOpen(item)}
      className={`flex cursor-pointer items-start gap-3 rounded-xl border border-l-4 p-3 shadow-sm transition-shadow hover:shadow-md ${
        isOverdue
          ? 'border-red-300 border-l-red-400 bg-red-50'
          : `border-slate-200 bg-white ${TYPE_COLOR[item.type].accent}`
      }`}
    >
      <span className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${TYPE_COLOR[item.type].dot}`} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">{item.title}</p>
        {item.dueAt && (
          <p className={`text-xs ${isOverdue ? 'font-medium text-red-600' : 'text-slate-400'}`}>
            {new Date(item.dueAt).toLocaleString()}
          </p>
        )}
      </div>

      <div className="flex flex-shrink-0 items-center gap-1">
        {isActive && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMarkDone(item.id);
              }}
              title="Mark as Done"
              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-emerald-100 hover:text-emerald-600"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onArchive(item.id);
              }}
              title="Archive"
              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <rect x="1" y="3" width="22" height="5" />
                <polyline points="21 8 21 21 3 21 3 8" />
                <line x1="10" y1="12" x2="14" y2="12" />
              </svg>
            </button>
          </>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          title="Delete"
          className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-100 hover:text-red-600"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default NoteCard;
