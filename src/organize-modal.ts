import { App, Modal, Setting } from "obsidian";
import type { PlannedMove } from "./main";

const MAX_ROWS = 500;

// Shows which files "Organize files" would move and lets the user
// deselect some before anything is touched.
export class OrganizePreviewModal extends Modal {
	private selected: Set<PlannedMove>;

	constructor(
		app: App,
		private moves: PlannedMove[],
		private onConfirm: (selected: PlannedMove[]) => Promise<void>
	) {
		super(app);
		this.selected = new Set(moves);
	}

	onOpen(): void {
		const { contentEl } = this;
		this.titleEl.setText("Organize files");

		contentEl.createEl("p", {
			text: `${this.moves.length} file${
				this.moves.length === 1 ? "" : "s"
			} will be moved. Uncheck any file you want to keep where it is.`,
		});

		const listEl = contentEl.createDiv("afo-preview-list");
		const confirmBtnText = () => `Move ${this.selected.size} files`;
		let confirmButton: HTMLButtonElement | null = null;

		for (const plan of this.moves.slice(0, MAX_ROWS)) {
			const row = listEl.createEl("label", { cls: "afo-preview-row" });
			const checkbox = row.createEl("input", { type: "checkbox" });
			checkbox.checked = true;
			checkbox.addEventListener("change", () => {
				if (checkbox.checked) this.selected.add(plan);
				else this.selected.delete(plan);
				if (confirmButton) confirmButton.setText(confirmBtnText());
			});

			const text = row.createDiv("afo-preview-text");
			text.createDiv({ cls: "afo-preview-from", text: plan.file.path });
			text.createDiv({
				cls: "afo-preview-to",
				text: `→ ${plan.targetFolder || "/"}`,
			});
		}

		if (this.moves.length > MAX_ROWS) {
			listEl.createDiv({
				cls: "afo-preview-more",
				text: `…and ${this.moves.length - MAX_ROWS} more`,
			});
		}

		new Setting(contentEl)
			.addButton((btn) =>
				btn.setButtonText("Cancel").onClick(() => this.close())
			)
			.addButton((btn) => {
				confirmButton = btn.buttonEl;
				btn.setButtonText(confirmBtnText())
					.setCta()
					.onClick(async () => {
						btn.setDisabled(true);
						await this.onConfirm(
							this.moves.filter((m) => this.selected.has(m))
						);
						this.close();
					});
			});
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
