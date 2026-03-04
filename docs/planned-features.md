# ePortfolios — Planned Features & Remaining Work

**Last updated:** 04-03-2026

---

## Branding (Unfinished)

### Logo & Visual Assets
- [ ] Design final ePortfolios logo (SVG + PNG)
- [ ] Replace placeholder footer logos (`powered_by_eportfolios.svg/png`) in all 4 themes (raw, default, maroon, modern)
- [ ] Replace placeholder favicon.ico with final branded icon (currently shows "eP" on blue)
- [ ] Create Apple touch icon (`apple-touch-icon.png`) for mobile bookmarks
- [ ] Create Open Graph image for social media link previews

### Color Palette & Theme
- [ ] Define ePortfolios brand color palette
- [ ] Create a custom ePortfolios theme (or customize an existing child theme)
- [ ] Update default theme colors to match brand identity

### Email Templates
- [ ] Review all email notification templates for any remaining Mahara references
- [ ] Add ePortfolios branding to email headers/footers

---

## Site Tracker (Not Started)

Replace Mahara's phone-home to mahara.org with ePortfolios' own anonymous usage tracker.

- [ ] Change endpoint URL in `lib/registration.php` from `mahara.org/api/registration.php` to ePortfolios tracker
- [ ] Build receiving API to collect anonymous site statistics
- [ ] Build admin dashboard to view registered sites, user counts, version distribution
- [ ] Fix confusing opt-in/out config naming (`registration_sendweeklyupdates` where true = opted OUT)
- [ ] Add ePortfolios-specific data fields (e.g., PGME plugin status)

Full plan: see `mahara-plugin-dev/docs/plans/28-02-2026-eportfolios-tracker-plan.md`

---

## Internal Code Cleanup (Deferred — Low Priority)

These are intentionally deferred to avoid breaking changes. Address incrementally as files are modified.

- [ ] Update `@package mahara` docblocks to `@package eportfolios` in remaining ~900 unmodified files
- [ ] Update copyright headers to add Academe Research, Inc in files as they are modified
- [ ] Consider renaming `lib/mahara.php` to `lib/eportfolios.php` (high risk — requires updating every `require` call)
- [ ] Consider renaming CSS classes `.mahara-logo`, `.mahara-footer-logo`, `.mahara-version` (low impact but cosmetic)

---

## PGME Plugin Integration

The PGME (Postgraduate Medical Education) plugins are developed separately in `mahara-plugin-dev` and deployed by copy. Future work:

- [ ] Include PGME plugins as first-party plugins in the ePortfolios repo
- [ ] Complete remaining PGME phases:
  - Phase 5: HOD dashboard + reports + NMC logbook PDF export
  - Phase 6: LEAP2A export/import
- [ ] Update PGME plugin `@package` headers from `mahara` to `eportfolios`

---

## Infrastructure

- [ ] Set up eportfolios.in domain and hosting
- [ ] Set up CI/CD pipeline (GitHub Actions) for automated testing
- [ ] Create Docker development environment specific to ePortfolios (separate from mahara-plugin-dev)
- [ ] Set up GitHub wiki with installation guide, admin docs, developer docs

---

## PHP 8.1 Compatibility & SES Fixes (from migration testing 02-03-2026)

Discovered during Mahara 20.04 → 22.10 upgrade + production testing on DigitalOcean with PHP 8.1 and AWS SES. These should be committed to the ePortfolios fork.

### PHP 8.1 Fixes (6 patches)

| # | File | Fix | Lines |
|---|------|-----|-------|
| 1a | `lib/adodb/drivers/adodb-mysqli.inc.php` | Guard `bind_param` procedural call with `if (count($inputarr) > 0)` | ~1183 |
| 1b | `lib/adodb/drivers/adodb-mysqli.inc.php` | Guard `bind_param` OOP call with `if ($nparams > 0)` | ~1241 |
| 2 | `lib/dml.php` | `preg_replace()` null subject: `$table ?? ''` | ~1109 |
| 3 | `lib/dml.php` | `explode()` null subject: `$tables ?? ''` | ~1286 |
| 4 | `lib/upgrade.php` | `uksort()` bool return → spaceship: `$weight1 <=> $weight2` | ~1234 |
| 5 | `auth/lib.php` | `ceil()` string operand: `ceil((int)$warn / 86400)` | ~2546 |

