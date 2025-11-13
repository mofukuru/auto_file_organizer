import { Setting } from "obsidian";
import AutoFileOrganizer from "src/main";

export function GetExtensionMapping(
	containerEl: HTMLElement,
	plugin: AutoFileOrganizer,
	renderCallback: () => Promise<void> | void
) {
	new Setting(containerEl)
		.setName("Get extension mapping")
		.setDesc(
			"Scan the extension in the file and make mapping extension to folder automatically"
		)
		.addButton((btn) => {
			btn.setButtonText("Start scan")
				.setCta()
				.onClick(async () => {
					await plugin.updateExtensionMappingFromExistingFiles();
					if (renderCallback) await renderCallback();
				});
		});
}
