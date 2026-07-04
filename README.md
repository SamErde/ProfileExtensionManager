# Profile Extension Manager

<img src="assets/brand/banner.png" alt="Profile Extension Manager banner" width="100%" />

Easily see and manage which extensions are installed in each VS Code profile, all from one convenient matrix.

## Features

- **Profile x extension matrix**: Show every profile as a column and every extension as a row. Toggle any cell to install or uninstall the extension for that profile.
- **Cross-profile install/uninstall**: Act on any profile directly from the matrix; you never have to switch into a profile just to add or remove an extension from it.
- **Orphan cleanup**: Find extension versions on disk that no profile references, review them (size, last modified), and move them to the Trash/Recycle Bin.
- **Privacy**: This extension never collects or transmits any data.

## Requirements & Limitations

- VS Code Stable or Insiders on Windows, macOS, or Linux.
- Portable installations and custom `--user-data-dir`/`--extensions-dir` are supported.
- Remote workspaces (SSH, WSL, containers, github.dev) are not managed. Profile Extension Manager manages the local desktop install it runs in.

## Screenshot

*(GIF placeholder — record `docs/media/matrix.gif` before publishing: open the matrix → toggle a cell → run cleanup.)*

## How It Works

Profile Extension Manager reads the same files VS Code itself maintains: the profile registry and each profile's extension list. All installs and uninstalls run through the official `code` command-line interface, scoped to the right profile (and, when applicable, the right `--user-data-dir`/`--extensions-dir`).
