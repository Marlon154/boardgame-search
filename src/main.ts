// src/main.ts
import { App, Editor, MarkdownView, Modal, Notice, Plugin, Setting, TFile, requestUrl, normalizePath } from 'obsidian';
import { BoardGamePluginSettings, DEFAULT_SETTINGS } from './settings/settings';
import { BoardGameSettingTab } from './settings/SettingTab';
import { BGGApiManager, BGGGameDetails } from './api/BGGApiManager';
import { TemplateManager } from './template/TemplateManager';
import { ImageQuality } from './settings/settings';
import { BGGSearchModal } from './ui/BGGSearchModal';

export default class BoardGamePlugin extends Plugin {
    settings: BoardGamePluginSettings;
    public bggApi: BGGApiManager;
    private templateManager: TemplateManager;

    async onload() {
        await this.loadSettings();
        this.bggApi = new BGGApiManager();
        this.templateManager = new TemplateManager(this);

        // Create the ribbon icon
        const ribbonIconEl = this.addRibbonIcon('dice', 'Board Game Search', (evt: MouseEvent) => {
            new BGGSearchModal(this).open();
        });
        ribbonIconEl.addClass('boardgame-plugin-ribbon-class');

        // Add status bar item
        // const statusBarItemEl = this.addStatusBarItem();
        // statusBarItemEl.setText('🎲 Ready to track games');

        // Add command to search BGG
        this.addCommand({
            id: 'search-bgg',
            name: 'Search BoardGameGeek',
            callback: () => {
                new BGGSearchModal(this).open();
            }
        });

        // Add command to quickly add new game
        // this.addCommand({
        //     id: 'quick-add-game',
        //     name: 'Quick Add Game',
        //     callback: () => {
        //         new QuickAddGameModal(this.app, this).open();
        //     }
        // });

        // Add settings tab
        this.addSettingTab(new BoardGameSettingTab(this.app, this));
    }

    onunload() {}

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

	async downloadAndSaveImage(game: BGGGameDetails): Promise<string> {
		try {
            const url = this.settings.imageQuality === ImageQuality.Thumbnail ? game.thumbnail : game.image;
            if (!url) return '';

		    const response = await requestUrl({
		        url: url,
		        method: 'GET',
		        headers: {
		            Accept: 'image/*',
		        },
		    });

		    if (response.status !== 200) {
		        throw new Error(`Failed to download image: ${response.status}`);
		    }

		    let imageData = response.arrayBuffer;
            if (this.settings.imageQuality === ImageQuality.Medium) {
                imageData = await this.downscaleImage(imageData);
            }
    

		    // Generate file name and path
		    const gameId = game.id || 'unknown';
		    const fileName = `bgg-${gameId}.jpg`;
            const folderPath = normalizePath(this.settings.imagePath);
            const filePath = normalizePath(`${folderPath}/${fileName}`);

            const folder = this.app.vault.getFolderByPath(folderPath);
            if (!folder) {
                await this.app.vault.createFolder(folderPath);
            }

            const file = this.app.vault.getFileByPath(filePath);
            if (this.settings.overwriteExistingImage) {
                if (file) {
                    await this.app.vault.modifyBinary(file, imageData);
                } else {
                    await this.app.vault.createBinary(filePath, imageData);
                }
            }

		    return filePath;
		} catch (error) {
		    console.error('Error downloading or saving image:', error);
		    return game.image || '';
		}
	}

