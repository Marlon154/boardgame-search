import * as nunjucks from 'nunjucks';
import { moment, TFile, normalizePath } from 'obsidian';
import type BoardGamePlugin from '../main';
import { DEFAULT_TEMPLATE } from '../constants';
import { PersistExtension } from './PersistExtension';

const MARKDOWN_EXTENSION = '.md';

export class TemplateManager {
    private env: nunjucks.Environment;
    private plugin: BoardGamePlugin;

    constructor(plugin: BoardGamePlugin) {
        this.plugin = plugin;
        
        // Configure nunjucks environment
        this.env = nunjucks.configure({ 
            autoescape: false,
            trimBlocks: true,
            lstripBlocks: true
        });
        
        this.setupFilters();
        this.setupExtensions();
    }

    private setupFilters(): void {
        // Date formatting filter
        this.env.addFilter('date', (str: string | Date, format: string) => {
            return moment(str).format(format);
        });

        // Number formatting filter
        this.env.addFilter('number', (num: number, decimals = 2) => {
            if (num === null || num === undefined) return '';
            return Number(num).toFixed(decimals);
        });

        // Default value filter with better type checking
        this.env.addFilter('default', (value: any, defaultValue: any) => {
            if (value === null || value === undefined || value === '') {
                return defaultValue;
            }
            return value;
        });

        // Join array with prefix/suffix
        this.env.addFilter('joinWith', (arr: any[], separator = ', ', prefix = '', suffix = '') => {
            if (!Array.isArray(arr)) return '';
            return prefix + arr.join(separator) + suffix;
        });

        // Convert to bullet list
        this.env.addFilter('bulletList', (items: string[]) => {
            if (!Array.isArray(items)) return '';
            return items.map(item => `- ${item}`).join('\n');
        });
    }

    private setupExtensions(): void {
        // Register persist extension (like Zotero Integration does)
        this.env.addExtension('PersistExtension', new PersistExtension());
    }

    /**
     * Extract persisted sections from an existing file
     * Uses the same marker pattern as Zotero Integration: %% begin key %% ... %% end key %%
     */
    private async extractPersistedSections(filePath: string): Promise<Record<string, string>> {
        const persistedSections: Record<string, string> = {};
        
        try {
            const file = this.plugin.app.vault.getAbstractFileByPath(filePath);
            if (!file || !(file instanceof TFile)) {
                return persistedSections;
            }

            const content = await this.plugin.app.vault.read(file);
            
            // Match persist blocks using Obsidian comment markers (like Zotero does)
            // Pattern: %% begin key %%...content...%% end key %%
            const persistRegex = /%% begin (\w+) %%([\s\S]*?)%% end \1 %%/g;
            
            let match;
            while ((match = persistRegex.exec(content)) !== null) {
                const key = match[1];
                const value = match[2].trim();
                persistedSections[key] = value;
            }
        } catch (error) {
            console.error('Error extracting persisted sections:', error);
        }

        return persistedSections;
    }

    public async loadAndRender(templatePath: string | null, context: any): Promise<string> {
        let template = DEFAULT_TEMPLATE;
        
        // Only try to load custom template if path is provided
        if (templatePath && templatePath.trim().length > 0) {
            try {
                let abstractFile = this.plugin.app.vault.getAbstractFileByPath(templatePath);
                
                // If not found and path has .md extension, try without it
                if (!abstractFile && templatePath.endsWith(MARKDOWN_EXTENSION)) {
                    const pathWithoutExtension = templatePath.substring(0, templatePath.length - MARKDOWN_EXTENSION.length);
                    abstractFile = this.plugin.app.vault.getAbstractFileByPath(pathWithoutExtension);
                }
                
                // If not found and path doesn't have .md extension, try with it
                if (!abstractFile && !templatePath.endsWith(MARKDOWN_EXTENSION)) {
                    const pathWithExtension = templatePath + MARKDOWN_EXTENSION;
                    abstractFile = this.plugin.app.vault.getAbstractFileByPath(pathWithExtension);
                }
                
                if (abstractFile && abstractFile instanceof TFile) {
                    template = await this.plugin.app.vault.read(abstractFile);
                } else {
                    console.log('Template file not found or is not a file, using default template');
                }
            } catch (error) {
                console.error('Error loading template file:', error);
                console.log('Falling back to default template');
            }
        }

        // Extract persisted sections from existing file if it exists
        // This allows content in {% persist %} blocks to be preserved on re-import
        try {
            if (context.game && context.game.name) {
                const fileName = context.game.name.replace(/[\\/:*?"<>|]/g, '-');
                const folderPath = this.plugin.settings.folder || '';
                const filePath = normalizePath(folderPath ? `${folderPath}/${fileName}.md` : `${fileName}.md`);
                
                const persistedSections = await this.extractPersistedSections(filePath);
                
                // Add persisted sections to context for the PersistExtension to use
                context.persistedSections = persistedSections;
            }
        } catch (error) {
            console.error('Error extracting persisted sections:', error);
            // Continue with empty persisted sections
            context.persistedSections = {};
        }
    
        try {
            return this.env.renderString(template, context);
        } catch (error) {
            console.error('Template render error:', error);
            throw new Error(`Template render error: ${error.message}`);
        }
    }
}
