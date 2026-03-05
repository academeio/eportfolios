# Inactive Resident Report — Design Document

**Date:** 05-03-2026
**Status:** Approved

## Problem

After the SBVU migration, monitoring student activity requires SSH access and manual queries. We need:
1. A "Residents not logged in since" filter in the admin people search (excluding staff/admins)
2. An automated monthly report identifying inactive students, delivered to admins with CSV downloads

## Requirements

- **Residents** = users who are NOT staff or admin at either site or institution level
- Monthly cron on the 1st: students registered within 3.5 years who did not log in during the previous month
- Per-institution scoping: institution admins see only their institution; site admins see all
- Recipients: site admins + institution admins, via internal notification
- Output: CSV email attachment + browsable admin report page with download history

## Part 1: People Search — "Residents" Filter

### Changes

**`admin/users/search.php`** — Add two new entries to `$loggedintypes`:
- `residentsince` — "Residents who have logged in since"
- `residentnotsince` — "Residents who have not logged in since"

**`lib/searchlib.php`** — Add constraint handling for the two new types. The SQL excludes staff/admins:
```sql
AND u.staff = 0 AND u.admin = 0
AND u.id NOT IN (
    SELECT usr FROM {usr_institution} WHERE staff = 1 OR admin = 1
)
```
Combined with the existing `lastlogin` greater-than / less-than-equal logic.

**`lang/en.utf8/admin.php`** — New strings:
- `residentsloggedinsince` = "Residents who have logged in since"
- `residentsnotloggedinsince` = "Residents who have not logged in since"

No DB changes, no template changes — the existing dropdown and search infrastructure handles it.

## Part 2: Module — `module/inactivityreport/`

### File Structure

```
module/inactivityreport/
├── lib.php
├── version.php
├── db/install.xml
├── db/upgrade.php
├── lang/en.utf8/module.inactivityreport.php
├── report.php
└── theme/raw/templates/module/inactivityreport/
    └── report.tpl
```

### DB Table — `module_inactivityreport_history`

| Column | Type | Purpose |
|--------|------|---------|
| id | serial | PK |
| institution | varchar(255) | Institution shortname |
| report_date | timestamp | 1st of the month this report covers |
| period_start | timestamp | Start of "not logged in" window |
| period_end | timestamp | End of window (last day of prev month) |
| resident_count | int | Total inactive residents found |
| csv_path | text | Path in dataroot to generated CSV |
| ctime | timestamp | When report was generated |

### Cron Registration

In `PluginModuleInactivityreport::get_cron()`:
```php
return [
    (object) [
        'callfunction' => 'cron_generate_inactivity_report',
        'minute' => 0,
        'hour'   => 2,    // 2 AM server time
        'day'    => 1,    // 1st of month
        'month'  => '*',  // every month
    ]
];
```

### Report Generation Logic

`cron_generate_inactivity_report()`:

1. Calculate window: `period_start` = 1st of previous month, `period_end` = last day of previous month
2. Calculate registration cutoff: 3 years + 6 months before today
3. For each institution:

```sql
SELECT u.id, u.username, u.firstname, u.lastname, u.email,
       i.displayname AS institution_name, u.lastlogin, u.ctime AS registered
FROM {usr} u
JOIN {usr_institution} ui ON u.id = ui.usr AND ui.institution = ?
JOIN {institution} i ON i.name = ui.institution
WHERE u.deleted = 0
  AND u.staff = 0
  AND u.admin = 0
  AND ui.staff = 0
  AND ui.admin = 0
  AND u.ctime >= ?                -- registered within 3.5 years
  AND (u.lastlogin IS NULL OR u.lastlogin < ?)  -- no login during prev month
ORDER BY u.lastname, u.firstname
```

4. For each user, aggregate group names (departments):
   - PostgreSQL: subquery with `string_agg(g.name, ', ')`
   - MySQL/MariaDB: subquery with `GROUP_CONCAT(g.name SEPARATOR ', ')`

5. Generate CSV via `generate_csv()` with columns:

| Column | Source |
|--------|--------|
| Username | `u.username` |
| First name | `u.firstname` |
| Last name | `u.lastname` |
| Email | `u.email` |
| Institution | `i.displayname` |
| Group(s) | Aggregated `g.name` from `{group_member}` + `{group}` |
| Registered | `u.ctime` |
| Last login | `u.lastlogin` (or "Never") |

6. Store CSV in `dataroot/inactivityreports/YYYY-MM/institution_shortname.csv`
7. Insert record into `module_inactivityreport_history`
8. Notify admins via `activity_occurred('maharamessage', ...)`:
   - Site admins: summary of all institutions with link to report page
   - Institution admins: their institution's count with download link

### Admin Report Page — `report.php`

- **URL**: `{wwwroot}module/inactivityreport/report.php`
- **Access**: `define('ADMIN', 1)` — site admins see all, institution admins see their own
- **Layout**: Standard admin page with paginated history table

| Report Date | Institution | Inactive Residents | Generated | Download |
|-------------|------------|-------------------|-----------|----------|
| 01-03-2026 | Sri Balaji Vidyapeeth University | 142 | 01-03-2026 02:01 AM | CSV |

- **Filters**: Institution dropdown (site admins), date range
- **Download**: `report.php?download=1&id=N` — reads CSV from dataroot with permission check
- **Menu**: Listed under Reports in admin navigation

## Patterns Used

- Module plugin: follows `module/submissions/` structure exactly
- Cron: `get_cron()` array with `callfunction/minute/hour/day/month`
- CSV: `generate_csv()` from `lib/mahara.php`
- Notifications: `activity_occurred('maharamessage', ...)` from `lib/activity.php`
- Search constraints: extends existing pattern in `lib/searchlib.php`
- Admin pages: `define('ADMIN', 1)` + `init.php` bootstrap
