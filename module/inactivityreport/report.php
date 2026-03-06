<?php
/**
 * @package    eportfolios
 * @subpackage module-inactivityreport
 * @author     Academe Research, Inc
 * @license    https://www.gnu.org/licenses/gpl-3.0.html GNU GPL version 3 or later
 * @copyright  (C) 2026 Academe Research, Inc.
 */

define('INTERNAL', 1);
define('INSTITUTIONALADMIN', 1);
define('MENUITEM', 'adminhome/inactivityreport');
define('SECTION_PLUGINTYPE', 'module');
define('SECTION_PLUGINNAME', 'inactivityreport');
define('SECTION_PAGE', 'report');

require(dirname(dirname(dirname(__FILE__))) . '/init.php');

safe_require('module', 'inactivityreport');

define('TITLE', get_string('reporthistory', 'module.inactivityreport'));

// Handle CSV download
$download = param_integer('download', 0);
if ($download) {
    $id = param_integer('id');
    $record = get_record('module_inactivityreport_history', 'id', $id);
    if (!$record) {
        throw new NotFoundException(get_string('notfound', 'mahara'));
    }
    // Institution admins can only download their own institution's reports
    if (!$USER->get('admin')) {
        $userinst = array_keys($USER->get('institutions'));
        if (!in_array($record->institution, $userinst)) {
            throw new AccessDeniedException();
        }
    }
    if (!file_exists($record->csv_path)) {
        throw new NotFoundException(get_string('notfound', 'mahara'));
    }
    $filename = 'inactivity-report-' . $record->institution . '-' . date('Y-m', strtotime($record->report_date)) . '.csv';
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    readfile($record->csv_path);
    exit;
}

// Filters
$institution_filter = param_alpha('institution', 'all');
$limit = param_integer('limit', 20);
$offset = param_integer('offset', 0);

// Build query
$where = 'TRUE';
$values = array();

if (!$USER->get('admin')) {
    // Institution admins: restrict to their institutions
    $userinst = array_keys($USER->get('institutions'));
    if (empty($userinst)) {
        $userinst = array('_none_');
    }
    $placeholders = implode(',', array_fill(0, count($userinst), '?'));
    $where .= " AND h.institution IN ({$placeholders})";
    $values = array_merge($values, $userinst);
}
else if ($institution_filter !== 'all') {
    $where .= ' AND h.institution = ?';
    $values[] = $institution_filter;
}

$count = count_records_sql("SELECT COUNT(*) FROM {module_inactivityreport_history} h WHERE {$where}", $values);

$reports = get_records_sql_array("
    SELECT h.*, i.displayname AS institution_displayname
    FROM {module_inactivityreport_history} h
    JOIN {institution} i ON i.name = h.institution
    WHERE {$where}
    ORDER BY h.report_date DESC, i.displayname ASC
", $values, $offset, $limit);

// Institution list for filter dropdown (site admins only)
$institutions = array();
if ($USER->get('admin')) {
    $institutions = get_records_array('institution', '', '', 'displayname', 'name, displayname');
}

$pagination = build_pagination(array(
    'url'    => get_config('wwwroot') . 'module/inactivityreport/report.php?institution=' . $institution_filter,
    'count'  => $count,
    'limit'  => $limit,
    'offset' => $offset,
));

$smarty = smarty();
setpageicon($smarty, 'icon-chart-bar');
$smarty->assign('reports', $reports);
$smarty->assign('institutions', $institutions);
$smarty->assign('institution_filter', $institution_filter);
$smarty->assign('pagination', $pagination['html']);
$smarty->assign('count', $count);
$smarty->display('module/inactivityreport/report.tpl');
