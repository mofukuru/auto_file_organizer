import { App, Setting } from "obsidian";
import AutoFileOrganizer, { normalizeFolder } from "../../main";
import { addFolderSearch, createListSection } from "../ui";

export function ExtensionMappingList(
	containerEl: HTMLElement,
	plugin: AutoFileOrganizer,
	app: App,
	renderCallback?: () => Promise<void> | void
): void {
	const mapping = plugin.settings.extensionMapping ?? {};
	const section = createListSection(
		containerEl,
		"Extension mapping list",
		Object.keys(mapping).length,
		"No extension mappings yet."
	);

	for (const [extension, folder] of Object.entries(mapping)) {
		const setting = new Setting(section).setName(`.${extension}`);
		addFolderSearch(
			setting,
			app,
			{
				onCommit: async (value) => {
					const normalized = normalizeFolder(value);
					if (!normalized) return;
					plugin.settings.extensionMapping[extension] = normalized;
					await plugin.saveSettings();
				},
			},
			folder
		);
		setting.addExtraButton((btn) =>
			btn
				.setIcon("trash-2")
				.setTooltip("Delete mapping")
				.onClick(async () => {
					delete plugin.settings.extensionMapping[extension];
					await plugin.saveSettings();
					if (renderCallback) await renderCallback();
				})
		);
	}
}
