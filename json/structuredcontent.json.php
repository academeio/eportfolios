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

$action = param_alpha('action', 'fetch');

switch ($action) {
    case 'save':
        $tpldata = new stdClass();
        $tpldata->title = param_variable('title');
        $tpldata->description = param_variable('description', '');
        $tpldata->content = param_variable('content');
        $tpldata->category = param_variable('category', '');
        $tpldata->active = 1;
        $id = save_content_template($tpldata);
        json_reply(false, array(
            'data' => array(
                'id' => $id,
                'message' => 'Template saved.',
            ),
        ));
        break;

    case 'fetch':
    default:
        $query = param_variable('query', null);
        $category = param_variable('category', null);

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

        if ($query) {
            $q = strtolower($query);
            $data = array_values(array_filter($data, function($t) use ($q) {
                return strpos(strtolower($t['title']), $q) !== false
                    || strpos(strtolower($t['description'] ?? ''), $q) !== false;
            }));
        }

        $catdata = array();
        foreach ($categories as $cat) {
            $catdata[] = array(
                'id'    => $cat,
                'label' => ucfirst($cat),
            );
        }

        json_reply(false, array(
            'data' => array(
                'templates'  => $data,
                'categories' => $catdata,
            ),
        ));
        break;
}
