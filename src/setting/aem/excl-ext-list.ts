import { Setting } from "obsidian";

export default function ExcludedExtensionList(
	containerEl: HTMLElement,
	plugin: any,
	display?: () => void
) {
	const collapsibleSection5 = containerEl.createEl("details", {
		attr: { open: "true" },
	});
	const summary5 = collapsibleSection5.createEl("summary", {
		text: "Excluded Extension list",
	});

	summary5.style.fontSize = "1.2em";
	summary5.style.margin = "8px";
	summary5.style.cursor = "pointer";

	for (const [extension] of Object.entries(
		plugin.settings.extensionBlackList || {}
	)) {
		new Setting(collapsibleSection5)
			.setName(`Extension: ${extension}`)
			.setDesc(
				"This extension is excluded when pushing get extension button"
			)
			.addButton((btn) =>
				btn
					.setButtonText("Delete")
					.setCta()
					.onClick(async () => {
						delete plugin.settings.extensionBlackList[extension];
						if (typeof plugin.saveSettings === "function") {
							await plugin.saveSettings();
						}
						if (display) display?.();
					})
			);
	}
}
