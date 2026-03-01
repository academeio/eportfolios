<?php
/**
 *
 * @package    eportfolios
 * @subpackage admin
 * @author     Academe Research, Inc
 * @license    https://www.gnu.org/licenses/gpl-3.0.html GNU GPL version 3 or later
 * @copyright  (C) 2026 Academe Research, Inc.
 *
 */

define('INTERNAL', 1);
define('ADMIN', 1);
define('MENUITEM', 'configsite/contenttemplates');
define('SECTION_PLUGINTYPE', 'core');
define('SECTION_PLUGINNAME', 'admin');
define('SECTION_PAGE', 'contenttemplates');

require(dirname(dirname(dirname(__FILE__))) . '/init.php');
require_once('contenttemplates.php');
define('TITLE', get_string('managecontenttemplates', 'contenttemplates'));

// Pre-encode strings for use in JS heredoc (must be defined before heredoc)
$notemplates = json_encode(get_string('notemplates', 'contenttemplates'));
$str_title = json_encode(get_string('templatetitle', 'contenttemplates'));
$str_category = json_encode(get_string('templatecategory', 'contenttemplates'));
$str_description = json_encode(get_string('templatedescription', 'contenttemplates'));
$str_content = json_encode(get_string('templatecontent', 'contenttemplates'));
$str_sortorder = json_encode(get_string('templatesortorder', 'contenttemplates'));
$str_active = json_encode(get_string('active', 'contenttemplates'));
$str_inactive = json_encode(get_string('inactive', 'contenttemplates'));
$str_builtin = json_encode(get_string('builtin', 'contenttemplates'));
$str_custom = json_encode(get_string('custom', 'contenttemplates'));
$str_addtemplate = json_encode(get_string('addtemplate', 'contenttemplates'));
$str_edittemplate = json_encode(get_string('edittemplate', 'contenttemplates'));
$str_confirmdelete = json_encode(get_string('confirmdeletetemplate', 'contenttemplates'));
$str_edit = json_encode(get_string('edit'));
$str_delete = json_encode(get_string('delete'));
$str_actions = json_encode(get_string('edit'));
$str_status = json_encode(get_string('active', 'contenttemplates'));
$str_type_col = json_encode(get_string('builtin', 'contenttemplates'));
$str_save = json_encode(get_string('save'));
$str_cancel = json_encode(get_string('cancel'));
$str_yes = json_encode(get_string('yes'));
$str_no = json_encode(get_string('no'));

// Category labels
$str_cat_layout = json_encode(get_string('category.layout', 'contenttemplates'));
$str_cat_reflection = json_encode(get_string('category.reflection', 'contenttemplates'));
$str_cat_portfolio = json_encode(get_string('category.portfolio', 'contenttemplates'));
$str_cat_assessment = json_encode(get_string('category.assessment', 'contenttemplates'));
$str_cat_general = json_encode(get_string('category.general', 'contenttemplates'));

