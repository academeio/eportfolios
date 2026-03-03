# Academe ePortfolios Rebranding Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebrand all public-facing text from "ePortfolios" to "Academe ePortfolios" and fix remaining "Mahara" references visible to admins.

**Architecture:** Find-and-replace in language string values, templates, one PHP plugin, config comments, and image assets. No internal identifiers change. Version bump to 22.20.3.

**Tech Stack:** PHP language strings, Smarty templates (.tpl), SVG/PNG image assets.

---

### Task 1: Fix the Admin Footer Version String

The most visible issue reported by the user.

**Files:**
- Modify: `lib/dwoo/mahara/plugins/PluginMaharaVersion.php:21`

**Step 1: Change the hardcoded string**

Line 21, change:
```php
return '<div class="center">Mahara version ' . get_config('release') . ' (' . get_config('version') . ')</div>';
```
to:
```php
return '<div class="center">Academe ePortfolios version ' . get_config('release') . ' (' . get_config('version') . ')</div>';
```

**Step 2: Commit**

```bash
git add lib/dwoo/mahara/plugins/PluginMaharaVersion.php
git commit -m "fix: rebrand admin footer from 'Mahara version' to 'Academe ePortfolios version'"
```

---

### Task 2: Rebrand lang/en.utf8/admin.php

**Files:**
- Modify: `lang/en.utf8/admin.php`

**Step 1: Update the copyright string**

Line 20, change:
```php
$string['copyright'] = 'Copyright &copy; 2006-2022 Catalyst IT Limited. &copy; 2026 <a href="https://github.com/academeio/eportfolios">Academe Research, Inc.</a>';
```
to:
```php
$string['copyright'] = 'Copyright &copy; 2006-2022 Catalyst IT Limited. &copy; 2026 <a href="https://github.com/academeio/eportfolios">Academe Research, Inc. (Academe ePortfolios)</a>';
```

**Step 2: Replace all "ePortfolios" product name references in string values**

Apply `replace_all` on the string value `ePortfolios` → `Academe ePortfolios` for these lines (values only, not keys):

| Line | Key | Current value excerpt | New value excerpt |
|------|-----|----------------------|-------------------|
| 21 | installmahara | `Install ePortfolios` | `Install Academe ePortfolios` |
| 40 | successfullyinstalled | `...installed ePortfolios.` | `...installed Academe ePortfolios.` |
| 43 | registerthismaharasite | `...this ePortfolios site` | `...this Academe ePortfolios site` |
| 52 | youcanupgrade | `...upgrade ePortfolios from` | `...upgrade Academe ePortfolios from` |
| 56 | dbnotutf8warning | `...ePortfolios stores all data` | `...Academe ePortfolios stores all data` |
| 57 | dbnotutf8mb4warning | `...ePortfolios stores all data` | `...Academe ePortfolios stores all data` |
| 59 | maharainstalled | `ePortfolios is already installed.` | `Academe ePortfolios is already installed.` |
| 64 | cliinstallerdescription | `Install ePortfolios and create` | `Install Academe ePortfolios and create` |
| 65 | cliinstallingmahara | `Installing ePortfolios` | `Installing Academe ePortfolios` |
| 72 | cli_upgrade_description | `...the ePortfolios database...of ePortfolios installed.` | `...the Academe ePortfolios database...of Academe ePortfolios installed.` |
| 73 | cli_upgrade_title | `Upgrading ePortfolios` | `Upgrading Academe ePortfolios` |
| 77 | cliclearingcaches | `Clearing ePortfolios caches.` | `Clearing Academe ePortfolios caches.` |
| 83 | maharanotinstalled | `ePortfolios is not...install ePortfolios before` | `Academe ePortfolios is not...install Academe ePortfolios before` |
| 214 | cleanurloninstructionsonwiki | `...the ePortfolios wiki` | `...the Academe ePortfolios wiki` |
| 307 | registrationchanged2 | `...how ePortfolios is used` | `...how Academe ePortfolios is used` |
| 345 | maharaversion | `ePortfolios version` | `Academe ePortfolios version` |
| 376 | maharaabortedsiteinformation | `...up to date with ePortfolios core.` | `...up to date with Academe ePortfolios core.` |
| 432 | dropdownmenudescription | `...main ePortfolios navigation` | `...main Academe ePortfolios navigation` |
| 455 | deprecatedmobileapp | `...use ePortfolios Mobile instead.` | `...use Academe ePortfolios Mobile instead.` |
| 667 | networkingextnotinstalled | `...configure ePortfolios networking` | `...configure Academe ePortfolios networking` |
| 671 | networkingenabled1 | `...your ePortfolios server` | `...your Academe ePortfolios server` |
| 675 | networkingdescription | `ePortfolios networking features...ePortfolios or Moodle sites...Moodle or ePortfolios.` | `Academe ePortfolios networking features...Academe ePortfolios or Moodle sites...Moodle or Academe ePortfolios.` |
| 680 | networkingautocreateregistration | `...log on to ePortfolios.` | `...log on to Academe ePortfolios.` |
| 682 | wwwrootsslurl | `...this ePortfolios installation` | `...this Academe ePortfolios installation` |
| 819 | couldnotmailtoapplicant | `...server ePortfolios is running on` | `...server Academe ePortfolios is running on` |
| 858 | importfilenotavalidzipfile | `...the ePortfolios bulk exporter` | `...the Academe ePortfolios bulk exporter` |
| 870 | importfilenotusers | `...the ePortfolios bulk exporter` | `...the Academe ePortfolios bulk exporter` |
| 1010 | importfailed | `...this ePortfolios version...bug in ePortfolios causing` | `...this Academe ePortfolios version...bug in Academe ePortfolios causing` |
| 1106 | addedpersonauthmethod | `...authenticates to ePortfolios` | `...authenticates to Academe ePortfolios` |
| 1458 | langpackuptodate1 | `...defined in ePortfolios itself` | `...defined in Academe ePortfolios itself` |
| 1487 | maharaversionforseries | `ePortfolios series version` | `Academe ePortfolios series version` |

