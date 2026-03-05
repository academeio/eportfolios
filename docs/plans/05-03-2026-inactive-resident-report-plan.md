# Inactive Resident Report — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add "Residents not logged in since" search filter and a monthly cron-driven inactivity report module with CSV generation, admin browse page, and notifications.

**Architecture:** New `module/inactivityreport/` plugin following the standard module pattern (like `module/submissions/`). Registers a monthly cron job that generates per-institution CSV reports of inactive residents, stores them in dataroot, records history in a DB table, and notifies admins. The people search gets two new filter options that reuse existing constraint infrastructure.

**Tech Stack:** PHP 8.1, PostgreSQL/MariaDB (XMLDB schema), Smarty templates, jQuery AJAX, `generate_csv()` from `lib/mahara.php`

**Design doc:** `docs/plans/05-03-2026-inactive-resident-report-design.md`

---

### Task 1: Add "Residents" login filter options to people search

**Files:**
- Modify: `admin/users/search.php:56-61`
- Modify: `lib/searchlib.php:215-237`
- Modify: `search/internal/lib.php:665-805` (add new constraint case)
- Modify: `lang/en.utf8/admin.php`

**Step 1: Add language strings**

In `lang/en.utf8/admin.php`, find the existing login filter strings and add after `$string['usershavenotloggedinsince']`:

```php
$string['residentsloggedinsince'] = 'Residents who have logged in since';
$string['residentsnotloggedinsince'] = 'Residents who have not logged in since';
```

**Step 2: Add filter options to the search page**

In `admin/users/search.php`, after line 61 (`notsince` entry), add:

```php
$loggedintypes[] = array('name' => 'residentsince', 'string' => get_string('residentsloggedinsince', 'admin'));
$loggedintypes[] = array('name' => 'residentnotsince', 'string' => get_string('residentsnotloggedinsince', 'admin'));
```

**Step 3: Add constraint mapping in searchlib.php**

In `lib/searchlib.php`, after the `notsince` block (line 234), add:

```php
else if ($search->loggedin == 'residentsince') {
    $constraints[] = array('field'  => 'lastlogin',
                           'type'   => 'greaterthan',
                           'string' => $search->loggedindate);
    $constraints[] = array('field'  => 'resident',
                           'type'   => 'equals',
                           'string' => '1');
}
else if ($search->loggedin == 'residentnotsince') {
    $constraints[] = array('field'  => 'lastlogin',
                           'type'   => 'lessthanequal',
                           'string' => $search->loggedindate);
    $constraints[] = array('field'  => 'resident',
                           'type'   => 'equals',
                           'string' => '1');
}
```

**Step 4: Handle the `resident` constraint in the internal search plugin**

In `search/internal/lib.php`, inside the `switch ($f['field'])` block (around line 667), add a new case before `default`:

```php
case 'resident':
    // Exclude site-level and institution-level staff/admins
    $where .= ' AND u.staff = 0 AND u.admin = 0';
    $where .= ' AND u.id NOT IN (SELECT usr FROM {usr_institution} WHERE staff = 1 OR admin = 1)';
    break;
```

**Step 5: Test manually**

1. Load `admin/users/search.php` in browser
2. Verify the two new options appear in the login filter dropdown
3. Select "Residents who have not logged in since" with a date
4. Confirm results exclude staff/admin users
5. Select "Residents who have logged in since" — confirm it works

**Step 6: Commit**

```bash
git add admin/users/search.php lib/searchlib.php search/internal/lib.php lang/en.utf8/admin.php
git commit -m "feat: add 'Residents' login filter to admin people search

Adds 'Residents who have logged in since' and 'Residents who have not
logged in since' options to the people search dropdown. Residents are
users who are not staff or admin at either site or institution level."
```

---

### Task 2: Create module scaffold — version.php, lib.php, lang strings

