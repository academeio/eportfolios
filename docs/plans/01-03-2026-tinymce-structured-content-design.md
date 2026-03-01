# tinymce-structured-content — Design Document

**Created:** 01-03-2026
**Status:** APPROVED
**Repo:** `academeio/tinymce-structured-content` (to be created)
**Priority:** HIGH — strategic capability for CBME workflows

## Background

### The Problem

TinyMCE removed its built-in `template` plugin in version 6. There is no official replacement. For ePortfolios, this gap is critical — competency-based medical education (CBME) workflows require structured document templates with defined sections, placeholder fields, and consistent formatting.

### Two Aims of the ePortfolios Fork

ePortfolios was forked from Mahara 22.10.0 with two aims:

1. **Maintain and continue the 22.10 branch** — keep the platform stable, modern, and independent (TinyMCE upgrade, dependency modernization, etc.)
2. **Adapt ePortfolios into a CBME platform** — medical education is shifting globally from time-based training to competency-based assessment. ePortfolios are the natural tool — learners document clinical encounters, reflect on experiences, collect evidence of competency, and assessors evaluate against defined frameworks (EPAs, milestones, competencies).

The structured content plugin sits at the intersection of both aims. It modernizes the editor (aim 1) while enabling the structured content workflows that CBME requires (aim 2).

### Why Structured Content Matters for CBME

Learners and assessors repeatedly create structured documents:

