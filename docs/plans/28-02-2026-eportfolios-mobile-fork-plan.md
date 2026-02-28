# ePortfolios Mobile Fork — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fork Mahara Mobile 25.0.5 as ePortfolios Mobile with full rebrand, flattened repo structure, and light modernization.

**Architecture:** Clone upstream repo, flatten `MaharaMobile/` to repo root, rebrand identity (bundle IDs, app name, version), rebrand user-facing strings, replace brand assets, update config files. Nine commits mirroring the eportfolios web fork pattern.

**Tech Stack:** React Native 0.77.3, TypeScript, Redux/RTK, GlueStack UI, React Navigation 7, LinguiJS i18n

**Working directory:** `~/Development/eportfolios-mobile/`

**Design doc:** `~/Development/eportfolios/docs/plans/28-02-2026-eportfolios-mobile-fork-design.md`

---

### Task 1: Clone upstream and create flattened import

**Files:**
- Source: `https://github.com/MaharaProject/mahara-mobile-react-native` (clone to temp)
- Target: `~/Development/eportfolios-mobile/` (all files go here)

**Step 1: Clone upstream to a temp directory**

```bash
git clone https://github.com/MaharaProject/mahara-mobile-react-native.git /tmp/mahara-mobile-upstream
```

**Step 2: Initialize git in the target directory**

```bash
cd ~/Development/eportfolios-mobile
git init
```

**Step 3: Copy MaharaMobile/ contents (flattened) to target**

Copy the contents of `MaharaMobile/` — not the directory itself — to the repo root. Also copy `COPYING` and `README.md` from the upstream repo root.

```bash
cp -a /tmp/mahara-mobile-upstream/MaharaMobile/* ~/Development/eportfolios-mobile/
cp -a /tmp/mahara-mobile-upstream/MaharaMobile/.* ~/Development/eportfolios-mobile/ 2>/dev/null || true
cp /tmp/mahara-mobile-upstream/COPYING ~/Development/eportfolios-mobile/
cp /tmp/mahara-mobile-upstream/README.md ~/Development/eportfolios-mobile/README.upstream.md
```

Note: Save upstream README as `README.upstream.md` — we'll write our own `README.md` in Task 2.

**Step 4: Verify the flattened structure**

```bash
ls ~/Development/eportfolios-mobile/
# Expected: android/ ios/ src/ locales/ patches/ package.json app.json index.js
#           tsconfig.json metro.config.js babel.config.js Gemfile COPYING etc.
```

Verify key files exist:
```bash
test -f ~/Development/eportfolios-mobile/package.json && echo "OK: package.json"
test -f ~/Development/eportfolios-mobile/app.json && echo "OK: app.json"
test -d ~/Development/eportfolios-mobile/src && echo "OK: src/"
test -d ~/Development/eportfolios-mobile/android && echo "OK: android/"
test -d ~/Development/eportfolios-mobile/ios && echo "OK: ios/"
```

**Step 5: Create import commit**

```bash
cd ~/Development/eportfolios-mobile
git add -A
git commit -m "Import Mahara Mobile 25.0.5 (GPL v3) as base for ePortfolios Mobile"
```

**Step 6: Clean up temp clone**

```bash
rm -rf /tmp/mahara-mobile-upstream
```

---

### Task 2: Add LICENSE, ACKNOWLEDGEMENTS.md, README.md

**Files:**
- Remove: `COPYING`, `README.upstream.md`
- Create: `LICENSE`, `ACKNOWLEDGEMENTS.md`, `README.md`

**Step 1: Copy GPL v3 license text from COPYING to LICENSE**

```bash
cd ~/Development/eportfolios-mobile
mv COPYING LICENSE
```

**Step 2: Create ACKNOWLEDGEMENTS.md**

Write `ACKNOWLEDGEMENTS.md` with this content (matches web fork pattern):

