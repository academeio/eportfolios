<?php
/**
 *
 * @package    eportfolios
 * @subpackage core
 * @author     Academe Research, Inc
 * @license    https://www.gnu.org/licenses/gpl-3.0.html GNU GPL version 3 or later
 * @copyright  (C) 2026 Academe Research, Inc.
 *
 */

define('INTERNAL', 1);
define('ADMIN', 1);
define('JSON', 1);
require(dirname(dirname(__FILE__)) . '/init.php');
require_once('contenttemplates.php');

$action = param_alpha('action');

switch ($action) {
    case 'list':
        $templates = get_all_content_templates();
        $data = array();
        foreach ($templates as $t) {
            $data[] = array(
                'id'          => (int)$t->id,
                'title'       => $t->title,
                'description' => $t->description,
                'content'     => $t->content,
                'category'    => $t->category,
                'sort_order'  => (int)$t->sort_order,
                'active'      => (int)$t->active,
                'builtin'     => (int)$t->builtin,
            );
        }
        json_reply(false, array('templates' => $data));
        break;

    case 'get':
        $id = param_integer('id');
        $template = get_content_template($id);
        if (!$template) {
            json_reply(true, get_string('templatenotfound', 'contenttemplates'));
            break;
        }
        json_reply(false, array('template' => array(
            'id'          => (int)$template->id,
            'title'       => $template->title,
            'description' => $template->description,
            'content'     => $template->content,
            'category'    => $template->category,
            'sort_order'  => (int)$template->sort_order,
            'active'      => (int)$template->active,
            'builtin'     => (int)$template->builtin,
        )));
        break;

    case 'save':
        $data = new stdClass();
        $data->id = param_integer('id', 0);
        $data->title = param_variable('title');
        $data->description = param_variable('description', '');
        $data->content = param_variable('content');
        $data->category = param_variable('category', '');
        $data->sort_order = param_integer('sort_order', 0);
        $data->active = param_integer('active', 1);
        $id = save_content_template($data);
        json_reply(false, array(
            'message' => get_string('templatesaved', 'contenttemplates'),
            'id' => $id,
        ));
        break;

    case 'delete':
        $id = param_integer('id');
        $template = get_content_template($id);
        if (!$template) {
            json_reply(true, get_string('templatenotfound', 'contenttemplates'));
            break;
        }
        if ($template->builtin) {
            json_reply(true, get_string('cannotdeletebuiltin', 'contenttemplates'));
            break;
        }
        delete_content_template($id);
        json_reply(false, array('message' => get_string('templatedeleted', 'contenttemplates')));
        break;

    case 'toggle':
        $id = param_integer('id');
        $newactive = toggle_content_template_active($id);
        if ($newactive === false) {
            json_reply(true, get_string('templatenotfound', 'contenttemplates'));
            break;
        }
        json_reply(false, array(
            'message' => get_string('templatesaved', 'contenttemplates'),
            'active' => $newactive,
        ));
        break;

    default:
        json_reply(true, 'Unknown action.');
}
