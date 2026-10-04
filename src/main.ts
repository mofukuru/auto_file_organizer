import {
	Notice,
	Plugin,
	TAbstractFile,
	TFile,
	getAllTags,
	normalizePath,
} from "obsidian";
import { AutoFileOrganizerSettingTab } from "./setting";
import { OrganizePreviewModal } from "./organize-modal";

export interface AutoFileOrganizerSettings {
	tagEnabled: boolean;
	extensionEnabled: boolean;
	priority: string;
	// Only move files that sit in the vault root automatically
	rootOnly: boolean;
	extensionMapping: Record<string, string>; // mapping from extension to folder
	tagMapping: Record<string, string>; // mapping from tag to folder; earlier entries win
	extensionBlackList: Record<string, string>;
	extensionFolderBlackList: Record<string, string>;
	tagBlackList: Record<string, string>;
}

const DEFAULT_SETTINGS: AutoFileOrganizerSettings = {
	tagEnabled: false,
	extensionEnabled: false,
	priority: "tag",
	rootOnly: false,
	extensionMapping: {},
	tagMapping: {},
	extensionBlackList: {},
	extensionFolderBlackList: {},
	tagBlackList: {},
};

export interface PlannedMove {
	file: TFile;
	targetFolder: string;
}

// "/foo/bar/" -> "foo/bar", "/" -> ""
export function normalizeFolder(path: string): string {
	const normalized = normalizePath(path.trim());
	return normalized === "/" ? "" : normalized.replace(/^\/+|\/+$/g, "");
}

function parentPath(file: TFile): string {
	return normalizeFolder(file.parent?.path ?? "");
}

function isInRoot(file: TAbstractFile): boolean {
	return !file.path.includes("/");
}

