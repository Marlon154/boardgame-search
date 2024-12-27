// src/api/BGGApiManager.ts

export interface PollResult {
    value: string;
    votes: number;
}

export interface PlayerCountVote {
    playerCount: string;
    votes: { [key: string]: number };
    total: number;
}

export interface PlayerAgePoll {
    results: PollResult[];
    totalVotes: number;
}

export interface LanguageDependencePoll {
    results: PollResult[];
    totalVotes: number;
}

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
    minPlayTime?: number;
    maxPlayTime?: number;   
    minAge?: number;
    rating?: number;
    weight?: number;
    playerCountPoll: PlayerCountVote[];
    suggestedPlayerCount?: {
        best: string;
        recommended: string;
    };
    playerAgePoll: PlayerAgePoll;
    languageDependencePoll: LanguageDependencePoll;
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

    private parsePlayerCountPoll(pollEl: Element): PlayerCountVote[] {
        const results = pollEl.getElementsByTagName('results');
        const votes: PlayerCountVote[] = [];

        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            const playerCount = result.getAttribute('numplayers') || '';
            const voteResults = result.getElementsByTagName('result');
            const voteMap: { [key: string]: number } = {};
            let totalVotes = 0;

            // Parse all vote types dynamically
            for (let j = 0; j < voteResults.length; j++) {
                const vote = voteResults[j];
                const voteType = vote.getAttribute('value') || '';
                const numVotes = parseInt(vote.getAttribute('numvotes') || '0');
                voteMap[voteType] = numVotes;
                totalVotes += numVotes;
            }

            votes.push({
                playerCount,
                votes: voteMap,
                total: totalVotes
            });
        }
        return votes;
    }


    private parsePlayerAgePoll(pollEl: Element): PlayerAgePoll {
        const resultsEl = pollEl.getElementsByTagName('results')[0];
        const results: PollResult[] = [];
        let totalVotes = 0;

        if (resultsEl) {
            const voteElements = resultsEl.getElementsByTagName('result');
            for (let i = 0; i < voteElements.length; i++) {
                const vote = voteElements[i];
                const value = vote.getAttribute('value') || '';
                const numVotes = parseInt(vote.getAttribute('numvotes') || '0');
                totalVotes += numVotes;
                
                if (numVotes > 0) {
                    results.push({
                        value,
                        votes: numVotes
                    });
                }
            }
        }

        return {
            results,
            totalVotes
        };
    }

    private parseLanguageDependencePoll(pollEl: Element): LanguageDependencePoll {
        const resultsEl = pollEl.getElementsByTagName('results')[0];
        const results: PollResult[] = [];
        let totalVotes = 0;

        if (resultsEl) {
            const voteElements = resultsEl.getElementsByTagName('result');
            for (let i = 0; i < voteElements.length; i++) {
                const vote = voteElements[i];
                const value = vote.getAttribute('value') || '';
                const numVotes = parseInt(vote.getAttribute('numvotes') || '0');
                totalVotes += numVotes;
                
                if (numVotes > 0) {
                    results.push({
                        value,
                        votes: numVotes
                    });
                }
            }
        }

        return {
            results,
            totalVotes
        };
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
            const minPlayingTimeEl = item.getElementsByTagName('minplaytime')[0];
            const maxPlayingTimeEl = item.getElementsByTagName('maxplaytime')[0];
            const minAgeEl = item.getElementsByTagName('minage')[0];
            const yearPublishedEl = item.getElementsByTagName('yearpublished')[0];
            const statisticsEl = item.getElementsByTagName('statistics')[0];
            const ratingEl = statisticsEl?.getElementsByTagName('average')[0];

            // Parse polls
            const polls = item.getElementsByTagName('poll');
            let playerCountPoll;
            let playerAgePoll;
            let languageDependencePoll;
            let suggestedPlayerCount;

            for (let i = 0; i < polls.length; i++) {
                const poll = polls[i];
                const name = poll.getAttribute('name');
                
                if (name === 'suggested_numplayers') {
                    playerCountPoll = this.parsePlayerCountPoll(poll);
                } else if (name === 'suggested_playerage') {
                    playerAgePoll = this.parsePlayerAgePoll(poll);
                } else if (name === 'language_dependence') {
                    languageDependencePoll = this.parseLanguageDependencePoll(poll);
                }
            }

            // Get suggested player count summary
            const pollSummary = item.getElementsByTagName('poll-summary')[0];
            if (pollSummary) {
                const bestWith = pollSummary.querySelector('result[name="bestwith"]')?.getAttribute('value');
                const recommendedWith = pollSummary.querySelector('result[name="recommmendedwith"]')?.getAttribute('value');
                suggestedPlayerCount = {
                    best: bestWith || '',
                    recommended: recommendedWith || ''
                };
            }
            
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
                yearPublished: yearPublishedEl?.getAttribute('value') || undefined,
                description: sanitizedDescription,
                image: imageEl?.textContent || '',
                thumbnail: thumbnailEl?.textContent || '',
                minPlayers: parseInt(minPlayersEl?.getAttribute('value') || '0'),
                maxPlayers: parseInt(maxPlayersEl?.getAttribute('value') || '0'),
                playingTime: parseInt(playingTimeEl?.getAttribute('value') || '0'),
                minPlayTime: parseInt(minPlayingTimeEl?.getAttribute('value') || '0'),
                maxPlayTime: parseInt(maxPlayingTimeEl?.getAttribute('value') || '0'),
                minAge: parseInt(minAgeEl?.getAttribute('value') || '0'),
                rating: parseFloat(ratingEl?.getAttribute('value') || '0'),
                playerCountPoll: playerCountPoll || [],
                suggestedPlayerCount,
                playerAgePoll: playerAgePoll || { results: [], totalVotes: 0 },
                languageDependencePoll: languageDependencePoll || { results: [], totalVotes: 0 }
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
