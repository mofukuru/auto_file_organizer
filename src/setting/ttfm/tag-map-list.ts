import { Setting, Notice, TFolder } from "obsidian";
import AutoFileOrganizer from "src/main";

export function TagMappingList(
    containerEl: HTMLElement,
    plugin: AutoFileOrganizer,
    allFolders: TFolder[],
    refresh: () => void
): void {
    const collapsibleSection2 = containerEl.createEl("details", {
        attr: { open: "true" },
    });
    const summary2 = collapsibleSection2.createEl("summary", {
        text: "Tag mapping list",
    });

    summary2.style.fontSize = "1.2em";
    summary2.style.margin = "8px";
    summary2.style.cursor = "pointer";

    for (const [tag, folder] of Object.entries(plugin.settings.tagMapping)) {
        new Setting(collapsibleSection2)
            .setName(`Tag: ${tag}`)
            .setDesc("Change the folder for this tag")
            .addDropdown((dropdown) => {
                dropdown.addOption("", "Select folder...");
                allFolders.forEach((f) => dropdown.addOption(f.path, f.path));
                dropdown.setValue(folder);

                dropdown.onChange(async (value) => {
                    if (value) {
                        plugin.settings.tagMapping[tag] = value;
                        await plugin.saveSettings();
                        new Notice(`Folder for ${tag} files updated to: ${value}`);
                    }
                });
            })
            .addButton((btn) =>
                btn
                    .setButtonText("Delete")
                    .setCta()
                    .onClick(async () => {
                        delete plugin.settings.tagMapping[tag];
                        await plugin.saveSettings();
                        refresh();
                    })
            );
    }
}