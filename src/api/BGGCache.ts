// src/api/BGGCache.ts
import { BGGSearchResult } from './BGGApiManager';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    exactQuery: boolean;
}

interface SearchCache {
    [query: string]: CacheEntry<BGGSearchResult[]>;
}

export class BGGCache {
    private searchCache: SearchCache = {};
    private readonly searchTTL: number;  // Time to live for search results in ms
    private readonly maxCacheSize: number;
    
    constructor(options: {
        searchTTL?: number,     // Default 15 minutes
        maxCacheSize?: number   // Default 100 entries
    } = {}) {
        this.searchTTL = options.searchTTL || 15 * 60 * 1000;
        this.maxCacheSize = options.maxCacheSize || 256;
    }

    getSearchResults(query: string, exactSearch: boolean): BGGSearchResult[] | null {
        const normalizedQuery = this.normalizeQuery(query);
        const entry = this.searchCache[normalizedQuery];
        
        if (!entry) {
            return this.findPartialMatch(normalizedQuery);
        }

        if (this.isExpired(entry.timestamp)) {
            delete this.searchCache[normalizedQuery];
            return null;
        }

        if (entry.exactQuery === exactSearch) {
            return entry.data;
        }

        return null;
    }

    private findPartialMatch(query: string): BGGSearchResult[] | null {
        // Check if we have results for a similar query
        for (const [cachedQuery, entry] of Object.entries(this.searchCache)) {
            if (!this.isExpired(entry.timestamp)) {
                // If the current query is contained within a cached query
                // and the cached query is not too much longer
                if (cachedQuery.includes(query) && 
                    cachedQuery.length - query.length <= 3) {
                    // Filter the cached results to match the current query
                    return entry.data.filter(game => 
                        game.name.toLowerCase().includes(query.toLowerCase())
                    );
                }
            }
        }
        return null;
    }

    setSearchResults(query: string, results: BGGSearchResult[], exactSearch: boolean): void {
        const normalizedQuery = this.normalizeQuery(query);
        
        // Enforce cache size limit
        if (Object.keys(this.searchCache).length >= this.maxCacheSize) {
            this.pruneCache();
        }
        
        this.searchCache[normalizedQuery] = {
            data: results,
            timestamp: Date.now(),
            exactQuery: exactSearch
        };
    }

    private normalizeQuery(query: string): string {
        return query.toLowerCase().trim();
    }

    private isExpired(timestamp: number): boolean {
        return Date.now() - timestamp > this.searchTTL;
    }

    private pruneCache(): void {
        const now = Date.now();
        
        // Remove expired entries
        for (const [key, entry] of Object.entries(this.searchCache)) {
            if (now - entry.timestamp > this.searchTTL) {
                delete this.searchCache[key];
            }
        }
        
        // If still too large, remove oldest entries
        const entries = Object.entries(this.searchCache);
        if (entries.length >= this.maxCacheSize) {
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            const toRemove = entries.length - this.maxCacheSize + 10; // Remove extra to avoid frequent pruning
            entries.slice(0, toRemove).forEach(([key]) => delete this.searchCache[key]);
        }
    }

    clear(): void {
        this.searchCache = {};
    }
}
