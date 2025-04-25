/*
 * This code is adapted from [liamcain/obsidian-periodic-notes] (https://github.com/liamcain/obsidian-periodic-notes/tree/main)
 * under the MIT License.
 * Copyright (c) 2021 Liam Cain
 */

import { TAbstractFile, TFile, TFolder, getAllTags } from "obsidian";

import { TextInputSuggest } from "./suggest";

export class FileSuggest extends TextInputSuggest<TFile> {
    getSuggestions(inputStr: string): TFile[] {
        const abstractFiles = this.app.vault.getAllLoadedFiles();
        const files: TFile[] = [];
        const lowerCaseInputStr = inputStr.toLowerCase();

        abstractFiles.forEach((file: TAbstractFile) => {
            if (
                file instanceof TFile &&
                file.extension === "md" &&
                file.path.toLowerCase().contains(lowerCaseInputStr)
            ) {
                files.push(file);
            }
        });

        return files;
    }

    renderSuggestion(file: TFile, el: HTMLElement): void {
        el.setText(file.path);
    }

    selectSuggestion(file: TFile): void {
        this.inputEl.value = file.path;
        this.inputEl.trigger("input");
        this.close();
    }
}

export class FolderSuggest extends TextInputSuggest<TFolder> {
    getSuggestions(inputStr: string): TFolder[] {
        const abstractFiles = this.app.vault.getAllLoadedFiles();
        const folders: TFolder[] = [];
        const lowerCaseInputStr = inputStr.toLowerCase();

        abstractFiles.forEach((folder: TAbstractFile) => {
            if (
                folder instanceof TFolder &&
                folder.path.toLowerCase().contains(lowerCaseInputStr)
            ) {
                folders.push(folder);
            }
        });

        return folders;
    }

    renderSuggestion(file: TFolder, el: HTMLElement): void {
        el.setText(file.path);
    }

    selectSuggestion(file: TFolder): void {
        this.inputEl.value = file.path;
        this.inputEl.trigger("input");
        this.close();
    }
}

export class TagSuggest extends TextInputSuggest<string> {
    getSuggestions(inputStr: string): string[] {
        const allFiles = this.app.vault.getFiles();
        const tagSet = new Set<string>();
        const lowerCaseInputStr = inputStr.toLowerCase();
        for (const file of allFiles) {
            const metadata = this.app.metadataCache.getFileCache(file);
            if (!metadata) continue;

            const tags = getAllTags(metadata);
            if (tags) {
                tags.forEach(tag => {
                    if (tag.toLowerCase().includes(lowerCaseInputStr)) {
                        tagSet.add(tag);
                    }
                });
            }
        }
        const allTags = Array.from(tagSet);

        return allTags;
    }

    renderSuggestion(tag: string, el: HTMLElement): void {
        el.setText(tag);
    }

    selectSuggestion(tag: string): void {
        this.inputEl.value = tag;
        this.inputEl.trigger("input");
        this.close();
    }
}
