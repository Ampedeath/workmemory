export type NoteType = 'Reminder' | 'Task' | 'Investigation' | 'Note' | 'Waiting' | 'Decision';
export type NoteStatus = 'Active' | 'Done' | 'Archived' | 'Deleted';
export type DetailLevel = 'Quick' | 'Detailed';
export type TabName = 'Today' | 'Upcoming' | 'Waiting' | 'Later' | 'Archive';

export interface FormattedNote {
  title: string;
  type: NoteType;
  dueAt: string | null;
  action: string | null;
  tags: string[];
  context: string | null;
}

export interface AiSettings {
  baseUrl: string;
  model: string;
  hasApiKey: boolean;
}

export interface WorkItem {
  id: string;
  rawInput: string;
  detailLevel: DetailLevel;
  title: string;
  type: NoteType;
  status: NoteStatus;
  context: string | null;
  action: string | null;
  tags: string[];
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}
