# WorkMemory

Desktop app for capturing raw work notes. Type what happened, AI structures it into a task, reminder, or note, you review and save.

## Install

Download the latest installer from [Releases](https://github.com/Ampedeath/workmemory/releases), run it. No Node/Rust required — this is for using the app, not developing it.

## Stack

- Tauri v2 (Rust backend + React WebView)
- React 18 + TypeScript + Vite
- Tailwind CSS v3
- SQLite via `tauri-plugin-sql`
- AI: Groq (OpenAI-compatible API), swappable via Settings

## Prerequisites

- Node.js + npm
- Rust + Cargo
- Windows: MSVC Build Tools

## Development

```bash
npm install
npm run tauri dev
```

## AI setup

`Format` needs a Groq API key (free tier available): [console.groq.com](https://console.groq.com) → API Keys → Create. Paste it into the app's Settings screen. Base URL and model fall back to Groq defaults if left empty.

Without a key, notes can still be saved as-is via "Save as raw note".

## Features

- Quick/Detailed capture with AI-assisted structuring and an editable preview before save
- 5 tabs (Today / Upcoming / Waiting / Later / Archive), SQL-filtered
- Reminder notifications for notes with a due date
- Client-side search and tag filter
- Inline note editing, soft delete
- Global shortcut `Ctrl+Shift+N` to focus the app for quick capture
- Optional autostart on system login

## Build

```bash
npm run tauri build
```

Produces a standalone executable and installer under `src-tauri/target/release/`.
