import { Notice } from 'obsidian';
import BoardGamePlugin from '../main';

export class UIManager {
    private plugin: BoardGamePlugin;
    private statusBarItem: HTMLElement;

    constructor(plugin: BoardGamePlugin) {
        this.plugin = plugin;
    }

    async initialize() {
        // Add ribbon icon
        const ribbonIconEl = this.plugin.addRibbonIcon(
            'dice',
            'Board Game Tracker',
            this.handleRibbonClick.bind(this)
        );
        ribbonIconEl.addClass('boardgame-plugin-ribbon');

        // Add status bar
        this.statusBarItem = this.plugin.addStatusBarItem();
        this.updateStatusBar();
    }

    private handleRibbonClick() {
        new Notice('Board Game Tracker is ready!');
    }

    private updateStatusBar() {
        this.statusBarItem.setText('🎲 Ready to track games');
    }

    cleanup() {
        // Cleanup UI elements
    }
}

