import type { DetailLevel } from '../types';

interface DetailLevelToggleProps {
  value: DetailLevel;
  onChange: (value: DetailLevel) => void;
}

const LEVELS: DetailLevel[] = ['Quick', 'Detailed'];

function DetailLevelToggle({ value, onChange }: DetailLevelToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-gray-300 p-1">
      {LEVELS.map((level) => (
        <button
          key={level}
          type="button"
          onClick={() => onChange(level)}
          className={`rounded-md px-3 py-1 text-sm transition-colors ${
            value === level ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {level}
        </button>
      ))}
    </div>
  );
}

export default DetailLevelToggle;
