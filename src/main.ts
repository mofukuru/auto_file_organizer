// TODO: refactoring these codes into different files.
import { App, Plugin, PluginSettingTab, Setting, TFile, TFolder, FuzzySuggestModal, Notice, getAllTags } from "obsidian";
import { FolderSuggest, TagSuggest } from "./suggester"
import { isValidExtension, getSanitizedTag } from "./inputvalidation"

interface AutoFileOrganizerSettings {
	tagEnabled: boolean;
	extensionEnabled: boolean;
	priority: string;
	extensionMapping: Record<string, string>; // mapping from extension to folder
	tagMapping: Record<string, string>;    // mapping from tag to folder
	extensionBlackList: Record<string, string>;
	tagBlackList: Record<string, string>;
}

const DEFAULT_SETTINGS: AutoFileOrganizerSettings = {
	tagEnabled: false,
	extensionEnabled: false,
	priority: "tag",
	extensionMapping: {},
	tagMapping: {},
	extensionBlackList: {},
	tagBlackList: {},
};

export default class AutoFileOrganizer extends Plugin {
	settings: AutoFileOrganizerSettings;

	async onload() {
		console.log("Auto File Organizer loaded!");

		await this.loadSettings();
		this.addSettingTab(new AutoFileOrganizerSettingTab(this.app, this));

		this.registerEvent(
			this.app.vault.on("create", async (file: TFile) => {
				if (Object.keys(this.settings.extensionMapping).length > 0) {
					await this.handleFile(file);
				} else {
					console.log("No folder mapping defined. Skipping file organization.");
				}
			})
		);

		this.registerEvent(
			this.app.vault.on("rename", async (file: TFile, oldPath) => {
				if (!(file instanceof TFile)) return;

				const isInRoot = !file.path.includes('/');
				if (!isInRoot) return;

				await this.handleFile(file);
			})
		);

		this.registerEvent(
			this.app.metadataCache.on("changed", async (file: TFile) => {
				await this.handleFile(file);
			})
		);

		this.addCommand({
			id: "organize-files",
			name: "Organize Files",
			callback: async () => {
				await this.organizeVault();
				new Notice("Files organized");
			},
		});
	}

	async handleFile(file: TFile): Promise<string | null> {
		if (!(file instanceof TFile)) return null;

		const originalPath = file.path;

		// move by tag
		const moveByTag = async (): Promise<boolean> => {
			if (!this.settings.tagEnabled) return false;

			const metadata = this.app.metadataCache.getFileCache(file);
			if (!metadata) {
				console.log(`No metadata found for file: ${file.path}`);
				return false;
			}

			const tags = getAllTags(metadata);
			if (tags && tags.length > 0) {
				for (const tag of tags) {
					const targetFolder = this.settings.tagMapping[tag];
					if (targetFolder) {
						await this.ensureFolderExists(targetFolder);
						const targetPath = `${targetFolder}/${file.name}`;
						if (originalPath !== targetPath) {
							try {
								await this.app.vault.rename(file, targetPath);
								return true; // move success
							} catch (err) {
								console.error(`Failed to move file ${file.name} by tag:`, err);
							}
						}
					}
				}
			}
			return false; // no move
		};

		// move by extension
		const moveByExtension = async (): Promise<boolean> => {
			if (!this.settings.extensionEnabled) return false;

			const extension = file.extension;
			const targetFolder = this.settings.extensionMapping[extension];
			if (targetFolder) {
				await this.ensureFolderExists(targetFolder);
				const targetPath = `${targetFolder}/${file.name}`;
				if (originalPath !== targetPath) {
					try {
						await this.app.vault.rename(file, targetPath);
						return true; // move success
					} catch (err) {
						console.error(`Failed to move file ${file.name} by extension:`, err);
					}
				}
			}
			return false; // no move
		};

		// priority
		if (this.settings.priority === "tag") {
			const movedByTag = await moveByTag();
			if (movedByTag) return file.name;

			const movedByExtension = await moveByExtension();
			return movedByExtension ? file.name : null;
		} else if (this.settings.priority === "extension") {
			const movedByExtension = await moveByExtension();
			if (movedByExtension) return file.name;

			const movedByTag = await moveByTag();
			return movedByTag ? file.name : null;
		}

		console.log(`No suitable folder mapping found for file: ${file.name}`);
		return null; // no file moved
	}

