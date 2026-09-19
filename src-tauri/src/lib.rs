mod commands;

use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Emitter, Manager, Runtime, WindowEvent};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_global_shortcut::{Code, Modifiers, Shortcut, ShortcutState};
use tauri_plugin_sql::{Builder as SqlBuilder, Migration, MigrationKind};
use tauri_plugin_store::Builder as StoreBuilder;

pub const DB_URL: &str = "sqlite:workmemory.db";
pub const SETTINGS_STORE: &str = "settings.json";

fn show_main_window<R: Runtime>(app: &AppHandle<R>) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
        let _ = window.emit("focus-note-inbox", ());
    }
}

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
                        show_main_window(app);
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

            let show_item = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let tray_menu = Menu::with_items(app, &[&show_item, &quit_item])?;

            let tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().cloned().expect("app icon missing"))
                .menu(&tray_menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| {
                    if event.id() == "show" {
                        show_main_window(app);
                    } else if event.id() == "quit" {
                        app.exit(0);
                    }
                })
                .build(app)?;
            app.manage(tray);

            if let Some(window) = app.get_webview_window("main") {
                let window_clone = window.clone();
                window.on_window_event(move |event| {
                    if let WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = window_clone.hide();
                    }
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::notes::save_note,
            commands::notes::list_notes,
            commands::notes::update_note_status,
            commands::notes::update_note,
            commands::ai::format_note,
            commands::ai::save_ai_settings,
            commands::ai::get_ai_settings,
            commands::settings::get_autostart_enabled,
            commands::settings::set_autostart_enabled,
            commands::settings::get_theme,
            commands::settings::set_theme
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
