/**
 * Content Templates TinyMCE 7 Plugin
 *
 * @package    eportfolios
 * @subpackage core
 * @author     Academe Research, Inc
 * @license    https://www.gnu.org/licenses/gpl-3.0.html GNU GPL version 3 or later
 * @copyright  (C) 2026 Academe Research, Inc.
 */

/*global tinymce:true, jQuery:true, config:true, sendjsonrequest:true */

tinymce.PluginManager.add('contenttemplates', function(editor) {

    function openTemplateDialog() {
        // Fetch templates from backend
        sendjsonrequest(config['wwwroot'] + 'json/contenttemplates.json.php', {}, 'POST', function(data) {
            if (data.error) {
                return;
            }
            showTemplateModal(data.templates, data.categories);
        });
    }

    function showTemplateModal(templates, categories) {
        // Build modal HTML
        var modalId = 'contenttemplates-modal';

        // Remove any existing modal
        jQuery('#' + modalId).remove();

        var html = '<div id="' + modalId + '" class="modal modal-shown" tabindex="-1" role="dialog" '
            + 'style="display:block; position:fixed; top:0; left:0; width:100%; height:100%; z-index:100000; background:rgba(0,0,0,0.5);">'
            + '<div class="modal-dialog modal-lg" role="document" style="max-width:800px; margin:40px auto;">'
            + '<div class="modal-content" style="max-height:80vh; display:flex; flex-direction:column;">'
            + '<div class="modal-header" style="padding:15px 20px; border-bottom:1px solid #dee2e6; display:flex; justify-content:space-between; align-items:center;">'
            + '<h4 class="modal-title" style="margin:0;">Insert template</h4>'
            + '<button type="button" class="btn-close" id="' + modalId + '-close" aria-label="Close" '
            + 'style="background:none; border:none; font-size:1.5rem; cursor:pointer;">&times;</button>'
            + '</div>'
            + '<div style="padding:10px 20px; border-bottom:1px solid #dee2e6;">'
            + buildCategoryFilter(categories, modalId)
            + '</div>'
            + '<div class="modal-body" style="overflow-y:auto; padding:20px; flex:1;">'
            + '<div id="' + modalId + '-grid" style="display:grid; grid-template-columns:repeat(2, 1fr); gap:15px;">'
            + buildTemplateCards(templates, modalId)
            + '</div>'
            + '<div id="' + modalId + '-empty" style="display:none; text-align:center; padding:40px; color:#666;">'
            + 'No templates available in this category.'
            + '</div>'
            + '</div>'
            + '<div id="' + modalId + '-preview-panel" style="display:none; border-top:1px solid #dee2e6;">'
            + '<div style="padding:15px 20px; border-bottom:1px solid #dee2e6; display:flex; justify-content:space-between; align-items:center;">'
            + '<h5 style="margin:0;" id="' + modalId + '-preview-title">Preview</h5>'
            + '<button type="button" class="btn btn-sm btn-secondary" id="' + modalId + '-preview-back">Back to templates</button>'
            + '</div>'
            + '<div id="' + modalId + '-preview-content" style="padding:20px; max-height:300px; overflow-y:auto; background:#fafafa;"></div>'
            + '<div style="padding:10px 20px; text-align:right; border-top:1px solid #dee2e6;">'
            + '<button type="button" class="btn btn-primary" id="' + modalId + '-preview-insert">Insert</button>'
            + '</div>'
            + '</div>'
            + '</div>'
            + '</div>'
            + '</div>';

        jQuery('body').append(html);
        jQuery('body').addClass('modal-open');

        var selectedTemplateContent = null;
        var allTemplates = templates;

        // Close button
        jQuery('#' + modalId + '-close').on('click', function() {
            closeModal();
        });

        // Click outside modal to close
        jQuery('#' + modalId).on('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });

        // Escape key to close
        jQuery(document).on('keydown.contenttemplates', function(e) {
            if (e.key === 'Escape') {
                closeModal();
            }
        });

        // Category filter
        jQuery('#' + modalId + '-category').on('change', function() {
            var cat = jQuery(this).val();
            filterTemplates(cat);
        });

        // Template card click — show preview
        jQuery('#' + modalId + '-grid').on('click', '.ct-card', function() {
            var idx = jQuery(this).data('index');
            var template = allTemplates[idx];
            showPreview(template);
        });

        // Insert button on card
        jQuery('#' + modalId + '-grid').on('click', '.ct-insert-btn', function(e) {
            e.stopPropagation();
            var idx = jQuery(this).closest('.ct-card').data('index');
            var template = allTemplates[idx];
            insertTemplate(template.content);
        });

        // Preview panel — back button
        jQuery('#' + modalId + '-preview-back').on('click', function() {
            hidePreview();
        });

        // Preview panel — insert button
        jQuery('#' + modalId + '-preview-insert').on('click', function() {
            if (selectedTemplateContent) {
                insertTemplate(selectedTemplateContent);
            }
        });

        function filterTemplates(category) {
            var grid = jQuery('#' + modalId + '-grid');
            var cards = grid.find('.ct-card');
            var visibleCount = 0;
            cards.each(function() {
                var cardCat = jQuery(this).data('category');
                if (!category || cardCat === category) {
                    jQuery(this).show();
                    visibleCount++;
                } else {
                    jQuery(this).hide();
                }
            });
            if (visibleCount === 0) {
                jQuery('#' + modalId + '-empty').show();
            } else {
                jQuery('#' + modalId + '-empty').hide();
            }
        }

        function showPreview(template) {
            selectedTemplateContent = template.content;
            jQuery('#' + modalId + '-preview-title').text(template.title);
            jQuery('#' + modalId + '-preview-content').html(template.content);
            jQuery('#' + modalId + '-grid').parent().hide();
            jQuery('#' + modalId + '-preview-panel').show();
        }

        function hidePreview() {
            selectedTemplateContent = null;
            jQuery('#' + modalId + '-grid').parent().show();
            jQuery('#' + modalId + '-preview-panel').hide();
        }

        function insertTemplate(content) {
            editor.undoManager.transact(function() {
                editor.execCommand('mceInsertContent', false, content);
            });
            closeModal();
        }

        function closeModal() {
            jQuery(document).off('keydown.contenttemplates');
            jQuery('#' + modalId).remove();
            jQuery('body').removeClass('modal-open');
        }

        // Focus the close button for keyboard accessibility
        jQuery('#' + modalId + '-close').trigger('focus');
    }

    function buildCategoryFilter(categories, modalId) {
        if (!categories || categories.length === 0) {
            return '';
        }
        var html = '<select id="' + modalId + '-category" class="form-control form-select" '
            + 'style="max-width:250px;">'
            + '<option value="">All categories</option>';
        for (var i = 0; i < categories.length; i++) {
            // Capitalize first letter
            var label = categories[i].charAt(0).toUpperCase() + categories[i].slice(1);
            html += '<option value="' + escapeHtml(categories[i]) + '">' + escapeHtml(label) + '</option>';
        }
        html += '</select>';
        return html;
    }

    function buildTemplateCards(templates, modalId) {
        if (!templates || templates.length === 0) {
            return '<div style="grid-column:1/-1; text-align:center; padding:40px; color:#666;">No templates available.</div>';
        }
        var html = '';
        for (var i = 0; i < templates.length; i++) {
            var t = templates[i];
            var catLabel = t.category ? t.category.charAt(0).toUpperCase() + t.category.slice(1) : '';
            html += '<div class="ct-card" data-index="' + i + '" data-category="' + escapeHtml(t.category || '') + '" '
                + 'style="border:1px solid #dee2e6; border-radius:6px; padding:15px; cursor:pointer; transition:box-shadow 0.2s, border-color 0.2s;" '
                + 'onmouseover="this.style.borderColor=\'#0d6efd\'; this.style.boxShadow=\'0 2px 8px rgba(0,0,0,0.1)\';" '
                + 'onmouseout="this.style.borderColor=\'#dee2e6\'; this.style.boxShadow=\'none\';">'
                + '<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">'
                + '<h5 style="margin:0; font-size:1rem;">' + escapeHtml(t.title) + '</h5>'
                + (catLabel ? '<span style="font-size:0.75rem; background:#e9ecef; padding:2px 8px; border-radius:3px;">' + escapeHtml(catLabel) + '</span>' : '')
                + '</div>'
                + '<p style="margin:0 0 10px; font-size:0.85rem; color:#666;">' + escapeHtml(t.description || '') + '</p>'
                + '<button type="button" class="btn btn-sm btn-primary ct-insert-btn">Insert</button>'
                + '</div>';
        }
        return html;
    }

    function escapeHtml(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    // Register the toolbar button
    editor.ui.registry.addButton('contenttemplates', {
        icon: 'template',
        tooltip: 'Insert template',
        onAction: function() {
            openTemplateDialog();
        }
    });

    // Register the menu item
    editor.ui.registry.addMenuItem('contenttemplates', {
        icon: 'template',
        text: 'Insert template',
        onAction: function() {
            openTemplateDialog();
        }
    });
});
