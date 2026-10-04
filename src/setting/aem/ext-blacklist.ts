import { Notice, Setting } from "obsidian";
import AutoFileOrganizer from "src/main";
import { getSanitizedExtension } from "src/inputvalidation";
import { createListSection } from "../ui";

export function ExtensionBlacklist(
	containerEl: HTMLElement,
	plugin: AutoFileOrganizer,
	refresh: () => void
): void {
	let input = "";

	new Setting(containerEl)
		.setName("Excluded extensions")
		.setDesc("Extensions that are skipped when scanning for extension mappings.")
		.addText((text) =>
			text.setPlaceholder("Enter extension (e.g., md)").onChange((value) => {
				input = value;
			})
		)
		.addButton((btn) =>
			btn
				.setButtonText("Add")
				.setCta()
				.onClick(async () => {
					const extension = getSanitizedExtension(input);
					if (!extension) {
						new Notice("Enter a valid extension (e.g., md).");
						return;
					}
					plugin.settings.extensionBlackList =
						plugin.settings.extensionBlackList ?? {};
					plugin.settings.extensionBlackList[extension] = extension;
					await plugin.saveSettings();
					refresh();
				})
		);

	const extensions = Object.keys(plugin.settings.extensionBlackList ?? {});
	const section = createListSection(
		containerEl,
		"Excluded extension list",
		extensions.length,
		"No extensions excluded."
	);
	for (const extension of extensions) {
		new Setting(section).setName(`.${extension}`).addExtraButton((btn) =>
			btn
				.setIcon("trash-2")
				.setTooltip("Remove from excluded extensions")
				.onClick(async () => {
					delete plugin.settings.extensionBlackList[extension];
					await plugin.saveSettings();
					refresh();
				})
		);
	}
}
