import { App, PluginSettingTab, Setting, Notice, getAllTags } from "obsidian";
import { FolderSuggest, TagSuggest } from "./suggester";
import { isValidExtension, getSanitizedTag } from "./inputvalidation";
import AutoFileOrganizer from "./main";

export class AutoFileOrganizerSettingTab extends PluginSettingTab {
    plugin: AutoFileOrganizer;

    constructor(app: App, plugin: AutoFileOrganizer) {
        super(app, plugin);
        this.plugin = plugin;
    }

    async display(): Promise<void> {
        const { containerEl } = this;
        containerEl.empty();

        // === Priority: Priority Toggle ===
        // containerEl.createEl("h3", { text: "General Settings" });
        new Setting(containerEl)
            .setName("Priority")
            .setDesc("Decide which mapping takes precedence when both are enabled.")
            .addDropdown(dropdown => {
                dropdown.addOptions({
                    extension: "Extension first",
                    tag: "Tag first"
                });
                dropdown.setValue(this.plugin.settings.priority || "extension");
                dropdown.onChange(async (value) => {
                    this.plugin.settings.priority = value;
                    await this.plugin.saveSettings();
                    new Notice(`Priority set to: ${value === "extension" ? "Extension" : "Tag"}`);
                });
            });

        // === Extension-to-Folder Mapping Section ===
        containerEl.createEl("h3", { text: "Extension-to-Folder Mapping" });

        // Toggle to enable/disable this feature
        new Setting(containerEl)
            .setName("Enable Extension Mapping")
            .setDesc("Enable or disable extension-to-folder mapping.")
            .addToggle(toggle => {
                toggle.setValue(this.plugin.settings.extensionEnabled ?? true);
                toggle.onChange(async (value) => {
                    this.plugin.settings.extensionEnabled = value;
                    await this.plugin.saveSettings();
                    this.display();
                });
            });

        // Get all folders
        const allFolders = this.app.vault.getAllFolders();
        const allFiles = this.app.vault.getFiles();
        const tagSet = new Set<string>();
        for (const file of allFiles) {
            const metadata = this.app.metadataCache.getFileCache(file);
            if (!metadata) continue;

            const tags = getAllTags(metadata);
            if (tags) {
                tags.forEach(tag => tagSet.add(tag));
            }
        }
        const allTags = Array.from(tagSet);

        let newExtension = "";
        let newFolder = "";

        new Setting(containerEl)
            .setName("Add new extension mapping")
            .setDesc("Add a new extension and target folder")
            .addText(text => text
                .setPlaceholder("Enter extension (e.g., pdf)")
                .onChange((value) => {
                    newExtension = value.trim();
                })
            )
            .addSearch(search => {
                new FolderSuggest(this.app, search.inputEl);
                search.setPlaceholder("Search folder...")
                    .onChange(folder => {
                        newFolder = folder;
                    })
            })
            .addButton(btn => {
                btn.setButtonText("Add")
                    .setCta()
                    .onClick(async () => {
                        if (newExtension && newFolder) {
                            if (isValidExtension(newExtension)) {
                                this.plugin.settings.extensionMapping[newExtension] = newFolder;
                                await this.plugin.saveSettings();
                                this.display();
                            } else {
                                new Notice(`The extension input is invalid.`);
                            }
                        }
                    });
            });

        const collapsibleSection1 = containerEl.createEl("details", { attr: { open: "true" } });
        const summary1 = collapsibleSection1.createEl("summary", { text: "Extension mapping list" });

        summary1.style.fontSize = "1.2em";
        // summary1.style.fontWeight = "bold";
        summary1.style.margin = "8px";
        summary1.style.cursor = "pointer";

        for (const [extension, folder] of Object.entries(this.plugin.settings.extensionMapping)) {
            new Setting(collapsibleSection1)
                .setName(`Extension: ${extension}`)
                .setDesc("Change the folder for this extension")
                .addDropdown(dropdown => {
                    dropdown.addOption("", "Select folder...");
                    allFolders.forEach(f => dropdown.addOption(f.path, f.path));
                    dropdown.setValue(folder);

                    dropdown.onChange(async (value) => {
                        if (value) {
                            this.plugin.settings.extensionMapping[extension] = value;
                            await this.plugin.saveSettings();
                            new Notice(`Folder for .${extension} files updated to: ${value}`);
                        }
                    });
                })
                .addButton(btn =>
                    btn
                        .setButtonText("Delete")
                        .setCta()
                        .onClick(async () => {
                            delete this.plugin.settings.extensionMapping[extension];
                            await this.plugin.saveSettings();
                            this.display();
                        })
                );
        }

        containerEl.createEl("h3", { text: "Auto Extension Mapping" });

        new Setting(containerEl)
            .setName("Get extension mapping")
            .setDesc("Scan the extension in the file and make mapping extension to folder automatically")
            .addButton((btn) => {
                btn.setButtonText("Start scan")
                    .setCta()
                    .onClick(async () => {
                        await this.plugin.updateExtensionMappingFromExistingFiles();
                        this.display();
                    });
            });

        let eblackList = "";

        new Setting(containerEl)
            .setName("Set Black Folder List")
            .setDesc("Indicate what folder is excluded for automatically get extension mapping")
            .addSearch(search => {
                new FolderSuggest(this.app, search.inputEl);
                search.setPlaceholder("Search folder...")
                    .onChange(folder => {
                        eblackList = folder;
                    })
            })
            .addButton(btn => {
                btn.setButtonText("Add")
                    .setCta()
                    .onClick(async () => {
                        if (eblackList) {
                            this.plugin.settings.extensionBlackList[eblackList] = eblackList;
                            this.display();
                        }
                    });
            });

        const collapsibleSection3 = containerEl.createEl("details", { attr: { open: "true" } });
        const summary3 = collapsibleSection3.createEl("summary", { text: "Excluded list" });

        summary3.style.fontSize = "1.2em";
        // summary3.style.fontWeight = "bold";
        summary3.style.margin = "8px";
        summary3.style.cursor = "pointer";

        for (const [folder1, folder2] of Object.entries(this.plugin.settings.extensionBlackList)) {
            new Setting(collapsibleSection3)
                .setName(`Exclude "${folder1}"`)
                .setDesc("This folder is excluded when pushing get extension button")
                .addButton(btn =>
                    btn
                        .setButtonText("Delete")
                        .setCta()
                        .onClick(async () => {
                            delete this.plugin.settings.extensionBlackList[folder1];
                            this.display();
                        })
                );
        }

        // === Tag-to-Folder Mapping Section ===
        containerEl.createEl("h3", { text: "Tag-to-Folder Mapping" });

        // Toggle to enable/disable this feature
        new Setting(containerEl)
            .setName("Enable Tag Mapping")
            .setDesc("Enable or disable tag-to-folder mapping.")
            .addToggle(toggle => {
                toggle.setValue(this.plugin.settings.tagEnabled ?? true);
                toggle.onChange(async (value) => {
                    this.plugin.settings.tagEnabled = value;
                    await this.plugin.saveSettings();
                    this.display();
                });
            });

        let newTag = "";
        let tagFolder = "";

        new Setting(containerEl)
            .setName("Add new tag mapping")
            .setDesc("Add a new tag and target folder")
            .addSearch(search => {
                new TagSuggest(this.app, search.inputEl);
                search.setPlaceholder("Search tag...")
                    .onChange(tag => {
                        newTag = getSanitizedTag(tag);
                    })
            })
            .addSearch(search => {
                new FolderSuggest(this.app, search.inputEl);
                search.setPlaceholder("Search folder...")
                    .onChange(folder => {
                        tagFolder = folder;
                    })
            })
            .addButton(btn => {
                btn.setButtonText("Add")
                    .setCta()
                    .onClick(async () => {
                        if (newTag && tagFolder) {
                            this.plugin.settings.tagMapping[newTag] = tagFolder;
                            await this.plugin.saveSettings();
                            this.display();
                        } else {
                            new Notice(`The tag input is invalid.`);
                        }
                    });
            });

        const collapsibleSection2 = containerEl.createEl("details", { attr: { open: "true" } });
        const summary2 = collapsibleSection2.createEl("summary", { text: "Tag mapping list" });

        summary2.style.fontSize = "1.2em";
        // summary2.style.fontWeight = "bold";
        summary2.style.margin = "8px";
        summary2.style.cursor = "pointer";

        for (const [tag, folder] of Object.entries(this.plugin.settings.tagMapping)) {
            new Setting(collapsibleSection2)
                .setName(`Tag: ${tag}`)
                .setDesc("Change the folder for this tag")
                .addDropdown(dropdown => {
                    dropdown.addOption("", "Select folder...");
                    allFolders.forEach(f => dropdown.addOption(f.path, f.path));
                    dropdown.setValue(folder);

                    dropdown.onChange(async (value) => {
                        if (value) {
                            this.plugin.settings.tagMapping[tag] = value;
                            await this.plugin.saveSettings();
                            new Notice(`Folder for ${tag} files updated to: ${value}`);
                        }
                    });
                })
                .addButton(btn =>
                    btn
                        .setButtonText("Delete")
                        .setCta()
                        .onClick(async () => {
                            delete this.plugin.settings.tagMapping[tag];
                            await this.plugin.saveSettings();
                            this.display();
                        })
                );
        }

        containerEl.createEl("h3", { text: "Auto Tag Mapping" })

        new Setting(containerEl)
            .setName("Get tag mapping")
            .setDesc("Scan the tag in the file and make mapping tag to folder automatically")
            .addButton((btn) => {
                btn.setButtonText("Start scan")
                    .setCta()
                    .onClick(async () => {
                        await this.plugin.updateTagMappingFromExistingFiles();
                        this.display();
                    });
            });

        let blackList = "";
        const dropdownContainer = containerEl.createDiv({ cls: "search-dropdown-container" });

        new Setting(containerEl)
            .setName("Set Black Folder List")
            .setDesc("Indicate what folder is excluded for automatically get tag mapping")
            .addSearch(search => {
                new FolderSuggest(this.app, search.inputEl);
                search.setPlaceholder("Search folder...")
                    .onChange(folder => {
                        blackList = folder;
                    })
            })
            .addButton(btn => {
                btn.setButtonText("Add")
                    .setCta()
                    .onClick(async () => {
                        if (blackList) {
                            this.plugin.settings.tagBlackList[blackList] = blackList;
                            // await this.plugin.saveSettings();
                            this.display();
                        }
                    });
            });

        const collapsibleSection4 = containerEl.createEl("details", { attr: { open: "true" } });
        const summary4 = collapsibleSection4.createEl("summary", { text: "Excluded list" });

        summary4.style.fontSize = "1.2em";
        // summary4.style.fontWeight = "bold";
        summary4.style.margin = "8px";
        summary4.style.cursor = "pointer";

        for (const [folder1, folder2] of Object.entries(this.plugin.settings.tagBlackList)) {
            new Setting(collapsibleSection4)
                .setName(`Exclude "${folder1}"`)
                .setDesc("This folder is excluded when pushing get tag mapping button")
                .addButton(btn =>
                    btn
                        .setButtonText("Delete")
                        .setCta()
                        .onClick(async () => {
                            delete this.plugin.settings.tagBlackList[folder1];
                            // await this.plugin.saveSettings();
                            this.display();
                        })
                );
        }
    }
}
