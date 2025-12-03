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

---

## Installation

You can install it by searching for "Auto File Organizer" in the Community Plugins section.

---

## How to Use

1. **Set Folder Mappings**:
   - Open the settings, and in the **Extension-to-Folder Mapping** section, input the extension (e.g., `txt`, `md`, etc.) and select the target folder.
     **Do not include a period (".") in the extension.**
   - In the **Tag-to-Folder Mapping** section, input the tag (e.g., `#test`, `#project`, etc.) and select the target folder.
     **Make sure to include a "#" at the beginning of the tag.**

2. **Edit Existing Mappings**:
   - You can edit or delete existing mappings from the list in the settings.

3. **Priority and Enable/Disable Settings**:
   - In the **Priority** section, you can set whether mappings based on extensions or tags are prioritized.
   - You can enable or disable mappings for extensions and tags individually. Disabled mappings will remain saved.

4. **Automatically Making Mappings based on Extensions or Tags**:
   - You can start making mappings based on Extensions or Tags if you push the button.
   - You can also set black lists what you don't include folders to make mappings.
   
---

## How to exclude folders (Archive など)

If you want to prevent files inside certain folders (e.g., `Archive`) from being moved automatically:

1. Open Obsidian → Settings → Community Plugins → Auto File Organizer.
2. In the section "Auto Extension Mapping":
   - Add the folder to the "Excluded Folder" list (extension side).
3. Optionally, in the section "Auto Tag Mapping":
   - Add the folder to the "Excluded Folder" list (tag side).

From v1.0.9 and later, files under excluded folders will not be moved by the organizer thanks to a global guard. For details, see `SPEC.md`.

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
