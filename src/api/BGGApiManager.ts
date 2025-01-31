// src/api/BGGApiManager.ts
import { requestUrl, RequestUrlResponse } from 'obsidian';
import { BGGCache } from './BGGCache';

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

export interface RequestQueueItem {
    url: string;
    resolve: (value: any) => void;
    reject: (error: any) => void;
    retries: number;
}

export class BGGApiManager {
    private readonly baseUrl = 'https://api.geekdo.com/xmlapi2';
    private readonly minRequestInterval = 2000; // 2 seconds between requests
    private readonly maxRetries = 3;
    private readonly retryDelay = 4000; // 4 seconds
    private requestQueue: RequestQueueItem[] = [];
    private isProcessingQueue = false;
    private lastRequestTime = 0;
    private cache: BGGCache;
    
    constructor() {
        this.cache = new BGGCache();
    }

    private async processQueue() {
        if (this.isProcessingQueue || this.requestQueue.length === 0) {
            return;
        }

        this.isProcessingQueue = true;

        while (this.requestQueue.length > 0) {
            const currentTime = Date.now();
            const timeSinceLastRequest = currentTime - this.lastRequestTime;

            if (timeSinceLastRequest < this.minRequestInterval) {
                await new Promise(resolve => 
                    setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
                );
            }

            const request = this.requestQueue[0];
            
            try {
                const response = await this.makeRequest(request.url);
                
                // Handle 202 status (request queued by BGG)
                if (response.status === 202) {
                    if (request.retries < this.maxRetries) {
                        request.retries++;
                        // Move to end of queue
                        this.requestQueue.push(this.requestQueue.shift()!);
                        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                        continue;
                    } else {
                        throw new Error('Max retries exceeded for queued request');
                    }
                }

                this.requestQueue.shift();
                request.resolve(response);

            } catch (error) {
                // Handle rate limit (429) or other errors
                if (error.status === 429) {
                    if (request.retries < this.maxRetries) {
                        request.retries++;
                        this.requestQueue.push(this.requestQueue.shift()!);
                        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                        continue;
                    }
                }
                
                this.requestQueue.shift();
                request.reject(error);
            }

            this.lastRequestTime = Date.now();
        }

        this.isProcessingQueue = false;
    }

    private async makeRequest(url: string): Promise<RequestUrlResponse> {
        return requestUrl({
            url,
            method: 'GET',
            headers: {
                'Accept': 'application/xml',
                'User-Agent': 'Obsidian-BGG-Plugin/1.0'
            }
        });
    }

    private enqueueRequest(url: string): Promise<RequestUrlResponse> {
        return new Promise((resolve, reject) => {
            this.requestQueue.push({
                url,
                resolve,
                reject,
                retries: 0
            });
            
            if (!this.isProcessingQueue) {
                this.processQueue();
            }
        });
    }

    async searchGames(query: string): Promise<BGGSearchResult[]> {
        // Check cache first
        const cachedResults = this.cache.getSearchResults(query);
        if (cachedResults) {
            return cachedResults;
        }

        try {
            const url = `${this.baseUrl}/search?query=${encodeURIComponent(query)}&type=boardgame`;
            const response = await this.enqueueRequest(url);
            
            if (response.status !== 200) {
                throw new Error('Search request failed');
            }

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(response.text, 'text/xml');
            const items = xmlDoc.getElementsByTagName('item');
            const results: BGGSearchResult[] = [];

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                const nameEl = item.getElementsByTagName('name')[0];
                const yearPublishedEl = item.getElementsByTagName('yearpublished')[0];
                
                const gameId = item.getAttribute('id') || '';
                
                try {
                    // Get additional details for each game
                    const details = await this.getGameDetails(gameId);
                    
                    results.push({
                        id: gameId,
                        name: nameEl?.getAttribute('value') || '',
                        yearPublished: yearPublishedEl?.getAttribute('value') || '',
                        type: item.getAttribute('type') || '',
                        thumbnail: details.thumbnail,
                        minPlayers: details.minPlayers,
                        maxPlayers: details.maxPlayers,
                        playingTime: details.playingTime
                    });
                } catch (error) {
                    console.error(`Error fetching details for game ${gameId}:`, error);
                }
            }

            this.cache.setSearchResults(query, results);
            return results;
 
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

    private sanitizeText(text: string): string {
        return text
            .replace(/&#10;/g, '\n')     // Newlines
            .replace(/&mdash;/g, '—')     // Em dash
            .replace(/&ndash;/g, '–')     // En dash
            .replace(/&quot;/g, '"')      // Quotes
            .replace(/&amp;/g, '&')       // Ampersand
            .replace(/&lt;/g, '<')        // Less than
            .replace(/&gt;/g, '>')        // Greater than
            .replace(/&nbsp;/g, ' ')      // Non-breaking space
            .replace(/\n\s+\n/g, '\n\n')  // Remove extra spacing between paragraphs
            .trim();
    }

    async getGameDetails(gameId: string): Promise<BGGGameDetails> {
        try {
            const response = await requestUrl({
                url: `${this.baseUrl}/thing?id=${gameId}&stats=1`,  // Include stats for rating and polls
                method: 'GET'
            });
            
            if (response.status !== 200) {
                throw new Error('Network response was not ok');
            }
            
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(response.text, 'text/xml');
            
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

            return {
                id: gameId,
                name: this.sanitizeText(nameEl?.getAttribute('value') || ''),
                yearPublished: yearPublishedEl?.getAttribute('value') || undefined,
                description: this.sanitizeText(descriptionEl?.textContent || ''),
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
