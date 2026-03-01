# tinymce-structured-content Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a TinyMCE 7 structured content plugin with template browser, placeholder fields, and Tab navigation — then integrate it into ePortfolios, replacing the Phase 3 `contenttemplates` plugin.

**Architecture:** Modular TypeScript source (`src/`) bundled via Rollup into a single `dist/plugin.js` IIFE. The plugin is backend-agnostic — it receives template data via a configuration callback. ePortfolios provides the backend (existing `content_template` DB table, new JSON endpoint).

**Tech Stack:** TypeScript 5.x, Rollup, Vitest (with jsdom), TinyMCE 7 API

**Repos:**
- **Plugin:** `~/Development/tinymce-structured-content/` → GitHub `academeio/tinymce-structured-content`
- **ePortfolios integration:** `~/Development/eportfolios/`

**Design doc:** `docs/plans/01-03-2026-tinymce-structured-content-design.md`

---

## Phase A: Build the Plugin (new repo)

### Task 1: Project Scaffolding

**Files:**
- Create: `~/Development/tinymce-structured-content/package.json`
- Create: `~/Development/tinymce-structured-content/tsconfig.json`
- Create: `~/Development/tinymce-structured-content/rollup.config.js`
- Create: `~/Development/tinymce-structured-content/.gitignore`
- Create: `~/Development/tinymce-structured-content/LICENSE`
- Create: `~/Development/tinymce-structured-content/README.md`
- Create: `~/Development/tinymce-structured-content/CLAUDE.md`
- Create: `~/Development/tinymce-structured-content/src/plugin.ts` (minimal stub)

**Step 1: Create directory and init git**

```bash
mkdir -p ~/Development/tinymce-structured-content
cd ~/Development/tinymce-structured-content
git init
```

**Step 2: Create package.json**

```json
{
  "name": "@academeio/tinymce-structured-content",
  "version": "0.1.0",
  "description": "TinyMCE 7 plugin for structured content templates with placeholder fields",
  "main": "dist/plugin.js",
  "files": ["dist/"],
  "scripts": {
    "build": "rollup -c",
    "dev": "rollup -c --watch",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "keywords": ["tinymce", "templates", "structured-content", "editor-plugin"],
  "author": "Academe Research, Inc",
  "license": "GPL-3.0-or-later",
  "repository": {
    "type": "git",
    "url": "https://github.com/academeio/tinymce-structured-content.git"
  },
  "devDependencies": {
    "@rollup/plugin-typescript": "^12.0.0",
    "rollup": "^4.0.0",
    "rollup-plugin-terser": "^7.0.0",
    "tslib": "^2.7.0",
    "typescript": "^5.6.0",
    "vitest": "^2.0.0",
    "jsdom": "^25.0.0"
  },
  "peerDependencies": {
    "tinymce": "^7.0.0"
  }
}
```

**Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2018",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "declaration": true,
    "declarationDir": "dist/types",
    "outDir": "dist",
    "rootDir": "src",
    "sourceMap": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "test"]
}
```

**Step 4: Create rollup.config.js**

```javascript
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/plugin.ts',
  output: {
    file: 'dist/plugin.js',
    format: 'iife',
    name: 'StructuredContentPlugin',
    sourcemap: false
  },
  plugins: [
    typescript({ tsconfig: './tsconfig.json', declaration: false, declarationDir: undefined })
  ]
};
```

**Step 5: Create .gitignore**

```
node_modules/
dist/
*.tgz
```

**Step 6: Create LICENSE** (GPL v3 — copy standard text)

**Step 7: Create README.md**

```markdown
# tinymce-structured-content

A TinyMCE 7 plugin for structured content templates with placeholder fields, category browsing, and live preview.

## Install

npm install @academeio/tinymce-structured-content

## Usage

\`\`\`javascript
tinymce.init({
  external_plugins: {
    structuredcontent: '/path/to/plugin.js'
  },
  structuredcontent: {
    fetch: async () => ({ templates: [...], categories: [...] }),
    insertMode: 'both'
  }
});
\`\`\`

## License

GPL-3.0-or-later
```

**Step 8: Create CLAUDE.md**

```markdown
# CLAUDE.md

## Project: tinymce-structured-content

TinyMCE 7 plugin for structured content templates. Modular TypeScript, bundled via Rollup.

## Commands

- `npm run build` — build dist/plugin.js
- `npm test` — run Vitest tests
- `npm run dev` — watch mode

## Architecture

- `src/plugin.ts` — entry point, TinyMCE PluginManager registration
- `src/types.ts` — TypeScript interfaces (Template, Category, StructuredContentConfig)
- `src/browser.ts` — template browser modal UI
- `src/placeholders.ts` — placeholder field system (rendering, Tab navigation, cleanup)
- `src/insertion.ts` — template insertion logic (variable replacement, cursor/document mode)
- `src/styles.ts` — CSS injection for placeholders and modal

## Design

See ~/Development/eportfolios/docs/plans/01-03-2026-tinymce-structured-content-design.md
```

**Step 9: Create minimal src/plugin.ts stub**

```typescript
declare const tinymce: any;

tinymce.PluginManager.add('structuredcontent', (editor: any) => {
  // Plugin will be built out in subsequent tasks
});
```

**Step 10: Install dependencies and verify build**

```bash
npm install
npm run build
```

Expected: `dist/plugin.js` is generated, wraps the stub in an IIFE.

**Step 11: Commit**

```bash
git add -A
git commit -m "chore: project scaffolding — TypeScript, Rollup, Vitest"
```

---

### Task 2: Types Module

**Files:**
- Create: `src/types.ts`