```markdown
# Acknowledgements

## Origin

ePortfolios Mobile is forked from [Mahara Mobile](https://github.com/MaharaProject/mahara-mobile-react-native)
version 25.0.5, the React Native companion app for the Mahara ePortfolio platform.

Mahara Mobile was originally developed and maintained by
[Catalyst IT Limited](https://www.catalyst.net.nz/) and contributors,
licensed under the GNU General Public License v3.

We gratefully acknowledge the work of the Mahara project team and all
contributors whose code forms the foundation of ePortfolios Mobile.

## Original Copyright

Copyright (C) 2021-2025 Catalyst IT Limited and others.

The original copyright notices are preserved in individual source files
as required by the GPL v3 license.

## License Continuity

ePortfolios Mobile continues under the same GNU General Public License v3.
See the LICENSE file for full terms.
```

**Step 3: Create README.md**

Remove the upstream readme and write a new one:

```bash
rm README.upstream.md
```

Write `README.md`:

```markdown
# ePortfolios Mobile

**Mobile companion for ePortfolios**

By [Academe Research, Inc](https://eportfolios.in)

---

## About

ePortfolios Mobile is a React Native app that connects your mobile device to your
ePortfolios site. Capture photos, videos, and files on your device and upload them
directly to your portfolio. Create journal entries on the go, even while offline.

## Features

- Connect to any ePortfolios (or Mahara) server with mobile uploads enabled
- Upload files, photos, and videos to your portfolio
- Create and upload journal entries
- Offline queue — capture content without internet, upload when connected
- Token, SSO, and local login support

## Requirements

- Node.js 18+
- React Native 0.77 environment (Android SDK / Xcode)
- An ePortfolios or Mahara server with mobile API enabled

## Development

```bash
npm install
npm run ios      # or: npm run android
```

## License

GNU General Public License v3. See [LICENSE](LICENSE) for details.

## Attribution

ePortfolios Mobile is forked from [Mahara Mobile 25.0.5](https://github.com/MaharaProject/mahara-mobile-react-native)
(GPL v3) by Catalyst IT Limited. See [ACKNOWLEDGEMENTS](ACKNOWLEDGEMENTS.md) for full credits.
```

**Step 4: Commit**

```bash
git add LICENSE ACKNOWLEDGEMENTS.md README.md
git rm COPYING README.upstream.md 2>/dev/null || true
git commit -m "Add LICENSE, ACKNOWLEDGEMENTS.md, and README.md"
```

---

### Task 3: Rebrand app identity (app.json, package.json)

**Files:**
- Modify: `app.json`
- Modify: `package.json`

**Step 1: Update app.json**

Change from:
```json
{
    "name": "Mahara Mobile",
    "displayName": "Mahara Mobile"
}
```

To:
```json
{
    "name": "ePortfolios Mobile",
    "displayName": "ePortfolios Mobile"
}
```

**Step 2: Update package.json identity fields**

Change these fields:
- `"name": "maharamobile"` → `"name": "eportfolios-mobile"`
- `"version": "25.0.5"` → `"version": "1.0.0"`
- `"codegenConfig"."name": "MaharaMobile"` → `"codegenConfig"."name": "EPortfoliosMobile"`
- `"codegenConfig"."android"."javaPackageName": "org.mahara.mobile.app"` → `"codegenConfig"."android"."javaPackageName": "in.eportfolios.mobile"`

Do NOT change dependency names, script commands, or anything else in package.json.

**Step 3: Verify JSON is valid**

```bash
node -e "JSON.parse(require('fs').readFileSync('app.json','utf8')); console.log('app.json OK')"
node -e "JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log('package.json OK')"
```

**Step 4: Commit**

```bash
git add app.json package.json
git commit -m "Rebrand app.json and package.json for ePortfolios Mobile"
```

---

### Task 4: Rebrand Android project

**Files:**
- Modify: `android/app/build.gradle`
- Move: `android/app/src/main/java/org/mahara/mobile/app/` → `android/app/src/main/java/in/eportfolios/mobile/`
- Modify: `android/app/src/main/java/in/eportfolios/mobile/MainActivity.kt`
- Modify: `android/app/src/main/java/in/eportfolios/mobile/MainApplication.kt`
- Modify: `android/app/src/main/res/values/strings.xml`

**Step 1: Update build.gradle**

