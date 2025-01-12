// src/settings/SettingTab.ts
import { AbstractInputSuggest, App, PluginSettingTab, Setting, TFile, TFolder } from 'obsidian';
import BoardGamePlugin from '../main';

class FolderSuggestion extends AbstractInputSuggest<TFolder> {
    getSuggestions(inputStr: string): TFolder[] {
        const folders: TFolder[] = [];
        const inputLower = inputStr.toLowerCase();
        const files = this.app.vault.getAllLoadedFiles();
        
        for (const file of files) {
            if (file instanceof TFolder && file.path.toLowerCase().contains(inputLower)) {
                folders.push(file);
            }
        }
        return folders;
    }

    renderSuggestion(folder: TFolder, el: HTMLElement): void {
        el.setText(folder.path);
    }
}

class TemplateSuggestion extends AbstractInputSuggest<TFile> {
    getSuggestions(inputStr: string): TFile[] {
        const files = this.app.vault.getMarkdownFiles();
        const inputLower = inputStr.toLowerCase();
        
        return files.filter(file => 
            file.path.toLowerCase().contains(inputLower)
        );
    }

    renderSuggestion(file: TFile, el: HTMLElement): void {
        el.setText(file.path);
    }
}

export class BoardGameSettingTab extends PluginSettingTab {
    plugin: BoardGamePlugin;

