import { App, Plugin, PluginSettingTab, Setting, TFile, TFolder, Notice } from "obsidian";

interface AutoFileMoveSettings {
	folderMapping: Record<string, string>; // mapping from extension to folder
}

const DEFAULT_SETTINGS: AutoFileMoveSettings = {
	folderMapping: {},
};

export default class AutoFileMovePlugin extends Plugin {
	settings: AutoFileMoveSettings;

	async onload() {
		console.log("Auto File Move Plugin loaded!");

		await this.loadSettings();
		this.addSettingTab(new AutoFileMoveSettingTab(this.app, this));

		this.registerEvent(
			this.app.vault.on("create", async (file: TFile) => {
				if (Object.keys(this.settings.folderMapping).length > 0) {
					await this.handleFile(file);
				} else {
					console.log("No folder mapping defined. Skipping file organization.");
				}
			})
		);
	}

	async handleFile(file: TFile): Promise<boolean> {
		if (!(file instanceof TFile)) return false;

		const extension = file.extension;
		const targetFolder = this.settings.folderMapping[extension];

		if (targetFolder) {
			await this.ensureFolderExists(targetFolder);
			const targetPath = `${targetFolder}/${file.name}`;

			try {
				await this.app.vault.rename(file, targetPath);
				return true; // file moved
			} catch (err) {
				console.error(`Failed to move file ${file.name}:`, err);
			}
		} else {
			console.log(`No folder mapping found for extension: ${extension}`);
		}
		return false; // file not moved
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
		if (Object.keys(this.settings.folderMapping).length > 0) {
			await this.organizeVault();
		}
	}

	async organizeVault() {
		const files = this.app.vault.getFiles();
		const movedFiles: string[] = [];

		for (const file of files) {
			const moved = await this.handleFile(file);
			if (moved) {
				movedFiles.push(file.name);
			}
		}

		// notice of diff
		if (movedFiles.length > 0) {
			new Notice(`Moved ${movedFiles.length} files:\n${movedFiles.join(", ")}`);
		} else {
			new Notice("No files were moved.");
		}
	}
}

class AutoFileMoveSettingTab extends PluginSettingTab {
	plugin: AutoFileMovePlugin;

	constructor(app: App, plugin: AutoFileMovePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	async display(): Promise<void> {
		const { containerEl } = this;
		containerEl.empty();

		// get all folders
		const allFolders = await this.getAllFolders();

		for (const [extension, folder] of Object.entries(this.plugin.settings.folderMapping)) {
			new Setting(containerEl)
				.setName(`Extension: ${extension}`)
				.setDesc("Change the folder for this extension")
				.addDropdown(dropdown => {
					// init dropdown
					dropdown.addOption("", "Select folder...");
					allFolders.forEach(f => dropdown.addOption(f, f));
					dropdown.setValue(folder);

					// changes dropdown
					dropdown.onChange(async (value) => {
						if (value) {
							this.plugin.settings.folderMapping[extension] = value;
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
							delete this.plugin.settings.folderMapping[extension];
							await this.plugin.saveSettings();
							this.display();
						})
				);
		}

		let newExtension = "";
		let newFolder = "";

		new Setting(containerEl)
			.setName("Add new mapping")
			.setDesc("Add a new extension and target folder")
			.addText(text => text
				.setPlaceholder("Enter extension (e.g., docx)")
				.onChange((value) => newExtension = value.trim())
			)
			.addDropdown(dropdown => {
				dropdown.addOption("", "Select folder...");
				allFolders.forEach(folder => dropdown.addOption(folder, folder));
				dropdown.onChange(value => newFolder = value);
			})
			.addButton(btn => {
				btn.setButtonText("Add")
					.setCta()
					.onClick(async () => {
						if (newExtension && newFolder) {
							this.plugin.settings.folderMapping[newExtension] = newFolder;
							await this.plugin.saveSettings();
							this.display();
						}
					});
			});
	}
}