**Step 3: Commit**

```bash
git add lang/en.utf8/admin.php
git commit -m "rebrand: update admin.php language strings to 'Academe ePortfolios'"
```

---

### Task 3: Rebrand lang/en.utf8/error.php

**Files:**
- Modify: `lang/en.utf8/error.php`

**Step 1: Replace all "ePortfolios" in string values**

Use `replace_all` on the file: every occurrence of `ePortfolios` in string values → `Academe ePortfolios`.

Lines affected: 16, 17, 18, 19, 20, 22, 23, 24, 25, 27, 28, 29, 30, 32, 34, 36, 39, 42, 51, 53, 55, 60, 61, 62 (×2), 63, 64, 66 (×2), 67 (×3), 144, 147, 160.

**Step 2: Verify no string keys were changed**

Grep for `'Academe` at start of value assignments to make sure only values changed, not keys.

**Step 3: Commit**

```bash
git add lang/en.utf8/error.php
git commit -m "rebrand: update error.php language strings to 'Academe ePortfolios'"
```

---

### Task 4: Rebrand lang/en.utf8/mahara.php

**Files:**
- Modify: `lang/en.utf8/mahara.php`

**Step 1: Replace "ePortfolios" in these string values**

| Line | Key | Change |
|------|-----|--------|
| 153 | pluginexplainaddremove | `Plugins in ePortfolios` → `Plugins in Academe ePortfolios` |
| 154 | pluginexplainartefactblocktypes | `ePortfolios also stops` → `Academe ePortfolios also stops` |
| 971 | phpuploaderror_7 | `the ePortfolios dataroot` → `the Academe ePortfolios dataroot` |
| 1338 | facebookdescription | `ePortfolios is an open-source` → `Academe ePortfolios is an open-source` |
| 1369 | styleguide_description | `components used by ePortfolios` → `components used by Academe ePortfolios` |

**Step 2: Commit**

```bash
git add lang/en.utf8/mahara.php
git commit -m "rebrand: update mahara.php language strings to 'Academe ePortfolios'"
```

---

### Task 5: Rebrand Remaining Language Files

