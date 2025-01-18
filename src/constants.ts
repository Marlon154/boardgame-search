export enum DefaultFrontmatterKeyType {
  snakeCase = 'Snake Case',
  camelCase = 'Camel Case',
}

// BGGLOGOIMGAEURL = 'https://cf.geekdo-images.com/HZy35cmzmmyV9BarSuk6ug__imagepage/img/FOGhR5OgYhcg-1jdqT5i5W8Xfbg=/fit-in/900x600/filters:no_upscale():strip_icc()/pic7779581.png';
export const BGGLOGOBASE64 = 'data:image/png;base64,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';

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
{% if game.suggestedPlayerCount %}
{% if game.suggestedPlayerCount.best %}- {{ game.suggestedPlayerCount.best }}{% endif %}

{% if game.suggestedPlayerCount.best %}- {{ game.suggestedPlayerCount.recommended }}{% endif %}{% endif %}


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
