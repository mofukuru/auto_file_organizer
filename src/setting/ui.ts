import { App, Setting } from "obsidian";
import { FolderSuggest } from "src/suggester";

// Collapsible list with an item count and an empty-state message.
export function createListSection(
	containerEl: HTMLElement,
	title: string,
	count: number,
	emptyText: string
): HTMLElement {
	const details = containerEl.createEl("details", {
		cls: "afo-list",
		attr: { open: "true" },
	});
	details.createEl("summary", { text: `${title} (${count})` });

	if (count === 0) {
		details.createDiv({ cls: "afo-list-empty", text: emptyText });
	}
	return details;
}

// onChange fires on every keystroke; onCommit only when a suggestion is
// picked or the field loses focus, so partial paths are never saved.
export function addFolderSearch(
	setting: Setting,
	app: App,
	handlers: {
		onChange?: (folder: string) => void;
		onCommit?: (folder: string) => void;
	},
	initialValue = ""
): void {
	setting.addSearch((search) => {
		new FolderSuggest(app, search.inputEl);
		search.setPlaceholder("Search folder...").setValue(initialValue);
		if (handlers.onChange) search.onChange(handlers.onChange);
		const onCommit = handlers.onCommit;
		if (onCommit) {
			search.inputEl.addEventListener("change", () =>
				onCommit(search.getValue())
			);
		}
	});
}
