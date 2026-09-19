import type { DetailLevel } from '../types';

interface DetailLevelToggleProps {
  value: DetailLevel;
  onChange: (value: DetailLevel) => void;
}

const LEVELS: DetailLevel[] = ['Quick', 'Detailed'];

function DetailLevelToggle({ value, onChange }: DetailLevelToggleProps) {
  return (
    <div className="inline-flex gap-0.5 rounded-lg bg-slate-100 p-1 dark:bg-slate-700">
      {LEVELS.map((level) => (
        <button
          key={level}
          type="button"
          onClick={() => onChange(level)}
          className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
            value === level
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          {level}
        </button>
      ))}
    </div>
  );
}

export default DetailLevelToggle;
