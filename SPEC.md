# Auto File Organizer – Detailed Specification

This document provides the authoritative, detailed specification for the Obsidian plugin `Auto File Organizer`.

## Purpose
- Automatically move files to target folders based on either their file extensions or the tags contained in the note.
- Provide manual and automated mapping tools to configure how extensions and tags map to folders.

## Version / Compatibility
- Plugin version: 1.2.0
- Minimum Obsidian version: 1.6.6
- Platforms: Desktop and mobile (isDesktopOnly: false)

## Settings Model
- `tagEnabled` (boolean): Enable moving by tags.
- `extensionEnabled` (boolean): Enable moving by extension.
- `priority` ("tag" | "extension"): Which rule is attempted first.
- `rootOnly` (boolean, default false): When true, files created outside the vault root are not moved automatically.
- `extensionMapping` (Record<string, string>): `{ extension: folderName }` without leading dot.
- `tagMapping` (Record<string, string>): `{ "#tag": folderPath }` with leading `#`. Key order is rule priority (earlier wins).
- `extensionBlackList` (Record<string, string>): Extensions excluded from auto-building mappings.
- `extensionFolderBlackList` (Record<string, string>): Folder paths excluded from auto-mapping and live move logic. Keys are full vault-relative paths (e.g., `"- Files/Obsidian Tutorial"`); values equal keys (set semantics).
- `tagBlackList` (Record<string, string>): Folders excluded from auto tag-based mapping.

## Core Behavior
### Event Triggers
- `vault.create (TFile)`: On file creation, attempts to move based on configured mappings. Registered inside `workspace.onLayoutReady` so the create events Obsidian emits for existing files during vault load are ignored. Skipped for non-root files when `rootOnly` is true.
- `vault.rename (TFile, oldPath)`: If the file is in the vault root, re-evaluates move logic.
- `metadataCache.changed (TFile)`: On metadata change (e.g., tags added), attempts to move — **only if the file is in the vault root**. Already-organized files in subfolders are not affected.

### Move Algorithm
1. If the file's parent folder is under any key of `extensionFolderBlackList` or `tagBlackList`, do nothing.
2. Resolve a target folder, in `priority` order:
   - Tag (`tagEnabled`): collect the note's tags via `getAllTags` (case-insensitive). Take the `tagMapping` entries that match, in mapping order. If the note already sits in the folder of any matching rule, the target is its current folder (no move); otherwise the first matching rule's folder.
   - Extension (`extensionEnabled`): look up `file.extension` (exact, then lowercase) in `extensionMapping`.
3. If the target equals the current folder, do nothing.
4. If a file already exists at `target/file.name`, skip and show a notice.
5. Create the folder if needed and move with `fileManager.renameFile`, which updates links per the user's settings.
6. Manual command `Organize files`: plans moves for all vault files, shows a preview modal with per-file checkboxes, then moves the selected files sequentially and reports moved/skipped counts.

### Notes
- Tag-based mapping requires tags to be stored in the note’s metadata.
- Extension strings in mappings must not include a leading dot.
- Tag strings in mappings must include a leading `#`.

## Auto-Mapping Tools
### Extensions (AEM)
- `updateExtensionMappingFromExistingFiles()`:
  - Scans all files; skips extensions present in `extensionBlackList`.
  - Skips files in the vault root, extensions already mapped, and folders under `extensionFolderBlackList`.
  - For each extension, adds the full folder path that contains the most files with that extension.
  - Saves settings and displays a notice.

### Tags (ATM)
- `updateTagMappingFromExistingFiles()`:
  - Scans markdown files; for each unmapped tag, adds the full folder path that contains the most notes with that tag. Root files and folders under `tagBlackList` are skipped.
  - Saves settings and displays a notice.

## Settings UI Structure
- Priority section: choose precedence (`tag` vs `extension`).
- Extension-to-Folder Mapping (ETFM): enable toggle, add new mapping, list/edit mappings.
- Auto Extension Mapping (AEM): run auto-mapping, manage extension blacklist, view excluded extensions. Folder blacklist UI is commented out as legacy.
- Tag-to-Folder Mapping (TTFM): enable toggle, add new mapping, list/edit mappings.
- Auto Tag Mapping (ATM): run auto-mapping, set tag folder blacklist, view excluded tag folders.

