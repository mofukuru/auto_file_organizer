import { App, Setting, Notice } from "obsidian";
import { FolderSuggest } from "src/suggester";
import AutoFileOrganizer from "src/main";

export function SetTagFolderBlacklist(
    containerEl: HTMLElement,
    plugin: AutoFileOrganizer,
    app: App,
    refresh: () => void
): void {
    let blackList = "";

    new Setting(containerEl)
        .setName("Set Folder Blacklist")
        .setDesc(
            "Indicate what folder is excluded for automatically get tag mapping"
        )
        .addSearch((search) => {
            new FolderSuggest(app, search.inputEl);
            search.setPlaceholder("Search folder...").onChange((folder) => {
                blackList = folder;
            });
        })
        .addButton((btn) => {
            btn.setButtonText("Add")
                .setCta()
                .onClick(async () => {
                    if (blackList) {
                        plugin.settings.tagBlackList[blackList] = blackList;
                        await plugin.saveSettings();
                        refresh();
                    } else {
                        new Notice("The input is invalid.");
                    }
                });
        });
}