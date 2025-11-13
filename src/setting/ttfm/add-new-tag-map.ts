import { App, Setting, Notice } from "obsidian";
import { FolderSuggest, TagSuggest } from "src/suggester";
import { getSanitizedTag } from "src/inputvalidation";
import AutoFileOrganizer from "src/main";

export function AddNewTagMapping(
	containerEl: HTMLElement,
	plugin: AutoFileOrganizer,
	app: App,
	refresh: () => void
): void {
	let newTag = "";
	let tagFolder = "";

	new Setting(containerEl)
		.setName("Add new tag mapping")
		.setDesc("Add a new tag and target folder")
		.addSearch((search) => {
			new TagSuggest(app, search.inputEl);
			search.setPlaceholder("Search tag...").onChange((tag) => {
				newTag = getSanitizedTag(tag);
			});
		})
		.addSearch((search) => {
			new FolderSuggest(app, search.inputEl);
			search.setPlaceholder("Search folder...").onChange((folder) => {
				tagFolder = folder;
			});
		})
		.addButton((btn) => {
			btn.setButtonText("Add")
				.setCta()
				.onClick(async () => {
					if (newTag && tagFolder) {
						plugin.settings.tagMapping[newTag] = tagFolder;
						await plugin.saveSettings();
						refresh();
					} else {
						new Notice("The input is invalid.");
					}
				});
		});
}
