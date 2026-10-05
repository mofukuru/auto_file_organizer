# Auto File Organizer

The custom Obsidian plugin, "Auto File Organizer," automatically organizes files into specified folders based on their extensions or tags. It is an essential tool for users seeking efficient file organization.

---

## For those updating from 1.0.4 to 1.0.5 (latest)

Sorry for the inconvenience. If you were using extensionMapping, your list may have disappeared during this update. However, there's no need to worry.

You can find your previously registered mapping information by navigating to your Vault directory and checking the following file:

```
your-vault-directory/.obsidian/plugins/auto_file_organizer/data.json
```

---

## Automatic File Organization Feature

Files newly added to the Vault are automatically moved to designated folders based on their extensions or tags.

To organize files that already exist, run the **Organize files** command (or the **Preview** button in settings). You will see every planned move and can uncheck files before confirming.

---

## Installation

You can install it by searching for "Auto File Organizer" in the Community Plugins section.

---

## How to Use

1. **Set Folder Mappings**:
   - Open the settings, and in the **Extension-to-Folder Mapping** section, input the extension (e.g., `txt`, `md`, etc.) and select the target folder.
     A leading period (".pdf") is removed automatically.
   - In the **Tag-to-Folder Mapping** section, input the tag (e.g., `#test`, `#project`, etc.) and select the target folder.
     The leading "#" is added automatically if omitted. When a note has several mapped tags, the rule higher in the list wins.

2. **Edit Existing Mappings**:
   - You can edit or delete existing mappings from the list in the settings.

3. **Priority and Enable/Disable Settings**:
   - In the **Priority** section, you can set whether mappings based on extensions or tags are prioritized.
   - You can enable or disable mappings for extensions and tags individually. Disabled mappings will remain saved.

4. **Automatically Making Mappings based on Extensions or Tags**:
   - You can start making mappings based on Extensions or Tags if you push the button.
   - You can also set black lists what you don't include folders to make mappings.
   
---

## How to exclude folders

If you want to prevent files inside certain folders from being moved automatically:

1. Open Obsidian → Settings → Community Plugins → Auto File Organizer.
2. In the section "Auto Extension Mapping":
   - Add the folder's **full vault-relative path** to the "Excluded Folder" list (e.g., `- Files/Obsidian Tutorial`).
3. Optionally, in the section "Auto Tag Mapping":
   - Add the same path to the "Excluded Folder" list (tag side).

**Important:** Use the complete vault-relative path as the key. For example, to protect `- Files/Obsidian Tutorial/Images` without affecting `- Files/Attachments/Images`, add `- Files/Obsidian Tutorial` — this will protect that folder and all its subfolders, but will not touch any other path.

From v1.1.2, blacklist keys are matched against the file's full folder path (prefix match), so partial names no longer cause unintended exclusions. For full details, see [SPEC.md](SPEC.md).

---

## Notes

This plugin has been tested on Windows, macOS, iOS, and Android. However, as it is in the pre-release stage, unexpected behavior may occur.

For full, authoritative details of the current specifications, please refer to [See SPEC.md for details](SPEC.md). The README provides a high-level overview; detailed behavior and settings are documented in that markdown file.

---

## TODO

This plugin aims to focus solely on the functionality of moving files as specified, and features will be implemented to achieve this goal.

1. Set a rule to prioritize tags or extensions, which has less conflicts.
2. Apply priority rules when making mappings automatically.

---

## Bug Reports and Feedback

If you encounter any issues or have feature requests, please let us know by following these steps:
- Provide details on the Issues page of the repository.
- If possible, include reproduction steps and error messages.

---

## Changelog

### 1.2.0

- **Fix** ([#15](https://github.com/mofukuru/auto-file-organizer/issues/15)): Folder/tag suggestions were invisible when settings open in a separate window (default since Obsidian 1.13). Suggesters now use Obsidian's built-in `AbstractInputSuggest`.
- **Critical fix** ([#14](https://github.com/mofukuru/auto-file-organizer/issues/14)): Existing files could be moved on startup because Obsidian fires `create` for every file while the vault loads. The `create` handler is now registered after the layout is ready.
- **Safety**: The "Organize files" command now shows a preview of every move and lets you uncheck files before anything is touched.
- **New**: "Only move new files in the vault root" option, recommended when you sync your vault.
- **New** ([#4](https://github.com/mofukuru/auto-file-organizer/issues/4), [#9](https://github.com/mofukuru/auto-file-organizer/issues/9)): Tag rules are prioritized by their order in the tag mapping list (reorder with the arrow buttons). A note that already sits in the folder of one of its mapped tags is no longer moved when another tag is added.
- **Improved** ([#8](https://github.com/mofukuru/auto-file-organizer/issues/8)): Tag and folder suggestions are ranked by relevance, and pressing Enter keeps what you typed instead of replacing it with the first suggestion. New folders are created on demand.
- Moves now go through Obsidian's file manager, so internal links are updated according to your settings. A file is skipped (with a notice) if a file with the same name already exists in the target folder.
- Auto mapping scans now map to the full folder path (previously only the folder name, which created new top-level folders) and pick the folder that holds most of the files.
- Extensions are matched case-insensitively, and `.pdf` is accepted as input for `pdf`.
- Settings UI: folder fields in the mapping lists use search with suggestions instead of a long dropdown, lists show item counts and empty states, and the excluded folder lists explain that they also protect files from being moved.

### 1.1.2

- **Critical fix**: Files already organized in subfolders were incorrectly being moved when any file's metadata changed (e.g., on Obsidian startup or frontmatter edits). The `metadataCache.changed` handler now only processes files in the vault root, matching the behavior of the rename handler.
- **Fix**: Folder blacklist (`extensionFolderBlackList`) now correctly matches full vault-relative paths. Previously, a key like `"- Files/Obsidian Tutorial"` was not recognized because matching was done on individual path segments. Now, keys are compared against the file's complete folder path using prefix matching — so `"- Files/Obsidian Tutorial"` protects everything under that folder without affecting unrelated paths like `"- Files/Attachments/Images"`.

### 1.1.1

- Support nested folder exclusion: excluding "Project" now protects all files under "Project/Project 1", etc.
- Fix: Remove automatic vault reorganization on every settings save to prevent unnecessary processing.
- Add debug logging when files are already in their correct location.

### 1.1.0

- Add global guard to prevent moving files located in excluded folders (e.g., Archive). Manage excluded folders in Settings → Auto Extension Mapping / Auto Tag Mapping.
- Re-enable UI for extension folder blacklist management.
- Documentation updates pointing to SPEC.md for detailed specs.

### 1.0.9

- When auto-mapping extensions to folders, exclude file extensions directly instead of excluding folders.

### 1.0.8

- Modified the tag suggestion problem.

### 1.0.7

- Fix invalid input for tags using Unicode.

### 1.0.6

- Pop notice and not be adopted when you get invalid input.

### 1.0.5

- Change the setting UI that you can fold lists and search.

### 1.0.4

- Auto mapping function and black list are also added to extensions.

### 1.0.3

- Add Black List, which the folders included in are excluded when automatically making mappings tags to folders.

### 1.0.2

- Add command to organize files by hand. If can't organize well automatically you should use the function, even that doesn't work please tell me.
- Add button that make mappings tags to folder automatically. The function is so simple that I don't consider conflicts. Please take care when you use. I will modify later.

### 1.0.1

- Verified functionality on Android.
- Added tag and folder mapping features, along with related settings.

### 1.0.0

- Initial release of the plugin.

Thank you for using the plugin! 🙌
