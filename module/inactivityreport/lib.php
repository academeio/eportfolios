<?php
/**
 * @package    eportfolios
 * @subpackage module-inactivityreport
 * @author     Academe Research, Inc
 * @license    https://www.gnu.org/licenses/gpl-3.0.html GNU GPL version 3 or later
 * @copyright  (C) 2026 Academe Research, Inc.
 */

defined('INTERNAL') || die();

class PluginModuleInactivityreport extends PluginModule {

    public static function get_plugin_display_name() {
        return get_string('pluginname', 'module.inactivityreport');
    }

    public static function get_plugin_name() {
        return 'inactivityreport';
    }

    public static function is_active() {
        return is_plugin_active('inactivityreport', 'module');
    }

    public static function get_cron() {
        return array(
            (object) array(
                'callfunction' => 'cron_generate_inactivity_report',
                'minute' => 0,
                'hour'   => 2,
                'day'    => 1,
                'month'  => '*',
            ),
        );
    }

    public static function cron_generate_inactivity_report() {
        // Implemented in Task 4
    }
}
