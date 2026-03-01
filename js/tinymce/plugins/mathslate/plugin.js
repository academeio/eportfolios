/**
 * plugin.js - MathSlate equation editor for TinyMCE 7
 *
 * Provides a LaTeX input dialog with symbol palette and live MathJax preview.
 * Replaces the legacy YUI3-based drag-drop equation builder.
 *
 * @package eportfolios
 * @copyright Copyright (C) 2013 Daniel Thies (original MathSlate)
 * @copyright Copyright (C) 2026 Academe Research, Inc
 * @license GNU GPL v3 or later
 */

tinymce.PluginManager.add('mathslate', function(editor) {

    // Symbol palette: curated set of common LaTeX symbols grouped by category
    var symbolGroups = [
        {
            label: 'Operators',
            symbols: [
                {display: '+', latex: '+'},
                {display: '\u2212', latex: '-'},
                {display: '\u00B1', latex: '\\pm '},
                {display: '\u00D7', latex: '\\times '},
                {display: '\u00F7', latex: '\\div '},
                {display: '=', latex: '='},
                {display: '\u2260', latex: '\\neq '},
                {display: '<', latex: '<'},
                {display: '>', latex: '>'},
                {display: '\u2264', latex: '\\leq '},
                {display: '\u2265', latex: '\\geq '},
                {display: '\u2192', latex: '\\to '},
                {display: '\u221E', latex: '\\infty '}
            ]
        },
        {
            label: 'Greek',
            symbols: [
                {display: '\u03B1', latex: '\\alpha '},
                {display: '\u03B2', latex: '\\beta '},
                {display: '\u03B3', latex: '\\gamma '},
                {display: '\u03B4', latex: '\\delta '},
                {display: '\u03B5', latex: '\\epsilon '},
                {display: '\u03B8', latex: '\\theta '},
                {display: '\u03BB', latex: '\\lambda '},
                {display: '\u03BC', latex: '\\mu '},
                {display: '\u03C0', latex: '\\pi '},
                {display: '\u03C3', latex: '\\sigma '},
                {display: '\u03C6', latex: '\\phi '},
                {display: '\u03C9', latex: '\\omega '},
                {display: '\u0393', latex: '\\Gamma '},
                {display: '\u0394', latex: '\\Delta '},
                {display: '\u03A3', latex: '\\Sigma '},
                {display: '\u03A9', latex: '\\Omega '}
            ]
        },
        {
            label: 'Structures',
            symbols: [
                {display: 'a/b', latex: '\\frac{}{}'},
                {display: 'x\u00B2', latex: '^{}'},
                {display: 'x\u2082', latex: '_{}'},
                {display: '\u221A', latex: '\\sqrt{}'},
                {display: '\u221B', latex: '\\sqrt[3]{}'},
                {display: '()', latex: '\\left( \\right)'},
                {display: '[]', latex: '\\left[ \\right]'},
                {display: '{}', latex: '\\left\\{ \\right\\}'},
                {display: '||', latex: '\\left| \\right|'}
            ]
        },
        {
            label: 'Functions',
            symbols: [
                {display: 'sin', latex: '\\sin '},
                {display: 'cos', latex: '\\cos '},
                {display: 'tan', latex: '\\tan '},
                {display: 'log', latex: '\\log '},
                {display: 'ln', latex: '\\ln '},
                {display: 'lim', latex: '\\lim_{} '},
                {display: '\u2211', latex: '\\sum_{i=0}^{n} '},
                {display: '\u220F', latex: '\\prod_{i=0}^{n} '},
                {display: '\u222B', latex: '\\int_{a}^{b} '},
                {display: '\u2202', latex: '\\partial '},
                {display: '\u2207', latex: '\\nabla '}
            ]
        },
        {
            label: 'Sets',
            symbols: [
                {display: '\u2208', latex: '\\in '},
                {display: '\u2209', latex: '\\notin '},
                {display: '\u2282', latex: '\\subset '},
                {display: '\u2283', latex: '\\supset '},
                {display: '\u2286', latex: '\\subseteq '},
                {display: '\u2287', latex: '\\supseteq '},
                {display: '\u222A', latex: '\\cup '},
                {display: '\u2229', latex: '\\cap '},
                {display: '\u2200', latex: '\\forall '},
                {display: '\u2203', latex: '\\exists '}
            ]
        }
    ];

    /**
     * Build the HTML for the symbol palette grid.
     */
    function buildSymbolPaletteHTML() {
        var html = '<div style="margin-top: 8px; border-top: 1px solid #e0e0e0; padding-top: 8px;">';
        html += '<div style="font-weight: bold; margin-bottom: 6px; font-size: 13px;">Symbol Palette</div>';

        for (var g = 0; g < symbolGroups.length; g++) {
            var group = symbolGroups[g];
            html += '<div style="margin-bottom: 6px;">';
            html += '<span style="font-size: 11px; color: #666; display: inline-block; width: 70px; vertical-align: top; padding-top: 4px;">' + group.label + '</span>';
            html += '<span style="display: inline-block;">';

            for (var s = 0; s < group.symbols.length; s++) {
                var sym = group.symbols[s];
                html += '<button type="button" class="mathslate-symbol" data-latex="' +
                    sym.latex.replace(/"/g, '&quot;') + '" ' +
                    'style="display: inline-block; min-width: 28px; height: 28px; margin: 1px; ' +
                    'padding: 2px 4px; border: 1px solid #ccc; border-radius: 3px; ' +
                    'background: #fff; cursor: pointer; font-size: 14px; line-height: 22px; ' +
                    'text-align: center; vertical-align: middle;" ' +
                    'title="' + sym.latex.replace(/"/g, '&quot;').replace(/\\/g, '\\\\') + '">' +
                    sym.display + '</button>';
            }

            html += '</span></div>';
        }

        html += '</div>';
        return html;
    }

    /**
     * Render a LaTeX expression in the preview area using MathJax.
     */
    function renderPreview(latex) {
        var preview = document.getElementById('mathslate-preview');
        if (!preview) {
            return;
        }

        if (!latex || !latex.trim()) {
            preview.innerHTML = '<span style="color: #999; font-style: italic;">Type LaTeX above to see preview</span>';
            return;
        }

        preview.innerHTML = '\\(' + latex + '\\)';

        // MathJax 3.x API
        if (window.MathJax && typeof MathJax.typesetPromise === 'function') {
            MathJax.typesetClear([preview]);
            MathJax.typesetPromise([preview]).catch(function() {
                preview.innerHTML = '<span style="color: #c00;">Invalid LaTeX</span>';
            });
        }
        // MathJax 2.x fallback
        else if (window.MathJax && MathJax.Hub) {
            MathJax.Hub.Queue(['Typeset', MathJax.Hub, preview]);
        }
        else {
            // No MathJax available — show raw LaTeX
            preview.textContent = '\\(' + latex + '\\)';
        }
    }

    /**
     * Try to extract an existing LaTeX expression from the current selection.
     * Looks for \(...\) or \[...\] delimiters.
     */
    function getExistingLatex() {
        var content = editor.selection.getContent({format: 'text'});
        if (!content) {
            return '';
        }
        // Match inline \(...\) or display \[...\]
        var match = content.match(/\\\((.+?)\\\)/) || content.match(/\\\[(.+?)\\\]/);
        return match ? match[1] : '';
    }

    /**
     * Open the Math Editor dialog.
     */
    function showMathDialog() {
        var existingLatex = getExistingLatex();

        var dialogApi = editor.windowManager.open({
            title: 'Math Editor',
            size: 'medium',
            body: {
                type: 'panel',
                items: [
                    {
                        type: 'textarea',
                        name: 'latex',
                        label: 'LaTeX Expression',
                        placeholder: 'e.g., \\frac{a}{b}, x^2 + y^2 = z^2'
                    },
                    {
                        type: 'htmlpanel',
                        html: buildSymbolPaletteHTML()
                    },
                    {
                        type: 'htmlpanel',
                        html: '<div style="margin-top: 8px; border-top: 1px solid #e0e0e0; padding-top: 8px;">' +
                              '<div style="font-weight: bold; margin-bottom: 6px; font-size: 13px;">Preview</div>' +
                              '<div id="mathslate-preview" style="min-height: 40px; padding: 10px; ' +
                              'background: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 4px; ' +
                              'font-size: 18px; text-align: center;">' +
                              '<span style="color: #999; font-style: italic;">Type LaTeX above to see preview</span>' +
                              '</div></div>'
                    }
                ]
            },
            initialData: {
                latex: existingLatex
            },
            buttons: [
                {type: 'custom', text: 'Insert Inline', name: 'inline', primary: true},
                {type: 'custom', text: 'Insert Display', name: 'display'},
                {type: 'cancel', text: 'Cancel'}
            ],
            onChange: function(api, details) {
                if (details.name === 'latex') {
                    renderPreview(api.getData().latex);
                }
            },
            onAction: function(api, details) {
                var data = api.getData();
                if (details.name === 'inline') {
                    if (data.latex && data.latex.trim()) {
                        editor.insertContent('\\(' + data.latex + '\\)');
                    }
                    api.close();
                }
                else if (details.name === 'display') {
                    if (data.latex && data.latex.trim()) {
                        editor.insertContent('\\[' + data.latex + '\\]');
                    }
                    api.close();
                }
            }
        });

        // Attach click handlers to symbol palette buttons after dialog renders
        setTimeout(function() {
            var dialogEl = document.querySelector('.tox-dialog');
            if (!dialogEl) {
                return;
            }
            dialogEl.querySelectorAll('.mathslate-symbol').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var latex = this.getAttribute('data-latex');
                    var current = dialogApi.getData().latex || '';
                    dialogApi.setData({latex: current + latex});
                    renderPreview(dialogApi.getData().latex);
                });
            });

            // Render preview if editing an existing expression
            if (existingLatex) {
                renderPreview(existingLatex);
            }
        }, 100);
    }

    // Register the mathslate icon
    editor.ui.registry.addIcon('mathslate', '<svg width="25" height="25" viewBox="0 -200 900 900">' +
        '<path fill-rule="nonzero" d="M571.31 251.31l-22.62-22.62c-6.25-6.25-16.38-6.25-22.63 ' +
        '0L480 274.75l-46.06-46.06c-6.25-6.25-16.38-6.25-22.63 0l-22.62 22.62c-6.25 6.25-6.25 ' +
        '16.38 0 22.63L434.75 320l-46.06 46.06c-6.25 6.25-6.25 16.38 0 22.63l22.62 22.62c6.25 ' +
        '6.25 16.38 6.25 22.63 0L480 365.25l46.06 46.06c6.25 6.25 16.38 6.25 22.63 0l22.62-22.62' +
        'c6.25-6.25 6.25-16.38 0-22.63L525.25 320l46.06-46.06c6.25-6.25 6.25-16.38 0-22.63zM552 ' +
        '0H307.65c-14.54 0-27.26 9.8-30.95 23.87l-84.79 322.8-58.41-106.1A32.008 32.008 0 0 0 ' +
        '105.47 224H24c-13.25 0-24 10.74-24 24v48c0 13.25 10.75 24 24 24h43.62l88.88 163.73C168.99 ' +
        '503.5 186.3 512 204.94 512c17.27 0 44.44-9 54.28-41.48L357.03 96H552c13.25 0 24-10.75 ' +
        '24-24V24c0-13.26-10.75-24-24-24z"></path></svg>');

    // Register toolbar button
    editor.ui.registry.addButton('mathslate', {
        tooltip: 'Insert Math',
        onAction: showMathDialog,
        icon: 'mathslate'
    });

    // Register menu item
    editor.ui.registry.addMenuItem('mathslate', {
        text: 'Insert Math',
        onAction: showMathDialog,
        context: 'insert'
    });
});