    constructor(app: App, plugin: BoardGamePlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        
        // Note Creation section
        new Setting(containerEl).setName('Note Creation').setHeading();

        new Setting(containerEl)
        .setName('Open notes after creation')
        .setDesc('Automatically open new game pages after they are created')
        .addToggle(toggle => 
            toggle.setValue(this.plugin.settings.openPageOnCompletion)
                .onChange(async (value) => {
                    this.plugin.settings.openPageOnCompletion = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
        .setName('Overwrite existing files')
        .setDesc('If a game note is already in the location it gets overwritten. Note this can generate conflicts with the games with the same name.')
        .addToggle(toggle => 
            toggle.setValue(this.plugin.settings.overwriteExistingNote)
                .onChange(async (value) => {
                    this.plugin.settings.overwriteExistingNote = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Note location')
            .setDesc('Where to save game notes')
            .addSearch(cb => {
                new FolderSuggestion(this.app, cb.inputEl);
                cb.setPlaceholder('Games')
                    .setValue(this.plugin.settings.folder)
                    .onChange(async (value) => {
                        this.plugin.settings.folder = value;
                        await this.plugin.saveSettings();
                    });
            });

        // new Setting(containerEl)
        //     .setName('File name format')
        //     .setDesc('Format for new game notes')
        //     .addSearch(cb => {
        //         new FileNameFormatSuggest(this.app, cb.inputEl);
        //         cb.setPlaceholder('Example: {{gameName}}')
        //             .setValue(this.plugin.settings.fileNameFormat)
        //             .onChange(async (value) => {
        //                 this.plugin.settings.fileNameFormat = value;
        //                 await this.plugin.saveSettings();
        //             });
        //     });

        new Setting(containerEl)
            .setName('Template file')
            .setDesc('Template for new game notes')
            .addSearch(cb => {
                new TemplateSuggestion(this.app, cb.inputEl);
                cb.setPlaceholder('templates/game')
                    .setValue(this.plugin.settings.templateFile)
                    .onChange(async (value) => {
                        this.plugin.settings.templateFile = value;
                        await this.plugin.saveSettings();
                    });
            });

        // Images section
        new Setting(containerEl).setName('Images').setHeading();

        const enableImages = new Setting(containerEl)
            .setName('Save images locally')
            .setDesc('Download and save game images to your vault')
            .addToggle(toggle => 
                toggle.setValue(this.plugin.settings.enableImageSave)
                    .onChange(async (value) => {
                        this.plugin.settings.enableImageSave = value;
                        await this.plugin.saveSettings();
                        this.display();
                    }));

        if (this.plugin.settings.enableImageSave) {
            new Setting(containerEl)
                .setName('Image location')
                .setDesc('Where to save game images')
                .addSearch(cb => {
                    new FolderSuggestion(this.app, cb.inputEl);
                    cb.setPlaceholder('Games/images')
                        .setValue(this.plugin.settings.imagePath)
                        .onChange(async (value) => {
                            this.plugin.settings.imagePath = value;
                            await this.plugin.saveSettings();
                        });
                });
        }

        new Setting(containerEl).setName('Chart settings').setHeading();

        new Setting(containerEl)
            .setName('Use Charts Plugin')
            .setDesc('Use the Obsidian Charts plugin to visualize poll data (requires Charts plugin to be installed)')
            .addToggle(toggle => 
                toggle.setValue(this.plugin.settings.useChartPlugin)
                    .onChange(async (value) => {
                        this.plugin.settings.useChartPlugin = value;
                        await this.plugin.saveSettings();
                    }));

        new Setting(containerEl)
            .setName('Chart Width')
            .setDesc('Width of generated charts (e.g., 80%, 600px)')
            .addText(text => 
                text.setPlaceholder('80%')
                    .setValue(this.plugin.settings.chartWidth)
                    .onChange(async (value) => {
                        this.plugin.settings.chartWidth = value;
                        await this.plugin.saveSettings();
                    }))
            .setDisabled(!this.plugin.settings.useChartPlugin);


        // BoardGameGeek section
        // new Setting(containerEl).setName('BoardGameGeek').setHeading();

        // const enableBGG = new Setting(containerEl)
        //     .setName('Enable integration')
        //     .setDesc('Connect with BoardGameGeek')
        //     .addToggle(toggle => 
        //         toggle.setValue(this.plugin.settings.enableBGGIntegration)
        //             .onChange(async (value) => {
        //                 this.plugin.settings.enableBGGIntegration = value;
        //                 await this.plugin.saveSettings();
        //                 this.display();
        //             }));

        // if (this.plugin.settings.enableBGGIntegration) {
        //     new Setting(containerEl)
        //         .setName('Username')
        //         .setDesc('Your BoardGameGeek username')
        //         .addText(text => 
        //             text.setPlaceholder('Enter username')
        //                 .setValue(this.plugin.settings.bggUsername)
        //                 .onChange(async (value) => {
        //                     this.plugin.settings.bggUsername = value;
        //                     await this.plugin.saveSettings();
        //                 }));
        // }

        // Session tracking section
        // new Setting(containerEl).setName('Session tracking').setHeading();

        // const enableTracking = new Setting(containerEl)
        //     .setName('Enable tracking')
        //     .setDesc('Track individual game sessions')
        //     .addToggle(toggle => 
        //         toggle.setValue(this.plugin.settings.enableSessionTracking)
        //             .onChange(async (value) => {
        //                 this.plugin.settings.enableSessionTracking = value;
        //                 await this.plugin.saveSettings();
        //                 this.display();
        //             }));

        // if (this.plugin.settings.enableSessionTracking) {
        //     this.renderSessionSettings(containerEl);
        // }
    }

    private renderSessionSettings(containerEl: HTMLElement) {
        // new Setting(containerEl)
        //     .setName('Track players')
        //     .addToggle(toggle => 
        //         toggle.setValue(this.plugin.settings.enablePlayerTracking)
        //             .onChange(async (value) => {
        //                 this.plugin.settings.enablePlayerTracking = value;
        //                 await this.plugin.saveSettings();
        //             }));

        // new Setting(containerEl)
        //     .setName('Track scores')
        //     .addToggle(toggle => 
        //         toggle.setValue(this.plugin.settings.enableScoreTracking)
        //             .onChange(async (value) => {
        //                 this.plugin.settings.enableScoreTracking = value;
        //                 await this.plugin.saveSettings();
        //             }));

        // new Setting(containerEl)
        //     .setName('Track play time')
        //     .addToggle(toggle => 
        //         toggle.setValue(this.plugin.settings.enablePlaytimeTracking)
        //             .onChange(async (value) => {
        //                 this.plugin.settings.enablePlaytimeTracking = value;
        //                 await this.plugin.saveSettings();
        //             }));

        // new Setting(containerEl)
        //     .setName('Track winners')
        //     .addToggle(toggle => 
        //         toggle.setValue(this.plugin.settings.enableWinnerTracking)
        //             .onChange(async (value) => {
        //                 this.plugin.settings.enableWinnerTracking = value;
        //                 await this.plugin.saveSettings();
        //             }));
    }
}
