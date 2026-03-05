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
        if (!is_cli()) {
            header('Content-Type: application/json');
            echo json_encode(array('error' => true, 'message' => 'Access denied'));
        }
        else {
            echo "Access denied: invalid or missing urlsecret\n";
        }
        exit;
    }
}

// Parameters
if (is_cli()) {
    $lines = 50;
    $level = 'all';
    // Parse CLI args: --lines=N --level=warn
    global $argv;
    if (!empty($argv)) {
        foreach ($argv as $arg) {
            if (strpos($arg, '--lines=') === 0) {
                $lines = (int)substr($arg, 8);
            }
            if (strpos($arg, '--level=') === 0) {
                $level = substr($arg, 8);
            }
        }
    }
}
else {
    $lines = param_integer('lines', 50);
    $level = param_alpha('level', 'all');
}

// Cap lines to a reasonable maximum
$lines = min($lines, 500);

// Find log files
$logfiles = array();

// PHP error log
$php_error_log = ini_get('error_log');
if (!empty($php_error_log) && file_exists($php_error_log) && is_readable($php_error_log)) {
    $logfiles['php_error_log'] = $php_error_log;
}

// Config-specified log file
$cfg_log_file = get_config('log_file');
if (!empty($cfg_log_file) && file_exists($cfg_log_file) && is_readable($cfg_log_file)) {
    $logfiles['app_log'] = $cfg_log_file;
}

$result = array(
    'timestamp' => date('Y-m-d H:i:s'),
    'lines_requested' => $lines,
    'level_filter' => $level,
    'logs' => array(),
);

foreach ($logfiles as $log_name => $log_path) {
    $log_lines = tail_file($log_path, $lines);

    // Filter by level if requested
    if ($level !== 'all') {
        $filtered = array();
        foreach ($log_lines as $line) {
            $line_lower = strtolower($line);
            if ($level === 'warn' && (
                strpos($line_lower, 'warning') !== false ||
                strpos($line_lower, 'error') !== false ||
                strpos($line_lower, 'fatal') !== false ||
                strpos($line_lower, 'critical') !== false
            )) {
                $filtered[] = $line;
            }
            else if ($level === 'info' && (
                strpos($line_lower, 'info') !== false ||
                strpos($line_lower, 'notice') !== false
            )) {
                $filtered[] = $line;
            }
        }
        $log_lines = $filtered;
    }

    $result['logs'][$log_name] = array(
        'path' => $log_path,
        'line_count' => count($log_lines),
        'lines' => $log_lines,
    );
}

// Output
if (is_cli()) {
    echo "Error Log Viewer\n";
    echo "Timestamp: " . $result['timestamp'] . "\n";
    echo "Filter: level={$level}, lines={$lines}\n";
    echo str_repeat('=', 60) . "\n";

    if (empty($logfiles)) {
        echo "No readable log files found.\n";
        echo "Checked: ini_get('error_log'), \$cfg->log_file\n";
    }

    foreach ($result['logs'] as $log_name => $log_data) {
        echo "\n[{$log_name}] {$log_data['path']} ({$log_data['line_count']} lines)\n";
        echo str_repeat('-', 60) . "\n";
        foreach ($log_data['lines'] as $line) {
            echo $line . "\n";
        }
    }
}
else {
    header('Content-Type: application/json');
    echo json_encode($result, JSON_PRETTY_PRINT);
}

/**
 * Read last N lines from a file efficiently (without loading entire file)
 */
function tail_file($filepath, $num_lines) {
    $lines = array();
    $fp = @fopen($filepath, 'r');
    if ($fp === false) {
        return $lines;
    }

    // For small files, just read all lines
    $filesize = filesize($filepath);
    if ($filesize < 65536) {
        $content = fread($fp, $filesize);
        fclose($fp);
        $all_lines = explode("\n", rtrim($content, "\n"));
        return array_slice($all_lines, -$num_lines);
    }

    // For large files, read from end in chunks
    $chunk_size = 8192;
    $buffer = '';
    $line_count = 0;

    fseek($fp, 0, SEEK_END);
    $pos = ftell($fp);

    while ($pos > 0 && $line_count < $num_lines) {
        $read_size = min($chunk_size, $pos);
        $pos -= $read_size;
        fseek($fp, $pos);
        $buffer = fread($fp, $read_size) . $buffer;
        $line_count = substr_count($buffer, "\n");
    }

    fclose($fp);

    $all_lines = explode("\n", rtrim($buffer, "\n"));
    return array_slice($all_lines, -$num_lines);
}
