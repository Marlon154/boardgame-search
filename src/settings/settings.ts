// src/settings/settings.ts
import { App, PluginSettingTab } from 'obsidian';
import BoardGamePlugin from '../main';

export enum DefaultFrontmatterKeyType {
  snakeCase = 'Snake Case',
  camelCase = 'Camel Case',
}

export enum ImageQuality {
  Thumbnail = 'thumbnail',
  FullSize = 'fullsize'
}

export interface BoardGamePluginSettings {
  folder: string;
  fileNameFormat: string;
  frontmatter: string;
  content: string;
  useDefaultFrontmatter: boolean;
  defaultFrontmatterKeyType: DefaultFrontmatterKeyType;
  templateFile: string;
  
  // Image settings
  showGameImageInSearch: boolean;
  enableImageSave: boolean;
  imagePath: string;
  imageQuality: ImageQuality;
  
  // General settings
  openPageOnCompletion: boolean;
  lastPlayedGame: string;
  overwriteExistingNote: boolean;

  // BGG Integration settings
  enableBGGIntegration: boolean;
  bggUsername: string;
  syncWithBGG: boolean;

  // Session tracking
  // enableSessionTracking: boolean;
  // enablePlayerTracking: boolean;
  // enableScoreTracking: boolean;
  // enablePlaytimeTracking: boolean;
  // enableWinnerTracking: boolean;

  // Chart settings
  useChartPlugin: boolean;
  chartWidth: string;
}

export const DEFAULT_SETTINGS: BoardGamePluginSettings = {
  // File and template settings
  folder: '',
  fileNameFormat: '{{gameName}}',
  frontmatter: '',
  content: '',
  useDefaultFrontmatter: true,
  defaultFrontmatterKeyType: DefaultFrontmatterKeyType.camelCase,
  templateFile: '',
  
  // Image settings
  showGameImageInSearch: true,
  enableImageSave: false,
  imagePath: 'Games/Images',
  imageQuality: ImageQuality.Thumbnail,
  
  // General settings
  openPageOnCompletion: true,
  lastPlayedGame: '',
  overwriteExistingNote: false,
  
  // BGG Integration
  enableBGGIntegration: true,
  bggUsername: '',
  syncWithBGG: false,

  // Session tracking - disabled by default
  // enableSessionTracking: false,
  // enablePlayerTracking: false,
  // enableScoreTracking: false,
  // enablePlaytimeTracking: false,
  // enableWinnerTracking: false,

  // Chart settings
  useChartPlugin: false,
  chartWidth: '80%',
};

// Format syntax for the file name format suggester
export const GAME_NAME_SYNTAX = '{{gameName}}';
export const DATE_SYNTAX = '{{date}}';
export const PLAYERS_SYNTAX = '{{players}}';
export const WINNER_SYNTAX = '{{winner}}';
export const SCORE_SYNTAX = '{{score}}';
export const PLAYTIME_SYNTAX = '{{playtime}}';
export const LOCATION_SYNTAX = '{{location}}';

// Regex patterns for suggestions
export const GAME_NAME_SYNTAX_SUGGEST_REGEX = /{{g?a?m?e?N?a?m?e?}?}?$/i;
export const DATE_SYNTAX_SUGGEST_REGEX = /{{d?a?t?e?}?}?$/i;
export const PLAYERS_SYNTAX_SUGGEST_REGEX = /{{p?l?a?y?e?r?s?}?}?$/i;
export const WINNER_SYNTAX_SUGGEST_REGEX = /{{w?i?n?n?e?r?}?}?$/i;
export const SCORE_SYNTAX_SUGGEST_REGEX = /{{s?c?o?r?e?}?}?$/i;
export const PLAYTIME_SYNTAX_SUGGEST_REGEX = /{{p?l?a?y?t?i?m?e?}?}?$/i;
export const LOCATION_SYNTAX_SUGGEST_REGEX = /{{l?o?c?a?t?i?o?n?}?}?$/i;