**Files:**
- Modify: `lang/en.utf8/install.php`
- Modify: `lang/en.utf8/statistics.php`
- Modify: `lang/en.utf8/webservices.php`
- Modify: `module/mobileapi/lang/en.utf8/module.mobileapi.php`
- Modify: `search/elasticsearch/lang/en.utf8/search.elasticsearch.php`

**Step 1: lang/en.utf8/install.php**

Line 18: Replace all 3 occurrences of `ePortfolios` with `Academe ePortfolios` in the `aboutdefaultcontent` string value.

**Step 2: lang/en.utf8/statistics.php**

Line 446: Change `ePortfolios version` → `Academe ePortfolios version`.

**Step 3: lang/en.utf8/webservices.php**

Lines 122, 124, 126, 131, 145, 161, 217: Replace `ePortfolios` → `Academe ePortfolios` in all string values.

**Step 4: module/mobileapi/lang/en.utf8/module.mobileapi.php**

Lines 18, 23, 24, 32, 33: Replace `ePortfolios` → `Academe ePortfolios` in all string values.

**Step 5: search/elasticsearch/lang/en.utf8/search.elasticsearch.php**

Lines 26, 64: Replace `ePortfolios` → `Academe ePortfolios` in string values.

**Step 6: Commit**

```bash
git add lang/en.utf8/install.php lang/en.utf8/statistics.php lang/en.utf8/webservices.php \
  module/mobileapi/lang/en.utf8/module.mobileapi.php \
  search/elasticsearch/lang/en.utf8/search.elasticsearch.php
git commit -m "rebrand: update remaining language files to 'Academe ePortfolios'"
```

---

### Task 6: Rebrand Templates

**Files:**
- Modify: `theme/raw/templates/footer.tpl:27,30`
- Modify: `theme/raw/templates/admin/upgradefooter.tpl:9`
- Modify: `theme/raw/templates/header/head.tpl:2`
- Modify: `theme/maroon/plugintype/export/html/templates/header.tpl:30,33`

**Step 1: footer.tpl**

Line 27: Change alt text:
```
alt="Powered by ePortfolios"  →  alt="Powered by Academe ePortfolios"
```

Line 30: Change HTML comment:
```
powered by ePortfolios, an open-source  →  powered by Academe ePortfolios, an open-source
```

**Step 2: upgradefooter.tpl**

Line 9: Change alt text:
```
alt="Powered by ePortfolios"  →  alt="Powered by Academe ePortfolios"
```

**Step 3: head.tpl**

Line 2: Change meta generator:
```
content="ePortfolios {$SERIES}  →  content="Academe ePortfolios {$SERIES}
```

**Step 4: maroon export header.tpl**

Line 30: `alt="Mahara"` → `alt="Academe ePortfolios"`
Line 33: `alt="Mahara"` → `alt="Academe ePortfolios"`

**Step 5: Commit**

```bash
git add theme/raw/templates/footer.tpl theme/raw/templates/admin/upgradefooter.tpl \
  theme/raw/templates/header/head.tpl \
  theme/maroon/plugintype/export/html/templates/header.tpl
git commit -m "rebrand: update templates to 'Academe ePortfolios'"
```

---

### Task 7: Rename Image Assets

**Files:**
- Rename: `theme/raw/images/powered_by_eportfolios.png` → `powered_by_academe_eportfolios.png`
- Rename: `theme/raw/images/powered_by_eportfolios.svg` → `powered_by_academe_eportfolios.svg`
- Modify: `theme/raw/templates/footer.tpl:27` — update filename reference
- Modify: `theme/raw/templates/admin/upgradefooter.tpl:9` — update filename reference
- Modify: `lib/file.php:399` — update filename reference

**Step 1: Rename the image files**

```bash
cd /Users/jagan/Development/eportfolios
git mv theme/raw/images/powered_by_eportfolios.png theme/raw/images/powered_by_academe_eportfolios.png
git mv theme/raw/images/powered_by_eportfolios.svg theme/raw/images/powered_by_academe_eportfolios.svg
```

**Step 2: Update footer.tpl reference**

Line 27: Change `filename='powered_by_eportfolios'` → `filename='powered_by_academe_eportfolios'`

**Step 3: Update upgradefooter.tpl reference**

