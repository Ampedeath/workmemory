import type { NoteType } from '../types';
import { TYPE_COLOR } from './NoteCard';

const TYPE_ORDER: NoteType[] = ['Reminder', 'Task', 'Investigation', 'Waiting', 'Decision', 'Note'];

function NoteLegend() {
  return (
    <div className="group relative inline-flex">
      <button
        type="button"
        aria-label="What do the colors mean?"
        className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-[11px] font-medium text-slate-400 transition-colors hover:border-slate-400 hover:text-slate-600"
      >
        i
      </button>

      <div className="invisible absolute right-0 top-full z-10 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600 opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100">
        <p className="mb-2 font-medium text-slate-800">Note colors</p>
        <ul className="flex flex-col gap-1.5">
          {TYPE_ORDER.map((type) => (
            <li key={type} className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${TYPE_COLOR[type].dot}`} />
              {type}
            </li>
          ))}
        </ul>
        <div className="mt-2 flex items-center gap-2 border-t border-slate-100 pt-2">
          <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full border-2 border-red-400 bg-white" />
          Overdue (past due)
        </div>
      </div>
    </div>
  );
}

export default NoteLegend;
