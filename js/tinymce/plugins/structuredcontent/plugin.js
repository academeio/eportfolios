(function () {
    'use strict';

    /** Escape HTML special characters for safe insertion into DOM */
    function escapeHtml$1(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

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
.sc-scope-tabs {
  display: flex;
  border-bottom: 1px solid #dee2e6;
  padding: 0 20px;
}
.sc-scope-tab {
  padding: 8px 16px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.85rem;
  color: #666;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}
.sc-scope-tab:hover { color: #333; }
.sc-scope-tab.active {
  color: #0d6efd;
  border-bottom-color: #0d6efd;
  font-weight: 600;
}
.sc-footer {
  padding: 10px 20px;
  border-top: 1px solid #dee2e6;
  text-align: right;
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
    function insertTemplate(editor, html, templateId, mode, config, templateVersion, templateTitle) {
        const processed = replaceVariables(html, config.variables);
        editor.undoManager.transact(() => {
            if (mode === 'document') {
                editor.setContent(processed);
            }
            else {
                let versionAttr = '';
                if (templateVersion) {
                    versionAttr = ` data-template-version="${escapeHtml(templateVersion)}"`;
                }
                let titleAttr = '';
                if (templateTitle) {
                    titleAttr = ` data-template-title="${escapeHtml(templateTitle)}"`;
                }
                const wrapped = `<div class="sc-template" data-template-id="${escapeHtml(templateId)}"${versionAttr}${titleAttr}>${processed}</div>`;
                editor.insertContent(wrapped);
            }
        });
    }

    /** CSS for widget popovers — injected into the host page */
    const WIDGET_CSS = `
.sc-popover {
  position: absolute;
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 8px 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 100001;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 0.9rem;
}
.sc-popover input,
.sc-popover select {
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.9rem;
}
.sc-popover-error {
  color: #d9534f;
  font-size: 0.8rem;
  margin-top: 4px;
}
`;
    /** Inject widget CSS into a document (idempotent) */
    function injectWidgetStyles(doc) {
        if (doc.getElementById('sc-widget-styles'))
            return;
        const style = doc.createElement('style');
        style.id = 'sc-widget-styles';
        style.textContent = WIDGET_CSS;
        doc.head.appendChild(style);
    }
    /** Close and remove the active popover */
    function closePopover(doc) {
        const existing = doc.querySelector('.sc-popover');
        if (existing)
            existing.remove();
    }
    /** Open a typed popover for a placeholder field */
    function openPopover(doc, field, resolve) {
        closePopover(doc);
        injectWidgetStyles(doc);
        const popover = doc.createElement('div');
        popover.className = 'sc-popover';
        // Position popover near the field element
        const rect = field.element.getBoundingClientRect();
        popover.style.top = `${rect.bottom + 4}px`;
        popover.style.left = `${rect.left}px`;
        const content = createInput(doc, field, popover, resolve);
        popover.appendChild(content);
        doc.body.appendChild(popover);
        // Focus the input
        const input = popover.querySelector('input, select');
        if (input)
            input.focus();
        // Escape to close
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closePopover(doc);
                doc.removeEventListener('keydown', escHandler);
            }
        };
        doc.addEventListener('keydown', escHandler);
        // Click outside to close
        const clickHandler = (e) => {
            if (!popover.contains(e.target)) {
                closePopover(doc);
                doc.removeEventListener('mousedown', clickHandler);
            }
        };
        // Delay to avoid immediate close from the triggering click
        setTimeout(() => doc.addEventListener('mousedown', clickHandler), 0);
    }
    function createInput(doc, field, popover, resolve) {
        switch (field.type) {
            case 'date':
                return createDateInput(doc, field, popover, resolve);
            case 'select':
                return createSelectInput(doc, field, popover, resolve);
            case 'number':
                return createNumberInput(doc, field, popover, resolve);
            default:
                return doc.createElement('span');
        }
    }
    function createDateInput(doc, field, popover, resolve) {
        const input = doc.createElement('input');
        input.type = 'date';
        input.addEventListener('change', () => {
            if (input.value) {
                field.element.textContent = input.value;
                resolve(field);
                closePopover(doc);
            }
        });
        return input;
    }
    function createSelectInput(doc, field, popover, resolve) {
        const select = doc.createElement('select');
        // Placeholder option
        const placeholder = doc.createElement('option');
        placeholder.textContent = 'Choose...';
        placeholder.disabled = true;
        placeholder.selected = true;
        select.appendChild(placeholder);
        (field.options || []).forEach((opt) => {
            const option = doc.createElement('option');
            option.value = opt;
            option.textContent = opt;
            select.appendChild(option);
        });
        select.addEventListener('change', () => {
            if (select.value) {
                field.element.textContent = select.value;
                resolve(field);
                closePopover(doc);
            }
        });
        return select;
    }
    function createNumberInput(doc, field, popover, resolve) {
        const wrapper = doc.createElement('div');
        const input = doc.createElement('input');
        input.type = 'number';
        if (field.min !== undefined)
            input.min = String(field.min);
        if (field.max !== undefined)
            input.max = String(field.max);
        wrapper.appendChild(input);
        input.addEventListener('change', () => {
            // Clear previous error
            const existingError = popover.querySelector('.sc-popover-error');
            if (existingError)
                existingError.remove();
            const val = Number(input.value);
            if (input.value === '')
                return;
            // Range validation
            if (field.min !== undefined && val < field.min) {
                showNumberError(doc, popover, field.min, field.max);
                return;
            }
            if (field.max !== undefined && val > field.max) {
                showNumberError(doc, popover, field.min, field.max);
                return;
            }
            field.element.textContent = input.value;
            resolve(field);
            closePopover(doc);
        });
        return wrapper;
    }
    function showNumberError(doc, popover, min, max) {
        const existing = popover.querySelector('.sc-popover-error');
        if (existing)
            existing.remove();
        const error = doc.createElement('div');
        error.className = 'sc-popover-error';
        if (min !== undefined && max !== undefined) {
            error.textContent = `Value must be between ${min} and ${max}`;
        }
        else if (min !== undefined) {
            error.textContent = `Value must be at least ${min}`;
        }
        else if (max !== undefined) {
            error.textContent = `Value must be at most ${max}`;
        }
        popover.appendChild(error);
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
.tmpl-field-error {
  background: #fde8e8;
  border: 1px solid #d9534f;
  border-left: 3px solid #d9534f;
  animation: sc-shake 0.3s ease-in-out;
}
@keyframes sc-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px); }
  75% { transform: translateX(3px); }
}
.sc-validation-toast {
  position: fixed;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: #d9534f;
  color: #fff;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 0.85rem;
  z-index: 10000;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.tmpl-field[data-type="date"],
.tmpl-field[data-type="select"],
.tmpl-field[data-type="number"] {
  cursor: pointer;
  border-style: solid;
}
.tmpl-field[data-linked] {
  background: #e0f0e8;
  border-color: #6ab089;
}
`;
    /** Find all placeholder fields in a document and return metadata */
    function findPlaceholderFields(doc) {
        const elements = doc.querySelectorAll('.tmpl-field');
        return Array.from(elements).map((el) => {
            const typeAttr = el.getAttribute('data-type');
            const type = (typeAttr === 'date' || typeAttr === 'select' || typeAttr === 'number') ? typeAttr : 'text';
            const optionsAttr = el.getAttribute('data-options');
            const minAttr = el.getAttribute('data-min');
            const maxAttr = el.getAttribute('data-max');
            return {
                element: el,
                name: el.getAttribute('data-field') || '',
                defaultText: (el.textContent || '').trim(),
                required: el.getAttribute('data-required') === 'true',
                resolved: false,
                type,
                options: optionsAttr ? optionsAttr.split('|') : undefined,
                min: minAttr !== null ? Number(minAttr) : undefined,
                max: maxAttr !== null ? Number(maxAttr) : undefined,
            };
        });
    }
    /** Check if a field's text has changed from its default and strip placeholder markup if so */
    function resolveField(field, fields) {
        const currentText = (field.element.textContent || '').trim();
        if (currentText === field.defaultText)
            return;
        // Read name before stripping attributes
        const fieldName = field.name;
        field.resolved = true;
        field.element.classList.remove('tmpl-field');
        field.element.removeAttribute('data-field');
        field.element.removeAttribute('data-required');
        field.element.removeAttribute('data-type');
        field.element.removeAttribute('data-options');
        field.element.removeAttribute('data-min');
        field.element.removeAttribute('data-max');
        field.element.removeAttribute('data-linked');
        // Propagate to linked fields (same name, first-fill only)
        if (fields && fieldName) {
            fields.forEach((sibling) => {
                if (sibling !== field && !sibling.resolved && sibling.name === fieldName) {
                    sibling.element.textContent = currentText;
                    resolveField(sibling); // no fields param = no further propagation
                }
            });
        }
    }
    /** Return all required fields that have not been resolved */
    function getUnresolvedRequired(doc) {
        return findPlaceholderFields(doc).filter((f) => f.required && !f.resolved);
    }
    /** Add error styling to all unresolved required fields */
    function highlightUnresolved(doc) {
        const unresolvedRequired = getUnresolvedRequired(doc);
        unresolvedRequired.forEach((f) => f.element.classList.add('tmpl-field-error'));
        return unresolvedRequired;
    }
    /** Remove error styling from all placeholder fields */
    function clearValidationErrors(doc) {
        doc.querySelectorAll('.tmpl-field-error').forEach((el) => {
            el.classList.remove('tmpl-field-error');
        });
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
    /** Show a validation toast notification in the document */
    function showValidationToast(doc, count) {
        // Remove existing toast
        const existing = doc.querySelector('.sc-validation-toast');
        if (existing)
            existing.remove();
        const toast = doc.createElement('div');
        toast.className = 'sc-validation-toast';
        toast.textContent = `${count} required field(s) need to be filled`;
        doc.body.appendChild(toast);
        // Auto-dismiss after 5 seconds
        setTimeout(() => toast.remove(), 5000);
        // Dismiss when a placeholder field receives focus
        const dismissOnFocus = () => {
            toast.remove();
            doc.removeEventListener('focusin', dismissOnFocus);
        };
        doc.addEventListener('focusin', (e) => {
            var _a, _b;
            if ((_b = (_a = e.target) === null || _a === void 0 ? void 0 : _a.classList) === null || _b === void 0 ? void 0 : _b.contains('tmpl-field')) {
                dismissOnFocus();
            }
        });
    }
    /**
     * Activate placeholder system on an editor.
     * Call after inserting a template. Sets up Tab navigation and field resolution.
     */
    function activatePlaceholders(editor, config) {
        const doc = editor.getDoc();
        injectPlaceholderStyles(doc);
        if (typeof document !== 'undefined') {
            injectWidgetStyles(document);
        }
        const fields = findPlaceholderFields(doc);
        if (fields.length === 0)
            return;
        // Stamp data-default on each field so extractFieldValues can compare later
        fields.forEach((f) => {
            if (!f.element.getAttribute('data-default')) {
                f.element.setAttribute('data-default', (f.element.textContent || '').trim());
            }
        });
        // Mark linked fields (same data-field name appears 2+ times)
        const nameCounts = new Map();
        fields.forEach((f) => nameCounts.set(f.name, (nameCounts.get(f.name) || 0) + 1));
        fields.forEach((f) => {
            if ((nameCounts.get(f.name) || 0) >= 2) {
                f.element.setAttribute('data-linked', 'true');
            }
        });
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
            resolveField(currentField, fields);
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
                    resolveField(field, fields);
                }
            });
        });
        // Click handler for typed fields — open widget popover
        fields.forEach((field) => {
            if (field.type !== 'text') {
                field.element.addEventListener('click', () => {
                    openPopover(document, field, (f) => resolveField(f, fields));
                });
            }
        });
        // Validation on content extraction (warn mode)
        if ((config === null || config === void 0 ? void 0 : config.validation) === 'warn') {
            editor.on('BeforeGetContent', () => {
                const currentDoc = editor.getDoc();
                const unresolvedRequired = getUnresolvedRequired(currentDoc);
                if (unresolvedRequired.length > 0) {
                    highlightUnresolved(currentDoc);
                    editor.selection.select(unresolvedRequired[0].element, true);
                    showValidationToast(currentDoc, unresolvedRequired.length);
                }
                else {
                    clearValidationErrors(currentDoc);
                }
            });
        }
    }

    /**
     * Compute metrics for the current template in the editor.
     * Returns null if no .sc-template wrapper is present.
     */
    function getTemplateMetrics(editor) {
        const doc = editor.getDoc();
        const wrapper = doc.querySelector('.sc-template[data-template-id]');
        if (!wrapper)
            return null;
        const fields = findPlaceholderFields(doc);
        const totalFields = fields.length;
        const resolvedFields = fields.filter((f) => f.resolved).length;
        const requiredFields = fields.filter((f) => f.required).length;
        const unresolvedRequired = fields.filter((f) => f.required && !f.resolved).length;
        const completionPercentage = totalFields === 0 ? 100 : Math.round((resolvedFields / totalFields) * 100);
        const fieldBreakdown = fields.map((f) => ({
            name: f.name,
            type: f.type,
            required: f.required,
            resolved: f.resolved,
        }));
        return {
            totalFields,
            requiredFields,
            resolvedFields,
            unresolvedRequired,
            completionPercentage,
            fieldBreakdown,
        };
    }
    /**
     * Fire a template_inserted analytics event.
     * Called from browser.ts after insertTemplate().
     */
    function fireInsertionEvent(editor, config, template, mode) {
        if (!config.onAnalyticsEvent)
            return;
        const doc = editor.getDoc();
        const fields = findPlaceholderFields(doc);
        const event = {
            type: 'template_inserted',
            templateId: template.id,
            templateTitle: template.title,
            templateVersion: template.version,
            timestamp: Date.now(),
            insertionMode: mode,
            fieldCount: fields.length,
            requiredFieldCount: fields.filter((f) => f.required).length,
        };
        config.onAnalyticsEvent(event);
    }
    /**
     * Fire a template_submitted analytics event.
     * Called from plugin.ts in BeforeGetContent handler.
     */
    function fireSubmissionEvent(editor, config) {
        if (!config.onAnalyticsEvent)
            return;
        const doc = editor.getDoc();
        const wrapper = doc.querySelector('.sc-template[data-template-id]');
        if (!wrapper)
            return;
        const metrics = getTemplateMetrics(editor);
        if (!metrics)
            return;
        const event = {
            type: 'template_submitted',
            templateId: wrapper.getAttribute('data-template-id'),
            templateTitle: wrapper.getAttribute('data-template-title') || '',
            templateVersion: wrapper.getAttribute('data-template-version') || undefined,
            timestamp: Date.now(),
            metrics,
        };
        config.onAnalyticsEvent(event);
    }

    /** CSS for the template authoring modal */
    const AUTHORING_CSS = `
.sc-authoring-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 100001;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 30px;
}
.sc-authoring-modal {
  background: #fff;
  border-radius: 8px;
  width: 960px;
  max-width: 95vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}
.sc-authoring-header {
  padding: 15px 20px;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.sc-authoring-header h3 { margin: 0; font-size: 1.1rem; }
.sc-authoring-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}
.sc-authoring-left {
  flex: 1;
  padding: 15px 20px;
  overflow-y: auto;
  border-right: 1px solid #dee2e6;
}
.sc-authoring-right {
  width: 380px;
  flex-shrink: 0;
  overflow-y: auto;
}
.sc-authoring-meta {
  margin-bottom: 15px;
}
.sc-authoring-meta label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 3px;
  color: #555;
}
.sc-authoring-meta input,
.sc-authoring-meta textarea,
.sc-authoring-meta select {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.9rem;
  margin-bottom: 10px;
}
.sc-authoring-meta textarea { resize: vertical; min-height: 60px; }
.sc-authoring-editor {
  display: flex;
  flex-direction: column;
  flex: 1;
}
.sc-authoring-preview {
  padding: 15px 20px;
}
.sc-authoring-preview h4 {
  margin: 0 0 10px;
  font-size: 0.9rem;
  color: #555;
}
.sc-authoring-preview-content {
  background: #fafafa;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 15px;
  min-height: 200px;
}
.sc-authoring-footer {
  padding: 12px 20px;
  border-top: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.sc-authoring-scope {
  display: flex;
  gap: 16px;
  align-items: center;
}
.sc-authoring-scope label {
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}
`;
    /** Inject authoring CSS into a document (idempotent) */
    function injectAuthoringStyles(doc) {
        if (doc.getElementById('sc-authoring-styles'))
            return;
        const style = doc.createElement('style');
        style.id = 'sc-authoring-styles';
        style.textContent = AUTHORING_CSS;
        doc.head.appendChild(style);
    }

    let blockCounter = 0;
    /** Generate a unique block ID */
    function nextId() {
        return `blk_${++blockCounter}`;
    }
    /** Convert a label string to a snake_case field name */
    function autoSlug(label) {
        return label
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .trim()
            .replace(/\s+/g, '_')
            .replace(/_+/g, '_');
    }
    /** Create a new block with sensible defaults */
    function createBlock(type) {
        const id = nextId();
        switch (type) {
            case 'heading':
                return { id, type, level: 3, text: 'Section Title' };
            case 'paragraph':
                return { id, type, text: 'Enter instructions or description here.' };
            case 'text-field':
                return { id, type, name: 'text_field', label: 'Text Field', placeholder: 'Enter text', required: false };
            case 'date-field':
                return { id, type, name: 'date_field', label: 'Date Field', placeholder: 'Select date', required: false };
            case 'select-field':
                return { id, type, name: 'select_field', label: 'Select Field', placeholder: 'Choose option', required: false, options: ['Option 1', 'Option 2'] };
            case 'number-field':
                return { id, type, name: 'number_field', label: 'Number Field', placeholder: 'Enter number', required: false };
        }
    }
    const esc = escapeHtml$1;
    /** Build the tmpl-field span for a field block */
    function fieldSpan(name, type, placeholder, required, extras = '') {
        let attrs = `class="tmpl-field" data-field="${esc(name)}" data-type="${type}"`;
        if (required)
            attrs += ' data-required="true"';
        if (extras)
            attrs += ' ' + extras;
        return `<span ${attrs}>${esc(placeholder)}</span>`;
    }
    /** Convert block model array to template HTML */
    function modelToHTML(blocks) {
        if (blocks.length === 0)
            return '<div class="sc-template"></div>';
        const parts = blocks.map((block) => {
            switch (block.type) {
                case 'heading':
                    return `<h${block.level}>${esc(block.text)}</h${block.level}>`;
                case 'paragraph':
                    return `<p>${esc(block.text)}</p>`;
                case 'text-field':
                    return `<div class="sc-field-row"><label>${esc(block.label)}</label>${fieldSpan(block.name, 'text', block.placeholder, block.required)}</div>`;
                case 'date-field':
                    return `<div class="sc-field-row"><label>${esc(block.label)}</label>${fieldSpan(block.name, 'date', block.placeholder, block.required)}</div>`;
                case 'select-field': {
                    const optAttr = `data-options="${esc(block.options.join(','))}"`;
                    return `<div class="sc-field-row"><label>${esc(block.label)}</label>${fieldSpan(block.name, 'select', block.placeholder, block.required, optAttr)}</div>`;
                }
                case 'number-field': {
                    let extras = '';
                    if (block.min !== undefined)
                        extras += `data-min="${block.min}"`;
                    if (block.max !== undefined)
                        extras += `${extras ? ' ' : ''}data-max="${block.max}"`;
                    return `<div class="sc-field-row"><label>${esc(block.label)}</label>${fieldSpan(block.name, 'number', block.placeholder, block.required, extras)}</div>`;
                }
            }
        });
        return `<div class="sc-template">${parts.join('')}</div>`;
    }

    /** CSS for the block-based template builder */
    const BUILDER_CSS = `
.sc-builder-palette {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px 0;
  border-bottom: 1px solid #dee2e6;
  margin-bottom: 10px;
}
.sc-builder-palette button {
  padding: 4px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #f8f9fa;
  cursor: pointer;
  font-size: 0.78rem;
  color: #333;
}
.sc-builder-palette button:hover {
  background: #e9ecef;
  border-color: #0d6efd;
}
.sc-builder-canvas {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}
.sc-builder-empty {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-size: 0.85rem;
}
.sc-block-card {
  border: 1px solid #dee2e6;
  border-radius: 6px;
  margin-bottom: 8px;
  background: #fff;
  transition: border-color 0.15s;
}
.sc-block-card.selected {
  border-color: #0d6efd;
}
.sc-block-header {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  cursor: pointer;
  gap: 8px;
}
.sc-block-type {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #666;
  background: #e9ecef;
  padding: 1px 6px;
  border-radius: 3px;
  flex-shrink: 0;
}
.sc-block-summary {
  flex: 1;
  font-size: 0.85rem;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sc-block-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}
.sc-block-actions button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  color: #666;
  padding: 2px 5px;
  border-radius: 3px;
}
.sc-block-actions button:hover {
  background: #e9ecef;
  color: #333;
}
.sc-block-actions button:disabled {
  opacity: 0.3;
  cursor: default;
}
.sc-block-body {
  display: none;
  padding: 8px 10px 12px;
  border-top: 1px solid #eee;
}
.sc-block-card.selected .sc-block-body {
  display: block;
}
.sc-block-body label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: #555;
  margin-bottom: 2px;
  margin-top: 8px;
}
.sc-block-body label:first-child {
  margin-top: 0;
}
.sc-block-body input[type="text"],
.sc-block-body input[type="number"],
.sc-block-body select {
  width: 100%;
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.85rem;
}
.sc-block-body .sc-checkbox-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
}
.sc-block-body .sc-checkbox-row input[type="checkbox"] {
  margin: 0;
}
.sc-block-body .sc-checkbox-row label {
  margin: 0;
  font-weight: normal;
}
`;
    /** Inject builder CSS into a document (idempotent) */
    function injectBuilderStyles(doc) {
        if (doc.getElementById('sc-builder-styles'))
            return;
        const style = doc.createElement('style');
        style.id = 'sc-builder-styles';
        style.textContent = BUILDER_CSS;
        doc.head.appendChild(style);
    }

    const PALETTE_ITEMS = [
        { type: 'heading', label: '+Heading' },
        { type: 'paragraph', label: '+Paragraph' },
        { type: 'text-field', label: '+Text' },
        { type: 'date-field', label: '+Date' },
        { type: 'select-field', label: '+Select' },
        { type: 'number-field', label: '+Number' },
    ];
    /** Get display summary for a collapsed block card header */
    function getBlockSummary(block) {
        switch (block.type) {
            case 'heading':
                return block.text;
            case 'paragraph':
                return block.text.length > 50 ? block.text.slice(0, 50) + '...' : block.text;
            case 'text-field':
            case 'date-field':
            case 'select-field':
            case 'number-field':
                return block.label || block.name;
        }
    }
    /** Create a label + text input field and append to parent */
    function addTextField(parent, doc, labelText, value, onInput) {
        const lbl = doc.createElement('label');
        lbl.textContent = labelText;
        parent.appendChild(lbl);
        const input = doc.createElement('input');
        input.type = 'text';
        input.value = value;
        input.addEventListener('input', () => onInput(input.value));
        parent.appendChild(input);
        return input;
    }
    /** Create a label + number input field and append to parent */
    function addNumberField(parent, doc, labelText, value, onInput) {
        const lbl = doc.createElement('label');
        lbl.textContent = labelText;
        parent.appendChild(lbl);
        const input = doc.createElement('input');
        input.type = 'number';
        if (value !== undefined)
            input.value = String(value);
        input.addEventListener('input', () => {
            const v = input.value.trim();
            onInput(v === '' ? undefined : Number(v));
        });
        parent.appendChild(input);
        return input;
    }
    /** Create a label + select dropdown and append to parent */
    function addSelectField(parent, doc, labelText, options, currentValue, onChange) {
        const lbl = doc.createElement('label');
        lbl.textContent = labelText;
        parent.appendChild(lbl);
        const select = doc.createElement('select');
        for (const opt of options) {
            const option = doc.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            if (opt.value === currentValue)
                option.selected = true;
            select.appendChild(option);
        }
        select.addEventListener('change', () => onChange(select.value));
        parent.appendChild(select);
        return select;
    }
    /** Create a checkbox row and append to parent */
    function addCheckbox(parent, doc, labelText, checked, onChange) {
        const row = doc.createElement('div');
        row.className = 'sc-checkbox-row';
        const input = doc.createElement('input');
        input.type = 'checkbox';
        input.checked = checked;
        input.addEventListener('change', () => onChange(input.checked));
        row.appendChild(input);
        const lbl = doc.createElement('label');
        lbl.textContent = labelText;
        row.appendChild(lbl);
        parent.appendChild(row);
        return input;
    }
    /**
     * Render the block-based template builder into a container.
     *
     * @param container - DOM element to render into
     * @param doc - Document to create elements in
     * @param onChange - Called with a copy of the blocks array on every change
     */
    function renderBuilder(container, doc, onChange) {
        injectBuilderStyles(doc);
        const blocks = [];
        let selectedId = null;
        const manualNames = new Set();
        function notify() {
            onChange([...blocks]);
        }
        // -- Palette --
        const palette = doc.createElement('div');
        palette.className = 'sc-builder-palette';
        for (const item of PALETTE_ITEMS) {
            const btn = doc.createElement('button');
            btn.type = 'button';
            btn.textContent = item.label;
            btn.addEventListener('click', () => {
                const block = createBlock(item.type);
                blocks.push(block);
                selectedId = block.id;
                renderCanvas();
                notify();
            });
            palette.appendChild(btn);
        }
        container.appendChild(palette);
        // -- Canvas --
        const canvas = doc.createElement('div');
        canvas.className = 'sc-builder-canvas';
        container.appendChild(canvas);
        function renderCanvas() {
            canvas.innerHTML = '';
            if (blocks.length === 0) {
                const empty = doc.createElement('div');
                empty.className = 'sc-builder-empty';
                empty.textContent = 'Click a component above to start building your template.';
                canvas.appendChild(empty);
                return;
            }
            for (let i = 0; i < blocks.length; i++) {
                const block = blocks[i];
                const isSelected = block.id === selectedId;
                const card = doc.createElement('div');
                card.className = 'sc-block-card' + (isSelected ? ' selected' : '');
                // -- Header --
                const header = doc.createElement('div');
                header.className = 'sc-block-header';
                const typeBadge = doc.createElement('span');
                typeBadge.className = 'sc-block-type';
                typeBadge.textContent = block.type;
                header.appendChild(typeBadge);
                const summary = doc.createElement('span');
                summary.className = 'sc-block-summary';
                summary.textContent = getBlockSummary(block);
                header.appendChild(summary);
                // Action buttons
                const actions = doc.createElement('span');
                actions.className = 'sc-block-actions';
                // Move up
                const moveUpBtn = doc.createElement('button');
                moveUpBtn.type = 'button';
                moveUpBtn.textContent = '\u25B2';
                moveUpBtn.disabled = i === 0;
                moveUpBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (i > 0) {
                        const tmp = blocks[i - 1];
                        blocks[i - 1] = blocks[i];
                        blocks[i] = tmp;
                        renderCanvas();
                        notify();
                    }
                });
                actions.appendChild(moveUpBtn);
                // Move down
                const moveDownBtn = doc.createElement('button');
                moveDownBtn.type = 'button';
                moveDownBtn.textContent = '\u25BC';
                moveDownBtn.disabled = i === blocks.length - 1;
                moveDownBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (i < blocks.length - 1) {
                        const tmp = blocks[i + 1];
                        blocks[i + 1] = blocks[i];
                        blocks[i] = tmp;
                        renderCanvas();
                        notify();
                    }
                });
                actions.appendChild(moveDownBtn);
                // Delete
                const delBtn = doc.createElement('button');
                delBtn.type = 'button';
                delBtn.textContent = '\u2715';
                delBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    manualNames.delete(block.id);
                    blocks.splice(i, 1);
                    if (selectedId === block.id) {
                        selectedId = null;
                    }
                    renderCanvas();
                    notify();
                });
                actions.appendChild(delBtn);
                header.appendChild(actions);
                header.addEventListener('click', () => {
                    selectedId = selectedId === block.id ? null : block.id;
                    renderCanvas();
                });
                card.appendChild(header);
                // -- Body (inline editor) --
                const body = doc.createElement('div');
                body.className = 'sc-block-body';
                renderBlockEditor(body, doc, block, summary);
                card.appendChild(body);
                canvas.appendChild(card);
            }
        }
        function renderBlockEditor(body, doc, block, summaryEl) {
            /** Update the header summary text to reflect current block state */
            function updateSummary() {
                summaryEl.textContent = getBlockSummary(block);
            }
            switch (block.type) {
                case 'heading': {
                    addSelectField(body, doc, 'Level', [
                        { value: '2', label: 'H2' },
                        { value: '3', label: 'H3' },
                        { value: '4', label: 'H4' },
                    ], String(block.level), (val) => {
                        block.level = Number(val);
                        notify();
                    });
                    addTextField(body, doc, 'Text', block.text, (val) => {
                        block.text = val;
                        updateSummary();
                        notify();
                    });
                    break;
                }
                case 'paragraph': {
                    addTextField(body, doc, 'Text', block.text, (val) => {
                        block.text = val;
                        updateSummary();
                        notify();
                    });
                    break;
                }
                case 'text-field':
                case 'date-field':
                case 'number-field':
                case 'select-field': {
                    const fBlock = block;
                    // Name input ref needed by label callback for auto-slug sync
                    let nameInputEl = null;
                    // Label
                    addTextField(body, doc, 'Label', fBlock.label, (val) => {
                        fBlock.label = val;
                        if (!manualNames.has(block.id) && nameInputEl) {
                            fBlock.name = autoSlug(val);
                            nameInputEl.value = fBlock.name;
                        }
                        updateSummary();
                        notify();
                    });
                    // Name
                    nameInputEl = addTextField(body, doc, 'Name', fBlock.name, (val) => {
                        manualNames.add(block.id);
                        fBlock.name = val;
                        notify();
                    });
                    // Placeholder
                    addTextField(body, doc, 'Placeholder', fBlock.placeholder, (val) => {
                        fBlock.placeholder = val;
                        notify();
                    });
                    // Required
                    addCheckbox(body, doc, 'Required', fBlock.required, (val) => {
                        fBlock.required = val;
                        notify();
                    });
                    // Type-specific extras
                    if (block.type === 'select-field') {
                        const sBlock = block;
                        addTextField(body, doc, 'Options (comma-separated)', sBlock.options.join(', '), (val) => {
                            sBlock.options = val.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
                            notify();
                        });
                    }
                    if (block.type === 'number-field') {
                        const nBlock = block;
                        addNumberField(body, doc, 'Min', nBlock.min, (val) => {
                            nBlock.min = val;
                            notify();
                        });
                        addNumberField(body, doc, 'Max', nBlock.max, (val) => {
                            nBlock.max = val;
                            notify();
                        });
                    }
                    break;
                }
            }
        }
        // Initial render
        renderCanvas();
    }

    /** Open the template authoring modal */
    function openAuthoring(config, categories) {
        injectAuthoringStyles(document);
        let currentBlocks = [];
        let debounceTimer;
        // -- Overlay --
        const overlay = document.createElement('div');
        overlay.className = 'sc-authoring-overlay';
        overlay.id = 'sc-authoring-overlay';
        // -- Modal --
        const modal = document.createElement('div');
        modal.className = 'sc-authoring-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-label', 'Create Template');
        // -- Header --
        const header = document.createElement('div');
        header.className = 'sc-authoring-header';
        const h3 = document.createElement('h3');
        h3.textContent = 'Create Template';
        const closeBtn = document.createElement('button');
        closeBtn.className = 'sc-close';
        closeBtn.setAttribute('aria-label', 'Close');
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', closeAuthoring);
        header.appendChild(h3);
        header.appendChild(closeBtn);
        // -- Body --
        const body = document.createElement('div');
        body.className = 'sc-authoring-body';
        // Left pane: metadata + builder
        const left = document.createElement('div');
        left.className = 'sc-authoring-left';
        // Metadata fields
        const meta = document.createElement('div');
        meta.className = 'sc-authoring-meta';
        const titleLabel = document.createElement('label');
        titleLabel.textContent = 'Title';
        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.placeholder = 'Template title';
        const descLabel = document.createElement('label');
        descLabel.textContent = 'Description';
        const descInput = document.createElement('textarea');
        descInput.placeholder = 'Brief description';
        const catLabel = document.createElement('label');
        catLabel.textContent = 'Category';
        const catSelect = document.createElement('select');
        const defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.textContent = 'Select category...';
        catSelect.appendChild(defaultOpt);
        categories.forEach((cat) => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = cat.label;
            catSelect.appendChild(opt);
        });
        meta.appendChild(titleLabel);
        meta.appendChild(titleInput);
        meta.appendChild(descLabel);
        meta.appendChild(descInput);
        meta.appendChild(catLabel);
        meta.appendChild(catSelect);
        // Builder area (replaces TinyMCE)
        const builderDiv = document.createElement('div');
        builderDiv.className = 'sc-authoring-editor';
        left.appendChild(meta);
        left.appendChild(builderDiv);
        // Right pane: live preview
        const right = document.createElement('div');
        right.className = 'sc-authoring-right';
        const previewSection = document.createElement('div');
        previewSection.className = 'sc-authoring-preview';
        const previewH4 = document.createElement('h4');
        previewH4.textContent = 'Live Preview';
        const previewContent = document.createElement('div');
        previewContent.className = 'sc-authoring-preview-content';
        const previewStyle = document.createElement('style');
        previewStyle.textContent = PLACEHOLDER_CSS;
        previewSection.appendChild(previewH4);
        previewSection.appendChild(previewContent);
        right.appendChild(previewStyle);
        right.appendChild(previewSection);
        body.appendChild(left);
        body.appendChild(right);
        // -- Footer: scope + save --
        const footer = document.createElement('div');
        footer.className = 'sc-authoring-footer';
        const scopeDiv = document.createElement('div');
        scopeDiv.className = 'sc-authoring-scope';
        const savableScopes = (config.scopes || ['personal']).filter((s) => s !== 'site');
        savableScopes.forEach((scope, i) => {
            const label = document.createElement('label');
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'sc-authoring-scope';
            radio.value = scope;
            if (i === 0)
                radio.checked = true;
            const scopeLabels = { personal: 'Personal', group: 'Group' };
            label.appendChild(radio);
            label.appendChild(document.createTextNode(' ' + (scopeLabels[scope] || scope)));
            scopeDiv.appendChild(label);
        });
        const saveBtn = document.createElement('button');
        saveBtn.className = 'sc-btn sc-btn-primary';
        saveBtn.textContent = 'Save';
        saveBtn.addEventListener('click', async () => {
            const titleVal = titleInput.value.trim();
            if (!titleVal) {
                titleInput.style.borderColor = '#d9534f';
                titleInput.focus();
                return;
            }
            const description = descInput.value.trim();
            const category = catSelect.value;
            const content = modelToHTML(currentBlocks);
            const scopeRadio = document.querySelector('input[name="sc-authoring-scope"]:checked');
            const scope = ((scopeRadio === null || scopeRadio === void 0 ? void 0 : scopeRadio.value) || 'personal');
            const draft = { title: titleVal, description, content, category };
            if (config.onSave) {
                try {
                    await config.onSave(draft, scope);
                    closeAuthoring();
                }
                catch (err) {
                    console.error('Failed to save template:', err);
                }
            }
        });
        footer.appendChild(scopeDiv);
        footer.appendChild(saveBtn);
        // Assemble modal
        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        overlay.appendChild(modal);
        // Click outside to close
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay)
                closeAuthoring();
        });
        // Escape to close
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeAuthoring();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        document.body.appendChild(overlay);
        // -- Initialize builder --
        renderBuilder(builderDiv, document, (blocks) => {
            currentBlocks = blocks;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                previewContent.innerHTML = modelToHTML(blocks);
            }, 300);
        });
        titleInput.focus();
    }
    /** Close the authoring modal */
    function closeAuthoring() {
        const overlay = document.getElementById('sc-authoring-overlay');
        if (overlay)
            overlay.remove();
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
        var _a;
        injectModalStyles();
        let allTemplates = [];
        let allCategories = [];
        // Resolve template data
        const initialScope = (_a = config.scopes) === null || _a === void 0 ? void 0 : _a[0];
        const dataPromise = config.fetch
            ? config.fetch(undefined, initialScope).then((result) => {
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
    function renderModal(editor, config, initialTemplates, initialCategories) {
        var _a;
        const title = config.modalTitle || 'Structured Content';
        const insertMode = config.insertMode || 'both';
        let activeCategory = null;
        let searchQuery = '';
        let selectedTemplate = null;
        let templates = initialTemplates;
        let categories = initialCategories;
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
        let activeScope = ((_a = config.scopes) === null || _a === void 0 ? void 0 : _a[0]) || 'site';
        // -- Scope tabs (only when 2+ scopes) --
        let scopeTabsEl = null;
        if (config.scopes && config.scopes.length >= 2) {
            scopeTabsEl = document.createElement('div');
            scopeTabsEl.className = 'sc-scope-tabs';
            const scopeLabels = {
                personal: 'My Templates',
                group: 'Group',
                site: 'Site',
            };
            config.scopes.forEach((scope) => {
                const tab = document.createElement('button');
                tab.className = 'sc-scope-tab' + (scope === activeScope ? ' active' : '');
                tab.textContent = scopeLabels[scope] || scope;
                tab.dataset.scope = scope;
                tab.addEventListener('click', () => {
                    activeScope = scope;
                    updateScopeTabsActive();
                    if (config.fetch) {
                        config.fetch(searchQuery || undefined, scope).then((result) => {
                            templates = result.templates;
                            categories = result.categories;
                            rebuildSidebar();
                            renderCards();
                        });
                    }
                });
                scopeTabsEl.appendChild(tab);
            });
        }
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
        // -- Footer (only when enableAuthoring is true) --
        let footerEl = null;
        if (config.enableAuthoring) {
            footerEl = document.createElement('div');
            footerEl.className = 'sc-footer';
            const createBtn = document.createElement('button');
            createBtn.className = 'sc-btn sc-btn-primary';
            createBtn.textContent = '+ Create Template';
            createBtn.addEventListener('click', () => {
                closeBrowser();
                openAuthoring(config, categories);
            });
            footerEl.appendChild(createBtn);
        }
        // Assemble modal
        modal.appendChild(header);
        if (scopeTabsEl)
            modal.appendChild(scopeTabsEl);
        modal.appendChild(body);
        if (footerEl)
            modal.appendChild(footerEl);
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
        function updateScopeTabsActive() {
            if (!scopeTabsEl)
                return;
            scopeTabsEl.querySelectorAll('.sc-scope-tab').forEach((btn) => {
                const el = btn;
                el.classList.toggle('active', el.dataset.scope === activeScope);
            });
        }
        function rebuildSidebar() {
            sidebar.innerHTML = '';
            activeCategory = null;
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
        }
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
            insertTemplate(editor, selectedTemplate.content, selectedTemplate.id, mode, config, selectedTemplate.version, selectedTemplate.title);
            closeBrowser();
            activatePlaceholders(editor, config);
            fireInsertionEvent(editor, config, selectedTemplate, mode);
        }
    }

    /** CSS for the version update banner */
    const VERSIONING_CSS = `
