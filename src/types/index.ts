export type NoteType = 'Reminder' | 'Task' | 'Investigation' | 'Note' | 'Waiting' | 'Decision';
export type NoteStatus = 'Active' | 'Done' | 'Archived' | 'Deleted';
export type DetailLevel = 'Quick' | 'Detailed';

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
