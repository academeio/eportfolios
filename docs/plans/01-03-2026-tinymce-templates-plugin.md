# TinyMCE Templates Plugin — Design Brief

**Created:** 01-03-2026
**Status:** BRAINSTORMING — to be developed as a separate open-source project
**Priority:** HIGH — strategic capability for CBME workflows

## Background

### The Problem

TinyMCE removed its built-in `template` plugin in version 6. The plugin allowed users to insert predefined HTML document structures into the editor. There is no official replacement. For ePortfolios, this gap is critical.

### The Bigger Picture: Two Aims of the Fork

ePortfolios was forked from Mahara 22.10.0 with two aims:

1. **Maintain and continue the 22.10 branch** — keep the platform stable, modern, and independent after Mahara's direction diverged from our needs (TinyMCE upgrade, dependency modernization, etc.)

2. **Adapt ePortfolios into a competency-based medical education (CBME) platform** — medical education is shifting globally from time-based training ("complete X years") to competency-based assessment ("demonstrate Y skills"). ePortfolios are the natural tool for this — learners document clinical encounters, reflect on experiences, collect evidence of competency, and assessors evaluate against defined frameworks (EPAs, milestones, competencies).

The templating system sits at the intersection of both aims. It modernizes the editor (aim 1) while enabling the structured content workflows that CBME requires (aim 2).

### Why Templates Matter for CBME

In competency-based medical education, learners and assessors repeatedly create structured documents:

- **Clinical Encounter Logs** — date, patient demographics (anonymized), presenting complaint, clinical reasoning, procedures performed, learning points, supervisor feedback
- **Entrustable Professional Activity (EPA) Assessments** — structured forms with defined sections for each EPA, rating scales, narrative comments, action plans
- **Procedure Logs** — structured records of procedures performed, level of supervision, complications, reflections
- **Reflective Narratives** — guided reflection templates (e.g., Gibbs' cycle: Description → Feelings → Evaluation → Analysis → Conclusion → Action Plan)
- **Case Presentations** — standardized medical case format (history, examination, investigations, differential diagnosis, management plan)
- **Portfolio Progress Reports** — periodic summaries mapping evidence to competency milestones

Without templates, learners create these from scratch each time — inconsistent formatting, missing sections, variable quality. With templates, institutions can define standard structures that learners fill in, ensuring completeness and consistency while still allowing free-text reflection.

### Relationship to Existing Work

| Feature | Scope | Status |
|---------|-------|--------|
| Phase 3: Content Templates | Small reusable HTML snippets (layout blocks, info boxes) | DONE — `contenttemplates` plugin |
| Phase 5: Document Templates | Full-page structures with sections, placeholders, metadata | THIS PROJECT |
| Competency Frameworks module | Backend: defining competencies, EPAs, milestones | Future work (separate from TinyMCE) |

The document templates plugin is a building block. It provides the editor-level capability. The competency framework integration (mapping templates to specific EPAs, attaching rubrics, triggering assessment workflows) is a separate layer that builds on top of it within ePortfolios.

## Vision: What the Plugin Should Do

### Core Capabilities

1. **Template Library** — users see a list/grid of available templates, organized by category, with previews
2. **Template Insertion** — selecting a template inserts its HTML structure into the editor at the cursor position (or replaces the entire editor content for "new document from template")
3. **Placeholder Fields** — templates can contain named placeholders (e.g., `{{patient_age}}`, `{{learning_points}}`) that are visually distinct in the editor and prompt the user to fill them in
4. **Section Structure** — templates define sections (headings + content areas) that give the document its skeleton
5. **Template Variables** — date, author name, institution, and other metadata auto-populated on insertion
6. **Template Management** — create, edit, delete, categorize templates (admin and potentially user-level)

### What Makes This Different from a Simple Snippet Inserter

The Phase 3 `contenttemplates` plugin is a snippet inserter — it drops a block of HTML into the editor. A true templates plugin needs:

- **Placeholders that are interactive** — not just text markers but visually distinct, clickable regions that guide the user through filling in the document
- **Whole-document mode** — option to start a new page/entry from a template (not just insert a block at cursor)
- **Categories and search** — when you have 50+ templates for different clinical scenarios, you need organization
- **Preview before insertion** — see what the template looks like before committing
- **Template versioning** — when institutions update a template, existing documents created from older versions should be unaffected

## Architecture Questions (For Brainstorming)

### 1. Separate Repo — Why and How?

**Why separate:**
- The plugin is useful to any TinyMCE 7 user, not just ePortfolios
- Keeps the ePortfolios repo focused on the platform, not editor internals
- Enables independent versioning, releases, and community contributions
- Can be published to npm for easy consumption

**How it integrates with ePortfolios:**
- Loaded via TinyMCE's `external_plugins` config (same as `imagebrowser`, `contenttemplates`, `mathslate`)
- ePortfolios provides the backend API (template CRUD, category management, user permissions)
- The plugin itself is frontend-only (JS) — it calls a configurable API endpoint to fetch/manage templates

### 2. Backend API Contract

The plugin needs a backend to store and serve templates. The plugin should define a clean API contract that any backend can implement:

```
GET    /templates              — list templates (with optional category filter)
GET    /templates/:id          — get a single template (HTML content + metadata)
POST   /templates              — create a template (admin)
PUT    /templates/:id          — update a template (admin)
DELETE /templates/:id          — delete a template (admin)
GET    /templates/categories   — list categories
```

ePortfolios implements this contract in PHP (`json/templates.json.php` or similar). Other platforms implement it in their own stack.

### 3. Placeholder System Design

How should placeholders work?

- **Syntax in template HTML:** `<span class="tmpl-placeholder" data-field="patient_age">Patient Age</span>`
- **Editor behavior:** rendered as visually distinct chips/badges that are clickable
- **On click:** inline editing or a sidebar form?
- **Required vs optional:** can a template mark certain placeholders as required?
- **Typed placeholders:** text, date, number, select-from-list, rich text?

### 4. Template Scope and Permissions

Who can create templates?
- **System templates:** admin-created, available to all users (e.g., institutional CBME forms)
- **Group templates:** created by group admins, available within a group (e.g., a residency program's custom templates)
- **Personal templates:** user-created, private (e.g., a learner's own reflection format)

### 5. Relationship to Phase 3 Content Templates

Options:
- **Replace Phase 3** — the new plugin supersedes `contenttemplates` entirely
- **Coexist** — `contenttemplates` stays for simple snippets, new plugin handles structured documents
- **Merge** — migrate Phase 3's snippet templates into the new plugin's library as a "Snippets" category

## Technical Considerations

- **TinyMCE 7 Dialog API** — for template browser modal, category navigation, preview panel
- **No external framework dependencies** — vanilla JS plugin, no React/Vue (keeps it portable)
- **MathJax compatibility** — templates containing math notation should work with MathJax
- **Accessibility** — WCAG 2.1 AA compliance, keyboard navigation through template browser and placeholders
- **i18n** — plugin UI strings should be translatable
- **Bundle size** — keep it small; template content comes from the backend, not bundled

## Next Steps

1. **Brainstorming session** — work through the architecture questions above, make decisions
2. **Create the repo** — set up the separate project with build tooling, tests, docs
3. **MVP scope** — define what the minimum viable plugin looks like
4. **Build and integrate** — develop the plugin, wire it into ePortfolios
5. **CBME template library** — create the actual medical education templates as content (separate from the plugin code)