.sc-version-banner {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 4px;
  padding: 10px 16px;
  margin: 0 0 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #664d03;
}
.sc-version-banner-text {
  flex: 1;
}
.sc-version-banner-actions {
  display: flex;
  gap: 8px;
  margin-left: 12px;
}
.sc-version-banner-actions button {
  padding: 4px 12px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.8rem;
}
.sc-version-update {
  background: #0d6efd;
  color: #fff;
  border: 1px solid #0d6efd;
}
.sc-version-update:hover {
  background: #0b5ed7;
}
.sc-version-dismiss {
  background: transparent;
  color: #664d03;
  border: 1px solid #ffc107;
}
`;
    /** Inject versioning CSS into a document (idempotent) */
    function injectVersioningStyles(doc) {
        if (doc.getElementById('sc-versioning-styles'))
            return;
        const style = doc.createElement('style');
        style.id = 'sc-versioning-styles';
        style.textContent = VERSIONING_CSS;
        doc.head.appendChild(style);
    }
    /** Remove the version banner from the document */
    function dismissVersionBanner(doc) {
        const banner = doc.querySelector('.sc-version-banner');
        if (banner)
            banner.remove();
    }
    /** Show a version update banner at the top of the document */
    function showVersionBanner(doc, templateName, onUpdate, onDismiss) {
        dismissVersionBanner(doc);
        injectVersioningStyles(doc);
        const banner = doc.createElement('div');
        banner.className = 'sc-version-banner';
        banner.setAttribute('contenteditable', 'false');
        const text = doc.createElement('span');
        text.className = 'sc-version-banner-text';
        text.textContent = `This document uses an older version of "\u200B${templateName}\u200B". A newer version is available.`;
        const actions = doc.createElement('div');
        actions.className = 'sc-version-banner-actions';
        const updateBtn = doc.createElement('button');
        updateBtn.className = 'sc-version-update';
        updateBtn.textContent = 'Update';
        updateBtn.addEventListener('click', onUpdate);
        const dismissBtn = doc.createElement('button');
        dismissBtn.className = 'sc-version-dismiss';
        dismissBtn.textContent = '\u2715';
        dismissBtn.setAttribute('aria-label', 'Dismiss');
        dismissBtn.addEventListener('click', onDismiss);
        actions.appendChild(updateBtn);
        actions.appendChild(dismissBtn);
        banner.appendChild(text);
        banner.appendChild(actions);
        doc.body.insertBefore(banner, doc.body.firstChild);
    }
    /** Extract current values from unresolved placeholder fields (for migration) */
    function extractFieldValues(doc) {
        const fields = findPlaceholderFields(doc);
        const values = new Map();
        fields.forEach((field) => {
            const text = (field.element.textContent || '').trim();
            const defaultText = field.element.getAttribute('data-default') || field.defaultText;
            if (text !== defaultText) {
                values.set(field.name, text);
            }
        });
        return values;
    }
    /** Check if the editor content uses an outdated template version */
    async function checkForUpdates(editor, config) {
        if (!config.checkVersion)
            return;
        const doc = editor.getDoc();
        const wrapper = doc.querySelector('.sc-template[data-template-id][data-template-version]');
        if (!wrapper)
            return;
        const templateId = wrapper.getAttribute('data-template-id');
        const currentVersion = wrapper.getAttribute('data-template-version');
        const result = await config.checkVersion(templateId, currentVersion);
        if (!result)
            return;
        showVersionBanner(doc, result.latestTemplate.title, () => migrateTemplate(editor, config, wrapper, result), () => dismissVersionBanner(doc));
    }
    /** Migrate the editor content to the latest template version */
    function migrateTemplate(editor, config, wrapper, result) {
        const doc = wrapper.ownerDocument;
        // 1. Extract unresolved field values by name
        const values = extractFieldValues(doc);
        // 2. Replace content and update version
        wrapper.innerHTML = result.latestTemplate.content;
        wrapper.setAttribute('data-template-version', result.latestVersion);
        // 3. Map old values to matching fields in new template
        const newFields = findPlaceholderFields(doc);
        newFields.forEach((field) => {
            const oldValue = values.get(field.name);
            if (oldValue) {
                field.element.textContent = oldValue;
            }
        });
        // 4. Dismiss banner
        dismissVersionBanner(doc);
        // 5. Activate placeholders on new content (if editor has full TinyMCE API)
        if (editor.on && editor.selection) {
            activatePlaceholders(editor, config);
        }
    }

    tinymce.PluginManager.add('structuredcontent', (editor) => {
        var _a, _b;
        // Register option first so TinyMCE recognises the config key before we read it
        editor.options.register('structuredcontent', { processor: 'object', default: {} });
        const config = editor.options.get('structuredcontent') || {};
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
        // Check for template version updates on content load (once per session)
        let versionChecked = false;
        editor.on('SetContent', () => {
            if (versionChecked)
                return;
            versionChecked = true;
            checkForUpdates(editor, config).catch(() => { });
        });
        // Fire analytics event on content extraction
        editor.on('BeforeGetContent', () => {
            fireSubmissionEvent(editor, config);
        });
    });

})();