	async ensureFolderExists(folderPath: string) {
		if (!await this.app.vault.adapter.exists(folderPath)) {
			await this.app.vault.createFolder(folderPath);
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		if (Object.keys(this.settings.extensionMapping).length > 0) {
			await this.organizeVault();
		}
	}

	async organizeVault() {
		const files = this.app.vault.getFiles();
		const movedFiles: string[] = [];

		const promises = files.map(async (file) => {
			const moved = await this.handleFile(file);
			if (moved) {
				movedFiles.push(moved);
			}
		});

		await Promise.all(promises);

		// notice of diff
		if (movedFiles.length > 0) {
			new Notice(`Moved ${movedFiles.length} files:\n${movedFiles.join(", ")}`);
		} else {
			new Notice("No files were moved.");
		}
	}
	async updateExtensionMappingFromExistingFiles() {
		const allFiles = this.app.vault.getFiles();
		const extensionToFolderMap: Record<string, string> = {};

		for (const file of allFiles) {
			const extension = file.extension;
			if (!extension) continue;

			const folderName = this.app.vault.getAbstractFileByPath(file.path)?.parent?.name || 'DefaultFolder';
			if (!extensionToFolderMap[extension] && !this.settings.extensionBlackList[folderName]) {
				extensionToFolderMap[extension] = folderName;
			}
		}

		this.settings.extensionMapping = {
			...this.settings.extensionMapping,
			...extensionToFolderMap,
		};

		await this.saveSettings();
		new Notice(`update extension-to-folder mapping`);
	}
	async updateTagMappingFromExistingFiles() {
		const allFiles = this.app.vault.getFiles();
		const tagToFolderMap: Record<string, string> = {};

		for (const file of allFiles) {
			const metadata = this.app.metadataCache.getFileCache(file);
			if (!metadata) continue;

			const tags = getAllTags(metadata);
			if (tags && tags.length > 0) {
				for (const tag of tags) {
					const folderName = this.app.vault.getAbstractFileByPath(file.path)?.parent?.name || 'DefaultFolder';
					if (!tagToFolderMap[tag] && !this.settings.tagBlackList[folderName]) {
						tagToFolderMap[tag] = folderName;
					}
				}
			}
		}

		this.settings.tagMapping = {
			...this.settings.tagMapping,
			...tagToFolderMap,
		};

		await this.saveSettings();
		new Notice(`update tag-to-folder mapping.`);
	}
}

class AutoFileOrganizerSettingTab extends PluginSettingTab {
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

		// if (this.plugin.settings.extensionEnabled) {
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
			// .addDropdown(dropdown => {
			// 	dropdown.addOption("", "Select folder...");
			// 	allFolders.forEach(folder => dropdown.addOption(folder.path, folder.path));
			// 	dropdown.onChange(value => newFolder = value);
			// })
			// .addSearch(search => {
			// 	search.setPlaceholder("Search folder...");

			// 	const allFolder = this.app.vault.getAllFolders()
			// 		.map(f => (f as TFolder).path);

			// 	search.inputEl.addEventListener("click", () => {
			// 		new SuggestModal(this.app, allFolder, folder => {
			// 			search.setValue(folder);
			// 			newFolder = folder;
			// 		}).open();
			// 	});
			// })
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
		// }

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
			// .addDropdown(dropdown => {
			// 	dropdown.addOption("", "Select folder...");
			// 	allFolders.forEach(folder => dropdown.addOption(folder.path, folder.path));
			// 	dropdown.onChange(value => eblackList = value);
			// })
			// .addSearch(search => {
			// 	search.setPlaceholder("Search folder...");

			// 	const allFolder = this.app.vault.getAllFolders()
			// 		.map(f => (f as TFolder).path);

			// 	search.inputEl.addEventListener("click", () => {
			// 		new SuggestModal(this.app, allFolder, folder => {
			// 			search.setValue(folder);
			// 			eblackList = folder;
			// 		}).open();
			// 	});
			// })
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
				// .addDropdown(dropdown => {
				// 	dropdown.addOption("", "Select folder...");
				// 	allFolders.forEach(f => dropdown.addOption(f.path, f.path));
				// 	dropdown.setValue(folder2);

				// 	dropdown.onChange(async (value) => {
				// 		if (value) {
				// 			this.plugin.settings.extensionMapping[folder1] = value;
				// 		}
				// 	});
				// })
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

		// if (this.plugin.settings.tagEnabled) {
		// const allFolders = this.app.vault.getAllFolders();

		let newTag = "";
		let tagFolder = "";

		new Setting(containerEl)
			.setName("Add new tag mapping")
			.setDesc("Add a new tag and target folder")
			// .addSearch(search => {
			// 	search.setPlaceholder("Search tag...");

