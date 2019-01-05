type Change = string;

interface Changelog {
    [version: string]: Change[];
}

const CHANGELOG: Changelog = {
    "0.0.12": [
        `Showing a warning when marking episode as (un)watched failed`,
        `Continue watching button`
    ],
    "0.0.11": [
        `Fixed Popup for Firefox`,
        `Feedback option is now somewhat viable`
    ],
    "0.0.10": [
        `This version only served as a placeholder to fix the broken version of \`0.0.9\` that was *accidentally* deployed. Way to start a new year, eh?`
    ],
    "0.0.9": [
        `Added a button to manually mark an episode as watched/unwatched`,
        `Fixed a bug which would render Dolos unable to update the progress on Kitsu`,
        `Fixed a similar bug for MyAnimeList which would break setting the progress on mobile`,
        `Theme selection for website has been fixed`
    ],
    "0.0.8": [
        `Fixed being unable to change embedded player`,
        `MyAnimeList Mobile support`
    ],
    "0.0.7": [
        `Fixed skip buttons not working on Kitsu`,
        `Fixed loading animation not showing properly`
    ],
    "0.0.6": [
        `Embedded Players no longer reload upon opening the selection menu`,
        `Highlighting new version`,
    ],
    "0.0.5": [
        `Fixed styling issue with player which would lead to ugly borders`,
        `Added button to player to switch between dolos player (if possible) and embedded players`
    ],
    "0.0.4": [
        `Added this changelog. *Oh and I won't translate this to other languages so you may f*ck right off!*`,
        `**Embed selection** for episodes without direct streams`,
        `Automatic Anime **progress update**`,
    ]
};

export default CHANGELOG;