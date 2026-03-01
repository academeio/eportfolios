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
define('JSON', 1);
require(dirname(dirname(__FILE__)) . '/init.php');
require_once('contenttemplates.php');

$category = param_variable('category', null);

$templates = get_content_templates($category);
$categories = get_content_template_categories(true);

// Build response data
$data = array();
foreach ($templates as $t) {
    $data[] = array(
        'id'          => (int)$t->id,
        'title'       => $t->title,
        'description' => $t->description,
        'content'     => $t->content,
        'category'    => $t->category,
    );
}

json_reply(false, array(
    'templates'  => $data,
    'categories' => $categories,
    'count'      => count($data),
));
