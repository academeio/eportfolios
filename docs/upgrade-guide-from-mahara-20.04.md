# Upgrade Guide: Mahara 20.04 → Academe ePortfolios 22.20.x

**Last updated:** 04-03-2026
**Tested with:** Mahara 20.04.1 (2020013009) → Academe ePortfolios 22.20.3 (2026030301)
**Production tested on:** SBVU ePortfolios (3,611 users, 131,686 views, 1.54M tags, 104 GB dataroot)

---

## Prerequisites

- PHP 7.4 (required for running the upgrade CLI — Mahara 20.04 migration code paths are not PHP 8.1 compatible)
- PHP 8.1 (for running the application after upgrade)
- MariaDB 10.6+ or MySQL 8.0+
- Academe ePortfolios 22.20.x code deployed on target server

## CRITICAL: Tag Table Fix Before Upgrade

**This single fix reduced upgrade time from 15+ hours to ~4 hours on a 131K view database.**

### The Problem

Mahara's `tag.resourceid` column is `varchar(255)` but only stores numeric IDs. When the upgrade migration loop runs `new View($viewid)`, the View constructor joins against the tag table:

```sql
LEFT JOIN tag t ON t.resourcetype = 'artefact' AND t.resourceid = a.id
```

The type mismatch between `tag.resourceid` (varchar) and `artefact.id` (bigint) prevents MariaDB from using any resourceid-first index. Combined with the default index `(resourcetype, resourceid, tag)` where `resourcetype='artefact'` matches 97% of the table (767K+ rows), every single artefact lookup triggers a near-full table scan.

For a user with 2,455 artefacts, that's ~1.88 billion row comparisons per query. Multiply by 131K views and the upgrade takes 15+ hours.

### The Fix (apply BEFORE running upgrade)

```sql
-- 1. Convert resourceid from varchar to bigint (enables index ref lookups)
ALTER TABLE tag MODIFY COLUMN resourceid BIGINT NOT NULL;

-- 2. Add covering index with resourceid first (high selectivity → 1-2 rows per lookup)
ALTER TABLE tag ADD INDEX tag_resid_restyp_tag_ix (resourceid, resourcetype, tag);

-- 3. Drop the old index (optimizer may prefer it as a covering index)
--    Check the old index name first: SHOW INDEX FROM tag;
--    It's typically named tagresourcetyperesourceidtagix or similar
ALTER TABLE tag DROP INDEX tagresourcetyperesourceidtagix;
```

**Why this works:** With `resourceid` as BIGINT and first in the index, each artefact ID matches ~2 tag rows instead of scanning 767K. The upgrade loop processes views at ~145-190 views/min instead of ~19 views/hour.

**Space cost:** ~120 MB additional index on a 1.5M row tag table. Negligible.

**Risk:** None — additive change, the column already contains only numeric values.

### Additional Recommended Pre-upgrade Indexes

```sql
-- Speeds up "shared with me" permission queries (3.6s → <0.1s)
ALTER TABLE view_access ADD INDEX viewacce_usr_view_ix (usr, view);
```

## Pre-upgrade Checklist

```sql
-- 1. Tag table fix (CRITICAL — see above)
ALTER TABLE tag MODIFY COLUMN resourceid BIGINT NOT NULL;
ALTER TABLE tag ADD INDEX tag_resid_restyp_tag_ix (resourceid, resourcetype, tag);
-- Drop old (resourcetype, resourceid, tag) index

-- 2. View access index
ALTER TABLE view_access ADD INDEX viewacce_usr_view_ix (usr, view);

-- 3. Truncate dead Elasticsearch queue (if search plugin is 'internal')
TRUNCATE TABLE search_elasticsearch_queue;

-- 4. Save view mtime (upgrade overwrites ~25K view mtimes during layout migration)
CREATE TABLE view_mtime_backup AS SELECT id, mtime FROM view;
```

## Collation Conversion (if needed)

If your database is `utf8mb3`, convert to `utf8mb4` before upgrade:

