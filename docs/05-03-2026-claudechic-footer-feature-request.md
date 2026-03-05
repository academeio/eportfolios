# Feature Request: Enhanced Footer with Repo Context & Usage Info

**Project:** [claudechic](https://github.com/mrocklin/claudechic)

---

## Summary

Add **repo/folder name** and **session usage** (rate-limit utilisation) to the `StatusFooter`, giving users persistent at-a-glance awareness of where they are and how much capacity remains — without running `/usage` or checking the terminal title.

## Motivation

The current footer shows model, permission mode, context bar, CPU, and git branch. Two common pieces of information are missing:

1. **Where am I?** — When working across multiple repos or sub-directories (especially with multi-agent / worktree workflows), there's no footer indication of which repo or folder you're in. The git branch alone isn't enough when you have several repos checked out to the same branch name.

2. **How much usage is left?** — The `/usage` command exists but requires an explicit invocation. A compact always-visible indicator (like `5h:23% 7d:8%`) would let users pace their work without interrupting flow.

## Proposed Changes

### 1. Repo/Folder Label

Add an async helper `get_git_repo_folder(cwd)` that runs `git rev-parse --show-toplevel`, extracts the repo basename, and computes the relative path. Display it as e.g. `📁 eportfolios/` or `📁 eportfolios/lib/` in the footer, positioned just before the branch label.

Refresh it alongside `refresh_branch()` when switching agents or directories.

### 2. Usage Label

Add a `UsageLabel` widget that:

- Fetches from the existing `fetch_usage()` (OAuth endpoint) on mount and every ~60 seconds
- Displays compactly: `5h:23% 7d:8%` with colour coding (green < 50%, yellow < 80%, red ≥ 80%)
- Is clickable — runs `/usage` for the full report
- Gracefully shows `usage: --` on error / no token

### Proposed Footer Layout

```
[vi-mode] Model · Auto-edit: off    usage · [processes] [context ██░░ 23%] CPU 5%  📁 repo/path/ ⎇ main
```

## Design Considerations

- **Space:** The footer is a single line. On narrow terminals, some labels could be hidden or abbreviated. Consider a `min-width` threshold.
- **Polling frequency:** 60s for usage is conservative. Could be configurable via `.claudechic.yaml`.
- **Privacy:** The usage fetch uses the existing OAuth token path. No new credentials needed.
- **Extensibility:** If this lands, the same pattern could support showing session token totals (input/output) by parsing the session JSONL, though that's a separate ask.

## Reference Implementation

I've patched this locally against the installed package (v current). Happy to open a PR if there's interest. The changes touch two files:

- `claudechic/widgets/layout/footer.py` — new `get_git_repo_folder()`, `UsageLabel` widget, `repo_folder` reactive on `StatusFooter`
- `claudechic/app.py` — one extra `create_safe_task()` call to refresh `repo_folder` on agent switch