Line 9: Change `filename='powered_by_eportfolios'` → `filename='powered_by_academe_eportfolios'`

**Step 4: Update lib/file.php reference**

Line 399: Change `powered_by_eportfolios.png` → `powered_by_academe_eportfolios.png`

**Step 5: Commit**

```bash
git add theme/raw/images/ theme/raw/templates/footer.tpl \
  theme/raw/templates/admin/upgradefooter.tpl lib/file.php
git commit -m "rebrand: rename powered_by image files to include 'academe' prefix"
```

---

### Task 8: Update Install Defaults and Config Comments

**Files:**
- Modify: `admin/cli/install.php:41`
- Modify: `config-dist.php:20,23,24,57,58,63`
- Modify: `skin/export.php:49`

**Step 1: admin/cli/install.php**

Line 41: Change:
```php
$options['sitename']->examplevalue = 'Mahara site';
```
to:
```php
$options['sitename']->examplevalue = 'Academe ePortfolios';
```

**Step 2: config-dist.php**

Replace all `ePortfolios` → `Academe ePortfolios` in comments on lines 20, 23, 24, 57, 58, 63.

**Step 3: skin/export.php**

Line 49: Change `ePortfolios pages` → `Academe ePortfolios pages`.

**Step 4: Commit**

```bash
git add admin/cli/install.php config-dist.php skin/export.php
git commit -m "rebrand: update install defaults and config comments to 'Academe ePortfolios'"
```

---

### Task 9: Version Bump to 22.20.3

**Files:**
- Modify: `lib/version.php:20,22`

**Step 1: Update version numbers**

Line 20: Change `$config->version = 2026030201;` → `$config->version = 2026030301;`
Line 22: Change `$config->release = '22.20.2';` → `$config->release = '22.20.3';`

**Step 2: Commit**

```bash
git add lib/version.php
git commit -m "chore: bump version to 22.20.3 for Academe ePortfolios rebrand"
```

---

### Task 10: Verify the Rebrand

**Step 1: Grep for remaining standalone "ePortfolios" without "Academe" prefix in user-visible files**

```bash
# Check language files for any missed "ePortfolios" that should be "Academe ePortfolios"
grep -n "ePortfolios" lang/en.utf8/admin.php lang/en.utf8/error.php lang/en.utf8/mahara.php \
  lang/en.utf8/install.php lang/en.utf8/statistics.php lang/en.utf8/webservices.php \
  module/mobileapi/lang/en.utf8/module.mobileapi.php \
  search/elasticsearch/lang/en.utf8/search.elasticsearch.php | grep -v "Academe ePortfolios" | grep -v "^\$string\[" | grep -v "^//"
```

Every remaining "ePortfolios" in these files should either:
- Already say "Academe ePortfolios"
- Be in a string key (not value)
- Be in a URL

**Step 2: Grep for remaining user-visible "Mahara" in templates and PHP output**

```bash
grep -rn "Mahara" lib/dwoo/mahara/plugins/PluginMaharaVersion.php \
  theme/raw/templates/footer.tpl theme/raw/templates/admin/upgradefooter.tpl \
  theme/raw/templates/header/head.tpl admin/cli/install.php \
  theme/maroon/plugintype/export/html/templates/header.tpl
```

Should return zero matches for user-visible "Mahara" text (internal class/function names are OK).

**Step 3: Verify image references resolve**

```bash
ls -la theme/raw/images/powered_by_academe_eportfolios.*
grep -rn "powered_by_eportfolios" theme/ lib/
```

First command should show the renamed files exist. Second command should return zero matches (all references updated).

**Step 4: If all checks pass, no additional commit needed**

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Admin footer version string | 1 file |
| 2 | admin.php language strings + copyright | 1 file |
| 3 | error.php language strings | 1 file |
| 4 | mahara.php language strings | 1 file |
| 5 | Remaining language files (5 files) | 5 files |
| 6 | Templates (4 files) | 4 files |
| 7 | Image asset renames + references | 5 files |
| 8 | Install defaults + config comments | 3 files |
| 9 | Version bump | 1 file |
| 10 | Verification grep | 0 files (read-only) |

**Total: ~20 files modified, 9 commits, 10 tasks**
