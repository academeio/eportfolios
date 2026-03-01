# TinyMCE Upgrade Project Plan

**Created:** 01-03-2026
**Status:** Phases 1-3 DONE (shipped in v22.20.1), Phases 4-5 IN PROGRESS

## Overview

Upgrade the TinyMCE rich text editor from v5.10.2 (bundled) to v7.9.1 (CDN), modernize custom plugins, and add new editor features.

## Phase 1: CSS Fix (DONE)

**Goal:** Fix broken editor styling caused by missing compiled CSS.

- Compiled `tinymce.css` from `theme/raw/sass/tinymce.scss` using `npx sass`
- Removed stale `tinymceskin.css` reference that was causing 404 errors
- Editor renders correctly with proper Bootstrap 5 integration

**Files changed:**
- `theme/raw/style/tinymce.css` — compiled from SCSS
- `lib/web.php` — removed `tinymceskin.css` link

## Phase 2: TinyMCE 5.10.2 → 7.9.1 via CDN (DONE)

**Goal:** Replace the bundled TinyMCE 5 with TinyMCE 7 loaded from CDN.

- Deleted all bundled TinyMCE files from `js/tinymce/` (kept custom plugins)
- Updated `lib/web.php` to load TinyMCE 7.9.1 from `cdn.tiny.cloud`
- Added `license_key: 'gpl'` to TinyMCE init config (required for v7 open-source usage)
- Migrated custom plugins (`imagebrowser`, `tooltoggle`) to TinyMCE 7 APIs:
  - `editor.addButton()` → `editor.ui.registry.addButton()`
  - `editor.addMenuItem()` → `editor.ui.registry.addMenuItem()`
  - Updated icon registration (v7 uses SVG icon packs)
- Updated `mathslate` plugin: registered custom SVG icon, updated dialog API from `openUrl` patterns

**Files changed:**
- `js/tinymce/` — deleted bundled TinyMCE 5 files
- `lib/web.php` — CDN URL, `license_key: 'gpl'`, updated init config
- `js/tinymce/plugins/imagebrowser/plugin.js` — v7 API migration
- `js/tinymce/plugins/tooltoggle/plugin.js` — v7 API migration
- `js/tinymce/plugins/mathslate/plugin.js` — v7 API migration, SVG icon

## Phase 3: Content Templates Plugin (DONE)

**Goal:** Add a Content Templates plugin providing reusable content blocks in the editor.

- Created new TinyMCE plugin `contenttemplates` with dropdown UI
- Built PHP backend API (`json/contenttemplates.json.php`) for CRUD operations
- Created admin UI for managing templates (`admin/extensions/contenttemplates.php`)
- Added 6 built-in templates (two-column layout, info box, checklist, etc.)
- Database migration: `content_template` table via `db/upgrade.php`
- PHPUnit tests: `lib/tests/phpunit/ContentTemplatesTest.php` (8 methods)
- Behat features: `test/behat/features/content_templates.feature`

**Files created:**
- `js/tinymce/plugins/contenttemplates/plugin.js` — TinyMCE plugin
- `json/contenttemplates.json.php` — backend API
- `admin/extensions/contenttemplates.php` — admin page
- `theme/raw/templates/admin/extensions/contenttemplates.tpl` — admin template
- `lang/en.utf8/contenttemplates.php` — language strings
- `lib/tests/phpunit/ContentTemplatesTest.php` — tests

**Files modified:**
- `lib/web.php` — registered plugin in TinyMCE toolbar and external_plugins
- `db/upgrade.php` — migration for `content_template` table
- `lib/version.php` — version bump

## Phase 4: Image Browser Cleanup (IN PROGRESS)

**Goal:** Targeted cleanup of the `imagebrowser` plugin without full rewrite.

The image browser is deeply integrated with the artefact/file system (Pieform filebrowser element, file selection, access control). This phase does targeted fixes only:

1. **Replace `eval()` with DOM script injection** — the `eval(configblock.data.javascript)` call on line 198 executes backend-returned Pieform init code; replace with `document.createElement('script')` injection for safer global-scope execution
2. **Extract context detection into a helper function** — the jQuery DOM scraping block (lines 85-128) that reads `viewid`, `blogpostid`, `group`, `institution` from the page
3. **Fix button tooltip** — change from "Insert/edit image" to "Insert image" to match Behat test expectations (`aria-label='Insert image'`)
4. **Update copyright headers**

**What is NOT changed:**
- Backend: `lib/imagebrowser.php`, `json/imagebrowser.json.php`
- File browser UI: `artefact/file/js/filebrowser.js`
- Modal template: `theme/raw/templates/view/imagebrowser.tpl`

**Files modified:**
- `js/tinymce/plugins/imagebrowser/plugin.js`

## Phase 5: MathSlate Replacement (IN PROGRESS)

**Goal:** Replace the YUI3-based MathSlate equation editor with a lightweight LaTeX-input plugin.

### Problem
MathSlate is a 340KB, 42-file plugin using YUI3 (Yahoo UI, unmaintained) loaded from `yahooapis.com` CDN. It also depends on MathJax 2.7.1. The drag-drop equation builder is over-engineered for typical usage — most users who need math notation already know LaTeX.

### Solution
Replace with a self-contained plugin (~200 lines) that provides:
1. **LaTeX text input** — textarea for direct LaTeX entry
2. **Symbol palette** — clickable grid of common math symbols inserting LaTeX snippets
3. **Live preview** — renders LaTeX via MathJax 3.x in real-time
4. Uses TinyMCE 7's native `editor.windowManager.open()` dialog API

### Files
**Rewritten:**
- `js/tinymce/plugins/mathslate/plugin.js` — complete rewrite

**Deleted (YUI and legacy files):**
- `js/tinymce/plugins/mathslate/yui/` — entire YUI directory (~30 files)
- `js/tinymce/plugins/mathslate/mathslate.html` — YUI dialog page (HTTP)
- `js/tinymce/plugins/mathslate/mathslate-s.html` — YUI dialog page (HTTPS)
- `js/tinymce/plugins/mathslate/help.html` — YUI help page
- `js/tinymce/plugins/mathslate/styles.css` — YUI-specific styles
- `js/tinymce/plugins/mathslate/strings.js` — Moodle-style string loader
- `js/tinymce/plugins/mathslate/CHANGES` — changelog
- `js/tinymce/plugins/mathslate/README.Mahara` — Mahara-specific readme

**Kept:**
- `js/tinymce/plugins/mathslate/config.json` — symbol definitions (reference)
- `js/tinymce/plugins/mathslate/img/mathslate.png` — icon
- `js/tinymce/plugins/mathslate/LICENSE` — license file
- `js/tinymce/plugins/mathslate/README.md` — documentation

## Verification

- **Image Browser:** Open a journal entry → click "Insert image" → verify browser opens, file selection works, image inserts into editor
- **MathSlate:** Enable MathJax in site config → open editor → click math button → type LaTeX → verify preview renders → insert into editor
- **Behat:** Existing `test/behat/features/tinymce_editor.feature` scenarios pass
- **No PHP changes** in Phases 4-5, so no DB upgrade needed
