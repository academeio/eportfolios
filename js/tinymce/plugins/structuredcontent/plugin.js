(function () {
  'use strict';

  /** CSS for the template browser modal — injected into the host page (not the editor iframe) */
  const MODAL_CSS = `
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
  function injectModalStyles() {
      if (document.getElementById('sc-modal-styles'))
          return;
      const style = document.createElement('style');
      style.id = 'sc-modal-styles';
      style.textContent = MODAL_CSS;
      document.head.appendChild(style);
  }

  /** Escape HTML special characters in a string */
  function escapeHtml(str) {
      return str
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
  }
  /** Replace {{variable}} patterns in template HTML with config values */
  function replaceVariables(html, variables) {
      if (!variables)
          return html;
      return html.replace(/\{\{(\w+)\}\}/g, (match, name) => {
          return name in variables ? escapeHtml(variables[name]) : match;
      });
  }
  /** Insert processed template HTML into the editor */
  function insertTemplate(editor, html, templateId, mode, config) {
      const processed = replaceVariables(html, config.variables);
      editor.undoManager.transact(() => {
          if (mode === 'document') {
              editor.setContent(processed);
          }
          else {
              const wrapped = `<div class="sc-template" data-template-id="${escapeHtml(templateId)}">${processed}</div>`;
              editor.insertContent(wrapped);
          }
      });
  }

  /** CSS injected into the editor iframe for placeholder styling */
  const PLACEHOLDER_CSS = `
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
  function findPlaceholderFields(doc) {
      const elements = doc.querySelectorAll('.tmpl-field');
      return Array.from(elements).map((el) => ({
          element: el,
          name: el.getAttribute('data-field') || '',
          defaultText: (el.textContent || '').trim(),
          required: el.getAttribute('data-required') === 'true',
          resolved: false,
      }));
  }
  /** Check if a field's text has changed from its default and strip placeholder markup if so */
  function resolveField(field) {
      const currentText = (field.element.textContent || '').trim();
      if (currentText === field.defaultText)
          return;
      field.resolved = true;
      field.element.classList.remove('tmpl-field');
      field.element.removeAttribute('data-field');
      field.element.removeAttribute('data-required');
  }
  /** Get the next unresolved field after the current one (wraps around) */
  function getNextField(fields, current) {
      const unresolved = fields.filter((f) => !f.resolved);
      if (unresolved.length === 0)
          return null;
      const currentIdx = fields.indexOf(current);
      for (let i = 1; i <= fields.length; i++) {
          const candidate = fields[(currentIdx + i) % fields.length];
          if (!candidate.resolved)
              return candidate;
      }
      return null;
  }
  /** Get the previous unresolved field before the current one (wraps around) */
  function getPrevField(fields, current) {
      const unresolved = fields.filter((f) => !f.resolved);
      if (unresolved.length === 0)
          return null;
      const currentIdx = fields.indexOf(current);
      for (let i = 1; i <= fields.length; i++) {
          const candidate = fields[(currentIdx - i + fields.length) % fields.length];
          if (!candidate.resolved)
              return candidate;
      }
      return null;
  }
  /** Inject placeholder CSS into a document (idempotent) */
  function injectPlaceholderStyles(doc) {
      if (doc.getElementById('sc-placeholder-styles'))
          return;
      const style = doc.createElement('style');
      style.id = 'sc-placeholder-styles';
      style.textContent = PLACEHOLDER_CSS;
      doc.head.appendChild(style);
  }
  /**
   * Activate placeholder system on an editor.
   * Call after inserting a template. Sets up Tab navigation and field resolution.
   */
  function activatePlaceholders(editor) {
      const doc = editor.getDoc();
      injectPlaceholderStyles(doc);
      const fields = findPlaceholderFields(doc);
      if (fields.length === 0)
          return;
      // Focus the first field
      const firstField = fields.find((f) => !f.resolved);
      if (firstField) {
          editor.selection.select(firstField.element, true);
      }
      // Tab navigation handler
      editor.on('keydown', (e) => {
          if (e.key !== 'Tab')
              return;
          const node = editor.selection.getNode();
          const currentField = fields.find((f) => f.element === node || f.element.contains(node));
          if (!currentField)
              return;
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

  /** Filter templates by category and search term */
  function filterTemplates(templates, category, search) {
      let filtered = templates;
      if (category) {
          filtered = filtered.filter((t) => t.category === category);
      }
      if (search) {
          const q = search.toLowerCase();
          filtered = filtered.filter((t) => t.title.toLowerCase().includes(q) ||
              (t.description || '').toLowerCase().includes(q));
      }
      return filtered;
  }
  /** Open the template browser modal */
  function openBrowser(editor, config) {
      injectModalStyles();
      let allTemplates = [];
      let allCategories = [];
      // Resolve template data
      const dataPromise = config.fetch
          ? config.fetch().then((result) => {
              allTemplates = result.templates;
              allCategories = result.categories;
          })
          : Promise.resolve().then(() => {
              allTemplates = config.templates || [];
              const cats = new Set(allTemplates.map((t) => t.category).filter(Boolean));
              allCategories = Array.from(cats).map((c) => ({ id: c, label: c }));
          });
      dataPromise.then(() => {
          renderModal(editor, config, allTemplates, allCategories);
      });
  }
  /** Close and clean up the modal */
  function closeBrowser() {
      const overlay = document.getElementById('sc-overlay');
      if (overlay)
          overlay.remove();
      document.body.classList.remove('modal-open');
  }
  /**
   * Render the modal DOM.
   * Creates overlay, modal with header, sidebar, search, card grid, and preview panel.
   */
  function renderModal(editor, config, templates, categories) {
      const title = config.modalTitle || 'Structured Content';
      const insertMode = config.insertMode || 'both';
      let activeCategory = null;
      let searchQuery = '';
      let selectedTemplate = null;
      // Build overlay
      const overlay = document.createElement('div');
      overlay.className = 'sc-overlay';
      overlay.id = 'sc-overlay';
      // Build modal container
      const modal = document.createElement('div');
      modal.className = 'sc-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-label', title);
      // -- Header --
      const header = document.createElement('div');
      header.className = 'sc-header';
      const h3 = document.createElement('h3');
      h3.textContent = title;
      const closeBtn = document.createElement('button');
      closeBtn.className = 'sc-close';
      closeBtn.setAttribute('aria-label', 'Close');
      closeBtn.innerHTML = '&times;';
      closeBtn.addEventListener('click', closeBrowser);
      header.appendChild(h3);
      header.appendChild(closeBtn);
      // -- Body (sidebar + main) --
      const body = document.createElement('div');
      body.className = 'sc-body';
      // Sidebar
      const sidebar = document.createElement('div');
      sidebar.className = 'sc-sidebar';
      const allBtn = document.createElement('button');
      allBtn.className = 'sc-sidebar-item active';
      allBtn.textContent = 'All';
      allBtn.addEventListener('click', () => {
          activeCategory = null;
          updateSidebarActive();
          renderCards();
      });
      sidebar.appendChild(allBtn);
      categories.forEach((cat) => {
          const btn = document.createElement('button');
          btn.className = 'sc-sidebar-item';
          btn.textContent = cat.label;
          btn.dataset.categoryId = cat.id;
          btn.addEventListener('click', () => {
              activeCategory = cat.id;
              updateSidebarActive();
              renderCards();
          });
          sidebar.appendChild(btn);
      });
      // Main area
      const main = document.createElement('div');
      main.className = 'sc-main';
      // Search bar
      const searchDiv = document.createElement('div');
      searchDiv.className = 'sc-search';
      const searchInput = document.createElement('input');
      searchInput.type = 'text';
      searchInput.placeholder = 'Search templates...';
      searchInput.setAttribute('aria-label', 'Search templates');
      searchInput.addEventListener('input', () => {
          searchQuery = searchInput.value;
          renderCards();
      });
      searchDiv.appendChild(searchInput);
      // Card grid
      const grid = document.createElement('div');
      grid.className = 'sc-grid';
      main.appendChild(searchDiv);
      main.appendChild(grid);
      body.appendChild(sidebar);
      body.appendChild(main);
      // -- Preview panel --
      const preview = document.createElement('div');
      preview.className = 'sc-preview-panel';
      const previewHeader = document.createElement('div');
      previewHeader.className = 'sc-preview-header';
      const previewTitle = document.createElement('h4');
      previewTitle.textContent = '';
      const backBtn = document.createElement('button');
      backBtn.className = 'sc-btn';
      backBtn.textContent = 'Back';
      backBtn.addEventListener('click', hidePreview);
      previewHeader.appendChild(previewTitle);
      previewHeader.appendChild(backBtn);
      const previewContent = document.createElement('div');
      previewContent.className = 'sc-preview-content';
      const previewActions = document.createElement('div');
      previewActions.className = 'sc-preview-actions';
      if (insertMode === 'cursor' || insertMode === 'both') {
          const cursorBtn = document.createElement('button');
          cursorBtn.className = 'sc-btn sc-btn-primary';
          cursorBtn.textContent = 'Insert at cursor';
          cursorBtn.addEventListener('click', () => doInsert('cursor'));
          previewActions.appendChild(cursorBtn);
      }
      if (insertMode === 'document' || insertMode === 'both') {
          const docBtn = document.createElement('button');
          docBtn.className = 'sc-btn';
          docBtn.textContent = 'New document';
          docBtn.addEventListener('click', () => doInsert('document'));
          previewActions.appendChild(docBtn);
      }
      preview.appendChild(previewHeader);
      preview.appendChild(previewContent);
      preview.appendChild(previewActions);
      // Assemble modal
      modal.appendChild(header);
      modal.appendChild(body);
      modal.appendChild(preview);
      overlay.appendChild(modal);
      // Click outside to close
      overlay.addEventListener('click', (e) => {
          if (e.target === overlay)
              closeBrowser();
      });
      // Escape key to close
      const escHandler = (e) => {
          if (e.key === 'Escape') {
              closeBrowser();
              document.removeEventListener('keydown', escHandler);
          }
      };
      document.addEventListener('keydown', escHandler);
      document.body.appendChild(overlay);
      document.body.classList.add('modal-open');
      // Initial render
      renderCards();
      searchInput.focus();
      // -- Helper functions --
      function updateSidebarActive() {
          sidebar.querySelectorAll('.sc-sidebar-item').forEach((btn) => {
              const el = btn;
              const catId = el.dataset.categoryId || null;
              el.classList.toggle('active', catId === activeCategory);
          });
      }
      function renderCards() {
          grid.innerHTML = '';
          const filtered = filterTemplates(templates, activeCategory, searchQuery);
          if (filtered.length === 0) {
              const empty = document.createElement('div');
              empty.className = 'sc-empty';
              empty.textContent = 'No templates found.';
              grid.appendChild(empty);
              return;
          }
          filtered.forEach((tpl) => {
              const card = document.createElement('div');
              card.className = 'sc-card';
              card.tabIndex = 0;
              card.setAttribute('role', 'button');
              card.setAttribute('aria-label', tpl.title);
              const cardTitle = document.createElement('h5');
              cardTitle.className = 'sc-card-title';
              cardTitle.textContent = tpl.title;
              card.appendChild(cardTitle);
              if (tpl.category) {
                  const badge = document.createElement('span');
                  badge.className = 'sc-card-cat';
                  badge.textContent = tpl.category;
                  card.appendChild(badge);
              }
              if (tpl.description) {
                  const desc = document.createElement('p');
                  desc.className = 'sc-card-desc';
                  desc.textContent = tpl.description;
                  card.appendChild(desc);
              }
              card.addEventListener('click', () => showPreview(tpl));
              card.addEventListener('keydown', (e) => {
                  if (e.key === 'Enter')
                      showPreview(tpl);
              });
              grid.appendChild(card);
          });
      }
      function showPreview(tpl) {
          selectedTemplate = tpl;
          previewTitle.textContent = tpl.title;
          previewContent.innerHTML = tpl.content;
          preview.classList.add('active');
          grid.parentElement.style.display = 'none';
      }
      function hidePreview() {
          selectedTemplate = null;
          preview.classList.remove('active');
          grid.parentElement.style.display = '';
      }
      function doInsert(mode) {
          if (!selectedTemplate)
              return;
          if (mode === 'document') {
              const existing = editor.getContent({ format: 'text' }).trim();
              if (existing && !confirm('Replace all editor content with this template?')) {
                  return;
              }
          }
          insertTemplate(editor, selectedTemplate.content, selectedTemplate.id, mode, config);
          closeBrowser();
          activatePlaceholders(editor);
      }
  }

  tinymce.PluginManager.add('structuredcontent', (editor) => {
      var _a, _b;
      const config = editor.options.get('structuredcontent') || {};
      // Register option so TinyMCE knows about our config key
      editor.options.register('structuredcontent', { processor: 'object', default: {} });
      // Toolbar button
      editor.ui.registry.addButton('structuredcontent', {
          icon: 'template',
          tooltip: ((_a = config.strings) === null || _a === void 0 ? void 0 : _a.buttonTooltip) || 'Structured Content',
          onAction: () => openBrowser(editor, config),
      });
      // Menu item
      editor.ui.registry.addMenuItem('structuredcontent', {
          icon: 'template',
          text: ((_b = config.strings) === null || _b === void 0 ? void 0 : _b.menuText) || 'Structured Content',
          onAction: () => openBrowser(editor, config),
      });
  });

})();
