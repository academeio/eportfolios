<?php
/**
 *
 * @package    eportfolios
 * @subpackage health
 * @author     Academe Research, Inc
 * @license    https://www.gnu.org/licenses/gpl-3.0.html GNU GPL version 3 or later
 * @copyright  (C) 2026 Academe Research, Inc.
 *
 */

define('INTERNAL', 1);
define('PUBLIC', 1);
define('CRON', 1);
define('TITLE', '');

require(dirname(dirname(__FILE__)) . '/init.php');

// Auth: urlsecret for HTTP, no auth for CLI
if (!is_cli() && get_config('urlsecret') !== null) {
    $urlsecret = param_alphanumext('urlsecret', -1);
    if ($urlsecret !== get_config('urlsecret')) {
        if (defined('JSON')) {
            header('Content-Type: application/json');
            echo json_encode(array('error' => true, 'message' => 'Access denied'));
        }
        else {
            echo "Access denied: invalid or missing urlsecret\n";
        }
        exit;
    }
}

$checks = array();
$overall = 'ok';

// 1. PHP check
$required_extensions = array('gd', 'intl', 'zip', 'xml', 'curl', 'json');
// Add DB-specific extension
$dbtype = get_config('dbtype');
if ($dbtype === 'mysql' || $dbtype === 'mysqli') {
    $required_extensions[] = 'mysqli';
}
else {
    $required_extensions[] = 'pgsql';
}
$missing_extensions = array();
foreach ($required_extensions as $ext) {
    if (!extension_loaded($ext)) {
        $missing_extensions[] = $ext;
    }
}
$checks['php'] = array(
    'status' => empty($missing_extensions) ? 'ok' : 'critical',
    'version' => phpversion(),
    'memory_limit' => ini_get('memory_limit'),
    'extensions_ok' => empty($missing_extensions),
    'missing_extensions' => $missing_extensions,
);
if (!empty($missing_extensions)) {
    $overall = 'critical';
}

// 2. Database check
try {
    $table_count = count_records('config') > 0 ? true : false;
    $version = get_config('version');
    $release = get_config('release');
    $user_count = count_records('usr');
    $checks['database'] = array(
        'status' => 'ok',
        'connected' => true,
        'version' => $version,
        'release' => $release,
        'user_count' => (int)$user_count,
    );
}
catch (Exception $e) {
    $checks['database'] = array(
        'status' => 'critical',
        'connected' => false,
        'error' => $e->getMessage(),
    );
    $overall = 'critical';
}

// 3. Cron check — detect last run from cron table nextrun timestamps
$cron_status = 'ok';
$cron_age = null;
$cron_last_run = null;
$overdue = 0;
try {
    $earliest = get_field_sql('SELECT ' . db_format_tsfield('nextrun', 'nextrun') . ' FROM {cron} WHERE nextrun IS NOT NULL ORDER BY nextrun ASC LIMIT 1');
    if ($earliest) {
        $next_ts = strtotime($earliest);
        $overdue = time() - $next_ts;
        if ($overdue > 0) {
            $cron_age = $overdue;
            $cron_last_run = $next_ts;
        }
        else {
            $last_run_est = $next_ts - 300;
            $cron_age = time() - $last_run_est;
            $cron_last_run = $last_run_est;
        }

        if ($overdue > 1800) {
            $cron_status = 'critical';
            $overall = 'critical';
        }
        else if ($overdue > 600) {
            $cron_status = 'warning';
            if ($overall === 'ok') {
                $overall = 'warning';
            }
        }
    }
    else {
        $cron_status = 'warning';
        if ($overall === 'ok') {
            $overall = 'warning';
        }
    }
}
catch (Exception $e) {
    $cron_status = 'warning';
    if ($overall === 'ok') {
        $overall = 'warning';
    }
}

// Check for stuck cron locks (>24h)
$stuck_locks = 0;
$cutoff = db_format_timestamp(time() - 86400);
try {
    $stuck_locks = count_records_select('config', "field LIKE 'cron_lock_%' AND value < ?", array($cutoff));
}
catch (Exception $e) {
    // Table/column might not exist in all versions
}

$checks['cron'] = array(
    'status' => $cron_status,
    'last_run' => $cron_last_run ? date('Y-m-d H:i:s', $cron_last_run) : null,
    'seconds_ago' => $cron_age,
    'stuck_locks' => (int)$stuck_locks,
);
if ($stuck_locks > 0 && $overall === 'ok') {
    $overall = 'warning';
}

// 4. Disk check
$dataroot = get_config('dataroot');
$disk_status = 'ok';
$disk_free = null;
$disk_total = null;
$disk_percent = null;
if ($dataroot && is_dir($dataroot)) {
    $disk_free = @disk_free_space($dataroot);
    $disk_total = @disk_total_space($dataroot);
    if ($disk_free !== false && $disk_total !== false && $disk_total > 0) {
        $disk_percent = round(($disk_total - $disk_free) / $disk_total * 100, 1);
        if ($disk_percent >= 90) {
            $disk_status = 'critical';
            $overall = 'critical';
        }
        else if ($disk_percent >= 80) {
            $disk_status = 'warning';
            if ($overall === 'ok') {
                $overall = 'warning';
            }
        }
    }
    $writable = is_writable($dataroot);
    if (!$writable) {
        $disk_status = 'critical';
        $overall = 'critical';
    }
}
else {
    $disk_status = 'critical';
    $overall = 'critical';
}

