# Changelog

All notable changes to the Profile Extension Manager extension are documented in this file.

## 0.6.0 (2026-07-04)

### Added

- Extension × profile matrix view.
- Cross-profile install/uninstall via the VS Code CLI.
- `ALL` badge distinguishing extensions applied to all profiles via VS Code's native flag from those merely installed in every profile.
- Orphaned-extension cleanup (review + confirm, moves to Recycle Bin/Trash).
- No telemetry — this extension does not collect or transmit any data.
- Clicking the activity-bar icon now opens the Extension Matrix automatically; configurable via `profileExtensionManager.openMatrixOnActivityBarClick`.
- Per-row bulk actions in the extension matrix: install in every profile via the CLI, remove from every profile where it's directly installed, and a guided "Apply to all profiles…" shortcut that opens the Extensions view for VS Code's native toggle.
- UX polish: extension icons in the matrix (with a themed letter-tile fallback), a correctly-themed "Open Extension Matrix" button in dark themes, a clearer "Applied to all profiles" filter label, and a "Profile Extension Matrix" tab title.
- Profiles dashboard in the activity sidebar: per-profile extension counts ("N direct + M shared"), an orphaned-extensions summary with reclaimable size and a shortcut into the cleanup view, and parse-warning notices. Profile files open as live-updating read-only documents (with an explicit edit affordance for the raw file).
- Sidebar profile rows now wrap onto two lines — name (with a tooltip for long names) on the first, the "N direct + M shared" counts in dimmer text on the second — so long profile names no longer crowd the counts.
- Extension detail hover card in the matrix: hovering (or focusing) an extension's name shows its icon, publisher, description, version, and local install date, plus the row's bulk actions (install/remove/apply to all profiles), replacing the version text and always-hidden per-row action buttons. All data shown in the card is read from the offline extension manifests/package.json; the card's clickable name opens the extension's page via VS Code (which may contact the Marketplace per VS Code's own settings).
