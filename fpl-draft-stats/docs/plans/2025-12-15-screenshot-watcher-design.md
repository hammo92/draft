# Screenshot Watcher - Design Document

**Created:** 2025-12-15
**Purpose:** Automated screenshot capture for Claude Code visual feedback loop

---

## Overview

A file watcher that automatically captures screenshots of the dev server whenever source files change. This creates a tight feedback loop where Claude can see UI changes immediately after editing code.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Screenshot Watcher                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   [src/ files]  ──→  [chokidar]  ──→  [debounce 800ms]         │
│                          │                   │                  │
│                          ▼                   ▼                  │
│                    file change         wait for HMR             │
│                                              │                  │
│                                              ▼                  │
│                                     [Playwright capture]        │
│                                              │                  │
│                                              ▼                  │
│                              C:/tmp/claude/screenshots/         │
│                                     screenshot.png              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Components

| Component | Purpose |
|-----------|---------|
| chokidar | File watcher (already a Vite dependency) |
| Playwright | Headless browser for screenshots |
| screenshot-watcher.ts | Single script that orchestrates everything |

## Configuration

```typescript
const CONFIG = {
  watchDir: './src',
  outputPath: 'C:/tmp/claude/screenshots/screenshot.png',
  devServerUrl: 'http://localhost:5173',
  debounceMs: 800,
  viewport: { width: 1280, height: 800 }
};
```

## Implementation

### Script: `scripts/screenshot-watcher.ts`

**Workflow:**
1. Launch Playwright browser (headless)
2. Navigate to dev server URL
3. Take initial screenshot
4. Watch `src/` for `.svelte`, `.ts`, `.css` changes
5. On change: wait 800ms for HMR, capture screenshot
6. Overwrite `screenshot.png` each time
7. Log timestamp to console

### npm scripts

```json
{
  "scripts": {
    "screenshot": "npx tsx scripts/screenshot-watcher.ts",
    "dev:watch": "npm run dev & npm run screenshot"
  }
}
```

### Dependencies

- `playwright` (dev dependency - needs to be installed)
- `chokidar` (already present via Vite)

## Usage

### Starting the watcher

```bash
npm run dev:watch
```

### Console output

```
[screenshot] 14:32:15 - Watching src/ for changes...
[screenshot] 14:32:15 - Initial capture saved
[screenshot] 14:32:28 - src/app.css changed
[screenshot] 14:32:29 - Captured after HMR
```

### Claude Code integration

1. Start watcher: `npm run dev:watch`
2. Edit code, save files
3. Screenshots auto-capture to `C:/tmp/claude/screenshots/screenshot.png`
4. Ask Claude: "check the screenshot" or "how does it look?"
5. Claude reads the image and provides feedback

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Dev server not running | Wait and retry connection |
| Page has errors | Capture anyway (shows error state) |
| Ctrl+C | Cleanly close browser and exit |

## File Output

- **Path:** `C:/tmp/claude/screenshots/screenshot.png`
- **Behavior:** Always overwrites same file
- **Rationale:** Keeps it simple, no cleanup needed, predictable path for Claude to read
