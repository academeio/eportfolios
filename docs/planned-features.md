# ePortfolios — Planned Features & Remaining Work

**Last updated:** 28-02-2026

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

## Future Releases

| Version | Scope |
|---------|-------|
| 22.20.0 | Current — rebrand + compiled CSS (released) |
| 22.20.1 | Final brand assets + tracker endpoint update |
| 23.x | PGME plugins bundled + new features |