    async downscaleImage(arrayBuffer: ArrayBuffer): Promise<ArrayBuffer> {
        // Create a blob from the array buffer
        const blob = new Blob([arrayBuffer]);
        const imageUrl = URL.createObjectURL(blob);
    
        try {
            const img = await new Promise<HTMLImageElement>((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = imageUrl;
            });
    
            const canvas = document.createElement('canvas');
            const width = Math.floor(img.width / 2);
            const height = Math.floor(img.height / 2);
            canvas.width = width;
            canvas.height = height;
    
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('Could not get canvas context');
            }
            
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
    
            ctx.drawImage(img, 0, 0, width, height);
    
            const blob = await new Promise<Blob>((resolve) => {
                canvas.toBlob(
                    (blob) => resolve(blob!),
                    'image/jpeg',
                    0.85
                );
            });
    
            return await blob.arrayBuffer();
        } finally {
            URL.revokeObjectURL(imageUrl);
        }
    }

    async createGameEntry(gameDetails: BGGGameDetails) {
        try {
            // Handle image first
            let imageReference = '';
            if (this.settings.enableImageSave) {
                imageReference = await this.downloadAndSaveImage(gameDetails);
            }
    
            // Prepare template context
            const templateContext = {
                game: {
                    ...gameDetails,
                    image: imageReference
                },
                useLocalImages: this.settings.enableImageSave,
                useCharts: this.settings.useChartPlugin,
                chartWidth: this.settings.chartWidth,
                date: new Date()
            };
    
            // Render template
            const noteContent = await this.templateManager.loadAndRender(
                this.settings.templateFile,
                templateContext
            );

            // Generate file path
            const fileName = gameDetails.name.replace(/[\\/:*?"<>|]/g, '-');
            const folderPath = this.settings.folder ? normalizePath(this.settings.folder) : '';
            const filePath = normalizePath(folderPath ? `${folderPath}/${fileName}.md` : `${fileName}.md`);

            let createdFile: TFile;
            const existingFile = this.app.vault.getFileByPath(filePath);

            if (existingFile) {
                if (this.settings.overwriteExistingNote) {
                    await this.app.vault.process(existingFile, (data) => noteContent);
                    createdFile = existingFile;
                    new Notice('Game entry updated');
                } else {
                    new Notice('Game already exists - not updated');
                    createdFile = existingFile;
                }
            } else {
                if (folderPath) {
                    const folder = this.app.vault.getFolderByPath(folderPath);
                    if (!folder) {
                        await this.app.vault.createFolder(folderPath);
                    }
                }
                createdFile = await this.app.vault.create(filePath, noteContent);
                new Notice('Game entry created');
            }

            if (this.settings.openPageOnCompletion && createdFile instanceof TFile) {
                await this.app.workspace.getLeaf(false).openFile(createdFile);
            }
        } catch (error) {
            new Notice('Failed to create/update game entry');
            console.error('Error creating/updating game entry:', error);
        }
    }
}

// class QuickAddGameModal extends Modal {
//     private plugin: BoardGamePlugin;
//     private gameNameInput: HTMLInputElement;

//     constructor(app: App, plugin: BoardGamePlugin) {
//         super(app);
//         this.plugin = plugin;
//     }

//     onOpen() {
//         const { contentEl } = this;
//         contentEl.empty();
//         contentEl.addClass('quick-add-game-modal');

//         // Create search input
//         const searchContainer = contentEl.createDiv('search-container');
//         this.gameNameInput = searchContainer.createEl('input', {
//             type: 'text',
//             placeholder: 'Start typing to search BGG...'
//         });
//         this.gameNameInput.focus();

//         // Create results container
//         const resultsContainer = contentEl.createDiv('search-results');

//         // Handle search input
//         let debounceTimeout: NodeJS.Timeout;
//         this.gameNameInput.addEventListener('input', () => {
//             clearTimeout(debounceTimeout);
//             debounceTimeout = setTimeout(async () => {
//                 const query = this.gameNameInput.value.trim();
//                 if (query.length > 2) {
//                     try {
//                         const results = await this.plugin.bggApi.searchGames(query);
//                         this.showSearchResults(resultsContainer, results);
//                     } catch (error) {
//                         new Notice('Failed to search BoardGameGeek');
//                     }
//                 }
//             }, 500);
//         });
//     }

//     private showSearchResults(container: HTMLElement, results: BGGSearchResult[]) {
//         container.empty();
        
//         results.slice(0, 5).forEach(result => {
//             const resultEl = container.createDiv({
//                 cls: 'search-result-item',
//                 attr: { 'data-game-id': result.id }
//             });
//             const infoContainer = resultEl.createDiv('search-result-info');
            
//             if (this.plugin.settings.showGameImageInSearch && result.thumbnail) {
//                 const thumbnailContainer = resultEl.createDiv('search-result-thumbnail');
//                 const img = thumbnailContainer.createEl('img', {
//                     attr: { 
//                         src: result.thumbnail,
//                         alt: result.name
//                     }
//                 });
//             }

//             const titleEl = infoContainer.createDiv('search-result-title');
//             titleEl.setText(result.name);
            
//             if (result.yearPublished) {
//                 const yearEl = infoContainer.createEl('div', { 
//                     text: `(${result.yearPublished})`,
//                     cls: 'search-result-year'
//                 });
//             }
            
//             resultEl.addEventListener('click', async () => {
//                 try {
//                     const gameDetails = await this.plugin.bggApi.getGameDetails(result.id);
//                     this.close();
//                     await this.plugin.createGameEntry(gameDetails);
//                 } catch (error) {
//                     new Notice('Failed to load game details');
//                 }
//             });
//         });
//     }

//     onClose() {
//         const { contentEl } = this;
//         contentEl.empty();
//     }
// }

// class GameSessionModal extends Modal {
//     private plugin: BoardGamePlugin;
//     private gameDetails: BGGGameDetails;
//     private formValues: {[key: string]: string} = {};

//     constructor(app: App, plugin: BoardGamePlugin, gameDetails: BGGGameDetails) {
//         super(app);
//         this.plugin = plugin;
//         this.gameDetails = gameDetails;
//     }

//     onOpen() {
//         const { contentEl } = this;
//         contentEl.empty();
//         contentEl.addClass('game-session-modal');

//         // Display game info
//         const gameInfoEl = contentEl.createDiv('game-info');
//         gameInfoEl.createEl('h2', { text: this.gameDetails.name });

//         if (this.gameDetails.thumbnail) {
//             const thumbnailEl = gameInfoEl.createEl('img', {
//                 cls: 'game-thumbnail',
//                 attr: { src: this.gameDetails.thumbnail }
//             });
//         }

//         // Create form for session details
//         const formEl = contentEl.createDiv('session-form');
        
//         // Number of Players field
//         new Setting(formEl)
//             .setName('Number of Players')
//             .setDesc(`${this.gameDetails.minPlayers}-${this.gameDetails.maxPlayers} players`)
//             .addText(text => {
//                 text.setValue(this.formValues['players'] || '');
//                 text.onChange(value => {
//                     this.formValues['players'] = value;
//                 });
//             });

//         // Winner field
//         new Setting(formEl)
//             .setName('Winner')
//             .addText(text => {
//                 text.setValue(this.formValues['winner'] || '');
//                 text.onChange(value => {
//                     this.formValues['winner'] = value;
//                 });
//             });

//         // Play Time field
//         new Setting(formEl)
//             .setName('Play Time')
//             .setDesc(`Suggested: ${this.gameDetails.playingTime} minutes`)
//             .addText(text => {
//                 text.setValue(this.formValues['playtime'] || '');
//                 text.onChange(value => {
//                     this.formValues['playtime'] = value;
//                 });
//             });

//         // Notes field
//         new Setting(formEl)
//             .setName('Session Notes')
//             .addTextArea(text => {
//                 text.setValue(this.formValues['notes'] || '');
//                 text.setPlaceholder('Add any notes about this game session...');
//                 text.onChange(value => {
//                     this.formValues['notes'] = value;
//                 });
//             });

//         // Add save button
//         new Setting(formEl)
//             .addButton(btn => btn
//                 .setButtonText('Save Session')
//                 .setCta()
//                 .onClick(async () => {
//                     try {
//                         await this.saveGameSession();
//                         this.close();
//                     } catch (error) {
//                         new Notice('Failed to save game session');
//                         console.error('Error saving game session:', error);
//                     }
//                 }));
//     }

//     private async saveGameSession() {
//         // Create session data
//         const sessionDate = new Date().toISOString();
//         const sessionData = {
//             date: sessionDate,
//             players: parseInt(this.formValues['players']) || 0,
//             winner: this.formValues['winner'] || '',
//             playtime: parseInt(this.formValues['playtime']) || 0,
//             notes: this.formValues['notes'] || '',
//             gameId: this.gameDetails.id,
//             gameName: this.gameDetails.name
//         };

//         try {
//             // First, create or get the game entry
//             await this.plugin.createGameEntry(this.gameDetails);

//             // Then append the session data
//             const fileName = this.gameDetails.name.replace(/[\\/:*?"<>|]/g, '-');
//             const filePath = `${this.plugin.settings.folder}/${fileName}.md`;
//             const file = this.app.vault.getAbstractFileByPath(filePath);

//             if (file) {
//                 const currentContent = await this.app.vault.read(file as TFile);
//                 const sessionContent = `\n\n## Game Session - ${new Date().toLocaleDateString()}
// - Players: ${sessionData.players}
// - Winner: ${sessionData.winner}
// - Play Time: ${sessionData.playtime} minutes
// ${sessionData.notes ? `- Notes: ${sessionData.notes}` : ''}`;

//                 await this.app.vault.modify(file as TFile, currentContent + sessionContent);
//                 new Notice('Game session saved successfully!');
//             } else {
//                 throw new Error('Game file not found');
//             }
//         } catch (error) {
//             console.error('Error saving session:', error);
//             throw error;
//         }
//     }

//     onClose() {
//         const { contentEl } = this;
//         contentEl.empty();
//     }
// }
