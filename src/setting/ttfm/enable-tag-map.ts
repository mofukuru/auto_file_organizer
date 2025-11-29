import { Setting } from "obsidian";
import AutoFileOrganizer from "src/main";

export function EnableTagMapping(
	containerEl: HTMLElement,
	plugin: AutoFileOrganizer,
	refresh: () => void
): void {
	new Setting(containerEl)
		.setName("Enable Tag Mapping")
		.setDesc("Enable or disable tag-to-folder mapping.")
		.addToggle((toggle) => {
			toggle.setValue(plugin.settings.tagEnabled ?? true);
			toggle.onChange(async (value) => {
				plugin.settings.tagEnabled = value;
				await plugin.saveSettings();
				refresh();
			});
		});
}