			// 	search.inputEl.addEventListener("click", () => {
			// 		new WeakSuggestModal(this.app, allTags, tag => {
			// 			search.setValue(tag);
			// 			newTag = tag.trim();
			// 		}).open();
			// 	});
			// })
			.addSearch(search => {
				new TagSuggest(this.app, search.inputEl);
				search.setPlaceholder("Search tag...")
					.onChange(tag => {
						newTag = getSanitizedTag(tag);
					})
			})
			// .addText(text => text
			// 	.setPlaceholder("Enter tag (e.g., #test1)")
			// 	.onChange((value) => newTag = value.trim())
			// )
			// .addDropdown(dropdown => {
			// 	dropdown.addOption("", "Select folder...");
			// 	allFolders.forEach(folder => dropdown.addOption(folder.path, folder.path));
			// 	dropdown.onChange(value => tagFolder = value);
			// })
			// .addSearch(search => {
			// 	search.setPlaceholder("Search folder...");

			// 	const allFolder = this.app.vault.getAllFolders()
			// 		.map(f => (f as TFolder).path);

			// 	search.inputEl.addEventListener("click", () => {
			// 		new SuggestModal(this.app, allFolder, folder => {
			// 			search.setValue(folder);
			// 			tagFolder = folder;
			// 		}).open();
			// 	});
			// })
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

		// }

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
			// .addDropdown(dropdown => {
			// 	dropdown.addOption("", "Select folder...");
			// 	allFolders.forEach(folder => dropdown.addOption(folder.path, folder.path));
			// 	dropdown.onChange(value => blackList = value);
			// })
			// .addSearch(search => {
			// 	search.setPlaceholder("Search folder...");
			// 	const resultContainer = containerEl.createDiv({ cls: "search-results" });
			// 	search.onChange(query => {
			// 		resultContainer.empty();
			// 		if (!query.trim()) return;
			// 		const filteredFolders = allFolders.filter(folder => folder.path.includes(query));
			// 		filteredFolders.forEach(folder => {
			// 			const resultItem = resultContainer.createEl("div", {
			// 				text: folder.path,
			// 				cls: "search-result-item"
			// 			});
			// 			resultItem.onclick = () => {
			// 				search.setValue(folder.path);
			// 				blackList = folder.path;
			// 				resultContainer.empty();
			// 			};
			// 		});
			// 	});
			// })
			// .addSearch(search => {
			// 	search.setPlaceholder("Search folder...");

			// 	const allFolder = this.app.vault.getAllFolders()
			// 		.map(f => (f as TFolder).path);

			// 	search.inputEl.addEventListener("click", () => {
			// 		new SuggestModal(this.app, allFolder, folder => {
			// 			search.setValue(folder);
			// 			blackList = folder;
			// 		}).open();
			// 	});
			// })
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
				// .addDropdown(dropdown => {
				// 	dropdown.addOption("", "Select folder...");
				// 	allFolders.forEach(f => dropdown.addOption(f.path, f.path));
				// 	dropdown.setValue(folder2);

				// 	dropdown.onChange(async (value) => {
				// 		if (value) {
				// 			this.plugin.settings.tagMapping[folder1] = value;
				// 			// await this.plugin.saveSettings();
				// 		}
				// 	});
				// })
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

// class SuggestModal extends FuzzySuggestModal<string> {
// 	protected onChoose: (folder: string) => void;
// 	protected items: string[];

// 	constructor(app: App, items: string[], onChoose: (folder: string) => void) {
// 		super(app);
// 		this.items = items;
// 		this.onChoose = onChoose;
// 	}

// 	getItems(): string[] {
// 		return this.items;
// 	}

// 	getItemText(item: string): string {
// 		return item;
// 	}

// 	onChooseItem(item: string, evt: MouseEvent | KeyboardEvent): void {
// 		this.onChoose(item);
// 	}
// }

// class WeakSuggestModal extends SuggestModal {
// 	private inputValue: string = "";

// 	constructor(app: App, items: string[], onChoose: (folder: string) => void) {
// 		super(app, items, onChoose);
// 	}

// 	onOpen(): void {
// 		super.onOpen();

// 		if (this.inputEl) {
// 			this.inputEl.addEventListener("input", (event: Event) => {
// 				const target = event.target as HTMLInputElement;
// 				this.inputValue = target.value.trim();
// 			});
// 		} else {
// 			console.error("this.inputEl is undefined");
// 		}
// 	}

// 	onInputChanged(input: string): void {
// 		this.inputValue = input;
// 	}

// 	onClose(): void {
// 		super.onClose();
// 		console.log("Input changed:", this.inputValue);  // デバッグログ
// 		if (this.inputValue && !this.items.includes(this.inputValue)) {
// 			this.onChoose(this.inputValue);
// 		}
// 	}
// }
