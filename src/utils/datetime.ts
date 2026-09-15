// <input type="datetime-local"> works with local time and no timezone suffix
// (e.g. "2026-08-24T10:00"), while WorkItem.dueAt is stored as UTC ISO 8601.
// These two helpers convert between the two representations.

export function isoUtcToDatetimeLocal(isoUtc: string | null): string {
  if (!isoUtc) return '';
  const date = new Date(isoUtc);
  if (Number.isNaN(date.getTime())) return '';
  const offsetMs = date.getTimezoneOffset() * 60000;
  const local = new Date(date.getTime() - offsetMs);
  return local.toISOString().slice(0, 16);
}

export function datetimeLocalToIsoUtc(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}
