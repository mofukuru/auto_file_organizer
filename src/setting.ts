import { App, PluginSettingTab, Setting, Notice, getAllTags } from "obsidian";
import AutoFileOrganizer from "./main";
import { RenderPrioritySetting } from "./setting/priority";
import { EnableExtensionMapping } from "./setting/etfm/enable-ext-map";
import { AddNewExtensionMapping } from "./setting/etfm/add-new-ext-map";
import { ExtensionMappingList } from "./setting/etfm/ext-map-list";
import { GetExtensionMapping } from "./setting/aem/get-ext-map";
import { SetExtFolderBlacklist } from "./setting/aem/set-ext-folder-blacklist";
import { ExcludedExtensionFolderList } from "./setting/aem/excl-ext-folder-list";
import { EnableTagMapping } from "./setting/ttfm/enable-tag-map";
import { AddNewTagMapping } from "./setting/ttfm/add-new-tag-map";
import { TagMappingList } from "./setting/ttfm/tag-map-list";
import { GetTagMapping } from "./setting/atm/get-tag-map";
import { SetTagFolderBlacklist } from "./setting/atm/set-tag-folder-blacklist";
import { ExcludedTagFolderList } from "./setting/atm/excl-tag-folder-list";

export class AutoFileOrganizerSettingTab extends PluginSettingTab {
	plugin: AutoFileOrganizer;

	constructor(app: App, plugin: AutoFileOrganizer) {
		super(app, plugin);
		this.plugin = plugin;
	}

	async display(): Promise<void> {
		const { containerEl } = this;
		containerEl.empty();

		//! === Priority: Priority Toggle ===
		RenderPrioritySetting(containerEl, this.plugin);

		//* === ETFM Section ===
		containerEl.createEl("h3", { text: "Extension-to-Folder Mapping" });

		//! === ETFM: Enable Extension Mapping ===
		//? Toggle to enable/disable this feature
		EnableExtensionMapping(containerEl, this.plugin, () => this.display());

		// Get all folders
		const allFolders = this.app.vault.getAllFolders();

		//! === ETFM: Add New Extension Mapping ===
		AddNewExtensionMapping(containerEl, this.plugin, this.app, () =>
			this.display()
		);

		//! === ETFM: Extension Mapping List ===
		ExtensionMappingList(containerEl, this.plugin, allFolders, () =>
			this.display()
		);

		//* === AEM Section ===
		containerEl.createEl("h3", { text: "Auto Extension Mapping" });

		/* Get Extension Mapping */
		//! === AEM: Get Extension Mapping ===
		GetExtensionMapping(containerEl, this.plugin, () => this.display());

		//! NEW === AEM: Set Extension Blacklist ===
		let eblackList = "";

		new Setting(containerEl)
			.setName("Set Extension Blacklist")
			.setDesc(
				"Indicate what file extension is excluded for automatically get extension mapping"
			)
			.addText((text) =>
				text
					.setPlaceholder("Enter extension (e.g., pdf)")
					.onChange((value) => {
						eblackList = value.trim();
					})
			)
			.addButton((btn) => {
				btn.setButtonText("Add")
					.setCta()
					.onClick(async () => {
						if (eblackList) {
							this.plugin.settings.extensionBlackList[
								eblackList
							] = eblackList;
							this.display();
						} else {
							new Notice("The input is invalid.");
						}
					});
			});

		const collapsibleSection5 = containerEl.createEl("details", {
			attr: { open: "true" },
		});
		const summary5 = collapsibleSection5.createEl("summary", {
			text: "Excluded list",
		});

		summary5.style.fontSize = "1.2em";
		summary5.style.margin = "8px";
		summary5.style.cursor = "pointer";

		//! === AEM: Set Folder Blacklist (extension) ===
		SetExtFolderBlacklist(containerEl, this.plugin, this.app, () =>
			this.display()
		);
		//! === AEM: Excluded Folder (List) ===
		ExcludedExtensionFolderList(containerEl, this.plugin, () =>
			this.display()
		);

		//* === TTFM Section ===
		containerEl.createEl("h3", { text: "Tag-to-Folder Mapping" });

		//? Toggle to enable/disable this feature
		//! === TTFM: Enable Tag Mapping ===
		EnableTagMapping(containerEl, this.plugin, () => this.display());

		//! === TTFM: Add New Tag Mapping ===
		AddNewTagMapping(containerEl, this.plugin, this.app, () =>
			this.display()
		);

		//! === TTFM: Tag Mapping List ===
		TagMappingList(containerEl, this.plugin, allFolders, () =>
			this.display()
		);

		//* === ATM Section ===
		containerEl.createEl("h3", { text: "Auto Tag Mapping" });

		//! === ATM: Get Tag Mapping ===
		GetTagMapping(containerEl, this.plugin, () => this.display());

		//! === ATM: Set Folder Blacklist (tag) ===
		SetTagFolderBlacklist(containerEl, this.plugin, this.app, () =>
			this.display()
		);

		//! === ATM: Excluded Folder (tag) ===
		ExcludedTagFolderList(containerEl, this.plugin, () => this.display());
	}
}
