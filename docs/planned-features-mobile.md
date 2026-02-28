# ePortfolios Mobile — Planned Features & Future Work

**Last updated:** 28-02-2026

---

## Internal Code Cleanup (Deferred — Low Priority)

Address incrementally as files are modified. Same approach as the web fork.

### TypeScript Type Renames

The following types/functions retain "Mahara" in their names. Renaming touches many files across the codebase, so defer until actively working in those areas.

- [ ] `MaharaFile` → `PortfolioFile` (in `src/models/models.ts`)
- [ ] `PendingMFile` → `PendingPortfolioFile`
- [ ] `emptyMFile` → `emptyPortfolioFile` (in `src/utils/constants.ts`)
- [ ] `emptyMaharaFile` → `emptyPortfolioFile`
- [ ] `isMaharaFile()` → `isPortfolioFile()` (in `src/utils/helperFunctions.ts`)
- [ ] `isPendingMFile()` → `isPendingPortfolioFile()`
- [ ] `maharaFormData` field → `formData` (in `PendingMFile` type)
- [ ] `uploadItemToMahara()` → `uploadItem()` (in `src/utils/helperFunctions.ts`)
- [ ] `onCheckAuthJSON()` comments referencing "Mahara API" (in `src/utils/authHelperFunctions.ts`)
- [ ] Update JSDoc comments that reference "Mahara" in code files

### Package & Config References

- [ ] `@string/app_name` audit — ensure no XML files still say "Mahara"
- [ ] Gradle namespace comments
- [ ] Xcode scheme internal names

---

## CI/CD Pipeline (Not Started)

- [ ] GitHub Actions workflow for Android build (debug APK)
- [ ] GitHub Actions workflow for iOS build (requires macOS runner or Xcode Cloud)
- [ ] Automated lint + type-check on PRs (`npm run lint && npx tsc`)
- [ ] Automated test run on PRs (`npm test`)
- [ ] Release workflow: build signed APK/AAB, create GitHub release with artifacts

---

## Dependency Modernization

- [ ] Audit `patches/` directory — verify all patch-package patches still apply and are needed
- [ ] Run `npm audit` and resolve critical/high vulnerabilities
- [ ] Evaluate GlueStack UI migration path (themed-native-base → gluestack-ui v2)
- [ ] Evaluate React Native upgrade path beyond 0.77 (New Architecture adoption)
- [ ] Update Gemfile dependencies (CocoaPods, Fastlane if added)

---

## Feature Improvements

### Server Compatibility

- [ ] Update SiteCheckScreen to detect both Mahara and ePortfolios servers
- [ ] Add server version detection (show warning if server is too old)
- [ ] Support ePortfolios-specific API extensions as they're developed

### User Experience

- [ ] Dark mode support
- [ ] Offline queue improvements (better retry logic, conflict resolution)
- [ ] Push notifications for upload completion
- [ ] Biometric authentication (fingerprint/face) for app lock
- [ ] Tablet-optimized layouts

### Portfolio Features

- [ ] View portfolio pages within the app (WebView or native render)
- [ ] Competency framework integration (view assigned competencies)
- [ ] Quick capture: camera → annotate → upload in one flow
- [ ] Audio/video recording improvements

### i18n

- [ ] Complete translation coverage for es, fr, ko, ru locales
- [ ] Add additional languages as needed by institutions
- [ ] RTL layout support

---

## App Store Presence

- [ ] Register "ePortfolios Mobile" on Google Play Store
- [ ] Register "ePortfolios Mobile" on Apple App Store
- [ ] Prepare store listings (screenshots, descriptions, privacy policy)
- [ ] Set up app signing keys (separate from Mahara Mobile's)

---

## Future Releases

| Version | Scope |
|---------|-------|
| 1.0.0 | Current — rebrand from Mahara Mobile (in progress) |
| 1.1.0 | Dependency modernization + CI/CD pipeline |
| 1.2.0 | Server compatibility improvements + dark mode |
| 2.0.0 | Major feature additions (competency framework, portfolio viewer) |
