import { App, Notice, Setting } from "obsidian";
import AutoFileOrganizer, { normalizeFolder } from "src/main";
import { addFolderSearch, createListSection } from "./ui";

type BlacklistKey = "extensionFolderBlackList" | "tagBlackList";

// Files inside these folders (and their subfolders) are never moved, and the
// folders are skipped when scanning for mappings.
export function FolderBlacklist(
	containerEl: HTMLElement,
	plugin: AutoFileOrganizer,
	app: App,
	key: BlacklistKey,
	scanName: string,
	refresh: () => void
): void {
	let input = "";

	const setting = new Setting(containerEl)
		.setName("Excluded folders")
		.setDesc(
			`Files in these folders and their subfolders are never moved, and are skipped by ${scanName}.`
		);
	addFolderSearch(setting, app, {
		onChange: (folder) => {
			input = folder;
		},
	});
	setting.addButton((btn) =>
		btn
			.setButtonText("Add")
			.setCta()
			.onClick(async () => {
				const folder = normalizeFolder(input);
				if (!folder) {
					new Notice("Choose a folder to exclude.");
					return;
				}
				plugin.settings[key] = plugin.settings[key] ?? {};
				plugin.settings[key][folder] = folder;
				await plugin.saveSettings();
				refresh();
			})
	);

	const folders = Object.keys(plugin.settings[key] ?? {});
	const section = createListSection(
		containerEl,
		"Excluded folder list",
		folders.length,
		"No folders excluded."
	);
	for (const folder of folders) {
		new Setting(section).setName(folder).addExtraButton((btn) =>
			btn
				.setIcon("trash-2")
				.setTooltip("Remove from excluded folders")
				.onClick(async () => {
					delete plugin.settings[key][folder];
					await plugin.saveSettings();
					refresh();
				})
		);
	}
}
