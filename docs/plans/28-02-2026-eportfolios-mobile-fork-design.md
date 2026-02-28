# ePortfolios Mobile — Fork Design

**Date:** 28-02-2026
**Status:** Approved
**Source:** [MaharaProject/mahara-mobile-react-native](https://github.com/MaharaProject/mahara-mobile-react-native)
**Target:** `~/Development/eportfolios-mobile/`

---

## Overview

Fork Mahara Mobile (React Native, v25.0.5, RN 0.77, TypeScript) as ePortfolios Mobile. Rebrand the app identity, user-facing strings, and assets. Apply light modernization. Defer internal type renames.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Git history | Single import commit | Mirrors eportfolios web fork pattern. Clean provenance. |
| Repo structure | Flatten `MaharaMobile/` to root | Standard RN project layout. Simpler paths. |
| App name | ePortfolios Mobile | Mirrors "Mahara Mobile" pattern |
| Bundle ID | `in.eportfolios.mobile` | Reverse-DNS of eportfolios.in domain |
| Version | 1.0.0 | Fresh start for new product identity |
| TS type renames | Deferred | `MaharaFile`, `PendingMFile` etc. — too many files, low user impact. See planned-features-mobile.md |

## Source Repo State (as of 28-02-2026)

- **Version:** 25.0.5
- **React Native:** 0.77.3
- **Last commit:** 01-12-2025 (maintenance updates)
- **Node requirement:** >=18
- **Platforms:** Android + iOS
- **Android bundle:** `org.mahara.mobile.app` (versionCode 145, versionName 25.0.5)
- **iOS bundle:** `org.mahara.mobile.app` (MARKETING_VERSION 24.08.1)
- **i18n:** LinguiJS (en, es, fr, ko, ru)
- **State management:** Redux + RTK
- **UI framework:** GlueStack UI (NativeBase successor)
- **Navigation:** React Navigation 7
- **Screens:** SiteCheck, LoginMethod, AuthLoading, AddItem, EditItem, Pending, SelectMedia, Preferences, About, Help, Menu, Privacy, Terms, Version

## API Architecture

The app uses **user-entered server URLs** — no hardcoded Mahara domain. API endpoints are relative paths appended to the user's server URL:

- `webservice/rest/server.php?alt=json` — main sync/auth API
- `module/mobileapi/download.php` — file/profile pic download
- `module/mobileapi/upload_blog_post` — blog post upload
- `module/mobileapi/upload_file` — file upload

These paths are server-side routes in the ePortfolios web codebase (`module/mobileapi/`) and work as-is. No endpoint URL changes needed.

## Commit Plan

### Commit 1 — Import Mahara Mobile 25.0.5

Clone upstream, copy `MaharaMobile/` contents to repo root (flatten), copy `COPYING` from repo root.

```
eportfolios-mobile/
├── android/
├── ios/
├── src/
│   ├── App.tsx
│   ├── assets/
│   ├── components/
│   ├── constants/
│   ├── hooks/
│   ├── i18n.ts
│   ├── models/
│   ├── navigation/
│   ├── screens/
│   ├── store/
│   └── utils/
├── locales/ (en, es, fr, ko, ru)
├── patches/
├── package.json
├── app.json
├── index.js
├── tsconfig.json
├── metro.config.js
├── babel.config.js
├── react-native.config.js
├── Gemfile
├── COPYING
└── ...config files
```

Message: `Import Mahara Mobile 25.0.5 (GPL v3) as base for ePortfolios Mobile`

### Commit 2 — Add LICENSE, ACKNOWLEDGEMENTS.md, README.md

- Replace `COPYING` with `LICENSE` (same GPL v3 text, standard filename)
- Create `ACKNOWLEDGEMENTS.md` crediting Mahara Mobile / Catalyst IT
- Write new `README.md` for ePortfolios Mobile

Message: `Add LICENSE, ACKNOWLEDGEMENTS.md, and README.md`

### Commit 3 — Rebrand app identity (app.json, package.json)

- `app.json`: `name` → `"ePortfolios Mobile"`, `displayName` → `"ePortfolios Mobile"`
- `package.json`:
  - `name` → `"eportfolios-mobile"`
  - `version` → `"1.0.0"`
  - `codegenConfig.name` → `"EPortfoliosMobile"`
  - `codegenConfig.android.javaPackageName` → `"in.eportfolios.mobile"`

Message: `Rebrand app.json and package.json for ePortfolios Mobile`

### Commit 4 — Rebrand Android project

- `android/app/build.gradle`:
  - `namespace` → `"in.eportfolios.mobile"`
  - `applicationId` → `"in.eportfolios.mobile"`
  - `versionCode` → `1`
  - `versionName` → `"1.0.0"`
- Rename Java/Kotlin package directory: `android/app/src/main/java/org/mahara/mobile/app/` → `android/app/src/main/java/in/eportfolios/mobile/`
- Update `package` declarations in `MainActivity.kt`, `MainApplication.kt`
- `android/app/src/main/res/values/strings.xml`: `app_name` → `"ePortfolios Mobile"`
- Replace Android icon resources (`mipmap-*`) with ePortfolios placeholder icons

Message: `Rebrand Android project for ePortfolios Mobile`

### Commit 5 — Rebrand iOS project

- Rename directories and project files:
  - `ios/MaharaMobile.xcodeproj/` → `ios/EPortfoliosMobile.xcodeproj/`
  - `ios/MaharaMobile.xcworkspace/` → `ios/EPortfoliosMobile.xcworkspace/`
  - `ios/MaharaMobile/` → `ios/EPortfoliosMobile/`
- Update `project.pbxproj`:
  - `PRODUCT_BUNDLE_IDENTIFIER` → `"in.eportfolios.mobile"`
  - `MARKETING_VERSION` → `"1.0.0"`
  - `CURRENT_PROJECT_VERSION` → `"1"`
  - All references from `MaharaMobile` to `EPortfoliosMobile`
- Update `Podfile`: target name and paths
- Update `Podfile.lock` references
- Update iOS launch screen / storyboard branding
- Replace iOS app icons in `Images.xcassets`

Message: `Rebrand iOS project for ePortfolios Mobile`

### Commit 6 — Rebrand user-facing strings

Scan all `src/` TypeScript/TSX files and locale files for "Mahara" in user-facing text:

Key strings to update:
- `"What is the address of your Mahara?"` → `"What is the address of your ePortfolios site?"`
- Any About screen text referencing Mahara
- Help screen content
- Error messages shown to users
- All `<Trans>` and `` t` `` tagged strings containing "Mahara"

Update locale catalogs (`locales/en/`, `locales/es/`, etc.) — re-extract and compile after changes.

Keep "Mahara" only in:
- Code comments about upstream compatibility
- Internal type names (deferred)
- GPL attribution text

Message: `Rebrand user-facing strings from Mahara to ePortfolios`

### Commit 7 — Replace brand assets

- Replace app icon / logo images in `src/assets/images/` with ePortfolios placeholders
- Replace any splash screen imagery
- Update `src/components/LogoView/` if it renders a Mahara logo

Message: `Replace Mahara branding images with ePortfolios placeholders`

### Commit 8 — Update config and entry points

- `index.js`: update `AppRegistry.registerComponent` name if it references `MaharaMobile`
- `metro.config.js`: update if references `MaharaMobile`
- `react-native.config.js`: update project paths for renamed iOS directory
- `.eslintrc.js`, `.prettierrc.json`: no changes expected
- Update `.nvmrc` to current Node LTS (22)

Message: `Update config files and entry points for ePortfolios Mobile`

### Commit 9 — Final sweep and version tag

- `grep -ri "mahara"` across entire repo, fix any remaining user-facing references
- Verify `npm install` succeeds
- Verify `npx tsc` compiles without errors
- Add placeholder `.github/workflows/` for future CI
- Tag `v1.0.0`

Message: `Bump version to 1.0.0 — first ePortfolios Mobile release`

## Light Modernization (post-rebranding)

- Update `.nvmrc` to Node 22 LTS (done in commit 8)
- Audit `patches/` directory — verify patch-package patches still apply cleanly
- Run `npm audit` and address critical/high vulnerabilities
- Verify build and runtime against an ePortfolios server instance

## Deferred Work

See `docs/planned-features-mobile.md` for:
- TypeScript type renames (`MaharaFile` → `PortfolioFile`, etc.)
- Full CI/CD pipeline (GitHub Actions for Android/iOS builds)
- New features and modernization roadmap
