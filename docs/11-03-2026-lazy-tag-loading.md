# Lazy Tag Loading in ArtefactType

**Date:** 11-03-2026
**Release:** v22.20.7
**Commit:** `4f9b73f`

---

## Summary

ArtefactType objects were eagerly loading tags from the database during construction. On a production database with 1.66M tags, this meant every artefact construction fired a query against the tag table — even when the page never displays tags (which is ~90% of page loads). This change makes tag loading lazy: tags are only fetched from the database when first accessed.

---

## The Problem

### Eager loading in constructor

`ArtefactType::__construct()` (artefact/lib.php:358) called `artefact_get_tags($this->id)` unconditionally:

```php
// load tags
if ($this->id) {
    $this->tags = ArtefactType::artefact_get_tags($this->id);
}
```

Each call executes:

```sql
SELECT t.tag FROM {tag} t
WHERE t.resourcetype = 'artefact' AND t.resourceid = ?
ORDER BY tag
```

### Impact on SBVU production

- 1.66M rows in the tag table
- Users with hundreds of artefacts trigger hundreds of tag queries per page load
- File browser, dashboard, portfolio pages — all construct artefacts but rarely display tags
- These queries compound with the other tag performance issues (missing indexes, `tagid_%` dead code) documented in `10-03-2026-tagid-dead-code-removal-and-db-indexes.md`

### Pre-existing bugs discovered

**1. Pointless tag DELETE+INSERT on every save**

`commit()` unconditionally deleted all tags for an existing artefact, then re-inserted them — even when only non-tag fields (title, description, etc.) were modified:

```php
// Before: runs on EVERY commit, regardless of whether tags changed
if (!$is_new) {
    $deleted = delete_records('tag', 'resourcetype', 'artefact', 'resourceid', $this->id);
}
if (is_array($this->tags)) {
    // ... re-insert all tags
}
```

This meant every artefact save (title edit, description change, file rename, etc.) performed 1 DELETE + N INSERT queries against the tag table for no reason.

**2. PHP `null == array()` quirk preventing tag clearing**

PHP considers `null == array()` to be `true`. The `set()` method's dirty check used `!=`:

```php
if ($this->{$field} != $value) {
    $this->dirty = true;
}
```

When `$this->tags` was `null` (unloaded) and a caller set tags to `array()` (clear all tags), PHP evaluated `null != array()` as `false`, so `dirty` was never set and `commit()` was never called. Tags appeared uncleared.

---

## The Fix

### Changes to `artefact/lib.php`

**1. Property declaration**

```php
// Before:
protected $tags = array();

// After:
protected $tags = null;
private $tags_loaded = false;
private $tags_dirty = false;
```

- `$tags = null` — distinguishes "not yet loaded" from "loaded as empty array"
- `$tags_loaded` — tracks whether tags have been fetched from DB
- `$tags_dirty` — tracks whether tags have been explicitly set/modified (controls commit behavior)

**2. Constructor — removed eager load**

```php
// Before:
if ($this->id) {
    $this->tags = ArtefactType::artefact_get_tags($this->id);
}

// After:
// Tags are loaded lazily via get_tags() on first access.
```

If tags are passed in via `$data` (e.g., during import), they're marked as loaded+dirty in the data loop.

**3. New `get_tags()` method + `get()` routing**

```php
public function get($field) {
    // ...
    if ($field == 'tags') {
        return $this->get_tags();
    }
    return $this->{$field};
}

public function get_tags() {
    if (!$this->tags_loaded && $this->id) {
        $this->tags = ArtefactType::artefact_get_tags($this->id);
        $this->tags_loaded = true;
    }
    return is_array($this->tags) ? $this->tags : array();
}
```

All existing callers use `$artefact->get('tags')` — they get lazy loading transparently.

**4. `set()` — tags handled before generic dirty check**

```php
if ($field == 'tags') {
    // Tags need special handling: null == array() in PHP,
    // so the generic != check below would miss the change.
    $this->tags_dirty = true;
    $this->tags_loaded = true;
    $this->dirty = true;
}
else if ($this->{$field} != $value) {
    $this->dirty = true;
    // ...
}
```