**Files:**
- Create: `module/inactivityreport/version.php`
- Create: `module/inactivityreport/lib.php`
- Create: `module/inactivityreport/lang/en.utf8/module.inactivityreport.php`

**Step 1: Create version.php**

```php
<?php
/**
 * @package    eportfolios
 * @subpackage module-inactivityreport
 * @author     Academe Research, Inc
 * @license    https://www.gnu.org/licenses/gpl-3.0.html GNU GPL version 3 or later
 * @copyright  (C) 2026 Academe Research, Inc.
 */

defined('INTERNAL') || die();

$config = new StdClass;
$config->version = 2026030500;
$config->release = '1.0.0';
```

**Step 2: Create lib.php**

```php
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
```

**Step 3: Create language strings**

Create `module/inactivityreport/lang/en.utf8/module.inactivityreport.php`:

```php
<?php
/**
 * @package    eportfolios
 * @subpackage module-inactivityreport
 * @author     Academe Research, Inc
 * @license    https://www.gnu.org/licenses/gpl-3.0.html GNU GPL version 3 or later
 * @copyright  (C) 2026 Academe Research, Inc.
 */

defined('INTERNAL') || die();

$string['pluginname'] = 'Inactivity Report';
$string['reporthistory'] = 'Inactivity report history';
$string['reportdate'] = 'Report date';
$string['institution'] = 'Institution';
$string['inactiveresidents'] = 'Inactive residents';
$string['generated'] = 'Generated';
$string['download'] = 'Download CSV';
$string['noreports'] = 'No inactivity reports have been generated yet.';
$string['reportgenerated'] = 'Inactivity report generated for %s: %d inactive residents found.';
$string['reportsubject'] = 'Monthly inactivity report — %s';
$string['reportmessage'] = 'The monthly inactivity report for %s has been generated. %d residents registered within the last 3.5 years did not log in during %s. View and download reports at: %s';
$string['filterinstitution'] = 'Filter by institution';
$string['allinstitutions'] = 'All institutions';
```

**Step 4: Commit**

```bash
git add module/inactivityreport/
git commit -m "feat: add module/inactivityreport scaffold with cron registration

New module plugin with version.php, lib.php (PluginModuleInactivityreport
with monthly cron registration), and language strings."
```

---

### Task 3: Create DB schema — install.xml

**Files:**
- Create: `module/inactivityreport/db/install.xml`

**Step 1: Create install.xml**

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<XMLDB PATH="module/inactivityreport/db" VERSION="20260305"
       COMMENT="XMLDB file for inactivityreport module tables"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:noNamespaceSchemaLocation="../../../lib/xmldb/xmldb.xsd"
>
    <TABLES>
        <TABLE NAME="module_inactivityreport_history">
            <FIELDS>
                <FIELD NAME="id" TYPE="int" LENGTH="10" SEQUENCE="true" NOTNULL="true"/>
                <FIELD NAME="institution" TYPE="char" LENGTH="255" NOTNULL="true"/>
                <FIELD NAME="report_date" TYPE="datetime" NOTNULL="true"/>
                <FIELD NAME="period_start" TYPE="datetime" NOTNULL="true"/>
                <FIELD NAME="period_end" TYPE="datetime" NOTNULL="true"/>
                <FIELD NAME="resident_count" TYPE="int" LENGTH="10" NOTNULL="true" DEFAULT="0"/>
                <FIELD NAME="csv_path" TYPE="text" NOTNULL="false"/>
                <FIELD NAME="ctime" TYPE="datetime" NOTNULL="true"/>
            </FIELDS>
            <KEYS>
                <KEY NAME="primary" TYPE="primary" FIELDS="id"/>
            </KEYS>
            <INDEXES>
                <INDEX NAME="institutionix" UNIQUE="false" FIELDS="institution"/>
                <INDEX NAME="reportdateix" UNIQUE="false" FIELDS="report_date"/>
            </INDEXES>
        </TABLE>
    </TABLES>
