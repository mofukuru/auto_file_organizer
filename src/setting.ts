import { App, PluginSettingTab } from "obsidian";
import AutoFileOrganizer from "./main";
import { RenderPrioritySetting } from "./setting/priority";
import { EnableExtensionMapping } from "./setting/etfm/enable-ext-map";
import { AddNewExtensionMapping } from "./setting/etfm/add-new-ext-map";
import { ExtensionMappingList } from "./setting/etfm/ext-map-list";
import { GetExtensionMapping } from "./setting/aem/get-ext-map";
import { SetExtFolderBlacklist } from "./setting/aem/set-ext-folder-blacklist";
import { ExcludedExtensionFolderList } from "./setting/aem/excl-ext-folder-list";
import { SetExtensionBlacklist } from "./setting/aem/set-ext-blacklist";
import ExcludedExtensionList from "./setting/aem/excl-ext-list";
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

		//! === AEM: Get Extension Mapping ===
		GetExtensionMapping(containerEl, this.plugin, () => this.display());

		// NEW === AEM: Set Extension Blacklist ===
		SetExtensionBlacklist(containerEl, this.plugin, () => this.display());

		// NEW === AEM: Excluded Extension List ===
		ExcludedExtensionList(containerEl, this.plugin, () => this.display());

		//? Old === AEM: Set Folder Blacklist (extension) ===
		// SetExtFolderBlacklist(containerEl, this.plugin, this.app, () =>
		// 	this.display()
		// );
		//? Old === AEM: Excluded Folder (List) ===
		// ExcludedExtensionFolderList(containerEl, this.plugin, () =>
		// 	this.display()
		// );

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