In `android/app/build.gradle`, change:
- `namespace "org.mahara.mobile.app"` → `namespace "in.eportfolios.mobile"`
- `applicationId "org.mahara.mobile.app"` → `applicationId "in.eportfolios.mobile"`
- `versionCode 145` → `versionCode 1`
- `versionName "25.0.5"` → `versionName "1.0.0"`

**Step 2: Move Kotlin source files to new package directory**

```bash
mkdir -p android/app/src/main/java/in/eportfolios/mobile
mv android/app/src/main/java/org/mahara/mobile/app/MainActivity.kt android/app/src/main/java/in/eportfolios/mobile/
mv android/app/src/main/java/org/mahara/mobile/app/MainApplication.kt android/app/src/main/java/in/eportfolios/mobile/
```

Clean up empty parent directories:
```bash
rm -rf android/app/src/main/java/org/mahara
```

If `android/app/src/main/java/org/` is now empty, remove it too:
```bash
rmdir android/app/src/main/java/org 2>/dev/null || true
```

**Step 3: Update package declaration in MainActivity.kt**

Change first line from:
```kotlin
package org.mahara.mobile.app
```
To:
```kotlin
package in.eportfolios.mobile
```

Also change the `getMainComponentName` return value:
```kotlin
override fun getMainComponentName(): String = "EPortfoliosMobile"
```

**Step 4: Update package declaration in MainApplication.kt**

Change first line from:
```kotlin
package org.mahara.mobile.app
```
To:
```kotlin
package in.eportfolios.mobile
```

**Step 5: Update strings.xml**

Change `android/app/src/main/res/values/strings.xml` from:
```xml
<resources>
    <string name="app_name">MaharaMobile</string>
</resources>
```
To:
```xml
<resources>
    <string name="app_name">ePortfolios Mobile</string>
</resources>
```

**Step 6: Verify no remaining org.mahara references in Android source**

```bash
grep -r "org.mahara" android/ --include="*.kt" --include="*.java" --include="*.xml" --include="*.gradle"
# Expected: no matches (or only in comments/generated files)
```

**Step 7: Commit**

```bash
git add -A android/
git commit -m "Rebrand Android project for ePortfolios Mobile"
```

---

### Task 5: Rebrand iOS project

**Files:**
- Move: `ios/MaharaMobile.xcodeproj/` → `ios/EPortfoliosMobile.xcodeproj/`
- Move: `ios/MaharaMobile.xcworkspace/` → `ios/EPortfoliosMobile.xcworkspace/`
- Move: `ios/MaharaMobile/` → `ios/EPortfoliosMobile/`
- Modify: `ios/EPortfoliosMobile.xcodeproj/project.pbxproj`
- Modify: `ios/Podfile`
- Modify: `ios/EPortfoliosMobile/AppDelegate.swift`

**Step 1: Rename iOS directories**

```bash
mv ios/MaharaMobile.xcodeproj ios/EPortfoliosMobile.xcodeproj
mv ios/MaharaMobile.xcworkspace ios/EPortfoliosMobile.xcworkspace
mv ios/MaharaMobile ios/EPortfoliosMobile
```

**Step 2: Update project.pbxproj**

In `ios/EPortfoliosMobile.xcodeproj/project.pbxproj`, do a global find-and-replace:

- Replace all `MaharaMobile` → `EPortfoliosMobile` (directory references, target names, product names)
- Replace `PRODUCT_BUNDLE_IDENTIFIER = org.mahara.mobile.app` → `PRODUCT_BUNDLE_IDENTIFIER = in.eportfolios.mobile`
- Replace `MARKETING_VERSION = 24.08.1` → `MARKETING_VERSION = 1.0.0`
- Replace `CURRENT_PROJECT_VERSION = 1` — keep as `1` (already correct)

Be careful: `project.pbxproj` is a large generated file. Use `sed` for the replacements:

```bash
sed -i '' 's/MaharaMobile/EPortfoliosMobile/g' ios/EPortfoliosMobile.xcodeproj/project.pbxproj
sed -i '' 's/org\.mahara\.mobile\.app/in.eportfolios.mobile/g' ios/EPortfoliosMobile.xcodeproj/project.pbxproj
sed -i '' 's/MARKETING_VERSION = 24\.08\.1/MARKETING_VERSION = 1.0.0/g' ios/EPortfoliosMobile.xcodeproj/project.pbxproj
```