**Step 1: Write types**

```typescript
// src/types.ts

export interface Template {
  id: string;
  title: string;
  description?: string;
  content: string;
  category?: string;
  thumbnail?: string;
}

export interface Category {
  id: string;
  label: string;
  icon?: string;
}

export interface FetchResult {
  templates: Template[];
  categories: Category[];
}

export interface StructuredContentConfig {
  templates?: Template[];
  fetch?: (query?: string) => Promise<FetchResult>;
  insertMode?: 'cursor' | 'document' | 'both';
  variables?: Record<string, string>;
  modalTitle?: string;
  strings?: Record<string, string>;
}

/** Internal representation of a placeholder field in the editor */
export interface PlaceholderField {
  element: HTMLElement;
  name: string;
  defaultText: string;
  required: boolean;
  resolved: boolean;
}
```

**Step 2: Verify build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add TypeScript interfaces for plugin configuration and data"
```

---

### Task 3: Insertion Module (TDD)

**Files:**
- Create: `src/insertion.ts`
- Create: `test/insertion.test.ts`

**Step 1: Write failing test for variable replacement**

```typescript
// test/insertion.test.ts
import { describe, it, expect } from 'vitest';
import { replaceVariables } from '../src/insertion';

describe('replaceVariables', () => {
  it('replaces {{variable}} patterns with values', () => {
    const html = '<p>Author: {{author}}, Date: {{date}}</p>';
    const vars = { author: 'Dr. Smith', date: '01-03-2026' };
    expect(replaceVariables(html, vars)).toBe('<p>Author: Dr. Smith, Date: 01-03-2026</p>');
  });

  it('leaves unmatched variables as-is', () => {
    const html = '<p>{{known}} and {{unknown}}</p>';
    const vars = { known: 'hello' };
    expect(replaceVariables(html, vars)).toBe('<p>hello and {{unknown}}</p>');
  });

  it('returns html unchanged when no variables provided', () => {
    const html = '<p>{{author}}</p>';
    expect(replaceVariables(html, {})).toBe('<p>{{author}}</p>');
    expect(replaceVariables(html, undefined)).toBe('<p>{{author}}</p>');
  });

  it('handles multiple occurrences of the same variable', () => {
    const html = '<p>{{name}} wrote: signed {{name}}</p>';
    const vars = { name: 'Alice' };
    expect(replaceVariables(html, vars)).toBe('<p>Alice wrote: signed Alice</p>');
  });

  it('escapes HTML in variable values to prevent XSS', () => {
    const html = '<p>{{name}}</p>';
    const vars = { name: '<script>alert("xss")</script>' };
    const result = replaceVariables(html, vars);
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test
```

Expected: FAIL — `replaceVariables` not found.

**Step 3: Write minimal implementation**

```typescript
// src/insertion.ts
import type { StructuredContentConfig } from './types';

/** Escape HTML special characters in a string */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Replace {{variable}} patterns in template HTML with config values */
export function replaceVariables(
  html: string,
  variables: Record<string, string> | undefined
): string {
  if (!variables) return html;
  return html.replace(/\{\{(\w+)\}\}/g, (match, name) => {
    return name in variables ? escapeHtml(variables[name]) : match;
  });
}

/** Insert processed template HTML into the editor */
export function insertTemplate(
  editor: any,
  html: string,
  templateId: string,
  mode: 'cursor' | 'document',
  config: StructuredContentConfig
): void {
  const processed = replaceVariables(html, config.variables);

  editor.undoManager.transact(() => {
    if (mode === 'document') {
      editor.setContent(processed);
    } else {
      const wrapped = `<div class="sc-template" data-template-id="${escapeHtml(templateId)}">${processed}</div>`;
      editor.insertContent(wrapped);
    }
  });
}
```

**Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: All 5 tests PASS.

**Step 5: Write test for insertTemplate**

```typescript
// Append to test/insertion.test.ts
import { insertTemplate } from '../src/insertion';

describe('insertTemplate', () => {
  function mockEditor() {
    let content = '';
    return {
      _content: '',
      setContent(html: string) { this._content = html; },
      insertContent(html: string) { this._content += html; },
      undoManager: { transact(fn: () => void) { fn(); } },
      getContent() { return this._content; }
    };
  }

  it('inserts at cursor with sc-template wrapper', () => {
    const editor = mockEditor();
    insertTemplate(editor, '<p>Hello</p>', 'tpl-1', 'cursor', {});
    expect(editor._content).toContain('class="sc-template"');
    expect(editor._content).toContain('data-template-id="tpl-1"');
    expect(editor._content).toContain('<p>Hello</p>');
  });

  it('replaces content in document mode', () => {
    const editor = mockEditor();
    editor._content = '<p>Old content</p>';
    insertTemplate(editor, '<p>New</p>', 'tpl-2', 'document', {});
    expect(editor._content).toBe('<p>New</p>');
    expect(editor._content).not.toContain('Old content');
  });

  it('applies variable replacement before insertion', () => {
    const editor = mockEditor();
    insertTemplate(editor, '<p>By {{author}}</p>', 'tpl-3', 'document', {
      variables: { author: 'Dr. Smith' }
    });
    expect(editor._content).toContain('Dr. Smith');
    expect(editor._content).not.toContain('{{author}}');
  });
});
```

**Step 6: Run tests**

```bash
npm test
```

Expected: All 8 tests PASS.

**Step 7: Commit**

```bash
git add src/insertion.ts test/insertion.test.ts
git commit -m "feat: insertion module with variable replacement and XSS protection"
```

---

### Task 4: Placeholders Module (TDD)

**Files:**
- Create: `src/placeholders.ts`
- Create: `test/placeholders.test.ts`

**Step 1: Write failing tests**

```typescript
// test/placeholders.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import {
  findPlaceholderFields,
  resolveField,
  getNextField,
  getPrevField
} from '../src/placeholders';

describe('findPlaceholderFields', () => {
  it('finds all tmpl-field elements and extracts metadata', () => {
    const dom = new JSDOM(`
      <div>
        <span class="tmpl-field" data-field="date" data-required="true">Enter date</span>
        <span class="tmpl-field" data-field="notes">Add notes</span>
      </div>
    `);
    const fields = findPlaceholderFields(dom.window.document);
    expect(fields).toHaveLength(2);
    expect(fields[0].name).toBe('date');
    expect(fields[0].required).toBe(true);
    expect(fields[0].defaultText).toBe('Enter date');
    expect(fields[0].resolved).toBe(false);
    expect(fields[1].name).toBe('notes');
    expect(fields[1].required).toBe(false);
  });

  it('returns empty array when no placeholders exist', () => {
    const dom = new JSDOM('<div><p>No fields here</p></div>');
    expect(findPlaceholderFields(dom.window.document)).toHaveLength(0);
  });
});

describe('resolveField', () => {
  it('strips tmpl-field class and data attributes when text is modified', () => {
    const dom = new JSDOM(
      '<span class="tmpl-field" data-field="date" data-required="true">Enter date</span>'
    );
    const el = dom.window.document.querySelector('.tmpl-field') as HTMLElement;
    const field = { element: el, name: 'date', defaultText: 'Enter date', required: true, resolved: false };

    el.textContent = 'March 2026';
    resolveField(field);

    expect(field.resolved).toBe(true);
    expect(el.classList.contains('tmpl-field')).toBe(false);
    expect(el.hasAttribute('data-field')).toBe(false);
    expect(el.hasAttribute('data-required')).toBe(false);
    expect(el.textContent).toBe('March 2026');
  });

  it('does not resolve if text still matches default', () => {
    const dom = new JSDOM(
      '<span class="tmpl-field" data-field="date">Enter date</span>'
    );
    const el = dom.window.document.querySelector('.tmpl-field') as HTMLElement;
    const field = { element: el, name: 'date', defaultText: 'Enter date', required: false, resolved: false };

    resolveField(field);

    expect(field.resolved).toBe(false);
    expect(el.classList.contains('tmpl-field')).toBe(true);
  });
});

describe('getNextField / getPrevField', () => {
  let fields: any[];

  beforeEach(() => {
    const dom = new JSDOM(`
      <div>
        <span class="tmpl-field" data-field="a">A</span>
        <span class="tmpl-field" data-field="b">B</span>
        <span class="tmpl-field" data-field="c">C</span>
      </div>
    `);
    const els = dom.window.document.querySelectorAll('.tmpl-field');
    fields = Array.from(els).map((el, i) => ({
      element: el as HTMLElement,
      name: ['a', 'b', 'c'][i],
      defaultText: ['A', 'B', 'C'][i],
      required: false,
      resolved: false
    }));
  });

  it('getNextField returns the next unresolved field', () => {
    expect(getNextField(fields, fields[0])).toBe(fields[1]);
    expect(getNextField(fields, fields[1])).toBe(fields[2]);
  });

  it('getNextField wraps around to the first field', () => {
    expect(getNextField(fields, fields[2])).toBe(fields[0]);
  });

  it('getNextField skips resolved fields', () => {
    fields[1].resolved = true;
    expect(getNextField(fields, fields[0])).toBe(fields[2]);
  });

  it('getPrevField returns the previous unresolved field', () => {
    expect(getPrevField(fields, fields[2])).toBe(fields[1]);
    expect(getPrevField(fields, fields[1])).toBe(fields[0]);
  });

  it('getPrevField wraps around to the last field', () => {
    expect(getPrevField(fields, fields[0])).toBe(fields[2]);
  });

  it('returns null when all fields are resolved', () => {
    fields.forEach(f => f.resolved = true);
    expect(getNextField(fields, fields[0])).toBeNull();
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: FAIL — module not found.

**Step 3: Write implementation**

```typescript
// src/placeholders.ts
import type { PlaceholderField } from './types';

/** CSS injected into the editor iframe for placeholder styling */
export const PLACEHOLDER_CSS = `
.tmpl-field {
  background: #e8f4fd;
  border: 1px dashed #7ab8e0;
  border-radius: 3px;
  padding: 1px 4px;
  color: #1a6ca1;
  cursor: text;
  font-style: italic;
}
.tmpl-field[data-required="true"] {
  border-left: 3px solid #d9534f;
}
.tmpl-field:focus {
  outline: 2px solid #0d6efd;
  outline-offset: 1px;
}
`;

/** Find all placeholder fields in a document and return metadata */
export function findPlaceholderFields(doc: Document): PlaceholderField[] {
  const elements = doc.querySelectorAll('.tmpl-field');
  return Array.from(elements).map((el) => ({
    element: el as HTMLElement,
    name: el.getAttribute('data-field') || '',
    defaultText: (el.textContent || '').trim(),
    required: el.getAttribute('data-required') === 'true',
    resolved: false,
  }));
}

/** Check if a field's text has changed from its default and strip placeholder markup if so */
export function resolveField(field: PlaceholderField): void {
  const currentText = (field.element.textContent || '').trim();
  if (currentText === field.defaultText) return;

  field.resolved = true;
  field.element.classList.remove('tmpl-field');
  field.element.removeAttribute('data-field');
  field.element.removeAttribute('data-required');
}

/** Get the next unresolved field after the current one (wraps around) */
export function getNextField(
  fields: PlaceholderField[],
  current: PlaceholderField
): PlaceholderField | null {
  const unresolved = fields.filter((f) => !f.resolved);
  if (unresolved.length === 0) return null;

  const currentIdx = fields.indexOf(current);
  for (let i = 1; i <= fields.length; i++) {
    const candidate = fields[(currentIdx + i) % fields.length];
    if (!candidate.resolved) return candidate;
  }
  return null;
}

/** Get the previous unresolved field before the current one (wraps around) */
export function getPrevField(
  fields: PlaceholderField[],
  current: PlaceholderField
): PlaceholderField | null {
  const unresolved = fields.filter((f) => !f.resolved);
  if (unresolved.length === 0) return null;

  const currentIdx = fields.indexOf(current);
  for (let i = 1; i <= fields.length; i++) {
    const candidate = fields[(currentIdx - i + fields.length) % fields.length];
    if (!candidate.resolved) return candidate;
  }
  return null;
}

/** Inject placeholder CSS into a document (idempotent) */
export function injectPlaceholderStyles(doc: Document): void {
  if (doc.getElementById('sc-placeholder-styles')) return;
  const style = doc.createElement('style');
  style.id = 'sc-placeholder-styles';
  style.textContent = PLACEHOLDER_CSS;
  doc.head.appendChild(style);
}

/**
 * Activate placeholder system on an editor.
 * Call after inserting a template. Sets up Tab navigation and field resolution.
 */
export function activatePlaceholders(editor: any): void {
  const doc: Document = editor.getDoc();
  injectPlaceholderStyles(doc);

  const fields = findPlaceholderFields(doc);
  if (fields.length === 0) return;

  // Focus the first field
  const firstField = fields.find((f) => !f.resolved);
  if (firstField) {
    editor.selection.select(firstField.element, true);
  }

  // Tab navigation handler
  editor.on('keydown', (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    const node = editor.selection.getNode();
    const currentField = fields.find(
      (f) => f.element === node || f.element.contains(node)
    );
    if (!currentField) return;

    e.preventDefault();

    // Resolve current field if text was modified
    resolveField(currentField);

    // Navigate to next/prev
    const target = e.shiftKey
      ? getPrevField(fields, currentField)
      : getNextField(fields, currentField);

    if (target) {
      editor.selection.select(target.element, true);
    }
  });

  // Resolve fields on blur/click away
  editor.on('NodeChange', () => {
    const node = editor.selection.getNode();
    fields.forEach((field) => {
      if (field.element !== node && !field.element.contains(node)) {
        resolveField(field);
      }
    });
  });
}
```

**Step 4: Run tests**

```bash
npm test
```

Expected: All 10 tests PASS.

**Step 5: Commit**

```bash
git add src/placeholders.ts test/placeholders.test.ts
git commit -m "feat: placeholder field system with Tab navigation and auto-resolve"
```

---

### Task 5: Styles Module

**Files:**
- Create: `src/styles.ts`

No TDD for this — it's CSS string constants. Tested implicitly through the browser module.

**Step 1: Write styles**

```typescript
// src/styles.ts

/** CSS for the template browser modal — injected into the host page (not the editor iframe) */
export const MODAL_CSS = `
.sc-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 100000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 40px;
}
.sc-modal {
  background: #fff;
  border-radius: 8px;
  width: 800px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}
.sc-header {
  padding: 15px 20px;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.sc-header h3 { margin: 0; font-size: 1.1rem; }
.sc-close {
  background: none; border: none; font-size: 1.5rem;
  cursor: pointer; color: #666; line-height: 1;
}
.sc-close:hover { color: #333; }
.sc-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}
.sc-sidebar {
  width: 140px;
  border-right: 1px solid #dee2e6;
  padding: 10px 0;
  overflow-y: auto;
  flex-shrink: 0;
}
.sc-sidebar-item {
  display: block;
  width: 100%;
  padding: 8px 16px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font-size: 0.85rem;
  color: #333;
}
.sc-sidebar-item:hover { background: #f0f0f0; }
.sc-sidebar-item.active { background: #e8f4fd; color: #0d6efd; font-weight: 600; }
.sc-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.sc-search {
  padding: 10px 15px;
  border-bottom: 1px solid #dee2e6;
}
.sc-search input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.9rem;
}
.sc-grid {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  align-content: start;
}
.sc-card {
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 12px;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.sc-card:hover { border-color: #0d6efd; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.sc-card:focus { outline: 2px solid #0d6efd; outline-offset: 2px; }
.sc-card-title { margin: 0 0 4px; font-size: 0.95rem; }
.sc-card-cat {
  font-size: 0.7rem;
  background: #e9ecef;
  padding: 1px 6px;
  border-radius: 3px;
  display: inline-block;
  margin-bottom: 6px;
}
.sc-card-desc { margin: 0; font-size: 0.8rem; color: #666; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.sc-preview-panel {
  border-top: 1px solid #dee2e6;
  display: none;
}
.sc-preview-panel.active { display: block; }
.sc-preview-header {
  padding: 10px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
}
.sc-preview-header h4 { margin: 0; font-size: 1rem; }
.sc-preview-content {
  padding: 15px 20px;
  max-height: 200px;
  overflow-y: auto;
  background: #fafafa;
}
.sc-preview-actions {
  padding: 10px 20px;
  text-align: right;
  border-top: 1px solid #eee;
}
.sc-btn {
  padding: 6px 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  margin-left: 8px;
  background: #fff;
}
.sc-btn:hover { background: #f0f0f0; }
.sc-btn-primary { background: #0d6efd; color: #fff; border-color: #0d6efd; }
.sc-btn-primary:hover { background: #0b5ed7; }
.sc-empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px;
  color: #999;
}
`;

/** Inject modal CSS into the host page (idempotent) */
export function injectModalStyles(): void {
  if (document.getElementById('sc-modal-styles')) return;
  const style = document.createElement('style');
  style.id = 'sc-modal-styles';
  style.textContent = MODAL_CSS;
  document.head.appendChild(style);
}
```

**Step 2: Verify build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/styles.ts
git commit -m "feat: scoped CSS for template browser modal and placeholder fields"
```

---

### Task 6: Browser Module

**Files:**
- Create: `src/browser.ts`
- Create: `test/browser.test.ts`

This is the largest module. The test focuses on data logic (filtering, search), not DOM rendering.

**Step 1: Write failing tests for filtering logic**

```typescript
// test/browser.test.ts
import { describe, it, expect } from 'vitest';
import { filterTemplates } from '../src/browser';
import type { Template } from '../src/types';

const templates: Template[] = [
  { id: '1', title: 'Clinical Encounter', description: 'Log a clinical encounter', category: 'cbme', content: '' },
  { id: '2', title: 'Two Column Layout', description: 'Side by side columns', category: 'snippets', content: '' },
  { id: '3', title: 'Reflective Narrative', description: 'Gibbs cycle reflection', category: 'cbme', content: '' },
  { id: '4', title: 'Meeting Notes', description: 'Agenda and action items', category: 'general', content: '' },
];

describe('filterTemplates', () => {
  it('returns all templates when no category and no search', () => {
    expect(filterTemplates(templates, null, '')).toHaveLength(4);
  });

  it('filters by category', () => {
    const result = filterTemplates(templates, 'cbme', '');
    expect(result).toHaveLength(2);
    expect(result.map(t => t.id)).toEqual(['1', '3']);
  });

  it('filters by search term (title match)', () => {
    const result = filterTemplates(templates, null, 'clinical');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('filters by search term (description match)', () => {
    const result = filterTemplates(templates, null, 'gibbs');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('3');
  });

  it('combines category and search filters', () => {
    const result = filterTemplates(templates, 'cbme', 'encounter');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('search is case-insensitive', () => {
    expect(filterTemplates(templates, null, 'MEETING')).toHaveLength(1);
  });

  it('returns empty array when nothing matches', () => {
    expect(filterTemplates(templates, 'cbme', 'nonexistent')).toHaveLength(0);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test
```

**Step 3: Write browser module**

The full `browser.ts` will be ~250 lines. Key exports:

```typescript
// src/browser.ts
import type { Template, Category, StructuredContentConfig } from './types';
import { injectModalStyles } from './styles';
import { insertTemplate } from './insertion';
import { activatePlaceholders } from './placeholders';

/** Filter templates by category and search term */
export function filterTemplates(
  templates: Template[],
  category: string | null,
  search: string
): Template[] {
  let filtered = templates;
  if (category) {
    filtered = filtered.filter((t) => t.category === category);
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q)
    );
  }
  return filtered;
}

/** Escape HTML for safe insertion into the modal DOM */
function esc(str: string): string {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

/** Open the template browser modal */
export function openBrowser(editor: any, config: StructuredContentConfig): void {
  injectModalStyles();

  let allTemplates: Template[] = [];
  let allCategories: Category[] = [];
  let activeCategory: string | null = null;
  let searchQuery = '';

  // Resolve template data
  const dataPromise: Promise<void> = config.fetch
    ? config.fetch().then((result) => {
        allTemplates = result.templates;
        allCategories = result.categories;
      })
    : Promise.resolve().then(() => {
        allTemplates = config.templates || [];
        // Derive categories from template data
        const cats = new Set(allTemplates.map((t) => t.category).filter(Boolean));
        allCategories = Array.from(cats).map((c) => ({ id: c!, label: c! }));
      });

  dataPromise.then(() => {
    renderModal(editor, config, allTemplates, allCategories);
  });
}

/**
 * Render the modal DOM. Full implementation creates:
 * - Overlay with click-outside-to-close
 * - Modal with header (title + close button)
 * - Body with sidebar (categories) and main area (search + card grid)
 * - Preview panel (hidden until card clicked)
 * - Insert buttons (cursor / document mode)
 * - Escape key handler
 * - Search input filtering
 * - Category sidebar filtering
 */
function renderModal(
  editor: any,
  config: StructuredContentConfig,
  templates: Template[],
  categories: Category[]
): void {
  const title = config.modalTitle || 'Structured Content';
  const overlay = document.createElement('div');
  overlay.className = 'sc-overlay';
  overlay.id = 'sc-overlay';

  // Build modal HTML structure
  // Categories sidebar, search bar, 2-column card grid, preview panel
  // Wire up: category clicks, search input, card clicks, insert buttons, close/escape

  // Key behaviors:
  // - Card click → show preview panel with rendered HTML + insert buttons
  // - "Insert at cursor" → insertTemplate(editor, html, id, 'cursor', config) + activatePlaceholders(editor) + close
  // - "New document" → confirm if editor has content → insertTemplate(editor, html, id, 'document', config) + activatePlaceholders(editor) + close
  // - Search input → filterTemplates() → re-render cards
  // - Category click → set activeCategory → filterTemplates() → re-render cards
  // - Escape / overlay click / close button → remove overlay

  // [Full DOM construction omitted for plan brevity — follows the wireframe
  //  from the design doc. Uses esc() for all user-provided strings.
  //  Approximately 150 lines of DOM creation and event wiring.]

  document.body.appendChild(overlay);
  document.body.classList.add('modal-open');
}

/** Close and clean up the modal */
export function closeBrowser(): void {
  const overlay = document.getElementById('sc-overlay');
  if (overlay) overlay.remove();
  document.body.classList.remove('modal-open');
}
```

> **Note for implementer:** The `renderModal` function body is the bulk of the work (~150 lines of DOM construction). Follow the wireframe from the design doc exactly. Use `esc()` for all template titles/descriptions. Attach event listeners inline as the DOM is built (same pattern as `contenttemplates/plugin.js` in the ePortfolios repo — read it for reference).

**Step 4: Run tests**

```bash
npm test
```

Expected: All 17 tests PASS (7 browser + 10 previous).

**Step 5: Commit**

```bash
git add src/browser.ts test/browser.test.ts
git commit -m "feat: template browser modal with category filtering and search"
```

---

### Task 7: Plugin Entry Point

**Files:**
- Modify: `src/plugin.ts`

**Step 1: Wire everything together**

```typescript
// src/plugin.ts
import type { StructuredContentConfig } from './types';
import { openBrowser } from './browser';

declare const tinymce: any;

tinymce.PluginManager.add('structuredcontent', (editor: any) => {
  const config: StructuredContentConfig = editor.options.get('structuredcontent') || {};

  // Register option so TinyMCE knows about our config key
  editor.options.register('structuredcontent', { processor: 'object', default: {} });

  // Toolbar button
  editor.ui.registry.addButton('structuredcontent', {
    icon: 'template',
    tooltip: config.strings?.buttonTooltip || 'Structured Content',
    onAction: () => openBrowser(editor, config),
  });

  // Menu item
  editor.ui.registry.addMenuItem('structuredcontent', {
    icon: 'template',
    text: config.strings?.menuText || 'Structured Content',
    onAction: () => openBrowser(editor, config),
  });
});
```

**Step 2: Build and verify**

```bash
npm run build
ls -la dist/plugin.js
```

Expected: `dist/plugin.js` exists, contains the full bundled plugin as IIFE.

**Step 3: Commit**

```bash
git add src/plugin.ts
git commit -m "feat: plugin entry point — register toolbar button and menu item"
```

---

### Task 8: Build Verification & README

**Step 1: Run full test suite**

```bash
npm test
```

Expected: All tests PASS.

**Step 2: Run build**

```bash
npm run build
```

**Step 3: Verify dist/plugin.js is self-contained**

```bash
head -5 dist/plugin.js
# Should start with (function() { ... or similar IIFE wrapper
grep -c 'PluginManager' dist/plugin.js
# Should return 1
```

**Step 4: Tag v0.1.0**

```bash
git tag v0.1.0
```

**Step 5: Commit any final cleanup**

```bash
git add -A
git commit -m "chore: build verification, tag v0.1.0"
```

---

## Phase B: ePortfolios Integration

All remaining tasks are in the `~/Development/eportfolios/` repo.

### Task 9: Copy Built Plugin Into ePortfolios

**Files:**
- Create: `js/tinymce/plugins/structuredcontent/plugin.js` (copied from the plugin repo's `dist/plugin.js`)

**Step 1: Copy the built plugin**

```bash
mkdir -p js/tinymce/plugins/structuredcontent
cp ~/Development/tinymce-structured-content/dist/plugin.js js/tinymce/plugins/structuredcontent/plugin.js
```

**Step 2: Commit**

```bash
git add js/tinymce/plugins/structuredcontent/plugin.js
git commit -m "feat: add built structuredcontent TinyMCE plugin"
```

---

### Task 10: Create JSON Endpoint

**Files:**
- Create: `json/structuredcontent.json.php`

**Step 1: Write endpoint**

```php
<?php
/**
 * JSON endpoint for the Structured Content TinyMCE plugin.
 * Implements the fetch() callback contract.
 *
 * @package    eportfolios
 * @subpackage core
 * @author     Academe Research, Inc
 * @license    https://www.gnu.org/licenses/gpl-3.0.html GNU GPL version 3 or later
 * @copyright  (C) 2026 Academe Research, Inc.
 */

define('INTERNAL', 1);
define('JSON', 1);
require(dirname(dirname(__FILE__)) . '/init.php');
require_once('contenttemplates.php');

$query = param_variable('query', null);
$category = param_variable('category', null);

// Reuse existing content_template infrastructure
$templates = get_content_templates($category);
$categories = get_content_template_categories(true);

$data = array();
foreach ($templates as $t) {
    $data[] = array(
        'id'          => (string)$t->id,
        'title'       => $t->title,
        'description' => $t->description,
        'content'     => $t->content,
        'category'    => $t->category,
    );
}

// Apply search filter if query provided
if ($query) {
    $q = strtolower($query);
    $data = array_values(array_filter($data, function($t) use ($q) {
        return strpos(strtolower($t['title']), $q) !== false
            || strpos(strtolower($t['description'] ?? ''), $q) !== false;
    }));
}

// Build categories with id + label
$catdata = array();
foreach ($categories as $cat) {
    $catdata[] = array(
        'id'    => $cat,
        'label' => ucfirst($cat),
    );
}

json_reply(false, array(
    'templates'  => $data,
    'categories' => $catdata,
));
```

**Step 2: Commit**

```bash
git add json/structuredcontent.json.php
git commit -m "feat: add structuredcontent JSON endpoint for TinyMCE plugin"
```

---

### Task 11: Wire Plugin Into lib/web.php

**Files:**
- Modify: `lib/web.php` (two locations: toolbar config and external_plugins)

**Step 1: Replace `contenttemplates` with `structuredcontent` in the toolbar**

In `lib/web.php`, find:

```php
'"toolbar_toggle | blocks | bold italic | bullist numlist | link unlink | imagebrowser contenttemplates | undo redo"',
```

Replace `contenttemplates` with `structuredcontent`.

**Step 2: Replace in external_plugins**

Find:

```php
$external_plugins .= "        contenttemplates: '{$wwwroot}js/tinymce/plugins/contenttemplates/plugin.js'";
```

Replace with:

```php
$external_plugins .= "        structuredcontent: '{$wwwroot}js/tinymce/plugins/structuredcontent/plugin.js'";
```

**Step 3: Add structuredcontent config block**

After the `external_plugins` block, in the TinyMCE init config, add:

```php
structuredcontent: {
    fetch: async function(query) {
        return new Promise(function(resolve) {
            sendjsonrequest('{$wwwroot}json/structuredcontent.json.php',
                { query: query || '' }, 'POST', function(data) {
                    resolve({ templates: data.data.templates, categories: data.data.categories });
                });
        });
    },
    insertMode: 'both'
},
```

> **Note for implementer:** Read the full TinyMCE init block in `lib/web.php` (around lines 300-380) to find the exact location. The config must be inside the `tinymce.init({...})` call. Match the existing indentation style.

**Step 4: Update admin menu reference**

Find the admin menu entry `configsite/contenttemplates` and update:

```php
'configsite/contenttemplates' => array(
    'path'   => 'configsite/contenttemplates',
    'url'    => 'admin/site/contenttemplates.php',
    'title'  => get_string('contenttemplates', 'contenttemplates'),
    'weight' => 35,
),
```

Update the title string to reference the new name (keep URL and path as-is for now — cosmetic rename is optional per design doc):

```php
'configsite/contenttemplates' => array(
    'path'   => 'configsite/contenttemplates',
    'url'    => 'admin/site/contenttemplates.php',
    'title'  => get_string('structuredcontent', 'contenttemplates'),
    'weight' => 35,
),
```

And add the lang string in `lang/en.utf8/contenttemplates.php`:

```php
$string['structuredcontent'] = 'Structured Content';
```

**Step 5: Commit**

```bash
git add lib/web.php lang/en.utf8/contenttemplates.php
git commit -m "feat: wire structuredcontent plugin into TinyMCE config, replace contenttemplates"
```

---

### Task 12: Add CBME Seed Templates

**Files:**
- Modify: `lib/contenttemplates.php` — add CBME template definitions
- Modify: `lib/db/upgrade.php` — migration to seed new templates and update categories
- Modify: `lib/version.php` — version bump

**Step 1: Add CBME templates to get_builtin_content_templates()**

Append to the array in `lib/contenttemplates.php`:

```php
// CBME templates — structured documents with placeholder fields
array(
    'title' => 'Clinical Encounter Log',
    'description' => 'Structured log for documenting clinical encounters with placeholder fields',
    'category' => 'cbme',
    'content' => '<h4>Clinical Encounter Log</h4>'
        . '<p><strong>Date:</strong> <span class="tmpl-field" data-field="date" data-required="true">Enter date</span></p>'
        . '<p><strong>Setting:</strong> <span class="tmpl-field" data-field="setting">e.g., Emergency Department, Outpatient Clinic</span></p>'
        . '<h5>Presenting Complaint</h5>'
        . '<p><span class="tmpl-field" data-field="complaint" data-required="true">Describe the presenting complaint</span></p>'
        . '<h5>Clinical Reasoning</h5>'
        . '<p><span class="tmpl-field" data-field="reasoning">Document your clinical reasoning process</span></p>'
        . '<h5>Procedures / Interventions</h5>'
        . '<p><span class="tmpl-field" data-field="procedures">List any procedures performed or interventions made</span></p>'
        . '<h5>Learning Points</h5>'
        . '<p><span class="tmpl-field" data-field="learning" data-required="true">What did you learn from this encounter?</span></p>'
        . '<h5>Supervisor Feedback</h5>'
        . '<p><span class="tmpl-field" data-field="feedback">Record supervisor feedback</span></p>',
),
array(
    'title' => 'Reflective Narrative (Gibbs)',
    'description' => 'Guided reflection using the Gibbs reflective cycle with placeholder fields',
    'category' => 'cbme',
    'content' => '<h4>Reflective Narrative</h4>'
        . '<h5>Description</h5>'
        . '<p><span class="tmpl-field" data-field="description" data-required="true">What happened? Describe the event or experience</span></p>'
        . '<h5>Feelings</h5>'
        . '<p><span class="tmpl-field" data-field="feelings">What were you thinking and feeling?</span></p>'
        . '<h5>Evaluation</h5>'
        . '<p><span class="tmpl-field" data-field="evaluation">What was good and bad about the experience?</span></p>'
        . '<h5>Analysis</h5>'
        . '<p><span class="tmpl-field" data-field="analysis">What sense can you make of the situation?</span></p>'
        . '<h5>Conclusion</h5>'
        . '<p><span class="tmpl-field" data-field="conclusion">What else could you have done?</span></p>'
        . '<h5>Action Plan</h5>'
        . '<p><span class="tmpl-field" data-field="action_plan" data-required="true">What will you do differently next time?</span></p>',
),
array(
    'title' => 'Case Presentation',
    'description' => 'Standardized medical case presentation format with placeholder fields',
    'category' => 'cbme',
    'content' => '<h4>Case Presentation</h4>'
        . '<p><strong>Date:</strong> <span class="tmpl-field" data-field="date">Enter date</span></p>'
        . '<h5>History of Presenting Illness</h5>'
        . '<p><span class="tmpl-field" data-field="history" data-required="true">Present the history</span></p>'
        . '<h5>Examination Findings</h5>'
        . '<p><span class="tmpl-field" data-field="examination">Describe relevant examination findings</span></p>'
        . '<h5>Investigations</h5>'
        . '<p><span class="tmpl-field" data-field="investigations">List investigations and results</span></p>'
        . '<h5>Differential Diagnosis</h5>'
        . '<p><span class="tmpl-field" data-field="differential" data-required="true">List differential diagnoses with reasoning</span></p>'
        . '<h5>Management Plan</h5>'
        . '<p><span class="tmpl-field" data-field="management" data-required="true">Describe the management plan</span></p>'
        . '<h5>Learning Points</h5>'
        . '<p><span class="tmpl-field" data-field="learning">Key learning from this case</span></p>',
),
array(
    'title' => 'Procedure Log',
    'description' => 'Structured record of a procedure performed with placeholder fields',
    'category' => 'cbme',
    'content' => '<h4>Procedure Log</h4>'
        . '<p><strong>Date:</strong> <span class="tmpl-field" data-field="date" data-required="true">Enter date</span></p>'
        . '<p><strong>Procedure:</strong> <span class="tmpl-field" data-field="procedure" data-required="true">Name of procedure</span></p>'
        . '<p><strong>Supervision Level:</strong> <span class="tmpl-field" data-field="supervision">e.g., Direct, Indirect, Independent</span></p>'
        . '<h5>Indication</h5>'
        . '<p><span class="tmpl-field" data-field="indication">Why was this procedure performed?</span></p>'
        . '<h5>Technique</h5>'
        . '<p><span class="tmpl-field" data-field="technique">Describe the technique used</span></p>'
        . '<h5>Outcome / Complications</h5>'
        . '<p><span class="tmpl-field" data-field="outcome">Result and any complications</span></p>'
        . '<h5>Reflection</h5>'
        . '<p><span class="tmpl-field" data-field="reflection">What did you learn? What would you do differently?</span></p>',
),
```

**Step 2: Update existing Phase 3 templates to "snippets" category**

In `lib/db/upgrade.php`, add a new migration block:

```php
if ($oldversion < 2026030200) {
    log_debug('Updating content template categories for Structured Content plugin');

    // Re-categorize Phase 3 built-in templates into "snippets" category
    execute_sql(
        "UPDATE {content_template} SET category = 'snippets' WHERE builtin = 1 AND category IN ('layout', 'reflection', 'assessment', 'general', 'portfolio')"
    );

    log_debug('Seeding CBME content templates');
    require_once(get_config('libroot') . 'contenttemplates.php');
    seed_content_templates();
}
```

**Step 3: Bump version in lib/version.php**

```php
$config->version = 2026030200;
```

**Step 4: Commit**

```bash
git add lib/contenttemplates.php lib/db/upgrade.php lib/version.php
git commit -m "feat: add CBME seed templates, re-categorize Phase 3 templates as snippets"
```

---

### Task 13: Remove Old contenttemplates Plugin

**Files:**
- Delete: `js/tinymce/plugins/contenttemplates/plugin.js`

**Step 1: Delete the old plugin file**

```bash
rm js/tinymce/plugins/contenttemplates/plugin.js
rmdir js/tinymce/plugins/contenttemplates/
```

**Step 2: Verify no other references remain**

```bash
grep -r 'contenttemplates' js/tinymce/ lib/web.php
```

Expected: No matches in `js/tinymce/`. The only match in `lib/web.php` should be the admin menu path (which we intentionally kept).

**Step 3: Commit**

```bash
git add -A
git commit -m "refactor: remove retired contenttemplates TinyMCE plugin"
```

---

### Task 14: Final Verification

**Step 1: Run DB upgrade**

```bash
php admin/upgrade.php
```

Expected: Migration runs, seeds CBME templates, re-categorizes existing templates.

**Step 2: Manual browser verification**

- Open any page with a TinyMCE editor (e.g., journal entry)
- Verify the toolbar shows a "Structured Content" button (template icon)
- Click it — modal should appear with categories and template cards
- Select a CBME template — preview should show placeholder fields as styled badges
- Click "Insert at cursor" — template HTML inserted with placeholder styling
- Tab through placeholder fields — should navigate between them
- Type in a field — placeholder styling should clear after moving away
- Verify "New document" mode works (clears editor, inserts template)

**Step 3: Verify Behat tests still pass**

```bash
# Existing TinyMCE tests should not be broken
php testing/frameworks/behat/cli/util.php --run
```

---

## Summary

| Task | Repo | What |
|------|------|------|
| 1 | plugin | Project scaffolding |
| 2 | plugin | Types module |
| 3 | plugin | Insertion module (TDD — 8 tests) |
| 4 | plugin | Placeholders module (TDD — 10 tests) |
| 5 | plugin | Styles module |
| 6 | plugin | Browser module (TDD — 7 tests) |
| 7 | plugin | Plugin entry point |
| 8 | plugin | Build verification, tag v0.1.0 |
| 9 | eportfolios | Copy built plugin |
| 10 | eportfolios | JSON endpoint |
| 11 | eportfolios | Wire into lib/web.php |
| 12 | eportfolios | CBME seed templates + DB migration |
| 13 | eportfolios | Remove old contenttemplates plugin |
| 14 | eportfolios | Final verification |
