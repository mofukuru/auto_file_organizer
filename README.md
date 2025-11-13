# Auto File Organizer Enhanced

Forked from mofukuru/auto_file_organizer, this custom Obsidian plugin automatically organizes files into specified folders based on their extensions or tags and has been modified here to add support for blacklisting specific extensions.

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

## Notes

This plugin has been tested on Windows, macOS, iOS, and Android. However, as it is in the pre-release stage, unexpected behavior may occur.

---

## TODO

This plugin aims to focus solely on the functionality of moving files as specified, and features will be implemented to achieve this goal.

1. Set a rule to priotize tags or extensions, which has less confliction.
2. Apply priority rules when making mappings automatically.

---

## Bug Reports and Feedback

If you encounter any issues or have feature requests, please let us know by following these steps:
- Provide details on the Issues page of the repository.
- If possible, include reproduction steps and error messages.

---

## Changelog

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
- Add button that make mappings tags to folder automatically. The function is so simple that I don't consider conflictions. Please take care when you use. I will modify later.

### 1.0.1

- Verified functionality on Android.
- Added tag and folder mapping features, along with related settings.

### 1.0.0

- Initial release of the plugin.

Thank you for using the plugin! 🙌