**Step 3: Update xcworkspace contents**

If `ios/EPortfoliosMobile.xcworkspace/contents.xcworkspacedata` references `MaharaMobile`, update it:

```bash
sed -i '' 's/MaharaMobile/EPortfoliosMobile/g' ios/EPortfoliosMobile.xcworkspace/contents.xcworkspacedata
```

**Step 4: Update Podfile**

Change the target name in `ios/Podfile`:

```ruby
target 'MaharaMobile' do
```
→
```ruby
target 'EPortfoliosMobile' do
```

**Step 5: Update Podfile.lock**

If `ios/Podfile.lock` contains `MaharaMobile` references:

```bash
sed -i '' 's/MaharaMobile/EPortfoliosMobile/g' ios/Podfile.lock
```

**Step 6: Update AppDelegate.swift**

In `ios/EPortfoliosMobile/AppDelegate.swift`, change:

```swift
self.moduleName = "MaharaMobile"
```
→
```swift
self.moduleName = "EPortfoliosMobile"
```

**Step 7: Update Info.plist if needed**

Check `ios/EPortfoliosMobile/Info.plist` for `MaharaMobile` references and update them.

**Step 8: Verify no remaining MaharaMobile references in iOS**

```bash
grep -r "MaharaMobile" ios/ --include="*.swift" --include="*.m" --include="*.h" --include="*.plist" --include="*.pbxproj" --include="*.xcworkspacedata" --include="Podfile*"
# Expected: no matches
grep -r "org.mahara" ios/
# Expected: no matches
```

**Step 9: Commit**

```bash
git add -A ios/
git commit -m "Rebrand iOS project for ePortfolios Mobile"
```

---

### Task 6: Rebrand user-facing strings

**Files:**
- Modify: `src/screens/SiteCheckScreen/SiteCheckScreen.tsx`
- Modify: `src/screens/AboutScreen/AboutScreen.tsx`
- Modify: any other `src/**/*.tsx` files containing user-facing "Mahara" strings
- Modify: `locales/en/messages.po` (and other locales after extraction)

**Step 1: Find all user-facing Mahara references in source**

```bash
grep -rn "Mahara" src/ --include="*.tsx" --include="*.ts" | grep -v "node_modules" | grep -v ".test."
```

