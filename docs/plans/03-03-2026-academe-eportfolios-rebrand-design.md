# Academe ePortfolios Rebranding — Design Document

**Date:** 03-03-2026
**Status:** Approved
**Version target:** 22.20.3

## Overview

Rebrand all public-facing occurrences of "ePortfolios" to "Academe ePortfolios" and fix the remaining "Mahara" references visible to admins. This is a text/branding-only change — no internal identifiers, function names, CSS classes, or filenames are modified.

## Brand Name

**Canonical form:** `Academe ePortfolios`
- Lowercase 'e', capital 'P' — follows tech naming convention (like eBay, iPhone)
- "Academe" is always capitalized as a proper noun

## Scope

### What Changes

#### 1. Admin Footer Version String
- **File:** `lib/dwoo/mahara/plugins/PluginMaharaVersion.php`
- **Change:** `"Mahara version"` → `"Academe ePortfolios version"`

#### 2. Language Strings (values only, keys unchanged)
All strings where "ePortfolios" appears as the product name get prefixed with "Academe".

| File | Approximate count |
|------|-------------------|
| `lang/en.utf8/admin.php` | ~15 strings |
| `lang/en.utf8/error.php` | ~15 strings |
| `lang/en.utf8/mahara.php` | ~5 strings |
| `lang/en.utf8/install.php` | ~2 strings |
| `lang/en.utf8/statistics.php` | ~1 string |
| `lang/en.utf8/webservices.php` | ~7 strings |
| `module/mobileapi/lang/en.utf8/module.mobileapi.php` | ~5 strings |
| `search/elasticsearch/lang/en.utf8/search.elasticsearch.php` | ~2 strings |

#### 3. Templates
| File | Change |
|------|--------|
| `theme/raw/templates/footer.tpl` | Alt text, HTML comment → "Academe ePortfolios" |
| `theme/raw/templates/header/head.tpl` | Meta generator → "Academe ePortfolios" |
| `theme/maroon/plugintype/export/html/templates/header.tpl` | Export header branding |

#### 4. Image Assets
- Rename `theme/raw/images/powered_by_eportfolios.png` → `powered_by_academe_eportfolios.png`
- Rename `theme/raw/images/powered_by_eportfolios.svg` → `powered_by_academe_eportfolios.svg`
- Update all references to these filenames in templates and code

#### 5. Install Defaults
| File | Change |
|------|--------|
| `admin/cli/install.php` | Example sitename: `"Mahara site"` → `"Academe ePortfolios"` |
| `config-dist.php` | Comments referencing "ePortfolios" → "Academe ePortfolios" |
| `lang/en.utf8/install.php` | Default "About" content |

#### 6. Copyright
- `lang/en.utf8/admin.php` copyright string: add "(Academe ePortfolios)" to the legal text

### What Does NOT Change

- Internal PHP identifiers (function names, class names like `PluginMaharaVersion`)
- Language string **keys** (e.g., `$string['installmahara']` — key stays, only value changes)
- CSS classes (`mahara-footer-logo`, `mahara-version`, etc.)
- `@package` annotations (already being changed incrementally to `eportfolios`)
- URLs (`https://eportfolios.in`, `https://github.com/academeio/eportfolios`)
- Filenames (`lib/mahara.php`, etc.)
- Database table names or column names

## Judgment Rules

- Every occurrence of standalone "ePortfolios" as the product name → "Academe ePortfolios"
- "ePortfolios Mobile" → "Academe ePortfolios Mobile" (part of brand family)
- "ePortfolios ID" → "Academe ePortfolios ID" (refers to the system)
- Generic uses of "eportfolio" as a concept (not product name) → leave unchanged
- Help file HTML copyright comments (internal, not user-visible) → leave unchanged

## Version Bump

- Version: 22.20.3
- Release version in `lib/version.php`

## Out of Scope

- New logo design (deferred to future design task)
- Internal identifier renames (deferred per CLAUDE.md — high risk)
- Database migration for existing site names (admins update via Site Options)
- URL/domain changes
