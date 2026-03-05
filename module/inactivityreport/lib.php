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
        log_info('inactivityreport: starting monthly report generation');

        // Calculate date window: previous month
        $now = time();
        $period_end = strtotime('last day of previous month', $now);
        $period_start = strtotime('first day of previous month', $now);
        $report_date = date('Y-m-01', $now); // 1st of current month

        // Registration cutoff: 3 years + 6 months ago
        $registration_cutoff = strtotime('-3 years -6 months', $now);

        // Get all institutions
        $institutions = get_records_array('institution', '', '', 'name');
        if (empty($institutions)) {
            log_info('inactivityreport: no institutions found, skipping');
            return;
        }

        // Ensure storage directory exists
        $basedir = get_config('dataroot') . 'inactivityreports/' . date('Y-m', $now) . '/';
        if (!is_dir($basedir)) {
            mkdir($basedir, 0700, true);
        }

        $is_postgres = is_postgres();

        foreach ($institutions as $inst) {
            $instname = $inst->name;

            // Build group aggregation subquery based on DB type
            if ($is_postgres) {
                $group_agg = "(SELECT string_agg(g.name, ', ' ORDER BY g.name)
                    FROM {group_member} gm
                    JOIN {group} g ON g.id = gm.\"group\" AND g.deleted = 0
                    WHERE gm.member = u.id)";
            }
            else {
                $group_agg = "(SELECT GROUP_CONCAT(g.name ORDER BY g.name SEPARATOR ', ')
                    FROM {group_member} gm
                    JOIN {group} g ON g.id = gm.\"group\" AND g.deleted = 0
                    WHERE gm.member = u.id)";
            }

            if ($instname == 'mahara') {
                // Default institution: users NOT in any institution
                $sql = "SELECT u.id, u.username, u.firstname, u.lastname, u.email,
                            ? AS institution_name,
                            u.lastlogin, u.ctime AS registered,
                            {$group_agg} AS groups
                        FROM {usr} u
                        WHERE u.deleted = 0
                          AND u.staff = 0
                          AND u.admin = 0
                          AND u.id NOT IN (SELECT usr FROM {usr_institution})
                          AND u.ctime >= ?
                          AND (u.lastlogin IS NULL OR u.lastlogin < ?)
                          AND u.id != 0
                        ORDER BY u.lastname, u.firstname";
                $values = array(
                    $inst->displayname,
                    db_format_timestamp($registration_cutoff),
                    db_format_timestamp($period_start),
                );
            }
            else {
                $sql = "SELECT u.id, u.username, u.firstname, u.lastname, u.email,
                            i.displayname AS institution_name,
                            u.lastlogin, u.ctime AS registered,
                            {$group_agg} AS groups
                        FROM {usr} u
                        JOIN {usr_institution} ui ON u.id = ui.usr AND ui.institution = ?
                        JOIN {institution} i ON i.name = ui.institution
                        WHERE u.deleted = 0
                          AND u.staff = 0
                          AND u.admin = 0
                          AND ui.staff = 0
                          AND ui.admin = 0
                          AND u.ctime >= ?
                          AND (u.lastlogin IS NULL OR u.lastlogin < ?)
                        ORDER BY u.lastname, u.firstname";
                $values = array(
                    $instname,
                    db_format_timestamp($registration_cutoff),
                    db_format_timestamp($period_start),
                );
            }

            $residents = get_records_sql_array($sql, $values);
            $count = $residents ? count($residents) : 0;

            // Format data for CSV
            $csvdata = array();
            if ($residents) {
                foreach ($residents as $r) {
                    $csvdata[] = (object) array(
                        'username'    => $r->username,
                        'firstname'   => $r->firstname,
                        'lastname'    => $r->lastname,
                        'email'       => $r->email,
                        'institution' => $r->institution_name,
                        'groups'      => $r->groups ? $r->groups : '',
                        'registered'  => $r->registered ? format_date(strtotime($r->registered), 'strftimedate') : '',
                        'lastlogin'   => $r->lastlogin ? format_date(strtotime($r->lastlogin), 'strftimedate') : 'Never',
                    );
                }
            }

            $csvfields = array('username', 'firstname', 'lastname', 'email', 'institution', 'groups', 'registered', 'lastlogin');
            $csv = generate_csv($csvdata, $csvfields);

            // Save CSV
            $csvfilename = $instname . '.csv';
            $csvpath = $basedir . $csvfilename;
            file_put_contents($csvpath, $csv);

            // Record in history table
            $record = (object) array(
                'institution'    => $instname,
                'report_date'    => db_format_timestamp(strtotime($report_date)),
                'period_start'   => db_format_timestamp($period_start),
                'period_end'     => db_format_timestamp($period_end),
                'resident_count' => $count,
                'csv_path'       => $csvpath,
                'ctime'          => db_format_timestamp($now),
            );
            insert_record('module_inactivityreport_history', $record);

            log_info("inactivityreport: {$inst->displayname} — {$count} inactive residents");

            // Notify admins
            self::notify_admins($inst, $count, date('F Y', $period_start));
        }

        log_info('inactivityreport: monthly report generation complete');
    }

    private static function notify_admins($institution, $count, $period_label) {
        $reporturl = get_config('wwwroot') . 'module/inactivityreport/report.php';

        if ($institution->name == 'mahara') {
            // Notify site admins
            $admins = get_column('usr', 'id', 'admin', 1, 'deleted', 0);
        }
        else {
            // Notify institution admins + site admins
            $instadmins = get_column('usr_institution', 'usr', 'institution', $institution->name, 'admin', 1);
            $siteadmins = get_column('usr', 'id', 'admin', 1, 'deleted', 0);
            $admins = array_unique(array_merge($instadmins ? $instadmins : array(), $siteadmins ? $siteadmins : array()));
        }

        if (empty($admins)) {
            return;
        }

        activity_occurred('maharamessage', array(
            'users'   => $admins,
            'subject' => get_string('reportsubject', 'module.inactivityreport', $institution->displayname),
            'message' => get_string('reportmessage', 'module.inactivityreport',
                $institution->displayname, $count, $period_label, $reporturl),
        ));
    }
}