Review each match. Focus on strings inside `<Trans>`, `` t` ``, and JSX text content. Ignore:
- Import statements
- Type names (`MaharaFile`, `PendingMFile`, etc.) — these are deferred
- Code comments (leave or update as appropriate)

**Step 2: Update SiteCheckScreen.tsx**

Change:
```tsx
<Trans>What is the address of your Mahara?</Trans>
```
→
```tsx
<Trans>What is the address of your ePortfolios site?</Trans>
```

**Step 3: Update AboutScreen.tsx**

Rewrite the About screen text. Replace all paragraphs that reference "Mahara" and "Mahara Mobile":

Replace the entire screen content with ePortfolios-branded text:
- "Mahara Mobile is an open source project created by the Mahara Project Team" → "ePortfolios Mobile is an open source project by Academe Research, Inc."
- Update the GitHub repo link from `MaharaProject/mahara-mobile-react-native` to the ePortfolios Mobile repo URL
- "Mahara Mobile allows you to connect your mobile device to your Mahara site" → "ePortfolios Mobile allows you to connect your mobile device to your ePortfolios site"
- "Mahara is an open source ePortfolio platform..." → "ePortfolios is an open source ePortfolio and competency assessment platform..."
- "push content to Mahara from Mahara Mobile" → "push content to your site from ePortfolios Mobile"
- "an account on a Mahara site" → "an account on an ePortfolios site"

**Step 4: Update any other screens with Mahara references**

Check HelpScreen, PrivacyScreen, TermsScreen, VersionScreen for Mahara references and update them.

**Step 5: Update code comments that reference "Mahara" in user-visible error handling**

In `src/utils/authHelperFunctions.ts`, update comment:
```typescript
// the Mahara error message
```
→
```typescript
// the server error message
```

Any `console.warn` or user-visible Toast messages referencing "Mahara" should also be updated.

**Step 6: Re-extract and compile locale strings**

```bash
npm run extract
npm run compile
```

This updates the `.po` files in `locales/` with the new English strings. Non-English translations will show the English fallback until translated.

**Step 7: Verify no user-facing Mahara references remain**

```bash
grep -rn "Mahara" src/ --include="*.tsx" --include="*.ts" | grep -v "node_modules" | grep -v "MaharaFile\|PendingMFile\|isMaharaFile\|isPendingMFile\|maharaFormData\|uploadItemToMahara\|emptyMFile"
```

Remaining matches should only be in deferred type names and non-user-facing code.

**Step 8: Commit**

```bash
git add -A src/ locales/
git commit -m "Rebrand user-facing strings from Mahara to ePortfolios"
```

---

### Task 7: Replace brand assets

**Files:**
- Modify: `src/assets/images/Logo-big.tsx` (SVG component — Mahara logo)
- Modify: `src/assets/images/Logo.tsx` (SVG component — smaller Mahara logo)
- Replace: `src/assets/images/MaharaMobile.png` → rename/replace with ePortfolios image
- Modify: Android mipmap icons in `android/app/src/main/res/mipmap-*/`
- Modify: iOS icons in `ios/Images.xcassets/`

**Step 1: Replace Logo-big.tsx**

Create a placeholder SVG logo. Replace the Mahara tree+text SVG with a simple "eP" text logo in the same component structure. The SVG should:
- Use white fill (matching the current color scheme)
- Display "eP" or "ePortfolios" text
- Fit within the same viewBox dimensions

This is a placeholder — final brand assets will come later per `docs/planned-features-mobile.md`.

**Step 2: Replace Logo.tsx**

Same approach — replace the smaller Mahara logo SVG with an ePortfolios placeholder.

**Step 3: Rename MaharaMobile.png**

```bash
# Rename or replace the file
mv src/assets/images/MaharaMobile.png src/assets/images/eportfolios-mobile.png
```

Update any imports referencing this file:
```bash
grep -rn "MaharaMobile.png" src/
# Update each import to reference the new filename
```

**Step 4: Note on native app icons**

Android mipmap icons and iOS xcassets app icons need replacement with ePortfolios icons. For now, create simple placeholder icons:
- Generate placeholder icons using a solid color + "eP" text
- Android needs icons in mipmap-mdpi through mipmap-xxxhdpi
- iOS needs icons in the AppIcon asset catalog

If automated icon generation is not feasible, create a tracking note in the commit message that final icons are still needed per `docs/planned-features-mobile.md`.

**Step 5: Commit**

```bash
git add -A src/assets/ android/app/src/main/res/mipmap-*/ ios/Images.xcassets/
git commit -m "Replace Mahara branding images with ePortfolios placeholders"
```

---

### Task 8: Update config and entry points

**Files:**
- Verify: `index.js` (uses `codegenConfig.name` from package.json — should auto-update)
- Verify: `metro.config.js`
- Modify: `react-native.config.js` (if iOS paths need updating)
- Modify: `.nvmrc`

**Step 1: Verify index.js**

Read `index.js`:
```javascript
import { AppRegistry } from 'react-native';
import { codegenConfig as config } from './package.json';
import App from './src/App';

