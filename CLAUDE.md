# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ePortfolios is an open-source ePortfolio and competency assessment platform for educational institutions, forked from Mahara 22.10.0 (GPL v3). Current version: 22.20.0.

**Stack:** PHP 8.1+, PostgreSQL 12+ or MariaDB 10.6+, Bootstrap 5, SASS/SCSS, jQuery, Smarty templates (Dwoo variant), Apache/Nginx.

**Related:** [ePortfolios Mobile](https://github.com/academeio/eportfolios-mobile) (`~/Development/eportfolios-mobile/`) — React Native companion app. Separate repo, separate stack (RN 0.77, TypeScript, Redux).

## CSS Compilation

Child themes need compiled CSS. The `raw` theme ships pre-compiled; child themes (`default`, `primaryschool`, `maroon`, `modern`, `ocean`) were compiled at 22.20.0.

```bash
# Compile a single theme
npx sass theme/primaryschool/sass/style.scss theme/primaryschool/style/style.css \
  --style=compressed --no-source-map --quiet-deps

# Compile TinyMCE content CSS (raw theme)
npx sass theme/raw/sass/tinymce.scss theme/raw/style/tinymce.css \
  --style=compressed --no-source-map --quiet-deps

# Compile all child themes
for theme in default primaryschool maroon modern ocean; do
  mkdir -p "theme/$theme/style"
  npx sass "theme/$theme/sass/style.scss" "theme/$theme/style/style.css" \
    --style=compressed --no-source-map --quiet-deps
done
```

## Testing

Behat (BDD) is the testing framework. Setup requires config.php settings (`$cfg->behat_*`).

```bash
# Initialize Behat test environment
php testing/frameworks/behat/cli/init.php

# Run Behat tests (after init)
php testing/frameworks/behat/cli/util.php --run
```

## Database Upgrades

```bash
# CLI upgrade
php admin/upgrade.php

# Via browser (requires urlsecret in config.php)
# http://yoursite/admin/upgrade.php?urlsecret=yoursecret
```

## Cron

```bash
php lib/cron.php
# Or via browser: http://yoursite/lib/cron.php?urlsecret=yoursecret
```

## Architecture

### Routing

No router framework — each page is a standalone PHP file. Every entry point starts with `define('INTERNAL', 1); require(dirname(__FILE__) . '/init.php');` which bootstraps the application.

- Page files: `index.php`, `view/index.php`, `group/edit.php`, etc.
- JSON API endpoints: files named `*.json.php` (e.g., `json/friendsearch.php`)
- Web service APIs: `webservice/rest/`, `webservice/soap/`, `webservice/xmlrpc/`

### Bootstrap Sequence

`init.php` → loads `config.php` → merges `lib/config-defaults.php` → sets up DB, sessions, auth → makes `$USER`, `$THEME`, `$SESSION` globals available.

### Plugin System

Eight plugin types, each in their own top-level directory:

| Type | Directory | Base Class | Purpose |
|------|-----------|------------|---------|
| Artefact | `artefact/` | `PluginArtefact` | Portfolio items (blog, file, resume, plans, etc.) |
| Blocktype | `blocktype/` | `PluginBlocktype` | Dashboard/page widgets |
| Module | `module/` | `PluginModule` | Optional features (LTI, competency frameworks, submissions) |
| Auth | `auth/` | `PluginAuth` | Authentication backends (SAML, webservice) |
| Export | `export/` | `PluginExport` | Data export formats |
| Import | `import/` | `PluginImport` | Data import handlers |
| Notification | `notification/` | `PluginNotification` | Notification delivery (internal, email digest) |
| Grouptype | `grouptype/` | `PluginGrouptype` | Group type definitions |

Each plugin follows a standard structure:
- `lib.php` — main class extending base class
- `version.php` — version info
- `db/install.xml` — XMLDB table definitions
- `db/upgrade.php` — migration functions
- `lang/en.utf8/` — language strings
- `theme/raw/templates/` — Smarty `.tpl` templates

Load plugins with: `safe_require('artefact', 'blog')` or `safe_require_plugin('blocktype', 'text')`.

### Database Layer

Custom DML abstraction in `lib/dml.php` (no Doctrine/Eloquent). Key functions:

```php
get_record($table, $field, $value)              // Single row
get_records_array($table, $field, $value)        // Multiple rows as array
get_records_sql_array($sql, $values)             // Raw SQL → array
insert_record($table, $dataobject)               // Insert
update_record($table, $dataobject, $where)       // Update
delete_records($table, $field, $value)           // Delete
execute_sql($sql, $values)                       // Raw SQL
count_records($table, $field, $value)            // Count
```

Schema managed via XMLDB — XML definitions in `db/install.xml` files, migrations in `db/upgrade.php` files.

### Domain Objects

Factory pattern for core entities — static methods construct objects from DB:

- `View` (`lib/view.php`, 8400+ lines) — portfolio pages, `new View($id)`
- `User` (`lib/user.php`) — user accounts
- `Group` (`lib/group.php`) — groups/communities
- `ArtefactType` (`lib/artefact.php`) — base class for portfolio items
- `Collection` (`lib/collection.php`) — page collections
- `BlockInstance` (`lib/view.php`) — dashboard blocks

### HTTP Input & Output

Input sanitization functions in `lib/web.php`:
```php
param_integer('id')        // Required integer from $_REQUEST
param_variable('name')     // Required string
param_boolean('active')    // Boolean
param_alpha('type')        // Alpha-only string
```

JSON responses: `json_reply($error, $message)` in `lib/web.php`.

Localized strings: `get_string('identifier', 'section')` — looks up `lang/en.utf8/{section}.php`.

### Templates

Smarty (Dwoo) templates with `.tpl` extension. Theme hierarchy: child themes override parent templates by placing files at the same relative path.

- Base templates: `theme/raw/templates/`
- Per-plugin templates: `{plugin}/theme/raw/templates/`
- Template assignment: `$smarty->assign('varname', $value)` then `$smarty->display('templatename.tpl')`

### Frontend

- jQuery-based (no SPA framework)
- Main JS library: `js/mahara.js`
- AJAX pattern: `sendjsonrequest('endpoint.json.php', data, 'POST', callback)`
- Two layout systems: legacy row-based CSS layout and newer GridStack.js (drag-drop dashboard)
- Rich text: TinyMCE editor

### Theme Hierarchy

Themes in `theme/` directory. Each has `themeconfig.php` defining parent and CSS behavior:
- `overrideparentcss = true` → only load child's compiled CSS (child must have `style/style.css`)
- `overrideparentcss = false` → load parent CSS + child overrides
- `raw` is the base theme; all others inherit from it
- `subthemestarter/` is the template for creating new themes

## Key Files

| File | Purpose |
|------|---------|
| `init.php` | Application bootstrap (every page requires this) |
| `lib/mahara.php` | Core utilities, string functions, plugin loading (~6400 lines) |
| `lib/web.php` | HTTP helpers, param_*, json_reply, template setup (~190KB) |
| `lib/dml.php` | Database abstraction layer |
| `lib/view.php` | View/page/block management |
| `lib/config-defaults.php` | All default configuration values (~1400 lines) |
| `lib/version.php` | Version number (2026022800, series 22.20) |
| `config-dist.php` | Configuration template (copy to `config.php`) |

## Conventions

- All PHP files that aren't entry points start with `defined('INTERNAL') || die();`
- Entry points define `INTERNAL` before requiring `init.php`: `define('INTERNAL', 1);`
- Language strings live in `lang/en.utf8/{section}.php` as `$string['key'] = 'value';`
- Existing `@package mahara` docblocks are being incrementally changed to `@package eportfolios` — update when modifying a file
- Copyright headers should add `Academe Research, Inc` alongside existing Catalyst IT attribution when modifying files
- The codebase retains `mahara` in many internal identifiers (function names, class names, file names like `lib/mahara.php`) — renaming these is deferred due to high risk

## Local Development Setup

1. Copy `config-dist.php` → `config.php`
2. Configure database credentials (`$cfg->dbtype`, `$cfg->dbhost`, `$cfg->dbname`, `$cfg->dbuser`, `$cfg->dbpass`)
3. Set `$cfg->dataroot` to a writable directory **outside** the document root
4. Set `$cfg->wwwroot` if auto-detection fails
5. Point web server at the repository root
6. Visit the site to trigger initial install, or run `php admin/upgrade.php`
