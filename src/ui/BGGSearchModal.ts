import { SuggestModal, Notice, Setting } from 'obsidian';
import BoardGamePlugin from '../main';
import { BGGSearchResult } from '../api/BGGApiManager';
import { BGGLOGOBASE64 } from '../constants';

export class BGGSearchModal extends SuggestModal<BGGSearchResult> {
    private plugin: BoardGamePlugin;
    private isLoading = false;
    private searchDebounceTimeout: NodeJS.Timeout | undefined;
    private loadingEl: HTMLElement;
    private lastQuery = '';
    private exactQuery = false;

    constructor(plugin: BoardGamePlugin) {
        super(plugin.app);
        this.plugin = plugin;
        
        this.setPlaceholder('Search for a board game...');
        this.modalEl.addClass('bgg-search-modal');

        this.loadingEl = this.modalEl.createDiv({
            cls: 'search-loading',
            text: 'Searching BoardGameGeek...'
        });

        this.loadingEl.hide();
                
        this.addExactOption();
        this.addBGGAttribution();
    }

    private addExactOption(): void {
        new Setting(this.modalEl)
            .setName('Exact search')
            .addToggle((tgl) => tgl.onChange((value) => this.onExactToggle(value)));
    }

    private onExactToggle(value: boolean) {
        this.exactQuery = value;
        this.inputEl.dispatchEvent(new InputEvent("input"));
    }

    private addBGGAttribution(): void {
        const attributionEl = this.modalEl.createDiv('bgg-attribution');
        const linkEl = attributionEl.createEl('a', {
            href: 'https://boardgamegeek.com',
            cls: 'bgg-attribution-link',
            attr: {
                target: '_blank',
                rel: 'noopener'
            }
        });
        
        linkEl.createEl('img', {
            cls: 'bgg-logo',
            attr: {
                src: BGGLOGOBASE64,
                alt: 'Powered by BoardGameGeek'
            }
        });
    }

    async getSuggestions(query: string): Promise<BGGSearchResult[]> {
        this.lastQuery = query;

        if (this.searchDebounceTimeout) {
            clearTimeout(this.searchDebounceTimeout);
        }

        if (query.length < 3) {
            this.isLoading = false;
            this.loadingEl.hide();
            return [];
        }

        // Show loading before the debounce
        this.resultContainerEl.empty();
        this.isLoading = true;
        this.loadingEl.show();

        return new Promise((resolve) => {
            this.searchDebounceTimeout = setTimeout(async () => {
                if (query !== this.lastQuery) {
                    this.isLoading = false;
                    this.loadingEl.hide();
                    resolve([]);
                    return;
                }

                try {
                    const results = await this.plugin.bggApi.searchGames(query, this.exactQuery);
                    if (query === this.lastQuery) {
                        resolve(results);
                    } else {
                        resolve([]);
                    }
                } catch (error) {
                    console.error('Search error:', error);
                    new Notice('Failed to search BoardGameGeek');
                    resolve([]);
                } finally {
                    if (query === this.lastQuery) {
                        this.isLoading = false;
                        this.loadingEl.hide();
                    }
                }
            }, 300);
        });
    }

    renderSuggestion(game: BGGSearchResult, el: HTMLElement) {
        const suggestionEl = el.createDiv('search-result-item');

        if (this.plugin.settings.showGameImageInSearch && game.thumbnail) {
            const thumbnailContainer = suggestionEl.createDiv('search-result-thumbnail');
            thumbnailContainer.createEl('img', {
                attr: { 
                    src: game.thumbnail,
                    alt: game.name
                }
            });
        }

        const infoContainer = suggestionEl.createDiv('search-result-info');
        
        const titleRow = infoContainer.createDiv('search-result-title-row');
        titleRow.createDiv({
            text: game.name,
            cls: 'search-result-title'
        });

        // Game metadata row
        const metaItems = [];
        if (game.yearPublished) {
            metaItems.push(game.yearPublished);
        }

        if (game.minPlayers && game.maxPlayers) {
            const playerCount = game.minPlayers === game.maxPlayers 
                ? `${game.minPlayers} players`
                : `${game.minPlayers}-${game.maxPlayers} players`;
            metaItems.push(playerCount);
        }

        if (game.playingTime) {
            metaItems.push(`${game.playingTime} min`);
        }
        
        if (metaItems.length > 0) {
            infoContainer.createDiv({
                text: metaItems.join(' • '),
                cls: 'search-result-meta'
            });
        }
    }

    async onChooseSuggestion(game: BGGSearchResult, evt: MouseEvent | KeyboardEvent) {
        try {
            new Notice('Loading game details...');
            const gameDetails = await this.plugin.bggApi.getGameDetails(game.id);
            this.plugin.settings.lastPlayedGame = game.id;
            await this.plugin.saveSettings();
            await this.plugin.createGameEntry(gameDetails);
        } catch (error) {
            new Notice('Failed to load game details');
            console.error('Game loading error:', error);
        }
    }

    onNoSuggestion(): void {
        this.resultContainerEl.empty();
        
        const text = this.isLoading 
            ? 'Searching BoardGameGeek...'
            : this.inputEl.value.length < 3 
                ? 'Type at least 3 characters to search'
                : 'No games found';
                
        const emptyStateEl = this.resultContainerEl.createDiv('no-results');
        emptyStateEl.setText(text);
    }
}