AppRegistry.registerComponent(config.name, () => App);
```

This reads `codegenConfig.name` from `package.json` dynamically — since we updated that to `"EPortfoliosMobile"` in Task 3, this should work without changes. **No modification needed.**

**Step 2: Verify metro.config.js**

Read the file. If it doesn't reference `MaharaMobile` anywhere, no changes needed.

**Step 3: Update react-native.config.js**

Current content:
```javascript
module.exports = {
    project: {
        ios: {},
        android: {}
    },
    assets: ['./src/assets/fonts/']
};
```

The iOS project path is auto-detected. Since we renamed the Xcode project, verify that the auto-detection works. If not, add explicit path:

```javascript
module.exports = {
    project: {
        ios: {
            project: './ios/EPortfoliosMobile.xcodeproj'
        },
        android: {}
    },
    assets: ['./src/assets/fonts/']
};
```

**Step 4: Update .nvmrc**

Change from `18` to `22` (current Node LTS):

```
22
```

**Step 5: Commit**

```bash
git add index.js metro.config.js react-native.config.js .nvmrc
git commit -m "Update config files and entry points for ePortfolios Mobile"
```

---

### Task 9: Final sweep and version tag

**Files:**
- Potentially various files with remaining "mahara" references
- Create: `.github/workflows/` (placeholder directory)
- Create: `CLAUDE.md` (Claude Code guidance for the mobile repo)

**Step 1: Comprehensive grep for remaining Mahara references**

```bash
grep -ri "mahara" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" --include="*.md" --include="*.xml" --include="*.gradle" --include="*.swift" --include="*.kt" --include="*.plist" . | grep -v node_modules | grep -v ".git/"
```

Review each match:
- **Fix** any user-facing strings or config that still says "Mahara"
- **Keep** deferred type names (`MaharaFile`, etc.) — these are documented in `planned-features-mobile.md`
- **Keep** ACKNOWLEDGEMENTS.md and LICENSE attribution
- **Keep** `Podfile.lock` entries referencing MaharaExtension (if from upstream plugins)

**Step 2: Create placeholder GitHub Actions directory**

```bash
mkdir -p .github/workflows
```

Create `.github/workflows/.gitkeep`:
```bash
touch .github/workflows/.gitkeep
```

**Step 3: Create CLAUDE.md for the mobile repo**

Write a `CLAUDE.md` tailored to the React Native mobile codebase with:
- Project overview (RN 0.77, TypeScript, ePortfolios Mobile)
- Build/run commands (`npm install`, `npm run android`, `npm run ios`)
- Lint/test commands (`npm run lint`, `npm test`, `npx tsc`)
- Architecture overview (screens, store, components, utils, navigation)
- i18n workflow (`npm run extract`, `npm run compile`)
- Key conventions (deferred type renames, upstream attribution)

**Step 4: Verify npm install succeeds**

```bash
npm install
```

Expected: clean install with no errors. `postinstall` runs `patch-package` — verify patches apply.

**Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no type errors (or only pre-existing ones from upstream).

**Step 6: Commit**

```bash
git add -A
git commit -m "Bump version to 1.0.0 — first ePortfolios Mobile release"
```

**Step 7: Tag the release**

```bash
git tag -a v1.0.0 -m "ePortfolios Mobile v1.0.0 — initial fork from Mahara Mobile 25.0.5"
```

---

### Task 10: Post-fork verification

**This task is manual / informational — run these checks after all commits are done.**

**Step 1: Verify commit history**

```bash
git log --oneline
```

Expected (9 commits, newest first):
```
<hash> Bump version to 1.0.0 — first ePortfolios Mobile release
<hash> Update config files and entry points for ePortfolios Mobile
<hash> Replace Mahara branding images with ePortfolios placeholders
<hash> Rebrand user-facing strings from Mahara to ePortfolios
<hash> Rebrand iOS project for ePortfolios Mobile
<hash> Rebrand Android project for ePortfolios Mobile
<hash> Rebrand app.json and package.json for ePortfolios Mobile
<hash> Add LICENSE, ACKNOWLEDGEMENTS.md, and README.md
<hash> Import Mahara Mobile 25.0.5 (GPL v3) as base for ePortfolios Mobile
```

**Step 2: Verify bundle IDs are consistent**

```bash
grep -r "in.eportfolios.mobile" android/ ios/ package.json
# Should appear in: build.gradle, project.pbxproj, package.json codegenConfig
```

**Step 3: Verify app name is consistent**

```bash
grep -r "ePortfolios Mobile" app.json android/app/src/main/res/values/strings.xml
```

**Step 4: Verify no unintended Mahara references in user-facing code**

```bash
grep -rn "Mahara" src/ --include="*.tsx" | grep -E "<Trans>|t\`"
# Expected: no matches
```

**Step 5: Create GitHub repo and push (when ready)**

```bash
# When ready to publish:
git remote add origin git@github.com:academeio/eportfolios-mobile.git
git push -u origin main
git push origin v1.0.0
```

This step requires the GitHub repo to exist first — coordinate with the user.