export default class AutoFileOrganizer extends Plugin {
	settings: AutoFileOrganizerSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new AutoFileOrganizerSettingTab(this.app, this));

		// vault "create" also fires for every existing file while the vault
		// loads, so only start listening once the layout is ready. Otherwise
		// already-organized files get moved on startup.
		this.app.workspace.onLayoutReady(() => {
			this.registerEvent(
				this.app.vault.on("create", async (file) => {
					if (!(file instanceof TFile)) return;
					if (this.settings.rootOnly && !isInRoot(file)) return;
					await this.handleFile(file);
				})
			);
		});

		this.registerEvent(
			this.app.vault.on("rename", async (file) => {
				if (!(file instanceof TFile) || !isInRoot(file)) return;
				await this.handleFile(file);
			})
		);

		this.registerEvent(
			this.app.metadataCache.on("changed", async (file) => {
				// Only process files in vault root; already-organized files should not be re-moved
				if (!isInRoot(file)) return;
				await this.handleFile(file);
			})
		);

		this.addCommand({
			id: "organize-files",
			name: "Organize files",
			callback: () => this.organizeVault(),
		});
	}

	isInExcludedFolder(file: TFile): boolean {
		const folderPath = parentPath(file);
		const keys = [
			...Object.keys(this.settings.extensionFolderBlackList ?? {}),
			...Object.keys(this.settings.tagBlackList ?? {}),
		]
			.map(normalizeFolder)
			.filter((key) => key !== "");

		return keys.some(
			(key) => folderPath === key || folderPath.startsWith(key + "/")
		);
	}

	getTargetFolderByTag(file: TFile): string | null {
		if (!this.settings.tagEnabled) return null;

		const cache = this.app.metadataCache.getFileCache(file);
		if (!cache) return null;

		const fileTags = new Set(
			(getAllTags(cache) ?? []).map((tag) => tag.toLowerCase())
		);
		if (fileTags.size === 0) return null;

		// Rules are evaluated in the order of the mapping list in settings.
		const folders = Object.entries(this.settings.tagMapping)
			.filter(([tag]) => fileTags.has(tag.toLowerCase()))
			.map(([, folder]) => normalizeFolder(folder));
		if (folders.length === 0) return null;

		// If the note already sits in a folder of any matching rule, keep it
		// there instead of bouncing it around when another tag is added.
		const current = parentPath(file);
		return folders.includes(current) ? current : folders[0];
	}

	getTargetFolderByExtension(file: TFile): string | null {
		if (!this.settings.extensionEnabled) return null;

		const mapping = this.settings.extensionMapping;
		const folder =
			mapping[file.extension] ?? mapping[file.extension.toLowerCase()];
		return folder ? normalizeFolder(folder) : null;
	}

	getTargetFolder(file: TFile): string | null {
		if (this.isInExcludedFolder(file)) return null;

		const byTag = () => this.getTargetFolderByTag(file);
		const byExtension = () => this.getTargetFolderByExtension(file);

		return this.settings.priority === "extension"
			? byExtension() ?? byTag()
			: byTag() ?? byExtension();
	}

	planMove(file: TFile): PlannedMove | null {
		const targetFolder = this.getTargetFolder(file);
		if (targetFolder === null || targetFolder === parentPath(file)) {
			return null;
		}
		return { file, targetFolder };
	}

	async handleFile(file: TFile): Promise<boolean> {
		const plan = this.planMove(file);
		return plan ? this.moveFile(plan) : false;
	}

	async moveFile({ file, targetFolder }: PlannedMove): Promise<boolean> {
		const targetPath = normalizePath(
			targetFolder ? `${targetFolder}/${file.name}` : file.name
		);

		if (this.app.vault.getAbstractFileByPath(targetPath)) {
			new Notice(
				`Auto File Organizer: "${file.name}" was not moved because "${targetPath}" already exists.`
			);
			return false;
		}

		try {
			await this.ensureFolderExists(targetFolder);
			// fileManager.renameFile updates links according to the user's settings.
			await this.app.fileManager.renameFile(file, targetPath);
			return true;
		} catch (err) {
			console.error(`Auto File Organizer: failed to move ${file.path}`, err);
			return false;
		}
	}

	async ensureFolderExists(folderPath: string) {
		if (!folderPath) return;
		if (!this.app.vault.getAbstractFileByPath(folderPath)) {
			await this.app.vault.createFolder(folderPath);
		}
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	organizeVault() {
		const moves = this.app.vault
			.getFiles()
			.map((file) => this.planMove(file))
			.filter((plan): plan is PlannedMove => plan !== null);

		if (moves.length === 0) {
			new Notice("All files are already organized.");
			return;
		}

		new OrganizePreviewModal(this.app, moves, async (selected) => {
			let moved = 0;
			// Sequential on purpose: parallel renames race on folder creation.
			for (const plan of selected) {
				if (await this.moveFile(plan)) moved++;
			}
			const skipped = selected.length - moved;
			new Notice(
				`Moved ${moved} file${moved === 1 ? "" : "s"}` +
					(skipped > 0 ? ` (${skipped} skipped)` : "") +
					"."
			);
		}).open();
	}

	// Picks the folder that holds the most files for each key.
	private mostCommonFolder(
		counts: Record<string, Record<string, number>>
	): Record<string, string> {
		const result: Record<string, string> = {};
		for (const [key, folders] of Object.entries(counts)) {
			result[key] = Object.entries(folders).sort(
				(a, b) => b[1] - a[1]
			)[0][0];
		}
		return result;
	}

	private isUnder(folderPath: string, blacklist: Record<string, string>) {
		return Object.keys(blacklist ?? {})
			.map(normalizeFolder)
			.filter((key) => key !== "")
			.some((key) => folderPath === key || folderPath.startsWith(key + "/"));
	}

	// Build extension -> folder mapping but skip extensions present in extensionBlackList
	async updateExtensionMappingFromExistingFiles() {
		const counts: Record<string, Record<string, number>> = {};

		for (const file of this.app.vault.getFiles()) {
			const extension = file.extension;
			const folder = parentPath(file);
			if (
				!extension ||
				!folder ||
				this.settings.extensionBlackList?.[extension] ||
				this.settings.extensionMapping[extension] ||
				this.isUnder(folder, this.settings.extensionFolderBlackList)
			) {
				continue;
			}
			counts[extension] ??= {};
			counts[extension][folder] = (counts[extension][folder] ?? 0) + 1;
		}

		const added = this.mostCommonFolder(counts);
		this.settings.extensionMapping = {
			...this.settings.extensionMapping,
			...added,
		};

		await this.saveSettings();
		const n = Object.keys(added).length;
		new Notice(
			n > 0
				? `Added ${n} extension mapping${n === 1 ? "" : "s"}.`
				: "No new extension mappings found."
		);
	}

	async updateTagMappingFromExistingFiles() {
		const counts: Record<string, Record<string, number>> = {};

		for (const file of this.app.vault.getMarkdownFiles()) {
			const folder = parentPath(file);
			if (!folder || this.isUnder(folder, this.settings.tagBlackList)) {
				continue;
			}

			const cache = this.app.metadataCache.getFileCache(file);
			if (!cache) continue;

			for (const tag of new Set(getAllTags(cache) ?? [])) {
				if (this.settings.tagMapping[tag]) continue;
				counts[tag] ??= {};
				counts[tag][folder] = (counts[tag][folder] ?? 0) + 1;
			}
		}

		const added = this.mostCommonFolder(counts);
		this.settings.tagMapping = {
			...this.settings.tagMapping,
			...added,
		};

		await this.saveSettings();
		const n = Object.keys(added).length;
		new Notice(
			n > 0
				? `Added ${n} tag mapping${n === 1 ? "" : "s"}.`
				: "No new tag mappings found."
		);
	}
}
