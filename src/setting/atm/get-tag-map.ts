import { Setting } from "obsidian";
import AutoFileOrganizer from "src/main";
export function GetTagMapping(
	containerEl: HTMLElement,
	plugin: AutoFileOrganizer,
	refresh: () => void
): void {
	new Setting(containerEl)
		.setName("Get tag mapping")
		.setDesc(
			"Scan the tag in the file and make mapping tag to folder automatically"
		)
		.addButton((btn) => {
			btn.setButtonText("Start scan")
				.setCta()
				.onClick(async () => {
					await plugin.updateTagMappingFromExistingFiles();
					refresh();
				});
		});
}
