import { App, Setting } from "obsidian";
import AutoFileOrganizer, { normalizeFolder } from "src/main";
import { addFolderSearch, createListSection } from "../ui";

export function TagMappingList(
	containerEl: HTMLElement,
	plugin: AutoFileOrganizer,
	app: App,
	refresh: () => void
): void {
	const entries = Object.entries(plugin.settings.tagMapping);
	const section = createListSection(
		containerEl,
		"Tag mapping list",
		entries.length,
		"No tag mappings yet."
	);
	if (entries.length > 1) {
		section.createDiv({
			cls: "afo-list-hint",
			text: "When a note has several mapped tags, the rule higher in this list wins.",
		});
	}

	// Object key order is the rule order, so reordering rebuilds the object.
	const move = async (from: number, to: number) => {
		const reordered = [...entries];
		const [item] = reordered.splice(from, 1);
		reordered.splice(to, 0, item);
		plugin.settings.tagMapping = Object.fromEntries(reordered);
		await plugin.saveSettings();
		refresh();
	};

	entries.forEach(([tag, folder], index) => {
		const setting = new Setting(section).setName(tag);
		addFolderSearch(
			setting,
			app,
			{
				onCommit: async (value) => {
					const normalized = normalizeFolder(value);
					if (!normalized) return;
					plugin.settings.tagMapping[tag] = normalized;
					await plugin.saveSettings();
				},
			},
			folder
		);
		setting
			.addExtraButton((btn) =>
				btn
					.setIcon("arrow-up")
					.setTooltip("Higher priority")
					.setDisabled(index === 0)
					.onClick(() => move(index, index - 1))
			)
			.addExtraButton((btn) =>
				btn
					.setIcon("arrow-down")
					.setTooltip("Lower priority")
					.setDisabled(index === entries.length - 1)
					.onClick(() => move(index, index + 1))
			)
			.addExtraButton((btn) =>
				btn
					.setIcon("trash-2")
					.setTooltip("Delete mapping")
					.onClick(async () => {
						delete plugin.settings.tagMapping[tag];
						await plugin.saveSettings();
						refresh();
					})
			);
	});
}