Full reference: `~/Development/mahara-plugin-dev/docs/mahara-22.10-php81-compatibility-fixes.md`

### SES Email Compatibility Fix

- [ ] **`lib/user.php` ~line 838**: Force `From` to `noreplyaddress` for all emails, put user's email in `Reply-To` instead. SES rejects emails where `From` is an unverified user domain (e.g., `jagan@mgmcri.ac.in`). Without this fix, Contact Us, forum notifications, and any user-to-user email fails with "Email address is not verified".

```php
// Before (fails with SES):
$mail->Sender = $userfrom->email;
$mail->From = $userfrom->email;

// After (SES-compatible):
$mail->Sender = get_config('noreplyaddress');
$mail->From = get_config('noreplyaddress');
$mail->addReplyTo($userfrom->email, display_name($userfrom, $userto));
```

### Tag Table Index (DB migration)

- [ ] Add missing index for tag lookups: `ALTER TABLE tag ADD INDEX tag_restyp_resid_tag_ix (resourcetype, resourceid, tag);` — without this, any page listing tagged artefacts causes full table scan on 1.5M rows (load average hit 131 on 4-CPU server). Add to `db/upgrade.php` for the next version's DB migration.
- [ ] Add composite index on view_access: `ALTER TABLE view_access ADD INDEX viewacce_usr_view_ix (usr, view);` — speeds up "shared with me" permission queries from 3.6s to <0.1s.

### Tag Query Optimization (CRITICAL — causes multi-minute page loads)

Analysis (04-03-2026) of the 1.54M-row tag table revealed the root cause: the LEFT JOIN pattern `ON t.resourcetype = 'artefact' AND t.resourceid = a.id` uses index `(resourcetype, resourceid, tag)` which starts with `resourcetype`. Since 97% of tags are `resourcetype='artefact'` (767K rows), every artefact lookup scans 767K rows instead of ~2. For users with 2,455 artefacts, that's 1.88 billion comparisons per query.

Full design: `~/Development/sbveportfolios/docs/plans/04-03-2026-tag-query-optimization-design.md`

**Phase 1 — New index (deploy with migration, no code changes):**
- [ ] `ALTER TABLE tag ADD INDEX tag_resid_restyp_ix (resourceid, resourcetype);` — flips lookup order so each artefact ID matches ~2 rows instead of scanning 767K. Expected 100,000x improvement for LEFT JOIN queries.

**Phase 2 — Lazy tag loading (22.20.4):**
- [ ] Modify View/ArtefactType class hierarchy so tags are NOT loaded during object construction. Tags load on-demand only when explicitly accessed (`$tags_loaded` flag pattern). Eliminates tag queries for ~90% of page loads (most pages don't display tags).
- [ ] Verify tag display still works in templates, tag search/filter paths, and structured content plugin (tag-based template categories).

### Tag System — Future Improvements

- [ ] **Replace `tagid_%` with proper FK** — Add `institution_tag_id` integer column to tag table. Migrate existing `tagid_<N>` strings to populate the FK. Update queries to use index-backed joins instead of `SUBSTRING()`. Note: zero `tagid_%` tags exist on SBVU — this is a preventive fix for other deployments.
- [ ] **Cache tag cloud results** — Global tag cloud query (8.1s) scans 1.46M rows for a result that changes infrequently. Cache in a dedicated table, refresh on tag write operations.
- [ ] **Tag deduplication** — 26,200 unique tag values with case variants ("EPA 1" / "EPA1" / "epa 1"). Normalize to canonical forms.

---

## Future Releases

| Version | Scope |
|---------|-------|
| 22.20.3 | Current — Academe ePortfolios rebrand + PHP 8.1 fixes + SES fix (released) |
| 22.20.4 | Lazy tag loading + tag deduplication + tag cloud caching |
| 22.20.5 | Final brand assets + tracker endpoint update |
| 23.x | PGME plugins bundled + `tagid_%` FK migration + new features |
