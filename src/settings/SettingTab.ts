// src/settings/SettingTab.ts
import { App, PluginSettingTab, Setting } from 'obsidian';
import { FileNameFormatSuggest } from './suggesters/FileNameFormatSuggester';
import { FileSuggest } from './suggesters/FileSuggester';
import { FolderSuggest } from './suggesters/FolderSuggester';
import BoardGamePlugin from '../main';

export class BoardGameSettingTab extends PluginSettingTab {
    plugin: BoardGamePlugin;

    constructor(app: App, plugin: BoardGamePlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.classList.add('boardgame-plugin-settings');

        // File Location Settings
        containerEl.createEl('h2', { text: 'File Settings' });
        
        new Setting(containerEl)
            .setName('New file location')
            .setDesc('Location where game notes will be saved')
            .addSearch(cb => {
                new FolderSuggest(this.app, cb.inputEl);
                cb.setPlaceholder('Example: Games')
                    .setValue(this.plugin.settings.folder)
                    .onChange(async (value) => {
                        this.plugin.settings.folder = value;
                        await this.plugin.saveSettings();
                    });
            });

        new Setting(containerEl)
            .setName('File name format')
            .setDesc('Format for new game notes')
            .addSearch(cb => {
                new FileNameFormatSuggest(this.app, cb.inputEl);
                cb.setPlaceholder('Example: {{gameName}}')
                    .setValue(this.plugin.settings.fileNameFormat)
                    .onChange(async (value) => {
                        this.plugin.settings.fileNameFormat = value;
                        await this.plugin.saveSettings();
                    });
            });

        new Setting(containerEl)
            .setName('Template file')
            .setDesc('Template for new game notes')
            .addSearch(cb => {
                new FileSuggest(this.app, cb.inputEl);
                cb.setPlaceholder('Example: templates/game')
                    .setValue(this.plugin.settings.templateFile)
                    .onChange(async (value) => {
                        this.plugin.settings.templateFile = value;
                        await this.plugin.saveSettings();
                    });
            });

        // Image Settings
        containerEl.createEl('h2', { text: 'Image Settings' });

        new Setting(containerEl)
            .setName('Show Images in Search')
            .setDesc('Show game images in search results')
            .addToggle(toggle => 
                toggle.setValue(this.plugin.settings.showGameImageInSearch)
                    .onChange(async (value) => {
                        this.plugin.settings.showGameImageInSearch = value;
                        await this.plugin.saveSettings();
                    }));

        new Setting(containerEl)
            .setName('Save Images Locally')
            .setDesc('Download and save game images to your vault instead of using external links')
            .addToggle(toggle => 
                toggle.setValue(this.plugin.settings.enableImageSave)
                    .onChange(async (value) => {
                        this.plugin.settings.enableImageSave = value;
                        await this.plugin.saveSettings();
                    }));

        new Setting(containerEl)
            .setName('Image Save Location')
            .setDesc('Path where game images will be saved')
            .addText(text => 
                text.setPlaceholder('assets/games')
                    .setValue(this.plugin.settings.imagePath)
                    .onChange(async (value) => {
                        this.plugin.settings.imagePath = value;
                        await this.plugin.saveSettings();
                    }))
            .setDisabled(!this.plugin.settings.enableImageSave);

        // Session Settings
        containerEl.createEl('h2', { text: 'Session Tracking' });

        const sessionContainer = containerEl.createDiv('session-settings-container');

        new Setting(sessionContainer)
            .setName('Enable Session Tracking')
            .setDesc('Track individual game sessions')
            .addToggle(toggle => 
                toggle.setValue(this.plugin.settings.enableSessionTracking)
                    .onChange(async (value) => {
                        this.plugin.settings.enableSessionTracking = value;
                        await this.plugin.saveSettings();
                        this.renderSessionSettings(sessionContainer.createDiv(), value);
                    }));

        this.renderSessionSettings(sessionContainer.createDiv(), this.plugin.settings.enableSessionTracking);

        // BGG Integration Settings
        containerEl.createEl('h2', { text: 'BoardGameGeek Integration' });

        new Setting(containerEl)
            .setName('Enable BGG Integration')
            .setDesc('Enable integration with BoardGameGeek')
            .addToggle(toggle => 
                toggle.setValue(this.plugin.settings.enableBGGIntegration)
                    .onChange(async (value) => {
                        this.plugin.settings.enableBGGIntegration = value;
                        await this.plugin.saveSettings();
                    }));

        new Setting(containerEl)
            .setName('BGG Username')
            .setDesc('Your BoardGameGeek username')
            .addText(text => 
                text.setPlaceholder('Enter BGG username')
                    .setValue(this.plugin.settings.bggUsername)
                    .onChange(async (value) => {
                        this.plugin.settings.bggUsername = value;
                        await this.plugin.saveSettings();
                    }))
            .setDisabled(!this.plugin.settings.enableBGGIntegration);

        // General Settings
        containerEl.createEl('h2', { text: 'General Settings' });

        new Setting(containerEl)
            .setName('Open Page After Creation')
            .setDesc('Automatically open new game pages after creation')
            .addToggle(toggle => 
                toggle.setValue(this.plugin.settings.openPageOnCompletion)
                    .onChange(async (value) => {
                        this.plugin.settings.openPageOnCompletion = value;
                        await this.plugin.saveSettings();
                    }));
    }

    private renderSessionSettings(containerEl: HTMLElement, isEnabled: boolean) {
        containerEl.empty();
        
        if (!isEnabled) {
            return;
        }

        new Setting(containerEl)
            .setName('Track Players')
            .setDesc('Enable player tracking for sessions')
            .addToggle(toggle => 
                toggle.setValue(this.plugin.settings.enablePlayerTracking)
                    .onChange(async (value) => {
                        this.plugin.settings.enablePlayerTracking = value;
                        await this.plugin.saveSettings();
                    }));

        new Setting(containerEl)
            .setName('Track Scores')
            .setDesc('Enable score tracking for sessions')
            .addToggle(toggle => 
                toggle.setValue(this.plugin.settings.enableScoreTracking)
                    .onChange(async (value) => {
                        this.plugin.settings.enableScoreTracking = value;
                        await this.plugin.saveSettings();
                    }));

        new Setting(containerEl)
            .setName('Track Play Time')
            .setDesc('Enable play time tracking for sessions')
            .addToggle(toggle => 
                toggle.setValue(this.plugin.settings.enablePlaytimeTracking)
                    .onChange(async (value) => {
                        this.plugin.settings.enablePlaytimeTracking = value;
                        await this.plugin.saveSettings();
                    }));

        new Setting(containerEl)
            .setName('Track Winners')
            .setDesc('Enable winner tracking for sessions')
            .addToggle(toggle => 
                toggle.setValue(this.plugin.settings.enableWinnerTracking)
                    .onChange(async (value) => {
                        this.plugin.settings.enableWinnerTracking = value;
                        await this.plugin.saveSettings();
                    }));
    }
}
