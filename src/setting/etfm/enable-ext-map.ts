import { Setting } from "obsidian";
import AutoFileOrganizer from "src/main";

export function EnableExtensionMapping(
	containerEl: HTMLElement,
	plugin: AutoFileOrganizer,
	renderCallback?: () => Promise<void> | void
) {
	//Priority dropdown
	new Setting(containerEl)
		.setName("Enable Extension Mapping")
		.setDesc("Enable or disable extension-to-folder mapping.")
		.addToggle((toggle) => {
			toggle.setValue(plugin.settings.extensionEnabled ?? true);
			toggle.onChange(async (value) => {
				plugin.settings.extensionEnabled = value;
				await plugin.saveSettings();
				if (renderCallback) await renderCallback();
			});
		});
}
