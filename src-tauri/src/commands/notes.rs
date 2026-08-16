use chrono::Utc;
use serde::{Deserialize, Serialize};
use tauri::State;
use tauri_plugin_sql::{DbInstances, DbPool};
use uuid::Uuid;
use sqlx::{sqlite::SqliteRow, Row};

use crate::DB_URL;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveNotePayload {
    pub raw_input: String,
    pub detail_level: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateStatusPayload {
    pub id: String,
    pub status: String,
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
    let title: String = payload.raw_input.chars().take(60).collect();

    sqlx::query(
        "INSERT INTO work_items
            (id, raw_input, detail_level, title, type, status, context, action, tags, due_at, created_at, updated_at, archived_at)
         VALUES (?, ?, ?, ?, 'Note', 'Active', NULL, NULL, '[]', NULL, ?, ?, NULL)",
    )
    .bind(&id)
    .bind(&payload.raw_input)
    .bind(&payload.detail_level)
    .bind(&title)
    .bind(&now)
    .bind(&now)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(WorkItem {
        id,
        raw_input: payload.raw_input,
        detail_level: payload.detail_level,
        title,
        item_type: "Note".to_string(),
        status: "Active".to_string(),
        context: None,
        action: None,
        tags: vec![],
        due_at: None,
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
        "Today" => "status = 'Active' AND (date(due_at) = date ('now') OR date(created_at) = date('now'))",
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

    Ok(())
}