$ijs = <<<EOJS
jQuery(function(\$) {
    var wwwroot = config['wwwroot'];

    function loadTemplates() {
        sendjsonrequest(wwwroot + 'json/contenttemplatesadmin.json.php', {action: 'list'}, 'POST', function(data) {
            if (data.error) {
                return;
            }
            renderTemplateList(data.templates);
        });
    }

    function renderTemplateList(templates) {
        var container = $('#templatelist');
        container.empty();

        if (!templates || templates.length === 0) {
            container.html('<p class="lead text-center">' + {$notemplates} + '</p>');
            return;
        }

        var table = $('<table>', {'class': 'table table-striped'});
        var thead = $('<thead>').append(
            $('<tr>').append(
                $('<th>').text({$str_title}),
                $('<th>').text({$str_category}),
                $('<th>').text({$str_type_col}),
                $('<th>').text({$str_status}),
                $('<th>').text({$str_sortorder}),
                $('<th>').text({$str_actions})
            )
        );
        table.append(thead);

        var tbody = $('<tbody>');
        for (var i = 0; i < templates.length; i++) {
            var t = templates[i];
            tbody.append(buildRow(t));
        }
        table.append(tbody);
        container.append(table);
    }

    function buildRow(t) {
        var catLabel = t.category ? t.category.charAt(0).toUpperCase() + t.category.slice(1) : '-';
        var typeLabel = t.builtin
            ? '<span class="badge bg-secondary">' + {$str_builtin} + '</span>'
            : '<span class="badge bg-info">' + {$str_custom} + '</span>';
        var statusLabel = t.active
            ? '<span class="badge bg-success">' + {$str_active} + '</span>'
            : '<span class="badge bg-warning">' + {$str_inactive} + '</span>';

        var actions = $('<span>', {'class': 'btn-group'});

        // Edit button
        var editBtn = $('<button>', {'type': 'button', 'class': 'btn btn-secondary btn-sm', 'title': {$str_edit}})
            .append($('<span>', {'class': 'icon icon-pencil-alt', 'role': 'presentation'}));
        editBtn.on('click', function() { editTemplate(t.id); });
        actions.append(editBtn);

        // Toggle active button
        var toggleTitle = t.active ? {$str_inactive} : {$str_active};
        var toggleBtn = $('<button>', {
            'type': 'button',
            'class': 'btn btn-secondary btn-sm',
            'title': toggleTitle
        }).append($('<span>', {
            'class': t.active ? 'icon icon-eye-slash' : 'icon icon-eye',
            'role': 'presentation'
        }));
        toggleBtn.on('click', function() { toggleTemplate(t.id); });
        actions.append(toggleBtn);

        // Delete button (only for custom templates)
        if (!t.builtin) {
            var delBtn = $('<button>', {'type': 'button', 'class': 'btn btn-secondary btn-sm', 'title': {$str_delete}})
                .append($('<span>', {'class': 'icon icon-trash-alt text-danger', 'role': 'presentation'}));
            delBtn.on('click', function() { deleteTemplate(t.id); });
            actions.append(delBtn);
        }

        return $('<tr>').append(
            $('<td>').text(t.title),
            $('<td>').text(catLabel),
            $('<td>').html(typeLabel),
            $('<td>').html(statusLabel),
            $('<td>').text(t.sort_order),
            $('<td>').append(actions)
        );
    }

    function editTemplate(id) {
        if (id) {
            sendjsonrequest(wwwroot + 'json/contenttemplatesadmin.json.php', {action: 'get', id: id}, 'POST', function(data) {
                if (data.error) {
                    return;
                }
                showEditForm(data.template);
            });
        } else {
            showEditForm(null);
        }
    }

    function showEditForm(template) {
        var isNew = !template;
        var t = template || {id: 0, title: '', description: '', content: '', category: '', sort_order: 0, active: 1};

        var formHtml = '<div id="templateform" class="card mt-3">'
            + '<div class="card-header"><h3 class="card-title">' + (isNew ? {$str_addtemplate} : {$str_edittemplate}) + '</h3></div>'
            + '<div class="card-body">'
            + '<div class="form-group mb-3">'
            + '<label for="ct-title" class="form-label">' + {$str_title} + '</label>'
            + '<input type="text" id="ct-title" class="form-control" value="' + escapeAttr(t.title) + '">'
            + '</div>'
            + '<div class="form-group mb-3">'
            + '<label for="ct-description" class="form-label">' + {$str_description} + '</label>'
            + '<textarea id="ct-description" class="form-control" rows="2">' + escapeHtml(t.description) + '</textarea>'
            + '</div>'
            + '<div class="form-group mb-3">'
            + '<label for="ct-content" class="form-label">' + {$str_content} + '</label>'
            + '<textarea id="ct-content" class="form-control" rows="10" style="font-family:monospace;">' + escapeHtml(t.content) + '</textarea>'
            + '</div>'
            + '<div class="row mb-3">'
            + '<div class="col-md-4">'
            + '<label for="ct-category" class="form-label">' + {$str_category} + '</label>'
            + '<select id="ct-category" class="form-control form-select">'
            + '<option value="">-</option>'
            + '<option value="layout"' + (t.category === 'layout' ? ' selected' : '') + '>' + {$str_cat_layout} + '</option>'
            + '<option value="reflection"' + (t.category === 'reflection' ? ' selected' : '') + '>' + {$str_cat_reflection} + '</option>'
            + '<option value="portfolio"' + (t.category === 'portfolio' ? ' selected' : '') + '>' + {$str_cat_portfolio} + '</option>'
            + '<option value="assessment"' + (t.category === 'assessment' ? ' selected' : '') + '>' + {$str_cat_assessment} + '</option>'
            + '<option value="general"' + (t.category === 'general' ? ' selected' : '') + '>' + {$str_cat_general} + '</option>'
            + '</select>'
            + '</div>'
            + '<div class="col-md-4">'
            + '<label for="ct-sort" class="form-label">' + {$str_sortorder} + '</label>'
            + '<input type="number" id="ct-sort" class="form-control" value="' + t.sort_order + '">'
            + '</div>'
            + '<div class="col-md-4">'
            + '<label for="ct-active" class="form-label">' + {$str_active} + '</label>'
            + '<select id="ct-active" class="form-control form-select">'
            + '<option value="1"' + (t.active ? ' selected' : '') + '>' + {$str_yes} + '</option>'
            + '<option value="0"' + (!t.active ? ' selected' : '') + '>' + {$str_no} + '</option>'
            + '</select>'
            + '</div>'
            + '</div>'
            + '<div class="form-group">'
            + '<button type="button" class="btn btn-primary" id="ct-save">' + {$str_save} + '</button> '
            + '<button type="button" class="btn btn-secondary" id="ct-cancel">' + {$str_cancel} + '</button>'
            + '</div>'
            + '</div>'
            + '</div>';

        // Remove any existing form
        $('#templateform').remove();
        $('#templatelist').after(formHtml);

        $('#ct-save').on('click', function() {
            var savedata = {
                action: 'save',
                id: t.id || 0,
                title: $('#ct-title').val(),
                description: $('#ct-description').val(),
                content: $('#ct-content').val(),
                category: $('#ct-category').val(),
                sort_order: parseInt($('#ct-sort').val()) || 0,
                active: parseInt($('#ct-active').val())
            };
            if (!savedata.title) {
                displayMessage(get_string('namedfieldempty', 'mahara', {$str_title}), 'error');
                return;
            }
            if (!savedata.content) {
                displayMessage(get_string('namedfieldempty', 'mahara', {$str_content}), 'error');
                return;
            }
            sendjsonrequest(wwwroot + 'json/contenttemplatesadmin.json.php', savedata, 'POST', function(resp) {
                if (!resp.error) {
                    $('#templateform').remove();
                    loadTemplates();
                    displayMessage(resp.message, 'ok');
                }
            });
        });

        $('#ct-cancel').on('click', function() {
            $('#templateform').remove();
        });

        // Scroll to form
        $('html, body').animate({scrollTop: $('#templateform').offset().top - 60}, 300);
    }

    function toggleTemplate(id) {
        sendjsonrequest(wwwroot + 'json/contenttemplatesadmin.json.php', {action: 'toggle', id: id}, 'POST', function(data) {
            if (!data.error) {
                loadTemplates();
            }
        });
    }

    function deleteTemplate(id) {
        if (confirm({$str_confirmdelete})) {
            sendjsonrequest(wwwroot + 'json/contenttemplatesadmin.json.php', {action: 'delete', id: id}, 'POST', function(data) {
                if (!data.error) {
                    loadTemplates();
                    displayMessage(data.message, 'ok');
                }
            });
        }
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function escapeAttr(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // Add template button
    $('#addtemplate-btn').on('click', function() {
        editTemplate(null);
    });

    // Initial load
    loadTemplates();
});
EOJS;

$smarty = smarty();
setpageicon($smarty, 'icon-file-alt');
$smarty->assign('INLINEJAVASCRIPT', $ijs);
$smarty->display('admin/site/contenttemplates.tpl');
