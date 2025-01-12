import * as nunjucks from 'nunjucks';
import { moment, TFile } from 'obsidian';
import type BoardGamePlugin from '../main';
import { DEFAULT_TEMPLATE } from '../constants';


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

    public async loadAndRender(templatePath: string | null, context: any): Promise<string> {
        let template = DEFAULT_TEMPLATE;
        
        // Only try to load custom template if path is provided
        if (templatePath && templatePath.trim().length > 0) {
            try {
                const abstractFile = this.plugin.app.vault.getAbstractFileByPath(templatePath);
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
    
        try {
            return this.env.renderString(template, context);
        } catch (error) {
            console.error('Template render error:', error);
            throw new Error(`Template render error: ${error.message}`);
        }
    }
}