</XMLDB>
```

**Step 2: Create empty upgrade.php**

Create `module/inactivityreport/db/upgrade.php`:

```php
<?php
/**
 * @package    eportfolios
 * @subpackage module-inactivityreport
 * @author     Academe Research, Inc
 * @license    https://www.gnu.org/licenses/gpl-3.0.html GNU GPL version 3 or later
 * @copyright  (C) 2026 Academe Research, Inc.
 */

defined('INTERNAL') || die();

function xmldb_module_inactivityreport_upgrade($oldversion=0) {
    return true;
}
```

**Step 3: Commit**

```bash
git add module/inactivityreport/db/
git commit -m "feat: add inactivityreport DB schema (install.xml + upgrade.php)

Creates module_inactivityreport_history table for storing generated
report metadata and CSV paths."
```

---

### Task 4: Implement cron report generation logic

**Files:**
- Modify: `module/inactivityreport/lib.php` (fill in `cron_generate_inactivity_report()`)

**Step 1: Implement the cron function**

Replace the empty `cron_generate_inactivity_report()` in `lib.php` with:

```php
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
```

**Step 2: Commit**

```bash
git add module/inactivityreport/lib.php
git commit -m "feat: implement monthly inactivity report cron generation

Generates per-institution CSV reports of inactive residents (registered
within 3.5yr, no login during previous month). Stores CSVs in dataroot,
records history in DB, and notifies site + institution admins."
```

---

### Task 5: Create admin report browsing page

**Files:**
- Create: `module/inactivityreport/report.php`
- Create: `module/inactivityreport/theme/raw/templates/module/inactivityreport/report.tpl`

**Step 1: Create report.php**

```php
<?php
/**
 * @package    eportfolios
 * @subpackage module-inactivityreport
 * @author     Academe Research, Inc
 * @license    https://www.gnu.org/licenses/gpl-3.0.html GNU GPL version 3 or later
 * @copyright  (C) 2026 Academe Research, Inc.
 */

define('INTERNAL', 1);
define('ADMIN', 1);
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
    $inst = get_record('institution', 'name', $record->institution);
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
```

**Step 2: Create report.tpl**

Create `module/inactivityreport/theme/raw/templates/module/inactivityreport/report.tpl`:

```smarty
{include file='header.tpl'}

{if $USER->get('admin') && $institutions}
<div class="card mb-3">
    <div class="card-body">
        <form method="get" action="{$WWWROOT}module/inactivityreport/report.php" class="form-inline">
            <label for="institution" class="me-2">{str tag=filterinstitution section=module.inactivityreport}:</label>
            <select name="institution" id="institution" class="form-select form-select-sm d-inline-block w-auto me-2">
                <option value="all"{if $institution_filter == 'all'} selected{/if}>{str tag=allinstitutions section=module.inactivityreport}</option>
                {foreach from=$institutions item=inst}
                <option value="{$inst->name}"{if $institution_filter == $inst->name} selected{/if}>{$inst->displayname}</option>
                {/foreach}
            </select>
            <button type="submit" class="btn btn-secondary btn-sm">{str tag=filter section=mahara}</button>
        </form>
    </div>
</div>
{/if}

