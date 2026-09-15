import { useEffect, useState } from 'react';
import type { WorkItem } from '../types';

const DEBOUNCE_MS = 200;

export function useFilter(items: WorkItem[], query: string): WorkItem[] {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const normalized = debouncedQuery.trim().toLowerCase();
  if (!normalized) return items;

  return items.filter((item) => {
    const haystack = [item.title, item.rawInput, item.context, item.action, ...item.tags]
      .filter((value): value is string => Boolean(value))
      .join(' ')
      .toLowerCase();
    return haystack.includes(normalized);
  });
}
