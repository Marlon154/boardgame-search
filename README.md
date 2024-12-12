This is work in progress

# Obsidian Board Game Tracker

Track and manage your board game collection, play sessions, and statistics directly within Obsidian.

## Features

### 🎲 Board Game Integration
- Search and import board games from BoardGameGeek (BGG)
- Automatically create game entries with detailed metadata
- Download and save game thumbnails

### 📊 Session Tracking
- Record individual game play sessions
- Track players, winners, play time, and notes
- Append session details to game entries

### 🔍 Search and Discovery
- Quick search of board games
- Preview game details before creating entries
- Keyboard navigation in search results

### 🛠️ Customizable Settings
- Configure file location for game entries
- Customize file name format
- Control image saving preferences
- Toggle session tracking features

## Installation

### From Obsidian Plugin Store
1. Open Obsidian
2. Go to Settings → Community plugins
3. Enable Community Plugins
4. Click "Browse" and search for "Board Game Tracker"
5. Click "Install"

### Manual Installation
1. Download the latest release from GitHub
2. Create a folder `your-vault/.obsidian/plugins/board-game-tracker`
3. Copy `main.js`, `manifest.json`, and `styles.css` into the folder
4. Restart Obsidian and enable the plugin

## Usage

### Searching for Games
- Click the dice icon in the ribbon
- Type the game name in the search bar
- Browse and select a game
- Choose to create a game entry or start a game session

### Creating Game Entries
- Game entries include:
  - Game title
  - BGG ID
  - Player count
  - Play time
  - Year published
  - Rating
  - Optional thumbnail image

### Recording Game Sessions
- Track each play session with details like:
  - Number of players
  - Winner
  - Play time
  - Session notes

### Customization
Customize the plugin in Settings:
- Set folder for game entries
- Configure file name format
- Toggle image saving
- Enable/disable session tracking features

## Commands

- `Search BoardGameGeek`: Open BGG search modal
- `Quick Add Game`: Quickly add a new game entry
- `Create Game Session`: Start a new game session

## Example Workflow
1. Click "Search BoardGameGeek"
2. Search "Catan"
3. Select the game
4. Plugin creates a detailed game entry
5. Record play session details
6. Session notes are appended to the game entry

## Contributing
- Report issues on GitHub
- Submit pull requests
- Share feature requests

## Support
If you find this plugin useful, consider:
- Leaving a review
- Contributing to the project
- Buying me a coffee ☕

## License
MIT License

## Acknowledgments
- Inspired by board game enthusiasts
- Uses BoardGameGeek XML API 2
- Built for the Obsidian community

