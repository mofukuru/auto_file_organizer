import { Notice, Setting } from "obsidian";

export function SetExtensionBlacklist(
	containerEl: HTMLElement,
	plugin: any,
	display?: () => void
) {
	let eblackList: string | null = null;

	new Setting(containerEl)
		.setName("Set Extension Blacklist")
		.setDesc(
			"Indicate what file extension is excluded for automatically get extension mapping"
		)
		.addText((text) =>
			text
				.setPlaceholder("Enter extension (e.g., md)")
				.onChange((value) => {
					eblackList = value.trim();
				})
		)
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
