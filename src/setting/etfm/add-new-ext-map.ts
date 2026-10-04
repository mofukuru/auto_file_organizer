import { App, Setting, Notice } from "obsidian";
import AutoFileOrganizer, { normalizeFolder } from "src/main";
import { getSanitizedExtension } from "src/inputvalidation";
import { addFolderSearch } from "../ui";

export function AddNewExtensionMapping(
	containerEl: HTMLElement,
	plugin: AutoFileOrganizer,
	app: App,
	renderCallback: () => Promise<void> | void
) {
	let newExtension = "";
	let newFolder = "";

	const submit = async () => {
		const extension = getSanitizedExtension(newExtension);
		const folder = normalizeFolder(newFolder);
		if (!extension) {
			new Notice("Enter a valid extension (e.g., pdf).");
			return;
		}
		if (!folder) {
			new Notice("Choose a target folder.");
			return;
		}
		plugin.settings.extensionMapping[extension] = folder;
		await plugin.saveSettings();
		new Notice(`.${extension} files will be moved to ${folder}`);
		if (renderCallback) await renderCallback();
	};

	const setting = new Setting(containerEl)
		.setName("Add new extension mapping")
		.setDesc("Add a new extension and target folder")
		.addText((text) =>
			text
				.setPlaceholder("Enter extension (e.g., pdf)")
				.onChange((value) => {
					newExtension = value;
				})
		);
	addFolderSearch(setting, app, {
		onChange: (folder) => {
			newFolder = folder;
		},
	});
	setting.addButton((btn) => {
		btn.setButtonText("Add").setCta().onClick(submit);
	});
}
