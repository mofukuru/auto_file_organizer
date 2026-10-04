import { App, PluginSettingTab, Setting } from "obsidian";
import AutoFileOrganizer from "./main";
import { RenderPrioritySetting } from "./setting/priority";
import { EnableExtensionMapping } from "./setting/etfm/enable-ext-map";
import { AddNewExtensionMapping } from "./setting/etfm/add-new-ext-map";
import { ExtensionMappingList } from "./setting/etfm/ext-map-list";
import { GetExtensionMapping } from "./setting/aem/get-ext-map";
import { ExtensionBlacklist } from "./setting/aem/ext-blacklist";
import { EnableTagMapping } from "./setting/ttfm/enable-tag-map";
import { AddNewTagMapping } from "./setting/ttfm/add-new-tag-map";
import { TagMappingList } from "./setting/ttfm/tag-map-list";
import { GetTagMapping } from "./setting/atm/get-tag-map";
import { FolderBlacklist } from "./setting/folder-blacklist";

export class AutoFileOrganizerSettingTab extends PluginSettingTab {
	plugin: AutoFileOrganizer;

	constructor(app: App, plugin: AutoFileOrganizer) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		const refresh = () => this.display();
		containerEl.empty();
		containerEl.addClass("afo-settings");

		//! === General ===
		RenderPrioritySetting(containerEl, this.plugin);

		//* === ETFM Section ===
		new Setting(containerEl).setName("Extension-to-folder mapping").setHeading();
		EnableExtensionMapping(containerEl, this.plugin, refresh);
		AddNewExtensionMapping(containerEl, this.plugin, this.app, refresh);
		ExtensionMappingList(containerEl, this.plugin, this.app, refresh);

		//* === AEM Section ===
		new Setting(containerEl).setName("Auto extension mapping").setHeading();
		GetExtensionMapping(containerEl, this.plugin, refresh);
		ExtensionBlacklist(containerEl, this.plugin, refresh);
		FolderBlacklist(
			containerEl,
			this.plugin,
			this.app,
			"extensionFolderBlackList",
			"the extension scan",
			refresh
		);

		//* === TTFM Section ===
		new Setting(containerEl).setName("Tag-to-folder mapping").setHeading();
		EnableTagMapping(containerEl, this.plugin, refresh);
		AddNewTagMapping(containerEl, this.plugin, this.app, refresh);
		TagMappingList(containerEl, this.plugin, this.app, refresh);

		//* === ATM Section ===
		new Setting(containerEl).setName("Auto tag mapping").setHeading();
		GetTagMapping(containerEl, this.plugin, refresh);
		FolderBlacklist(
			containerEl,
			this.plugin,
			this.app,
			"tagBlackList",
			"the tag scan",
			refresh
		);
	}
}
