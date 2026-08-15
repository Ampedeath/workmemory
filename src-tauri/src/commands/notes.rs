use chrono::Utc;
use serde::{Deserialize, Serialize};
use tauri::State;
use tauri_plugin_sql::{DbInstances, DbPool};
use uuid::Uuid;

use crate::DB_URL;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveNotePayload {
    pub raw_input: String,
    pub detail_level: String,
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
