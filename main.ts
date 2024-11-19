import { App, Plugin, PluginSettingTab, Setting, TFile, TFolder, Notice } from "obsidian";

interface AutoFileMoveSettings {
	folderMapping: Record<string, string>; // 拡張子→フォルダのマッピング
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
				console.log(`Moved file ${file.name} to ${targetFolder}`);
				return true; // ファイルが移動された
			} catch (err) {
				console.error(`Failed to move file ${file.name}:`, err);
			}
		} else {
			console.log(`No folder mapping found for extension: ${extension}`);
		}
		return false; // ファイルは移動されなかった
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
			console.log("Settings saved. Organizing Vault...");
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

		// 差分についての通知
		if (movedFiles.length > 0) {
			new Notice(`Moved ${movedFiles.length} files:\n${movedFiles.join(", ")}`);
			console.log(`Moved files: ${movedFiles}`);
		} else {
			new Notice("No files were moved.");
			console.log("No files moved during reorganization.");
		}
	}
}

class AutoFileMoveSettingTab extends PluginSettingTab {
	plugin: AutoFileMovePlugin;

	constructor(app: App, plugin: AutoFileMovePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	async getAllFolders(): Promise<string[]> {
		const folders: Set<string> = new Set();
		const addFoldersRecursively = (path: string) => {
			const abstractFile = this.app.vault.getAbstractFileByPath(path);

			if (abstractFile instanceof TFolder) {
				folders.add(abstractFile.path);
				abstractFile.children.forEach(child => {
					if (child instanceof TFolder) {
						addFoldersRecursively(child.path);
					}
				});
			}
		};

		addFoldersRecursively("/");
		return Array.from(folders).sort();
	}

	async display(): Promise<void> {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "Auto File Move Plugin Settings" });

		// フォルダ一覧を取得
		const allFolders = await this.getAllFolders();

		for (const [extension, folder] of Object.entries(this.plugin.settings.folderMapping)) {
			new Setting(containerEl)
				.setName(`Extension: ${extension}`)
				.setDesc("Change the folder for this extension")
				.addDropdown(dropdown => {
					// ドロップダウンの初期値を設定
					dropdown.addOption("", "Select folder...");
					allFolders.forEach(f => dropdown.addOption(f, f));
					dropdown.setValue(folder);

					// ドロップダウンの変更を処理
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
			.setName("Add New Mapping")
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
