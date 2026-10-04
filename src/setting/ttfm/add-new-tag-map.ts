import { App, Setting, Notice } from "obsidian";
import { TagSuggest } from "src/suggester";
import { getSanitizedTag } from "src/inputvalidation";
import AutoFileOrganizer, { normalizeFolder } from "src/main";
import { addFolderSearch } from "../ui";

export function AddNewTagMapping(
	containerEl: HTMLElement,
	plugin: AutoFileOrganizer,
	app: App,
	refresh: () => void
): void {
	let newTag = "";
	let tagFolder = "";

	const submit = async () => {
		const tag = getSanitizedTag(newTag.trim());
		const folder = normalizeFolder(tagFolder);
		if (!tag) {
			new Notice("Enter a valid tag (e.g., #project).");
			return;
		}
		if (!folder) {
			new Notice("Choose a target folder.");
			return;
		}
		plugin.settings.tagMapping[tag] = folder;
		await plugin.saveSettings();
		new Notice(`Notes tagged ${tag} will be moved to ${folder}`);
		refresh();
	};

	const setting = new Setting(containerEl)
		.setName("Add new tag mapping")
		.setDesc("Add a new tag and target folder")
		.addSearch((search) => {
			new TagSuggest(app, search.inputEl);
			search.setPlaceholder("Search tag...").onChange((tag) => {
				newTag = tag;
			});
		});
	addFolderSearch(setting, app, {
		onChange: (folder) => {
			tagFolder = folder;
		},
	});
	setting.addButton((btn) => {
		btn.setButtonText("Add").setCta().onClick(submit);
	});
}
