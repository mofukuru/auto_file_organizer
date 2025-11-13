import { App, Setting, Notice } from "obsidian";
import AutoFileOrganizer from "src/main";
import { FolderSuggest } from "src/suggester";
import { isValidExtension } from "src/inputvalidation";

export function AddNewExtensionMapping(
	containerEl: HTMLElement,
	plugin: AutoFileOrganizer,
	app: App,
	renderCallback: () => Promise<void> | void
) {
	let newExtension = "";
	let newFolder = "";

	new Setting(containerEl)
		.setName("Add new extension mapping")
		.setDesc("Add a new extension and target folder")
		.addText((text) =>
			text
				.setPlaceholder("Enter extension (e.g., pdf)")
				.onChange((value) => {
					newExtension = value.trim();
				})
		)
		.addSearch((search) => {
			new FolderSuggest(app, search.inputEl);
			search.setPlaceholder("Search folder...").onChange((folder) => {
				newFolder = folder;
			});
		})
		.addButton((btn) => {
			btn.setButtonText("Add")
				.setCta()
				.onClick(async () => {
					if (newExtension && newFolder) {
						if (isValidExtension(newExtension)) {
							plugin.settings.extensionMapping[newExtension] =
								newFolder;
							await plugin.saveSettings();
							if (renderCallback) await renderCallback();
						} else {
							new Notice("The input is invalid.");
						}
					}
				});
		});
}