## Limitations / Current Behavior
- Rename trigger applies only when renamed files are in the vault root.
- When multiple tags match, the order of `tagMapping` decides (reorderable in settings).
- Suggesters use `AbstractInputSuggest`, so they work when settings open in a separate window (Obsidian 1.13+).

## Excluded Folders Behavior
- Files within folders listed in `extensionFolderBlackList` or `tagBlackList` will not be moved by the organizer.
- **Full path keys are supported:** The key must be the full vault-relative path of the folder (e.g., `"- Files/Obsidian Tutorial"`). Any file whose parent path equals the key or starts with `key + "/"` is excluded.
  - `"- Files/Obsidian Tutorial"` protects `- Files/Obsidian Tutorial/file.png` and `- Files/Obsidian Tutorial/Images/file.png`, but does NOT affect `- Files/Attachments/Images/file.png`.
- **Nested folders are supported:** If you exclude `- Files/Obsidian Tutorial`, all files under any subdirectory of that folder are also protected.
- The global guard is applied at the beginning of `getTargetFolder()`. Trailing slashes in keys are ignored.
- Use the settings UI to manage these lists:
  - Auto Extension Mapping → Excluded Folder (extension side)
  - Auto Tag Mapping → Excluded Folder (tag side)

## FAQ
- Q: My Archive files keep getting relocated. How can I stop this?
  - A: Add the folder's full vault-relative path (e.g., `Archive` or `- Files/Archive`) to the Excluded Folder list in Auto Extension Mapping (and optionally in Auto Tag Mapping). Files inside excluded folders and their subfolders are never moved.
- Q: If I exclude `"- Files/Obsidian Tutorial"`, will `"- Files/Attachments/Images"` also be excluded?
  - A: No. Exclusion is prefix-based on the full path. `"- Files/Obsidian Tutorial"` only protects files whose path starts with `- Files/Obsidian Tutorial/`, so `- Files/Attachments/Images` is unaffected.
- Q: If I exclude "Project", will "Project/Project 1/file.md" also be protected?
  - A: Yes. The exclusion applies to the entire folder hierarchy under the specified path.
- Q: Files with tag "#project" already in the "project" folder keep being processed. Why?
  - A: The plugin checks if a file is already in the correct location (`originalPath !== targetPath`) and skips the move. However, prior to v1.1.0, every settings save triggered a full vault reorganization, causing unnecessary processing. This has been fixed—now files already in their correct folder are simply logged and skipped.
- Q: Does exclusion affect auto-mapping builders?
  - A: Yes. Auto-mapping functions skip folders and extensions present in the respective blacklists when populating mappings.

## Recovery (Upgrade 1.0.4 → 1.0.5)
- If `extensionMapping` disappears during upgrade, recover previous mappings from:
  - `your-vault/.obsidian/plugins/auto_file_organizer/data.json`

## Changelog Highlights
- 1.2.0: Fix invisible suggestions in pop-out settings (#15); stop moving existing files on startup; preview before "Organize files"; tag rule priority by list order (#4, #9); link-aware moves; auto-mapping uses full folder paths.
- 1.1.2: Fix critical bug where `metadataCache.changed` moved existing organized files. Fix folder blacklist to support full vault-relative paths (e.g., `"- Files/Obsidian Tutorial"`).
- 1.1.1: Support nested folder exclusion; remove automatic vault reorganization on settings save.
- 1.0.9: Auto-mapping excludes blacklisted extensions directly.
- 1.0.8: Fix tag suggestion behavior.
- 1.0.7: Fix invalid Unicode tag input.
- 1.0.6: Show notice and skip invalid input.
- 1.0.5: Improved settings UI (folding/search).
- 1.0.4: Added auto-mapping and blacklists for extensions.
- 1.0.3: Added folder blacklist for auto tag mapping.
- 1.0.2: Manual organize command; auto tag mapping button.
- 1.0.1: Android verification; initial tag/extension mapping features.
- 1.0.0: Initial release.