- **Clinical Encounter Logs** — date, patient demographics (anonymized), presenting complaint, clinical reasoning, procedures performed, learning points, supervisor feedback
- **EPA Assessments** — structured forms with defined sections for each Entrustable Professional Activity, rating scales, narrative comments, action plans
- **Procedure Logs** — structured records of procedures performed, level of supervision, complications, reflections
- **Reflective Narratives** — guided reflection templates (e.g., Gibbs' cycle: Description, Feelings, Evaluation, Analysis, Conclusion, Action Plan)
- **Case Presentations** — standardized medical case format (history, examination, investigations, differential diagnosis, management plan)
- **Portfolio Progress Reports** — periodic summaries mapping evidence to competency milestones

Without templates, learners create these from scratch each time — inconsistent formatting, missing sections, variable quality. With templates, institutions define standard structures that learners fill in.

### Relationship to Existing Work

| Feature | Scope | Status |
|---------|-------|--------|
| Phase 3: Content Templates (`contenttemplates`) | Simple reusable HTML snippets (layout blocks, info boxes) | DONE — will be **merged into** this plugin |
| Phase 5: Structured Content (`structuredcontent`) | Full-page structures with sections, placeholders, metadata | THIS PROJECT |
| CBME template content | Clinical encounter logs, EPA forms, reflective narratives | Separate — seeded via ePortfolios DB migration |
| Competency Frameworks module | Backend: defining competencies, EPAs, milestones | Future work (separate from TinyMCE) |

**Decision: Phase 3's `contenttemplates` plugin is retired.** Its 6 built-in templates migrate into this plugin's library as a "Snippets" category. One plugin replaces both.

## Architecture

### Approach: Modular TypeScript with Rollup Build

The plugin is built from modular TypeScript source, bundled into a single `dist/plugin.js` output via Rollup. This gives clean module boundaries, type safety, and testability while producing the same single-file output that TinyMCE's `external_plugins` expects.

### Project Structure

```
tinymce-structured-content/
├── src/
│   ├── plugin.ts          # Entry point — registers with TinyMCE PluginManager
│   ├── browser.ts         # Template browser modal (category sidebar, card grid, search, preview)
│   ├── placeholders.ts    # Placeholder field system (rendering, Tab navigation, styling)
│   ├── insertion.ts       # Template insertion logic (at cursor vs. new document)
│   ├── types.ts           # Shared TypeScript interfaces
│   └── styles.ts          # CSS injection (placeholder badges, modal styles)
├── dist/
│   └── plugin.js          # Built output — single IIFE file, no external dependencies
├── test/
│   ├── browser.test.ts
│   ├── placeholders.test.ts
│   └── insertion.test.ts
├── rollup.config.js
├── tsconfig.json
├── package.json           # @academeio/tinymce-structured-content
├── LICENSE                # GPL v3
├── README.md
└── CLAUDE.md
```

**Build:** `npm run build` → Rollup bundles `src/plugin.ts` into `dist/plugin.js` (IIFE format).
**Test:** `npm test` → Vitest.
**Dev:** `npm run dev` → watch mode with rebuild.

### Data Source: Configuration Callback

The plugin is 100% frontend. It takes no opinions about the backend. The host app provides template data via TinyMCE init configuration:

```typescript
interface StructuredContentConfig {
  // Data source — one of these is required
  templates?: Template[];                              // Static list
  fetch?: (query?: string) => Promise<{                // Async callback
    templates: Template[];
    categories: Category[];
  }>;

  // Behavior
  insertMode?: 'cursor' | 'document' | 'both';        // Default: 'both'

  // Template variables — auto-replaced on insertion
  variables?: Record<string, string>;

  // UI customization
  modalTitle?: string;                                 // Default: 'Structured Content'
  strings?: Record<string, string>;                    // i18n overrides
}

interface Template {
  id: string;
  title: string;
  description?: string;
  content: string;           // HTML with optional tmpl-field placeholders
  category?: string;
  thumbnail?: string;        // URL for card preview image (optional)
}

interface Category {
  id: string;
  label: string;
  icon?: string;             // CSS class or emoji for sidebar
}
```

**ePortfolios usage:**

```javascript
tinymce.init({
  external_plugins: {
    'structuredcontent': wwwroot + 'js/tinymce/plugins/structuredcontent/plugin.js'
  },
  structuredcontent: {
    fetch: async function(query) {
      return new Promise(function(resolve) {
        sendjsonrequest(config.wwwroot + 'json/structuredcontent.json.php',
          { query: query }, 'POST', function(data) {
            resolve({ templates: data.templates, categories: data.categories });
          });
      });
    },
    insertMode: 'both',
    variables: {
      author: currentUserName,
      date: new Date().toLocaleDateString('en-IN'),
      institution: siteName
    }
  }
});
```

## Placeholder System

The core differentiator — what makes this more than a snippet inserter.

### Template Authoring Format

```html
<h4>Clinical Encounter Log</h4>
<p><strong>Date:</strong>
  <span class="tmpl-field" data-field="date" data-required="true">Enter date</span>
</p>
<h5>Presenting Complaint</h5>
<p>
  <span class="tmpl-field" data-field="complaint" data-required="true">
    Describe the presenting complaint
  </span>
</p>
<h5>Clinical Reasoning</h5>
<p>
  <span class="tmpl-field" data-field="reasoning">
    Document your clinical reasoning process
  </span>
</p>
<h5>Learning Points</h5>
<p>
  <span class="tmpl-field" data-field="learning">
    What did you learn from this encounter?
  </span>
</p>
```

### Editor Behavior

1. **On insertion** — `placeholders.ts` injects CSS into the editor iframe styling `.tmpl-field` spans as colored badges (light blue background, dashed border). Required fields get a subtle red-left-border accent.

2. **Click** — clicking a placeholder selects its entire text content, so the user can immediately start typing to replace it.

3. **Tab navigation** — Tab jumps to the next `tmpl-field` in document order. Shift+Tab goes backwards. Creates a form-like fill-in experience within the rich text editor.

4. **Visual cleanup** — once a user modifies a placeholder's content (text no longer matches the original default), the badge styling is removed and it becomes normal text. The `tmpl-field` class and `data-*` attributes are stripped. The field is "resolved."

5. **Serialization** — unresolved placeholders stay as styled spans (valid HTML). A half-filled template can be saved and resumed later — unfilled fields remain visually distinct.

### Not in MVP (Intentionally)

- No typed fields (date picker, dropdown, number input) — everything is free text
- No validation ("this required field is empty") — just visual distinction
- No sidebar or floating form — all interaction is inline
- No placeholder-to-placeholder linking (same value in multiple spots)

All are natural extensions for later, and `data-field` / `data-required` attributes provide hooks to add them without changing the template format.

## Template Browser UI

### Layout

Custom modal appended to the DOM (same pattern as existing `imagebrowser` and `contenttemplates` plugins). Three zones:

```
┌──────────────────────────────────┐
│ Structured Content            x │
├────────┬─────────────────────────┤
│ All    │ [Search templates...]   │
│ CBME   ├─────────────────────────┤
│ Layout │ ┌──────┐ ┌──────┐      │
│ Reflect│ │ Card │ │ Card │      │
│ Assess │ └──────┘ └──────┘      │
│ Snippt │ ┌──────┐ ┌──────┐      │
│        │ │ Card │ │ Card │      │
│        │ └──────┘ └──────┘      │
├────────┴─────────────────────────┤
│ Preview:                         │
│ ┌────────────────────────────┐   │
│ │ Clinical Encounter Log     │   │
│ │ Date: [________]           │   │
│ │ Complaint: [________]      │   │
│ └────────────────────────────┘   │
│    [Insert at cursor] [New doc]  │
└──────────────────────────────────┘
```

### Interaction Flow

1. User clicks toolbar button → plugin calls `fetch()` → modal appears
2. **Category sidebar** — vertical list from `fetch()` response. "All" selected by default. Click filters the grid.
3. **Search bar** — text input, client-side filtering by title and description. No server round-trip per keystroke.
4. **Template cards** — 2-column grid. Title, category badge, description (truncated). Click opens preview.
5. **Preview panel** — slides up from bottom. Renders template HTML read-only with placeholder badges visible. Two buttons: "Insert at cursor" and "New document". "Back" returns to grid.
6. **Keyboard:** Escape closes. Arrow keys navigate cards. Enter opens preview. Tab moves between controls.

### Styling

Scoped CSS with `sc-` prefixed classes (`sc-modal`, `sc-card`, `sc-sidebar`). No dependency on Bootstrap or any external CSS framework. Compatible with Bootstrap when present.

### Module Interface

```typescript
// browser.ts
export function openBrowser(
  editor: TinyMCE.Editor,
  config: StructuredContentConfig
): void;
```

## Insertion Logic

### `insertion.ts` — What Happens on Insert

1. **Variable replacement** — scan template HTML for `{{variableName}}` patterns, replace with values from `config.variables`. Unmatched variables are left as-is (signals misconfiguration rather than silently disappearing).

2. **Insert mode:**
   - "Insert at cursor" — `editor.insertContent(html)` at current selection. Wraps in `<div class="sc-template" data-template-id="...">`.
   - "New document" — `editor.setContent(html)`, replacing everything. Confirmation prompt if editor has existing content.

3. **Post-insertion** — `placeholders.ts` activates: injects placeholder CSS into the editor iframe (if not already present), focuses the first `tmpl-field` element so the user can start filling in immediately.

## ePortfolios Integration

### What Changes in ePortfolios

| File | Change |
|------|--------|
| `lib/web.php` | Replace `contenttemplates` with `structuredcontent` in `external_plugins` and toolbar config |
| `json/structuredcontent.json.php` | New endpoint implementing the `fetch()` contract |
| `js/tinymce/plugins/structuredcontent/plugin.js` | Built output from the separate repo (copied or symlinked) |
| `js/tinymce/plugins/contenttemplates/plugin.js` | Deleted |
| `db/upgrade.php` | Migration to add CBME seed templates to `content_template` table |

### What Does NOT Change

- `content_template` DB table schema — no changes needed
- `lib/contenttemplates.php` functions — still work, serve the new plugin
- `admin/extensions/contenttemplates.php` — admin UI stays (cosmetic rename optional)

### Template Migration

Phase 3's 6 built-in templates (two-column layout, reflection journal, project documentation, skills matrix, learning goals, meeting notes) become templates in a "Snippets" category within the same `content_template` table.

New CBME templates are added as seed data in `db/upgrade.php`:
- Clinical Encounter Log
- Reflective Narrative (Gibbs' cycle)
- Case Presentation
- Procedure Log

These are content, not code — they live in the ePortfolios DB, not in the plugin.

## Future Extensions (Not in MVP)

These are natural next steps enabled by the `data-field` / `data-required` attribute design:

- **Typed placeholders** — date pickers, dropdowns, number inputs based on a `data-type` attribute
- **Required field validation** — warning before save if required placeholders are unfilled
- **Placeholder linking** — same `data-field` name in multiple locations syncs values
- **Template versioning** — track which version of a template a document was created from
- **Group/personal templates** — scope templates to groups or individual users (requires backend permission changes)
- **Template analytics** — track which templates are used most, which fields are commonly left unfilled
