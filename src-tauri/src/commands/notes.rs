use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, State};
use tauri_plugin_sql::{DbInstances, DbPool};
use uuid::Uuid;
use sqlx::{sqlite::SqliteRow, Row};

use crate::commands::reminders;
use crate::DB_URL;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveNotePayload {
    pub raw_input: String,
    pub detail_level: String,
    pub title: Option<String>,
    #[serde(rename = "type")]
    pub item_type: Option<String>,
    pub due_at: Option<String>,
    pub action: Option<String>,
    pub tags: Option<Vec<String>>,
    pub context: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateStatusPayload {
    pub id: String,
    pub status: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateNotePayload {
    pub id: String,
    pub title: String,
    #[serde(rename = "type")]
    pub item_type: String,
    pub due_at: Option<String>,
    pub action: Option<String>,
    pub tags: Vec<String>,
    pub context: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkItem {
    pub id: String,
    pub raw_input: String,
    pub detail_level: String,
    pub title: String,
    #[serde(rename = "type")]
    pub item_type: String,
    pub status: String,
    pub context: Option<String>,
    pub action: Option<String>,
    pub tags: Vec<String>,
    pub due_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub archived_at: Option<String>,
}

#[tauri::command]
pub async fn save_note(
    app: AppHandle,
    db_instances: State<'_, DbInstances>,
    payload: SaveNotePayload,
) -> Result<WorkItem, String> {
    let instances = db_instances.0.read().await;
    let db = instances
        .get(DB_URL)
        .ok_or_else(|| "Database not loaded".to_string())?;

    let DbPool::Sqlite(pool) = db;

    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    let title = payload
        .title
        .unwrap_or_else(|| payload.raw_input.chars().take(60).collect());
    let item_type = payload.item_type.unwrap_or_else(|| "Note".to_string());
    let tags = payload.tags.unwrap_or_default();
    let tags_json = serde_json::to_string(&tags).unwrap_or_else(|_| "[]".to_string());

    sqlx::query(
        "INSERT INTO work_items
            (id, raw_input, detail_level, title, type, status, context, action, tags, due_at, created_at, updated_at, archived_at)
         VALUES (?, ?, ?, ?, ?, 'Active', ?, ?, ?, ?, ?, ?, NULL)",
    )
    .bind(&id)
    .bind(&payload.raw_input)
    .bind(&payload.detail_level)
    .bind(&title)
    .bind(&item_type)
    .bind(&payload.context)
    .bind(&payload.action)
    .bind(&tags_json)
    .bind(&payload.due_at)
    .bind(&now)
    .bind(&now)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    if let Some(due_at_raw) = &payload.due_at {
        if let Ok(due_at) = DateTime::parse_from_rfc3339(due_at_raw) {
            reminders::schedule_reminder(&app, id.clone(), title.clone(), due_at.with_timezone(&Utc));
        }
    }

    Ok(WorkItem {
        id,
        raw_input: payload.raw_input,
        detail_level: payload.detail_level,
        title,
        item_type,
        status: "Active".to_string(),
        context: payload.context,
        action: payload.action,
        tags,
        due_at: payload.due_at,
        created_at: now.clone(),
        updated_at: now,
        archived_at: None,
    })
}

#[tauri::command]
pub async fn list_notes(
    db_instances: State<'_, DbInstances>,
    tab: String,
) -> Result<Vec<WorkItem>, String>{
    let instances = db_instances.0.read().await;
    let db = instances
        .get(DB_URL)
        .ok_or_else(|| "Database not loaded".to_string())?;
        
    let DbPool::Sqlite(pool) = db;
    
    let where_clause = match tab.as_str() {
        "Today" => "status = 'Active' AND (date(due_at) <= date('now') OR date(created_at) = date('now'))",
        "Upcoming" => "status = 'Active' AND due_at > datetime('now', 'end of day')",
        "Waiting" => "status = 'Active' AND type = 'Waiting'",
        "Later" => "status = 'Active' AND (due_at IS NULL OR due_at > datetime('now', '+14 days'))",
        "Archive" => "status IN ('Done', 'Archived')",
        _ => return Err(format!("Unknow tab: {tab}")),
    };

    let query = format!(
        "SELECT id, raw_input, detail_level, title, type, status, context, action, tags, due_at, created_at, updated_at, archived_at
         FROM work_items WHERE {where_clause} ORDER BY created_at DESC"
    );

    let rows = sqlx::query(&query)
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?;

    rows.iter()
        .map(row_to_work_item)
        .collect::<Result<Vec<WorkItem>, sqlx::Error>>()
        .map_err(|e| e.to_string())
}

fn row_to_work_item(row: &SqliteRow) -> Result<WorkItem, sqlx::Error> {
    let tags_json: String = row.try_get("tags")?;
    let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();

    Ok(WorkItem {
        id: row.try_get("id")?,
        raw_input: row.try_get("raw_input")?,
        detail_level: row.try_get("detail_level")?,
        title: row.try_get("title")?,
        item_type: row.try_get("type")?,
        status: row.try_get("status")?,
        context: row.try_get("context")?,
        action: row.try_get("action")?,
        tags,
        due_at: row.try_get("due_at")?,
        created_at: row.try_get("created_at")?,
        updated_at: row.try_get("updated_at")?,
        archived_at: row.try_get("archived_at")?,
    })
}

#[tauri::command]
pub async fn update_note_status(
    app: AppHandle,
    db_instances: State<'_, DbInstances>,
    payload: UpdateStatusPayload,
) -> Result<(), String> {
    let instances = db_instances.0.read().await;
    let db = instances
        .get(DB_URL)
        .ok_or_else(|| "Database not loaded".to_string())?;

    let DbPool::Sqlite(pool) = db;

    let now = Utc::now().to_rfc3339();
    let archived_at = if payload.status == "Archived" {
        Some(now.clone())
    } else {
        None
    };

    sqlx::query(
        "UPDATE work_items SET status = ?, updated_at = ?, archived_at = COALESCE(?, archived_at) WHERE id = ?",
    )
    .bind(&payload.status)
    .bind(&now)
    .bind(&archived_at)
    .bind(&payload.id)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    if payload.status != "Active" {
        reminders::cancel_reminder(&app, &payload.id);
    }

    Ok(())
}

#[tauri::command]
pub async fn update_note(
    app: AppHandle,
    db_instances: State<'_, DbInstances>,
    payload: UpdateNotePayload,
) -> Result<WorkItem, String> {
    let instances = db_instances.0.read().await;
    let db = instances
        .get(DB_URL)
        .ok_or_else(|| "Database not loaded".to_string())?;

    let DbPool::Sqlite(pool) = db;

    let now = Utc::now().to_rfc3339();
    let tags_json = serde_json::to_string(&payload.tags).unwrap_or_else(|_| "[]".to_string());

    sqlx::query(
        "UPDATE work_items
            SET title = ?, type = ?, due_at = ?, action = ?, tags = ?, context = ?, updated_at = ?
         WHERE id = ?",
    )
    .bind(&payload.title)
    .bind(&payload.item_type)
    .bind(&payload.due_at)
    .bind(&payload.action)
    .bind(&tags_json)
    .bind(&payload.context)
    .bind(&now)
    .bind(&payload.id)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    let row = sqlx::query(
        "SELECT id, raw_input, detail_level, title, type, status, context, action, tags, due_at, created_at, updated_at, archived_at
         FROM work_items WHERE id = ?",
    )
    .bind(&payload.id)
    .fetch_one(pool)
    .await
    .map_err(|e| e.to_string())?;

    let item = row_to_work_item(&row).map_err(|e| e.to_string())?;

    if item.status == "Active" {
        match item
            .due_at
            .as_deref()
            .and_then(|s| DateTime::parse_from_rfc3339(s).ok())
        {
            Some(due_at) => reminders::schedule_reminder(
                &app,
                item.id.clone(),
                item.title.clone(),
                due_at.with_timezone(&Utc),
            ),
            None => reminders::cancel_reminder(&app, &item.id),
        }
    }

    Ok(item)
}
