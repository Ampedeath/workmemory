use chrono::Utc;
use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

const SETTINGS_STORE: &str = "settings.json";
const DEFAULT_BASE_URL: &str = "https://api.groq.com/openai/v1";
const DEFAULT_MODEL: &str = "openai/gpt-oss-20b";

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveAiSettingsPayload {
    pub base_url: String,
    pub api_key: String,
    pub model: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AiSettingsSummary {
    pub base_url: String,
    pub model: String,
    pub has_api_key: bool,
}

#[tauri::command]
pub fn save_ai_settings(app: AppHandle, payload: SaveAiSettingsPayload) -> Result<(), String> {
    let store = app.store(SETTINGS_STORE).map_err(|e| e.to_string())?;
    store.set("aiBaseUrl", payload.base_url);
    if !payload.api_key.trim().is_empty() {
        store.set("aiApiKey", payload.api_key);
    }
    store.set("aiModel", payload.model);
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_ai_settings(app: AppHandle) -> Result<AiSettingsSummary, String> {
    let store = app.store(SETTINGS_STORE).map_err(|e| e.to_string())?;

    let base_url = store
        .get("aiBaseUrl")
        .and_then(|v| v.as_str().map(String::from))
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| DEFAULT_BASE_URL.to_string());

    let model = store
        .get("aiModel")
        .and_then(|v| v.as_str().map(String::from))
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| DEFAULT_MODEL.to_string());

    let has_api_key = store
        .get("aiApiKey")
        .and_then(|v| v.as_str().map(|s| !s.is_empty()))
        .unwrap_or(false);

    Ok(AiSettingsSummary {
        base_url,
        model,
        has_api_key,
    })
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FormatNoteRequest {
    pub raw_input: String,
    pub detail_level: String,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FormattedNote {
    pub title: String,
    #[serde(rename = "type")]
    pub item_type: String,
    pub due_at: Option<String>,
    pub action: Option<String>,
    pub tags: Vec<String>,
    pub context: Option<String>,
}

#[tauri::command]
pub async fn format_note(
    app: AppHandle,
    payload: FormatNoteRequest,
) -> Result<FormattedNote, String> {
    let store = app.store(SETTINGS_STORE).map_err(|e| e.to_string())?;

    let base_url = store
        .get("aiBaseUrl")
        .and_then(|v| v.as_str().map(String::from))
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| DEFAULT_BASE_URL.to_string());

    let model = store
        .get("aiModel")
        .and_then(|v| v.as_str().map(String::from))
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| DEFAULT_MODEL.to_string());

    let api_key = store
        .get("aiApiKey")
        .and_then(|v| v.as_str().map(String::from))
        .filter(|s| !s.is_empty())
        .ok_or_else(|| "AI API key not configured. Set it in Settings.".to_string())?;

    let now = Utc::now().to_rfc3339();
    let system_prompt = build_system_prompt(&payload.detail_level, &now);

    let client = reqwest::Client::new();
    let response = client
        .post(format!("{base_url}/chat/completions"))
        .bearer_auth(&api_key)
        .json(&serde_json::json!({
            "model": model,
            "temperature": 0.2,
            "messages": [
                { "role": "system", "content": system_prompt },
                { "role": "user", "content": payload.raw_input },
            ],
        }))
        .send()
        .await
        .map_err(|e| format!("Request to AI provider failed: {e}"))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!("AI provider returned {status}: {body}"));
    }

    let body: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Could not parse AI provider response: {e}"))?;

    let content = body["choices"][0]["message"]["content"]
        .as_str()
        .ok_or_else(|| "Unexpected response shape from AI provider".to_string())?;

    let cleaned = strip_markdown_fences(content);

    serde_json::from_str::<FormattedNote>(&cleaned)
        .map_err(|e| format!("AI response was not valid JSON: {e}"))
}

fn strip_markdown_fences(text: &str) -> String {
    let trimmed = text.trim();
    let without_prefix = trimmed
        .strip_prefix("```json")
        .or_else(|| trimmed.strip_prefix("```"))
        .unwrap_or(trimmed);
    without_prefix.trim_end_matches("```").trim().to_string()
}

fn build_system_prompt(detail_level: &str, now: &str) -> String {
    let context_instruction = if detail_level == "Detailed" {
        "Also include a \"context\" field: 1-3 sentences of background or why this matters, based only on the text. If nothing relevant is present, use null."
    } else {
        "Always set \"context\" to null in this mode."
    };

    format!(
        "You structure raw personal work notes into JSON. Current UTC time: {now}.\n\
Rules:\n\
- Never invent information that is not present in the text. If a field cannot be determined, use null.\n\
- \"type\" must be exactly one of: Reminder, Task, Investigation, Note, Waiting, Decision.\n\
- \"dueAt\" must be an ISO 8601 UTC timestamp or null. Resolve relative times (e.g. \"tomorrow\", \"in 2 hours\") relative to the current time given above.\n\
- \"tags\" is an array of at most 3 short lowercase keywords, or an empty array if none fit.\n\
- {context_instruction}\n\
- Return ONLY valid JSON matching this exact shape, with no markdown code fences and no explanation text:\n\
{{\"title\": string, \"type\": string, \"dueAt\": string|null, \"action\": string|null, \"tags\": string[], \"context\": string|null}}"
    )
}
