import { App, Notice, Setting } from "obsidian";
import { FolderSuggest } from "src/suggester";

export function SetExtFolderBlacklist(
	containerEl: HTMLElement,
	plugin: any,
	app: App,
	display?: () => void
) {
	let eblackList: string | null = null;

	new Setting(containerEl)
		.setName("Set Folder Blacklist")
		.setDesc(
			"Indicate what folder is excluded for automatically get extension mapping"
		)
		.addSearch((search) => {
			new FolderSuggest(app, search.inputEl);
			search.setPlaceholder("Search folder...").onChange((folder) => {
				eblackList = folder;
			});
		})
		.addButton((btn) => {
			btn.setButtonText("Add")
				.setCta()
				.onClick(async () => {
					if (eblackList) {
						plugin.settings.extensionBlackList =
							plugin.settings.extensionBlackList || {};
						plugin.settings.extensionBlackList[eblackList] =
							eblackList;
						if (typeof plugin.saveSettings === "function") {
							await plugin.saveSettings();
						}
						if (display) display();
					} else {
						new Notice("The input is invalid.");
					}
				});
		});
}
