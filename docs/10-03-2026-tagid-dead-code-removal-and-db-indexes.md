# Dead `tagid_%` Code Removal & Database Index Recommendations

**Date:** 10-03-2026
**Release:** v22.20.6
**Upstream relevance:** These findings apply to all Mahara 22.x installations with institution tags

---

## Summary

During a workshop incident where 25+ concurrent portfolio copies crashed the server, we discovered two independent performance issues in the tag subsystem:

1. **Missing database indexes** on the 1.66M-row `tag` table causing full table scans
2. **Dead `tagid_%` code** adding 2 unnecessary LEFT JOINs to every tag query site-wide

This release removes the dead code (13 files, -268 lines) and documents the required database indexes.

---

## The `tagid_%` Pattern — What It Was

Mahara's tag system had a mechanism for storing institution tag references as `tagid_<N>` (where N is the `tag.id` of the institution tag definition). Every tag query included:

```sql
SELECT
    (CASE
        WHEN t.tag LIKE 'tagid_%' THEN CONCAT(i.displayname, ': ', t2.tag)
        ELSE t.tag
    END) AS tag
FROM {tag} t
LEFT JOIN {tag} t2 ON t2.id::varchar = SUBSTRING(t.tag, 7)
LEFT JOIN {institution} i ON i.name = t2.ownerid
```

**Problems:**
- `SUBSTRING(t.tag, 7)` is a function-based join — it can never use an index
- The 2 LEFT JOINs execute on every tag query even when zero `tagid_%` tags exist
- In our production database (1.66M tags, 3611 users), **zero** `tagid_%` tags exist
- The tagged posts block save code converted institution tags to `tagid_N` format, but the filter query matched against plain `{tag}.tag` values — so **institution tag filtering in tagged posts blocks has been silently broken**

## What Was Removed (13 files)

### Read paths — CASE/SUBSTRING/LEFT JOIN removed:

| File | Function/Context |
|---|---|
| `lib/view.php` | `get_tags()`, `get_all_tags_for_view()` |
| `lib/mahara.php` | `get_my_tags()`, `check_if_institution_tag()`, `check_case_sensitive()` |
| `lib/collection.php` | `Collection::get_tags()` |
| `lib/form/elements/tags.php` | `get_all_tags_for_user()` (Part 1 UNION), `AND tag NOT LIKE ('tagid_%')` filters on Parts 2-4 |
| `artefact/lib.php` | `get_attachments_for_artefact()`, `get_attachments()`, `artefact_get_tags()` |
| `artefact/file/lib.php` | File listing tag display |
| `blocktype/lib.php` | `BlockInstance::get_tags()` |
| `view/editlayout.php` | Tag dropdown for block layout editor |
| `search/internal/lib.php` | 7 tag query variants (view, collection, artefact, blocktype + cross-joins) |
| `artefact/blog/blocktype/taggedposts/lib.php` | Block heading tag display |
| `artefact/blog/blocktype/taggedposts/taggedposts.json.php` | Tag search autocomplete |

### Write paths — `tagid_N` creation removed:

| File | What changed |
|---|---|
| `artefact/blog/blocktype/taggedposts/lib.php` | Save now stores plain tag string instead of `tagid_N` (fixes broken institution tag filtering) |
| `search/internal/lib.php` | Search now uses plain tag for institution tag queries instead of converting to `tagid_N` |
| `lib/institution.php` | Removed `tagid_%` rename block on institution leave |

### Dead UNION removed:

| File | What changed |
|---|---|
| `admin/users/institutiontags.php` | Removed second UNION that counted `tagid_%` references (always returned 0) |

### Preserved:

- `$typecast` (`is_postgres() ? '::varchar' : ''`) kept where needed for legitimate non-tag resource ID joins (e.g., `group.id::varchar = t.ownerid`)
- All institution tag prefix display logic in `display_tag()` and `get_all_tags_for_user()` preserved — these use the `i.displayname` prefix from the institution tags UNION, not from `tagid_%` resolution

---

## Recommended Database Indexes

These indexes are critical for any Mahara installation with a large `tag` table (100K+ rows). They should be applied regardless of the code changes above.

### Index 1: Institution tag resolution (prevents full table scans)

```sql
ALTER TABLE tag ADD INDEX tag_restyp_owntyp_ownid_tag_ix (resourcetype, ownertype, ownerid, tag);
```

**Impact:** Portfolio copy with N institution tags fires N queries. Without this index, each query scans the entire tag table.

| Metric | Before | After |
|---|---|---|
| EXPLAIN | `ALL, 1,659,643 rows` | `ref, 1 row, Using index` |
| Query time | 8-15 seconds | 17 ms |
| 25 concurrent copies | Server crash (load 29) | Instant |

### Index 2: Per-user tag cloud (prevents wide range scans)

```sql
ALTER TABLE tag ADD INDEX tag_owntyp_ownid_restyp_tag_ix (ownertype, ownerid, resourcetype, tag);
```

**Impact:** Tag editor and My Tags page query. Without this, `ownertype='user'` matches 99.98% of rows before narrowing.

| Metric | Before | After |
|---|---|---|
| EXPLAIN | `range, 912,240 rows` | `range, 7,689 rows` (per-user) |
| Query time (heaviest user) | Several seconds | 59 ms |

### Note on `ownerid` column type

The `ownerid` column is `varchar(100)` but Mahara sometimes passes integer values for user/group lookups. MariaDB handles this via implicit cast, but verify `EXPLAIN` shows `ref` not `ALL` after adding indexes. String-quoted values always work correctly.

---

## Incident Summary

On 10-03-2026, a workshop where students were asked to copy a model portfolio with institution EPA tags caused all 30 PHP-FPM workers to block on full table scans. Load spiked to 29 on 4 vCPUs. The emergency index addition (Index 1) resolved the issue in under 5 minutes. Full incident report: see SBV ePortfolios deployment docs.

---

## How to Verify Your Installation

Check if you have `tagid_%` tags:

```sql
SELECT COUNT(*) FROM tag WHERE tag LIKE 'tagid_%';
```

If the count is 0 (as it was in our 1.66M-row production database), the CASE/SUBSTRING/LEFT JOIN code is pure overhead.

Check if you have the recommended indexes:

```sql
SHOW INDEX FROM tag WHERE Key_name LIKE 'tag_%_ix';
```

---

## Compatibility

- These code changes are backward-compatible — if `tagid_%` tags somehow exist, they will be treated as literal tag strings (displayed as-is)
- The `blocktype_taggedposts_tags` table may contain stale `tagid_N` values from before this fix. A one-time cleanup query:

```sql
-- Preview what would change
SELECT bt.id, bt.tag, t.tag AS actual_tag
FROM blocktype_taggedposts_tags bt
JOIN tag t ON t.id = CAST(SUBSTRING(bt.tag, 7) AS UNSIGNED)
WHERE bt.tag LIKE 'tagid_%';

-- Apply fix (run only if preview shows rows)
UPDATE blocktype_taggedposts_tags bt
JOIN tag t ON t.id = CAST(SUBSTRING(bt.tag, 7) AS UNSIGNED)
SET bt.tag = t.tag
WHERE bt.tag LIKE 'tagid_%';
```
