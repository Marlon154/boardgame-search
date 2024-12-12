// src/api/BGGApiManager.ts
export interface BGGSearchResult {
    id: string;
    name: string;
    yearPublished?: string;
    type: string;
    thumbnail?: string;
    minPlayers?: number;
    maxPlayers?: number;
    playingTime?: number;
}

export interface BGGGameDetails {
    id: string;
    name: string;
    yearPublished?: string;
    description?: string;
    image?: string;
    thumbnail?: string;
    minPlayers?: number;
    maxPlayers?: number;
    playingTime?: number;
    minAge?: number;
    rating?: number;
    weight?: number;
}

export class BGGApiManager {
    private readonly baseUrl = 'https://api.geekdo.com/xmlapi2';
    
    constructor() {}

    async searchGames(query: string): Promise<BGGSearchResult[]> {
        try {
            const response = await fetch(`${this.baseUrl}/search?query=${encodeURIComponent(query)}&type=boardgame`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            const xmlText = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            
            const items = xmlDoc.getElementsByTagName('item');
            const results: BGGSearchResult[] = [];
            
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                const nameEl = item.getElementsByTagName('name')[0];
                const yearPublishedEl = item.getElementsByTagName('yearpublished')[0];
                
                results.push({
                    id: item.getAttribute('id') || '',
                    name: nameEl?.getAttribute('value') || '',
                    yearPublished: yearPublishedEl?.getAttribute('value') || undefined,
                    type: item.getAttribute('type') || ''
                });
            }
            
            // Get details for each game
            const detailedResults = await Promise.all(
                results.map(async (result) => {
                    try {
                        const details = await this.getGameDetails(result.id);
                        return {
                            ...result,
                            thumbnail: details.thumbnail,
                            minPlayers: details.minPlayers,
                            maxPlayers: details.maxPlayers,
                            playingTime: details.playingTime
                        };
                    } catch (error) {
                        console.error(`Error fetching details for game ${result.id}:`, error);
                        return result;
                    }
                })
            );
            
            return detailedResults;
        } catch (error) {
            console.error('Error searching BGG:', error);
            throw new Error('Failed to search BoardGameGeek');
        }
    }

    async getGameDetails(gameId: string): Promise<BGGGameDetails> {
        try {
            // Add stats=1 to get rating information
            const response = await fetch(`${this.baseUrl}/thing?id=${gameId}&stats=1`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            const xmlText = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            
            const item = xmlDoc.getElementsByTagName('item')[0];
            const nameEl = item.getElementsByTagName('name')[0];
            const descriptionEl = item.getElementsByTagName('description')[0];
            const imageEl = item.getElementsByTagName('image')[0];
            const thumbnailEl = item.getElementsByTagName('thumbnail')[0];
            const minPlayersEl = item.getElementsByTagName('minplayers')[0];
            const maxPlayersEl = item.getElementsByTagName('maxplayers')[0];
            const playingTimeEl = item.getElementsByTagName('playingtime')[0];
            const minAgeEl = item.getElementsByTagName('minage')[0];
            const statisticsEl = item.getElementsByTagName('statistics')[0];
            const ratingEl = statisticsEl?.getElementsByTagName('average')[0];
            
            // Sanitize HTML entities and format description
            const description = descriptionEl?.textContent || '';
            const sanitizedDescription = description
                .replace(/&#10;/g, '\n')
                .replace(/&quot;/g, '"')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/\n\s+\n/g, '\n\n')
                .trim();

            return {
                id: gameId,
                name: nameEl?.getAttribute('value') || '',
                description: sanitizedDescription,
                image: imageEl?.textContent || '',
                thumbnail: thumbnailEl?.textContent || '',
                minPlayers: parseInt(minPlayersEl?.getAttribute('value') || '0'),
                maxPlayers: parseInt(maxPlayersEl?.getAttribute('value') || '0'),
                playingTime: parseInt(playingTimeEl?.getAttribute('value') || '0'),
                minAge: parseInt(minAgeEl?.getAttribute('value') || '0'),
                rating: parseFloat(ratingEl?.getAttribute('value') || '0'),
            };
        } catch (error) {
            console.error('Error fetching game details:', error);
            throw new Error('Failed to fetch game details from BoardGameGeek');
        }
    }

    // Helper method to handle XML API throttling
    private async wait(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