{if $reports}
<div class="card">
    <h2 class="card-header">{str tag=reporthistory section=module.inactivityreport} <span class="text-small text-muted">({$count})</span></h2>
    <div class="table-responsive">
        <table class="table table-striped">
            <thead>
                <tr>
                    <th>{str tag=reportdate section=module.inactivityreport}</th>
                    <th>{str tag=institution section=module.inactivityreport}</th>
                    <th>{str tag=inactiveresidents section=module.inactivityreport}</th>
                    <th>{str tag=generated section=module.inactivityreport}</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                {foreach from=$reports item=report}
                <tr>
                    <td>{$report->report_date|format_date:'strftimedate'}</td>
                    <td>{$report->institution_displayname}</td>
                    <td>
                        {if $report->resident_count > 0}
                            <span class="text-danger">{$report->resident_count}</span>
                        {else}
                            <span class="text-success">0</span>
                        {/if}
                    </td>
                    <td>{$report->ctime|format_date:'strftimedatetime'}</td>
                    <td>
                        {if $report->resident_count > 0}
                        <a href="{$WWWROOT}module/inactivityreport/report.php?download=1&id={$report->id}" class="btn btn-sm btn-secondary">
                            <span class="icon icon-download" role="presentation" aria-hidden="true"></span>
                            {str tag=download section=module.inactivityreport}
                        </a>
                        {/if}
                    </td>
                </tr>
                {/foreach}
            </tbody>
        </table>
    </div>
</div>
{$pagination|safe}
{else}
<div class="alert alert-info">
    {str tag=noreports section=module.inactivityreport}
</div>
{/if}

{include file='footer.tpl'}
```

**Step 3: Commit**

```bash
git add module/inactivityreport/report.php module/inactivityreport/theme/
git commit -m "feat: add admin report browsing page for inactivity reports

Admin page at module/inactivityreport/report.php with institution filter,
paginated history table, and CSV download. Institution admins see only
their own institution's reports."
```

---

### Task 6: Install module and test end-to-end

**Step 1: Run database upgrade to install the module**

Visit `/admin/upgrade.php` or run:

```bash
php admin/upgrade.php
```

This will create the `module_inactivityreport_history` table and register the cron job.

**Step 2: Verify module appears in plugin admin**

Visit `/admin/extensions/plugins.php` — confirm "Inactivity Report" appears under Modules.

**Step 3: Test cron manually**

Temporarily invoke the cron function to test report generation without waiting for the 1st of the month. In a PHP test script or via the CLI:

```bash
php -r "
define('INTERNAL', 1);
define('PUBLIC', 1);
define('CRON', 1);
define('TITLE', '');
require('init.php');
safe_require('module', 'inactivityreport');
PluginModuleInactivityreport::cron_generate_inactivity_report();
"
```

Verify:
- CSV files created in `dataroot/inactivityreports/YYYY-MM/`
- Records inserted into `module_inactivityreport_history`
- Notifications sent to admin users

**Step 4: Test the report page**

Visit `/module/inactivityreport/report.php`:
- Verify table shows generated reports
- Click "Download CSV" — confirm CSV downloads with correct data
- If site admin: test institution filter dropdown
- If institution admin: confirm only their institution's reports are visible

**Step 5: Test the people search filter**

Visit `/admin/users/search.php`:
- Select "Residents who have not logged in since" with a recent date
- Verify results exclude staff/admin users
- Select "Residents who have logged in since" — verify it works

**Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete inactivity report module — search filters + monthly cron + admin page

Adds 'Residents not logged in since' filter to people search, monthly
cron-generated per-institution CSV reports, admin browse/download page,
and admin notifications. Module: module/inactivityreport."
```

---

### Summary of all files

| File | Action |
|------|--------|
| `admin/users/search.php` | Modify — add 2 filter options |
| `lib/searchlib.php` | Modify — add resident constraint mapping |
| `search/internal/lib.php` | Modify — add `resident` case in constraint switch |
| `lang/en.utf8/admin.php` | Modify — add 2 strings |
| `module/inactivityreport/version.php` | Create |
| `module/inactivityreport/lib.php` | Create — plugin class + cron + report generation |
| `module/inactivityreport/db/install.xml` | Create — history table schema |
| `module/inactivityreport/db/upgrade.php` | Create — empty scaffold |
| `module/inactivityreport/lang/en.utf8/module.inactivityreport.php` | Create |
| `module/inactivityreport/report.php` | Create — admin browse/download page |
| `module/inactivityreport/theme/raw/templates/module/inactivityreport/report.tpl` | Create |
