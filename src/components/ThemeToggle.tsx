import type { ThemePreference } from '../types';

interface ThemeToggleProps {
  value: ThemePreference;
  onChange: (value: ThemePreference) => void;
}

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

function ThemeToggle({ value, onChange }: ThemeToggleProps) {
  return (
    <div className="inline-flex gap-0.5 rounded-lg bg-slate-100 p-1 dark:bg-slate-700">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
            value === option.value
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default ThemeToggle;
