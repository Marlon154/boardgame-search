export enum DefaultFrontmatterKeyType {
  snakeCase = 'Snake Case',
  camelCase = 'Camel Case',
}

export const BGGLOGOIMGAEURL = 'https://cf.geekdo-images.com/HZy35cmzmmyV9BarSuk6ug__imagepage/img/FOGhR5OgYhcg-1jdqT5i5W8Xfbg=/fit-in/900x600/filters:no_upscale():strip_icc()/pic7779581.png';

export const DEFAULT_TEMPLATE = `---
title: "{{ game.name }}"
bggId: {{ game.id }}
minPlayers: {{ game.minPlayers | default(0) }}
maxPlayers: {{ game.maxPlayers | default(0) }}
playTime: {{ game.playingTime | default(0) }}
year: {{ game.yearPublished | default('') }}
rating: {{ game.rating | number(1) | default('N/A') }}
image: {{ game.image }}
lastUpdated: {{ date | date('YYYY-MM-DD') }}
---

# {{ game.name }}

## Overview
{% if game.image -%}
{% if useLocalImages -%}
![[{{ game.image }}]]
{%- else -%}
![{{ game.name }}]({{ game.image }})
{%- endif -%}
{%- endif %}

## Game Details
- **Min Players:** {{ game.minPlayers | default('Unknown') }}
- **Max Players:** {{ game.maxPlayers | default('Unknown') }}
- **Play Time:** {{ game.playingTime | default('') }}
- **Year Published:** {{ game.yearPublished | default('') }}
- **BGG Rating:** {{ game.rating | number(1) | default('N/A') }}{% if game.rating %}/10{%- endif %}

## Description
{{ game.description | default('No description available.') }}

## Community Polls

### Player Count Information
{% if game.suggestedPlayerCount -%}
- {{ game.suggestedPlayerCount.best }}
- {{ game.suggestedPlayerCount.recommended }}
{%- endif %}

| Players | Best | Recommended | Not Recommended |
|---------|------|-------------|-----------------|
{% for vote in game.playerCountPoll %}
| {{ vote.playerCount }} | {{ vote.votes['Best'] | default(0) }} | {{ vote.votes['Recommended'] | default(0) }} | {{ vote.votes['Not Recommended'] | default(0) }} |
{% endfor %}

{%- if useCharts %}
^playerCountTable

\`\`\`chart
type: bar
id: playerCountTable
layout: rows
width: {{ chartWidth }}
legend: true
title: Player Count Votes
beginAtZero: true
\`\`\`
{%- endif %}

### Age Recommendation
Total votes: {{ game.playerAgePoll.totalVotes }}

| Age | Votes |
|-----|-------|
{% for result in game.playerAgePoll.results %}
| {{ result.value }} | {{ result.votes }} |
{% endfor %}

{% if useCharts %}
^ageTable

\`\`\`chart
type: bar
id: ageTable
layout: rows
width: {{ chartWidth }}
legend: true
beginAtZero: true
\`\`\`
{%- endif %}

### Language Dependency
Total votes: {{ game.languageDependencePoll.totalVotes }}

| Level | Votes |
|-------|-------|
{% for result in game.languageDependencePoll.results %}
| {{ result.value }} | {{ result.votes }} |
{% endfor %}

{% if useCharts %}
^languageTable

\`\`\`chart
type: bar
id: languageTable
layout: rows
width: {{ chartWidth }}
legend: true
beginAtZero: true
\`\`\`
{%- endif %}`;
