# Board Game Search

Track and manage your board game collection directly within Obsidian.

<img src="https://raw.githubusercontent.com/Marlon154/obsidian-boardgame-plugin/main/docs/search-screenshot.png" alt="A screenshot show the search for boardgames.">

## Features

### 🎲 Board Game Integration

- Search and import board games from [BoardGameGeek](https://boardgamegeek.com/) (BGG)
- Automatically create game entries with detailed metadata
- Download and save game cover images

#### Image download quality

Images are downloaded and stored in different resolutions to optimize for various use cases.
Here is an example comparison of the different image sizes and their characteristics:

| Version   | Dimensions | File Size | Percentage |
|-----------|------------|-----------|------------|
| Thumbnail | 95 x 150   | 3.4 KB    | 11%        |
| Medium    | 244 x 385  | 14.1 KB   | 47%        |
| Full      | 488 x 771  | 29.9 KB   | 100%       |

### 📊 Session Tracking

Work in progress
~~- Record individual game play sessions~~
~~- Track players, winners, play time, and notes~~
~~- Append session details to game entries~~

### 🛠️ Customizable Settings

- Configure file location for game entries
- Customize file name format
- Control image saving preferences
~~- Toggle session tracking features~~

## Installation

### From Obsidian Plugin Store

1. Open Obsidian
2. Go to Settings → Community plugins
3. Enable Community Plugins
4. Click "Browse" and search for "Boardgame Search"
5. Click "Install" and then "Enable"

### Manual Installation

1. Download the latest release from GitHub
2. Create a folder `your-vault/.obsidian/plugins/obsidian-boardgame-plugin`
3. Copy `main.js`, `manifest.json`, and `styles.css` into the folder or just extract and move the zip
4. Enable the plugin in Obsidian

## Usage

### Searching for Games

- Click the dice icon in the ribbon
- Type the game name in the search bar
- Browse and select a game
- Choose to create a game entry or start a game session
or use the command `Search BoardGameGeek`

### Creating Game Entries

- Game entries include:
  - Game title
  - BGG ID
  - Player count
  - Play time
  - Year published
  - Rating
  - Optional thumbnail image

## Example Workflow

1. Click "Search BoardGameGeek"
2. Search "Catan"
3. Select the game
4. Plugin creates a detailed game entry

### 📈 Statistics and Visualization

- Support for [Obsidian Charts plugin](https://github.com/phibr0/obsidian-charts)
- Visualize player count data
- Age recommendation statistics
- Language dependency information

## Templating

The plugin uses Nunjucks templating for customizable game entries. Access available template data using the Data Explorer command in Obsidian.

### Available Template Variables

```markdown
game:
  name: string
  id: string
  minPlayers: number
  maxPlayers: number
  playTime: number
  yearPublished: string
  rating: number
  image: string
  description: string
  suggestedPlayerCount:
    best: string
    recommended: string
  playerCountPoll: Array
  playerAgePoll: object
  languageDependencePoll: object

useCharts: boolean
chartWidth: string
useLocalImages: boolean
date: Date
```

### Example Template

```markdown
## {{game.name}}

### Overview
{% if game.image %}
{% if useLocalImages %}
![[{{ game.image }}]]
{% else %}
![{{ game.name }}]({{ game.image }})
{% endif %}
{% endif %}

### Game Details
- **Min Players:** {{ game.minPlayers | default('Unknown') }}
- **Max Players:** {{ game.maxPlayers | default('Unknown') }}
- **Play Time:** {{ game.playingTime | default('Unknown') }}{% if game.playingTime %} minutes{% endif %}
- **Year Published:** {{ game.yearPublished | default('Unknown') }}
- **BGG Rating:** {{ game.rating | number(1) | default('N/A') }}{% if game.rating %}/10{% endif %}

### Notes
{% persist "notes" %}
Add your personal notes here - this section won't be overwritten on reimport
{% endpersist %}
```

### Persistent Sections

Use the `persist` tag to create sections that won't be overwritten on reimport:

```markdown
{% persist "section-name" %}
Your persistent content here
{% endpersist %}
```

### Charts Support

If you have the Obsidian Charts plugin installed, enable chart support in settings to visualize data:

```markdown
{% if useCharts %}
^playerCountData

\`\`\`chart
type: bar
id: playerCountData
layout: rows
width: {{ chartWidth }}
legend: true
title: Player Count Votes
beginAtZero: true
\`\`\`
{% endif %}
```

## Example Overview

Here is an example for a collection, which uses:

- [Dataview](https://blacksmithgu.github.io/obsidian-dataview/)
- [Meta Bind](https://github.com/mProjectsCode/obsidian-meta-bind-plugin)
- [Minimal Theme](https://github.com/kepano/obsidian-minimal)

Code:
````
---
notetype: database
cssclasses:
  - cards
  - cards-2-3
  - cards-cover
  - table-max
  - table-nowrap
---

```meta-bind-button
label: New Game
icon: ""
hidden: false
class: ""
tooltip: ""
id: ""
style: default
actions:
  - type: command
    command: boardgame-search:search-bgg

```

```dataview
TABLE WITHOUT ID
	embed(link(meta(link(image)).path)) as "",
	link(file.link, title) as Title,
	ownership,
	choice(played, "✅", " - ") as Played
FROM #boardgame 
WHERE !contains(file.path, "templates")
SORT title ASC
```
````

<img src="https://raw.githubusercontent.com/Marlon154/obsidian-boardgame-plugin/main/docs/example_overview.png" alt="Overview over the board game collection.">


## Support

If you find this plugin useful, please consider a donation.

## Contributing

- Report issues on GitHub
- Submit pull requests

## Credits

This plugin uses the BoardGameGeek XML API 2 to fetch game data. All game information is provided by BoardGameGeek.

[![Powered by BoardGameGeek](https://cf.geekdo-images.com/HZy35cmzmmyV9BarSuk6ug__imagepage/img/FOGhR5OgYhcg-1jdqT5i5W8Xfbg=/fit-in/900x600/filters:no_upscale():strip_icc()/pic7779581.png)](https://boardgamegeek.com)

All game data is property of BoardGameGeek and its users. Usage of this plugin is subject to BoardGameGeek's [Terms of Service](https://boardgamegeek.com/terms) and XML API Terms of Use.

Built for the Obsidian community.
