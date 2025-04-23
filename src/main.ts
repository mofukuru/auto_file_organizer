import { Plugin, TFile, Notice, getAllTags } from "obsidian";
import { AutoFileOrganizerSettingTab } from "./setting";

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
