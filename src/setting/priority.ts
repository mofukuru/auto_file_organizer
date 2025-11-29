import { Setting, Notice } from "obsidian";
import AutoFileOrganizer from "src/main";

export function RenderPrioritySetting(
	containerEl: HTMLElement,
	plugin: AutoFileOrganizer
) {
	//Priority dropdown
	new Setting(containerEl)
		.setName("Priority")
		.setDesc("Decide which mapping takes precedence when both are enabled.")
		.addDropdown((dropdown) => {
			dropdown.addOptions({
				extension: "Extension first",
				tag: "Tag first",
			});
			dropdown.setValue(plugin.settings.priority || "extension");
			dropdown.onChange(async (value) => {
				plugin.settings.priority = value;
				await plugin.saveSettings();
				new Notice(
					`Priority set to: ${
						value === "extension" ? "Extension" : "Tag"
					}`
				);
			});
		});
}
