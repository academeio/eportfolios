<?php
/**
 * Server health check functions for admin dashboard and AJAX endpoint
 *
 * @package    eportfolios
 * @subpackage lib
 * @author     Academe Research, Inc
 * @license    https://www.gnu.org/licenses/gpl-3.0.html GNU GPL version 3 or later
 * @copyright  (C) 2026 Academe Research, Inc.
 *
 */

defined('INTERNAL') || die();

/**
 * Gather server health data for the admin dashboard
 *
 * @return array Health data with keys for each metric
 */
function get_server_health() {
    $health = array();

    // PHP version + memory limit
    $health['php_version'] = phpversion();
    $health['memory_limit'] = ini_get('memory_limit');

    // Database size
    $dbtype = get_config('dbtype');
    $dbname = get_config('dbname');
    try {
        if ($dbtype === 'postgres') {
            $result = get_record_sql("SELECT pg_database_size(current_database()) AS size");
            $health['db_size'] = format_bytes_health($result->size);
            $health['db_size_bytes'] = (int)$result->size;
        }
        else {
            $result = get_record_sql(
                "SELECT SUM(data_length + index_length) AS size FROM information_schema.tables WHERE table_schema = ?",
                array($dbname)
            );
            $health['db_size'] = format_bytes_health($result->size);
            $health['db_size_bytes'] = (int)$result->size;
        }
    }
    catch (Exception $e) {
        $health['db_size'] = 'unknown';
        $health['db_size_bytes'] = 0;
    }

    // Disk: dataroot free/total/percent
    $dataroot = get_config('dataroot');
    $health['disk_status'] = 'ok';
    if ($dataroot && is_dir($dataroot)) {
        $free = @disk_free_space($dataroot);
        $total = @disk_total_space($dataroot);
        if ($free !== false && $total !== false && $total > 0) {
            $used_pct = round(($total - $free) / $total * 100, 1);
            $health['disk_free'] = format_bytes_health($free);
            $health['disk_total'] = format_bytes_health($total);
            $health['disk_used_percent'] = $used_pct;

            if ($used_pct >= 90) {
                $health['disk_status'] = 'critical';
            }
            else if ($used_pct >= 80) {
                $health['disk_status'] = 'warning';
            }
        }
        else {
            $health['disk_free'] = 'unknown';
            $health['disk_total'] = 'unknown';
            $health['disk_used_percent'] = null;
        }
    }
    else {
        $health['disk_free'] = 'N/A';
        $health['disk_total'] = 'N/A';
        $health['disk_used_percent'] = null;
        $health['disk_status'] = 'critical';
    }

    // Cron: last run timestamp
    $lastcron = get_config('lastcronrun');
    $health['cron_status'] = 'ok';
    if ($lastcron) {
        $cron_age = time() - $lastcron;
        $health['cron_last_run'] = date('Y-m-d H:i:s', $lastcron);
        $health['cron_seconds_ago'] = $cron_age;
        $health['cron_human'] = format_seconds_ago_health($cron_age);

        if ($cron_age > 1800) {
            $health['cron_status'] = 'critical';
        }
        else if ($cron_age > 600) {
            $health['cron_status'] = 'warning';
        }
    }
    else {
        $health['cron_last_run'] = null;
        $health['cron_seconds_ago'] = null;
        $health['cron_human'] = 'never';
        $health['cron_status'] = 'warning';
    }

    // Stuck cron locks
    $health['cron_stuck_locks'] = 0;
    try {
        $cutoff = db_format_timestamp(time() - 86400);
        $health['cron_stuck_locks'] = (int)count_records_select('config', "field LIKE 'cron_lock_%' AND value < ?", array($cutoff));
    }
    catch (Exception $e) {
        // ignore
    }

    // Missing modules (disk vs DB audit)
    $missing_modules = array();
    $plugin_types = array('artefact', 'blocktype', 'module', 'auth', 'export', 'import', 'notification', 'grouptype');
    foreach ($plugin_types as $plugintype) {
        $plugindir = get_config('docroot') . $plugintype . '/';
        if (!is_dir($plugindir)) {
            continue;
        }
        $dirhandle = @opendir($plugindir);
        if ($dirhandle === false) {
            continue;
        }
        while (($dir = readdir($dirhandle)) !== false) {
            if ($dir === '.' || $dir === '..' || !is_dir($plugindir . $dir)) {
                continue;
            }
            if (!file_exists($plugindir . $dir . '/db/install.xml')) {
                continue;
            }
            try {
                $installed = get_record($plugintype . '_installed', 'name', $dir);
                if (!$installed) {
                    $missing_modules[] = $plugintype . '/' . $dir;
                }
            }
            catch (Exception $e) {
                // ignore
            }
        }
        closedir($dirhandle);
    }
    $health['missing_modules'] = count($missing_modules);
    $health['missing_modules_list'] = $missing_modules;

    // Load average (Linux/macOS)
    if (function_exists('sys_getloadavg')) {
        $load = sys_getloadavg();
        $health['load_average'] = implode(', ', array_map(function($v) { return number_format($v, 2); }, $load));
    }
    else {
        $health['load_average'] = 'N/A';
    }

    // Overall status
    $health['overall_status'] = 'ok';
    if ($health['disk_status'] === 'critical' || $health['cron_status'] === 'critical') {
        $health['overall_status'] = 'critical';
    }
    else if ($health['disk_status'] === 'warning' || $health['cron_status'] === 'warning' || $health['missing_modules'] > 0) {
        $health['overall_status'] = 'warning';
    }

    return $health;
}

/**
 * Format bytes to human readable string
 */
function format_bytes_health($bytes) {
    $units = array('B', 'KB', 'MB', 'GB', 'TB');
    $i = 0;
    while ($bytes >= 1024 && $i < count($units) - 1) {
        $bytes /= 1024;
        $i++;
    }
    return round($bytes, 1) . ' ' . $units[$i];
}

/**
 * Format seconds ago to human readable string
 */
function format_seconds_ago_health($seconds) {
    if ($seconds < 60) {
        return $seconds . 's ago';
    }
    if ($seconds < 3600) {
        return round($seconds / 60) . ' min ago';
    }
    if ($seconds < 86400) {
        return round($seconds / 3600, 1) . 'h ago';
    }
    return round($seconds / 86400, 1) . 'd ago';
}
