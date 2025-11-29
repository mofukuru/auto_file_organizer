import { Setting, Notice, TFolder } from "obsidian";
import AutoFileOrganizer from "../../main";

export function ExtensionMappingList(
    containerEl: HTMLElement,
    plugin: AutoFileOrganizer,
    allFolders: TFolder[],
    renderCallback?: () => Promise<void> | void
): void {
    const collapsibleSection1 = containerEl.createEl("details", {
        attr: { open: "true" },
    });
    const summary1 = collapsibleSection1.createEl("summary", {
        text: "Extension mapping list",
    });

    summary1.style.fontSize = "1.2em";
    summary1.style.margin = "8px";
    summary1.style.cursor = "pointer";

    const mapping = plugin.settings.extensionMapping ?? {};

    for (const [extension, folder] of Object.entries(mapping)) {
        new Setting(collapsibleSection1)
            .setName(`Extension: ${extension}`)
            .setDesc("Change the folder for this extension")
            .addDropdown((dropdown) => {
                dropdown.addOption("", "Select folder...");
                allFolders.forEach((f) => dropdown.addOption(f.path, f.path));
                dropdown.setValue(folder ?? "");

                dropdown.onChange(async (value) => {
                    if (value) {
                        plugin.settings.extensionMapping[extension] = value;
                        await plugin.saveSettings();
                        new Notice(
                            `Folder for .${extension} files updated to: ${value}`
                        );
                        if (renderCallback) await renderCallback();
                    }
                });
            })
            .addButton((btn) =>
                btn
                    .setButtonText("Delete")
                    .setCta()
                    .onClick(async () => {
                        delete plugin.settings.extensionMapping[extension];
                        await plugin.saveSettings();
                        if (renderCallback) await renderCallback();
                    })
            );
    }
}