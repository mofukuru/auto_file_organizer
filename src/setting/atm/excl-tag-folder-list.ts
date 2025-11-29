import { Setting } from "obsidian";
import AutoFileOrganizer from "src/main";

export function ExcludedTagFolderList(
    containerEl: HTMLElement,
    plugin: AutoFileOrganizer,
    refresh: () => void
): void {
    const collapsibleSection4 = containerEl.createEl("details", {
        attr: { open: "true" },
    });
    const summary4 = collapsibleSection4.createEl("summary", {
        text: "Excluded Tag list",
    });

    summary4.style.fontSize = "1.2em";
    summary4.style.margin = "8px";
    summary4.style.cursor = "pointer";

    for (const [folder1] of Object.entries(plugin.settings.tagBlackList)) {
        new Setting(collapsibleSection4)
            .setName(`Exclude "${folder1}"`)
            .setDesc(
                "This folder is excluded when pushing get tag mapping button"
            )
            .addButton((btn) =>
                btn
                    .setButtonText("Delete")
                    .setCta()
                    .onClick(async () => {
                        delete plugin.settings.tagBlackList[folder1];
                        await plugin.saveSettings();
                        refresh();
                    })
            );
    }
}