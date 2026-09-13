mod commands;

use tauri::{Emitter, Manager};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_global_shortcut::{Code, Modifiers, Shortcut, ShortcutState};
use tauri_plugin_sql::{Builder as SqlBuilder, Migration, MigrationKind};
use tauri_plugin_store::Builder as StoreBuilder;

pub const DB_URL: &str = "sqlite:workmemory.db";

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "init",
            sql: include_str!("db/migrations/0001_init.sql"),
            kind: MigrationKind::Up,
        },
    ];

    let quick_capture_shortcut = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyN);

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            SqlBuilder::default()
                .add_migrations(DB_URL, migrations)
                .build(),
        )
        .plugin(StoreBuilder::default().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_shortcut(quick_capture_shortcut)
                .expect("failed to register Ctrl+Shift+N shortcut")
                .with_handler(move |app, shortcut, event| {
                    if shortcut == &quick_capture_shortcut && event.state == ShortcutState::Pressed {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.unminimize();
                            let _ = window.set_focus();
                            let _ = window.emit("focus-note-inbox", ());
                        }
                    }
                })
                .build(),
        )
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, None))
        .setup(|app| {
            app.manage(commands::reminders::ReminderRegistry::default());

            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let _ = commands::reminders::reschedule_active(&app_handle).await;
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::notes::save_note,
            commands::notes::list_notes,
            commands::notes::update_note_status,
            commands::ai::format_note,
            commands::ai::save_ai_settings,
            commands::ai::get_ai_settings
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