1. Drop all foreign keys (generate script from `information_schema.TABLE_CONSTRAINTS`)
2. `ALTER DATABASE dbname CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
3. Convert each table (generate script from `information_schema.TABLES`)
4. Re-add all foreign keys

**Important:** `FOREIGN_KEY_CHECKS=0` does NOT work for charset conversion in MariaDB 10.11. You must actually drop and re-add FKs.

## Running the Upgrade

### Temporarily lower minupgradefrom

Academe ePortfolios 22.20.x sets `minupgradefrom = 2022090903` (requires Mahara 22.10). Since the codebase includes ALL 22.10 migration steps, you can safely lower this for a direct 20.04 → 22.20.x upgrade:

```bash
# In lib/version.php, change:
$config->minupgradefrom = 2022090903;
# To:
$config->minupgradefrom = 2020013009;
```

**Restore to `2022090903` after the upgrade completes.**

### Run with PHP 7.4

```bash
php7.4 /path/to/htdocs/admin/cli/upgrade.php
```

The migration includes a view description-to-block conversion loop that processes every view. With the tag index fix, expect ~145-190 views/min.

### Monitor Progress

```sql
-- Count views that have been migrated (description set to empty after conversion)
SELECT COUNT(*) AS migrated FROM view WHERE description = '';
```

### Orphan Views

Views referencing deleted artefacts (e.g., journal entries that no longer exist) will throw exceptions. The codebase includes a try/catch around the migration loop that logs and skips these:

```
[DBG] Skipping view 69418: You are trying to access a journal entry that does not exist.
```

This is safe — the orphan views are skipped and the upgrade continues.

## Post-upgrade Steps

```sql
-- 1. Restore view mtime
UPDATE view v JOIN view_mtime_backup b ON v.id = b.id SET v.mtime = b.mtime;
DROP TABLE view_mtime_backup;

-- 2. Clear upgrade flag
DELETE FROM config WHERE field = 'siteclosedforupgrade';
```

```bash
# 3. Restore minupgradefrom
# In lib/version.php, change back to:
# $config->minupgradefrom = 2022090903;

# 4. Restart PHP-FPM (switch to PHP 8.1 for production)
systemctl restart php8.1-fpm
```

### Verify

```sql
SELECT field, value FROM config WHERE field IN ('version', 'release', 'series');
-- Expected: version=2026030301, release=22.20.3, series=22.20
```

## Post-upgrade Optimizations

```sql
-- Delete expired notifications (adjust retention as needed)
DELETE FROM notification_internal_activity
WHERE ctime < DATE_SUB(NOW(), INTERVAL 182 DAY);

-- Defragment key tables
OPTIMIZE TABLE notification_internal_activity, tag, artefact_blog_blogpost,
  artefact_attachment, view, view_access, block_instance;

-- Update optimizer statistics
ANALYZE TABLE artefact, tag, view, view_access,
  notification_internal_activity, block_instance;
```

## Maintenance Mode

To put the site in maintenance mode via SQL (useful for CLI-only access):

```sql
-- Enable
INSERT INTO config (field, value) VALUES ('siteclosed', '1')
  ON DUPLICATE KEY UPDATE value = '1';
INSERT INTO config (field, value) VALUES ('siteclosedbyadmin', '1')
  ON DUPLICATE KEY UPDATE value = '1';

-- Disable
UPDATE config SET value = '0' WHERE field = 'siteclosed';
UPDATE config SET value = '0' WHERE field = 'siteclosedbyadmin';
```

**Note:** Both `siteclosed` AND `siteclosedbyadmin` must be set. Setting only `siteclosed=1` is not sufficient.

## SES / Cloud Email Compatibility

If using AWS SES (or any email service that requires verified sender domains), the fix in `lib/user.php` ensures all emails use `noreplyaddress` as the `From` address with the user's email in `Reply-To`. Without this, Contact Us, forum notifications, and user-to-user emails fail with "Email address is not verified".

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Must upgrade to 2022090903 first" | Lower `minupgradefrom` in `lib/version.php` (see above) |
| Upgrade crashes on specific view ID | try/catch is included — re-run with `-f` flag |
| Upgrade takes 15+ hours | Apply tag resourceid BIGINT + index fix (see Critical section) |
| `tee` output lags behind actual progress | Run without `tee`, use SQL monitoring instead |
| SSL "unrecognized name" after DNS swap | Add new domain to Nginx `server_name` and get new SSL cert |
| Maintenance page not showing | Set BOTH `siteclosed=1` AND `siteclosedbyadmin=1` |
