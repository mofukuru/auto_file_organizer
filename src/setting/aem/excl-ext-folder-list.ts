import { Setting } from "obsidian";

export function ExcludedExtensionFolderList(
	containerEl: HTMLElement,
	plugin: any,
	display?: () => void
) {
	const collapsibleSection3 = containerEl.createEl("details", {
		attr: { open: "true" },
	});
	const summary3 = collapsibleSection3.createEl("summary", {
		text: "Excluded Folder list",
	});

	summary3.style.fontSize = "1.2em";
	summary3.style.margin = "8px";
	summary3.style.cursor = "pointer";

	for (const [folder1] of Object.entries(
		plugin.settings.extensionFolderBlackList || {}
	)) {
		new Setting(collapsibleSection3)
			.setName(`Exclude "${folder1}"`)
			.setDesc(
				"This folder is excluded when pushing get extension button"
			)
			.addButton((btn) =>
				btn
					.setButtonText("Delete")
					.setCta()
					.onClick(async () => {
						delete plugin.settings.extensionFolderBlackList[folder1];
						if (typeof plugin.saveSettings === "function") {
							await plugin.saveSettings();
						}
						if (display) display?.();
					})
			);
	}
}