**5. `commit()` — tag operations guarded by `tags_dirty`**

```php
// Before: unconditional delete on every save
if (!$is_new) {
    $deleted = delete_records('tag', 'resourcetype', 'artefact', 'resourceid', $this->id);
}
if (is_array($this->tags)) { ... }

// After: only when tags were explicitly modified
if ($this->tags_dirty && !$is_new) {
    delete_records('tag', 'resourcetype', 'artefact', 'resourceid', $this->id);
}
if ($this->tags_dirty && is_array($this->tags)) { ... }
```

---

## What Was NOT Changed

- **View tags** (`lib/view.php`) — already lazy loaded via `get_tags()` with `isset($this->tags)` guard
- **Collection tags** (`lib/collection.php`) — already lazy loaded
- **BlockInstance tags** (`blocktype/lib.php`) — already lazy loaded
- **`artefact_get_tags()` static method** — unchanged, still used by external code for explicit tag loading on stdClass query results
- **Tag display in templates** — all use `$artefact->get('tags')` which routes through the new lazy loader
- **Tag saving** — same delete+insert pattern, just guarded by `tags_dirty`

---

## Testing

### Automated tests (19/19 passing)

| Test | Description | Result |
|------|-------------|--------|
| 1 | Artefact constructs without loading tags | PASS |
| 2 | Tags load on first `get('tags')` call | PASS |
| 3 | Tags cached on second call | PASS |
| 4 | `get_tags()` direct method works | PASS |
| 5 | Tagless artefact returns empty array | PASS |
| 6 | `set('tags')` + `commit()` persists correctly | PASS |
| 7 | Non-tag field edit preserves existing tags | PASS |
| 8 | New artefact with tags via `set()` | PASS |
| 9 | Constructor with comma-string tags in `$data` | PASS |
| 10 | Clear tags with empty array | PASS |
| 11 | Page load simulation (construct many, access few) | PASS |

### Web smoke tests

| Page | Status |
|------|--------|
| Homepage (`/`) | 200 |
| Admin dashboard (`/admin/`) | 200 |
| Portfolio views (`/view/index.php`) | 200 |
| Blog/journal (`/artefact/blog/index.php`) | 200 |
| Edit tags (`/edittags.php`) | 200 |
| My tags (`/tags.php`) | 200 |

### Production testing (pending)

To be tested on SBVU (3,611 users, 1.66M tags) after DigitalOcean snapshot:
- Journal pages render with tags displayed correctly
- Editing blog post tags persists
- Editing blog post title (without touching tags) doesn't wipe tags
- Portfolio copy preserves tags on copied artefacts
- General page load speed improvement

---

## Lessons Learned

1. **Check what's already lazy before optimizing.** View, Collection, and BlockInstance already had lazy tag loading. Only ArtefactType was eager — targeted analysis saved unnecessary work.

2. **PHP's loose comparisons bite hard.** `null == array()` being `true` is well-known but easy to forget. Using strict types or explicit flag tracking (`tags_dirty`) is safer than relying on value comparison for change detection.

3. **Existing commit patterns may hide waste.** The unconditional DELETE+INSERT in `commit()` was invisible overhead — every artefact save churned the tag table. Without the lazy loading investigation, this would never have been noticed.

4. **`protected` properties with `private` flags is the right pattern.** `$tags` stays `protected` (subclasses can access it), while `$tags_loaded` and `$tags_dirty` are `private` (only the base class manages lazy loading state). Subclasses that override `commit()` and call `parent::commit()` get the optimization automatically.

---

## Related

- `docs/10-03-2026-tagid-dead-code-removal-and-db-indexes.md` — dead `tagid_%` code removal and DB index recommendations
- `docs/planned-features.md` — tag cloud caching and tag deduplication (remaining 22.20.7 items)
- `docs/upgrade-guide-from-mahara-20.04.md` — tag table performance fixes for the upgrade path
