CREATE TABLE work_items (
    id TEXT PRIMARY KEY,
    raw_input TEXT NOT NULL,
    detail_level TEXT NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    context TEXT NULL,
    action TEXT NULL,
    tags TEXT NOT NULL DEFAULT '[]',
    due_at TEXT NULL,
    created_at TEXT NOT NULL,  -- ISO 8601
    updated_at TEXT NOT NULL,
    archived_at TEXT NULL
);

CREATE INDEX idx_work_items_status_and_due_at ON work_items(status, due_at);