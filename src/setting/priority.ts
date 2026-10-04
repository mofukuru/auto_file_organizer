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
			dropdown.setValue(plugin.settings.priority || "tag");
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

	new Setting(containerEl)
		.setName("Only move new files in the vault root")
		.setDesc(
			"When on, newly created files are only moved if they are created in the vault root. " +
				"Turn this on if you sync your vault or keep attachments in specific folders, " +
				"so files that arrive in subfolders stay where they are."
		)
		.addToggle((toggle) =>
			toggle.setValue(plugin.settings.rootOnly).onChange(async (value) => {
				plugin.settings.rootOnly = value;
				await plugin.saveSettings();
			})
		);

	new Setting(containerEl)
		.setName("Organize existing files")
		.setDesc(
			"Preview which files in the vault would be moved by the current rules, then confirm."
		)
		.addButton((btn) =>
			btn.setButtonText("Preview").onClick(() => plugin.organizeVault())
		);
}
