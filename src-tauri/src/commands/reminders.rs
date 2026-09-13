use std::collections::HashMap;
use std::sync::Mutex;

use chrono::{DateTime, Utc};
use sqlx::Row;
use tauri::async_runtime::JoinHandle;
use tauri::{AppHandle, Manager};
use tauri_plugin_notification::NotificationExt;
use tauri_plugin_sql::{DbInstances, DbPool};

use crate::DB_URL;

#[derive(Default)]
pub struct ReminderRegistry(Mutex<HashMap<String, JoinHandle<()>>>);

/// Schedules an in-process reminder for a note. If `due_at` is already in the
/// past (e.g. it was missed while the app was closed), fires immediately instead.
pub fn schedule_reminder(app: &AppHandle, note_id: String, title: String, due_at: DateTime<Utc>) {
    cancel_reminder(app, &note_id);

    let now = Utc::now();
    if due_at <= now {
        fire_now(app, &title);
        return;
    }

    let delay = (due_at - now).to_std().unwrap_or_default();
    let app_handle = app.clone();
    let id_for_task = note_id.clone();

    let handle = tauri::async_runtime::spawn(async move {
        tokio::time::sleep(delay).await;
        fire_now(&app_handle, &title);
        let registry = app_handle.state::<ReminderRegistry>();
        registry.0.lock().unwrap().remove(&id_for_task);
    });

    let registry = app.state::<ReminderRegistry>();
    registry.0.lock().unwrap().insert(note_id, handle);
}

/// Cancels a pending reminder for a note, if one is scheduled. No-op if none exists.
pub fn cancel_reminder(app: &AppHandle, note_id: &str) {
    let registry = app.state::<ReminderRegistry>();
    let removed = registry.0.lock().unwrap().remove(note_id);
    if let Some(handle) = removed {
        handle.abort();
    }
}

fn fire_now(app: &AppHandle, title: &str) {
    let _ = app
        .notification()
        .builder()
        .title("⏰ WorkMemory Reminder")
        .body(title)
        .show();
}

/// Re-schedules reminders for all Active notes with a due date. Called once at
/// startup, since the in-memory schedule above does not survive an app restart.
pub async fn reschedule_active(app: &AppHandle) -> Result<(), String> {
    let db_instances = app.state::<DbInstances>();
    let instances = db_instances.0.read().await;
    let db = instances
        .get(DB_URL)
        .ok_or_else(|| "Database not loaded".to_string())?;

    let DbPool::Sqlite(pool) = db;

    let rows = sqlx::query(
        "SELECT id, title, due_at FROM work_items WHERE status = 'Active' AND due_at IS NOT NULL",
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    for row in rows {
        let id: String = row.try_get("id").map_err(|e| e.to_string())?;
        let title: String = row.try_get("title").map_err(|e| e.to_string())?;
        let due_at_raw: String = row.try_get("due_at").map_err(|e| e.to_string())?;

        if let Ok(due_at) = DateTime::parse_from_rfc3339(&due_at_raw) {
            schedule_reminder(app, id, title, due_at.with_timezone(&Utc));
        }
    }

    Ok(())
}