$checks['disk'] = array(
    'status' => $disk_status,
    'dataroot' => $dataroot,
    'exists' => is_dir($dataroot),
    'writable' => isset($writable) ? $writable : false,
    'free_bytes' => $disk_free,
    'total_bytes' => $disk_total,
    'used_percent' => $disk_percent,
    'free_human' => $disk_free !== null ? format_bytes($disk_free) : null,
    'total_human' => $disk_total !== null ? format_bytes($disk_total) : null,
);

// 5. Module audit (disk vs DB)
$missing_modules = array();
$plugin_types = array('artefact', 'blocktype', 'module', 'auth', 'export', 'import', 'notification', 'grouptype');
foreach ($plugin_types as $plugintype) {
    $plugindir = get_config('docroot') . $plugintype . '/';
    if (!is_dir($plugindir)) {
        continue;
    }
    $dirhandle = opendir($plugindir);
    if ($dirhandle === false) {
        continue;
    }
    while (($dir = readdir($dirhandle)) !== false) {
        if ($dir === '.' || $dir === '..' || !is_dir($plugindir . $dir)) {
            continue;
        }
        // Check if this plugin has a db/install.xml (meaning it needs DB tables)
        $installxml = $plugindir . $dir . '/db/install.xml';
        if (!file_exists($installxml)) {
            continue;
        }
        // Check if plugin is installed in DB
        try {
            $installed = get_record($plugintype . '_installed', 'name', $dir);
            if (!$installed) {
                $missing_modules[] = $plugintype . '/' . $dir;
            }
        }
        catch (Exception $e) {
            // Table might not exist
        }
    }
    closedir($dirhandle);
}

$checks['modules'] = array(
    'status' => empty($missing_modules) ? 'ok' : 'warning',
    'missing_count' => count($missing_modules),
    'missing' => $missing_modules,
);
if (!empty($missing_modules) && $overall === 'ok') {
    $overall = 'warning';
}

// 6. Config check
$checks['config'] = array(
    'status' => 'ok',
    'site_closed' => (bool)get_config('siteclosedbyadmin'),
    'productionmode' => !(bool)get_config('productionmode') ? false : true,
);

$result = array(
    'status' => $overall,
    'timestamp' => date('Y-m-d H:i:s'),
    'checks' => $checks,
);

// Output
if (is_cli()) {
    $status_label = strtoupper($overall);
    echo "Health Check: {$status_label}\n";
    echo "Timestamp: " . $result['timestamp'] . "\n";
    echo str_repeat('-', 50) . "\n";

    // PHP
    $c = $checks['php'];
    echo "[{$c['status']}] PHP: {$c['version']}, memory_limit={$c['memory_limit']}\n";
    if (!empty($c['missing_extensions'])) {
        echo "  Missing extensions: " . implode(', ', $c['missing_extensions']) . "\n";
    }

    // Database
    $c = $checks['database'];
    if ($c['connected']) {
        echo "[{$c['status']}] Database: connected, version={$c['version']}, users={$c['user_count']}\n";
    }
    else {
        echo "[{$c['status']}] Database: NOT CONNECTED - {$c['error']}\n";
    }

    // Cron
    $c = $checks['cron'];
    $ago = $c['seconds_ago'] !== null ? format_seconds_ago($c['seconds_ago']) : 'never';
    echo "[{$c['status']}] Cron: last run {$ago}";
    if ($c['stuck_locks'] > 0) {
        echo ", {$c['stuck_locks']} stuck lock(s)";
    }
    echo "\n";

    // Disk
    $c = $checks['disk'];
    if ($c['free_human'] && $c['total_human']) {
        echo "[{$c['status']}] Disk: {$c['free_human']} free / {$c['total_human']} total ({$c['used_percent']}% used)";
    }
    else {
        echo "[{$c['status']}] Disk: dataroot " . ($c['exists'] ? 'exists' : 'MISSING');
    }
    if (!$c['writable']) {
        echo " NOT WRITABLE";
    }
    echo "\n";

    // Modules
    $c = $checks['modules'];
    echo "[{$c['status']}] Modules: {$c['missing_count']} uninstalled with DB schemas\n";
    if (!empty($c['missing'])) {
        foreach ($c['missing'] as $m) {
            echo "  - {$m}\n";
        }
    }

    // Config
    $c = $checks['config'];
    echo "[{$c['status']}] Config: site_closed=" . ($c['site_closed'] ? 'yes' : 'no') . "\n";
}
else {
    header('Content-Type: application/json');
    echo json_encode($result, JSON_PRETTY_PRINT);
}

/**
 * Format bytes to human readable string
 */
function format_bytes($bytes) {
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
function format_seconds_ago($seconds) {
    if ($seconds < 60) {
        return $seconds . 's ago';
    }
    if ($seconds < 3600) {
        return round($seconds / 60) . 'min ago';
    }
    if ($seconds < 86400) {
        return round($seconds / 3600, 1) . 'h ago';
    }
    return round($seconds / 86400, 1) . 'd ago';
}
