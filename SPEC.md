# Auto File Organizer – Detailed Specification

This document provides the authoritative, detailed specification for the Obsidian plugin `Auto File Organizer`.

## Purpose
- Automatically move files to target folders based on either their file extensions or the tags contained in the note.
- Provide manual and automated mapping tools to configure how extensions and tags map to folders.

## Version / Compatibility
- Plugin version: 1.0.9
- Minimum Obsidian version: 1.6.6
- Platforms: Desktop and mobile (isDesktopOnly: false)

## Settings Model
- `tagEnabled` (boolean): Enable moving by tags.
- `extensionEnabled` (boolean): Enable moving by extension.
- `priority` ("tag" | "extension"): Which rule is attempted first.
- `extensionMapping` (Record<string, string>): `{ extension: folderName }` without leading dot.
- `tagMapping` (Record<string, string>): `{ "#tag": folderName }` with leading `#`.
- `extensionBlackList` (Record<string, string>): Extensions excluded from auto-building mappings.
- `extensionFolderBlackList` (Record<string, string>): Deprecated; folders excluded from old auto-mapping.
- `tagBlackList` (Record<string, string>): Folders excluded from auto tag-based mapping.

## Core Behavior
### Event Triggers
- `vault.create (TFile)`: On file creation, attempts to move based on configured mappings.
- `vault.rename (TFile, oldPath)`: If the file is in the vault root, re-evaluates move logic.
- `metadataCache.changed (TFile)`: On metadata change (e.g., tags), attempts to move again.

### Move Algorithm
1. Determine `priority`:
   - If `priority === "tag"` and `tagEnabled`:
     - Read file metadata; collect tags via `getAllTags`.
     - For the first tag present in `tagMapping`, ensure folder and rename to `targetFolder/file.name`.
   - Then, if not moved and `extensionEnabled`:
     - Look up `file.extension` in `extensionMapping` and move similarly.
   - If `priority === "extension"`, reverse the above order.
2. Folder creation: `ensureFolderExists(folderPath)` creates missing folders.
3. Manual command: `Organize Files` iterates all vault files and applies the same logic, showing a notice with moved filenames.

### Notes
- Tag-based mapping requires tags to be stored in the note’s metadata.
- Extension strings in mappings must not include a leading dot.
- Tag strings in mappings must include a leading `#`.

## Auto-Mapping Tools
### Extensions (AEM)
- `updateExtensionMappingFromExistingFiles()`:
  - Scans all files; skips extensions present in `extensionBlackList`.
  - Derives each file’s parent folder name; if the folder is not in `extensionFolderBlackList`, adds `{extension: folderName}` to `extensionMapping`.
  - Saves settings and displays a notice.
- `updateExtensionFolderMappingFromExistingFiles()` (legacy):
  - Older approach noted as problematic and deprecated in the UI.

### Tags (ATM)
- `updateTagMappingFromExistingFiles()`:
  - Scans all files; extracts tags from metadata and maps first-seen tag to the file’s parent folder, skipping folders in `tagBlackList`.
  - Saves settings and displays a notice.

## Settings UI Structure
- Priority section: choose precedence (`tag` vs `extension`).
- Extension-to-Folder Mapping (ETFM): enable toggle, add new mapping, list/edit mappings.
- Auto Extension Mapping (AEM): run auto-mapping, manage extension blacklist, view excluded extensions. Folder blacklist UI is commented out as legacy.
- Tag-to-Folder Mapping (TTFM): enable toggle, add new mapping, list/edit mappings.
- Auto Tag Mapping (ATM): run auto-mapping, set tag folder blacklist, view excluded tag folders.

## Limitations / Current Behavior
- Rename trigger applies only when renamed files are in the vault root.
- No explicit conflict resolution when multiple tags match; applies first matching tag encountered.
- Legacy folder blacklist for extension auto-mapping is present but not prominent in the UI.

## Excluded Folders Behavior
- Files within folders listed in `extensionFolderBlackList` or `tagBlackList` will not be moved by the organizer.
- The global guard is applied at the beginning of `handleFile()` and short-circuits any move attempts.
- Use the settings UI to manage these lists:
  - Auto Extension Mapping → Excluded Folder (extension side)
  - Auto Tag Mapping → Excluded Folder (tag side)

## FAQ
- Q: My Archive files keep getting relocated. How can I stop this?
  - A: Add `Archive` to the excluded folder list in Auto Extension Mapping (and optionally in Auto Tag Mapping). Files inside excluded folders are never moved.
- Q: Does exclusion affect auto-mapping builders?
  - A: Yes. Auto-mapping functions skip folders and extensions present in the respective blacklists when populating mappings.

## Recovery (Upgrade 1.0.4 → 1.0.5)
- If `extensionMapping` disappears during upgrade, recover previous mappings from:
  - `your-vault/.obsidian/plugins/auto_file_organizer/data.json`

## Changelog Highlights
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
