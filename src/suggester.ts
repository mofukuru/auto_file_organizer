import { AbstractInputSuggest, App, TFolder, getAllTags } from "obsidian";

/*
 * Suggesters built on Obsidian's AbstractInputSuggest, which renders the
 * popover in the same window as the input. This keeps suggestions visible
 * when settings are opened in a separate window (Obsidian 1.13+).
 */

interface Suggestion {
	value: string;
	isNew: boolean;
}

// Prefix matches first, then matches at a path/tag segment, then the rest.
function rankMatches(candidates: string[], query: string): string[] {
	const q = query.toLowerCase();
	const score = (candidate: string): number => {
		const c = candidate.toLowerCase();
		if (c.startsWith(q)) return 0;
		if (c.includes("/" + q)) return 1;
		return 2;
	};

	return candidates
		.filter((c) => c.toLowerCase().includes(q))
		.sort((a, b) => score(a) - score(b) || a.localeCompare(b));
}

abstract class TextSuggest extends AbstractInputSuggest<Suggestion> {
	protected inputEl: HTMLInputElement;

	constructor(app: App, inputEl: HTMLInputElement) {
		super(app, inputEl);
		this.inputEl = inputEl;
	}

	protected abstract getCandidates(): string[];
	protected abstract normalize(query: string): string;
	protected abstract newItemHint: string;

	protected getSuggestions(query: string): Suggestion[] {
		const normalized = this.normalize(query);
		const candidates = this.getCandidates();
		const matches = rankMatches(candidates, normalized).map((value) => ({
			value,
			isNew: false,
		}));

		// Offer the typed value first so Enter keeps what the user typed
		// instead of silently replacing it with the top suggestion.
		const exists = candidates.some(
			(c) => c.toLowerCase() === normalized.toLowerCase()
		);
		if (normalized && !exists) {
			matches.unshift({ value: normalized, isNew: true });
		}

		return matches;
	}

	renderSuggestion(item: Suggestion, el: HTMLElement): void {
		el.addClass("afo-suggestion");
		el.createSpan({ text: item.value });
		if (item.isNew) {
			el.createSpan({ cls: "afo-suggestion-hint", text: this.newItemHint });
		}
	}

	selectSuggestion(item: Suggestion): void {
		this.setValue(item.value);
		this.inputEl.trigger("input");
		this.inputEl.trigger("change");
		this.close();
	}
}

export class FolderSuggest extends TextSuggest {
	protected newItemHint = "new folder";

	protected getCandidates(): string[] {
		return this.app.vault
			.getAllLoadedFiles()
			.filter((f): f is TFolder => f instanceof TFolder && !f.isRoot())
			.map((f) => f.path);
	}

	protected normalize(query: string): string {
		return query.trim().replace(/^\/+|\/+$/g, "");
	}
}

export class TagSuggest extends TextSuggest {
	protected newItemHint = "new tag";

	protected getCandidates(): string[] {
		const tags = new Set<string>();
		for (const file of this.app.vault.getMarkdownFiles()) {
			const cache = this.app.metadataCache.getFileCache(file);
			if (!cache) continue;
			getAllTags(cache)?.forEach((tag) => tags.add(tag));
		}
		return Array.from(tags);
	}

	protected normalize(query: string): string {
		const trimmed = query.trim().replace(/^#+/, "");
		return trimmed ? "#" + trimmed : "";
	}
}
