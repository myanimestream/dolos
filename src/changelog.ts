/**
 * The changelog of Dolos.
 * This file only contains the changelog itself.
 * You can find the display logic in [[ChangelogDisplay]]
 */

/**
 * Type alias for a changelog entry.
 */
type Change = string;

interface Changelog {
    get(version: string): Change[];

    entries(): IterableIterator<[string, Change[]]>
}

/**
 * A mapping of a version to its changes.
 * This is done using a Map to make sure it can be iterated in the right order.
 */
const CHANGELOG: Changelog = new Map([
    ["0.2.0", [
        `Show notifications for new episodes. Hey, read it again, THIS IS HUGE!`
    ]],
    ["0.1.1", [
        `Firefox Bugs have been fixed which means that it's now on the same level as the Chrome extension.`,
        `If Dolos doesn't know how many episodes there are, it will just hope for the best and continue to the next episode anyway.`,
        `Oh and while we're at it, Dolos now respects the **auto next** setting`
    ]],
    ["0.1.0", [
        `Error reporting is now beautiful (I... yes. Just accept it)`,
        `Feel like Dolos didn't choose the correct Anime? Now **you can pick it yourself!**`,
        `Handling the case of there being no streams to play. *RIP in advance!*`,
        `**Kitsu**: ContinueWatching button updates with episodes watched.`,
        `**Kitsu**: Fixed issues related to Dolos not being able to retrieve the Anime from Kitsu`,
        `**MyAnimeList**: Moved the Continue button to the left, because let's be honest, that's where it belongs`
    ]],
    ["0.0.12", [
        `Showing a warning when marking episode as (un)watched failed`,
        `Continue watching button`,
        `Opening changelog directly when there's a new version`
    ]],
    ["0.0.11", [
        `Fixed Popup for Firefox`,
        `Feedback option is now somewhat viable`
    ]],
    ["0.0.10", [
        `This version only served as a placeholder to fix the broken version of \`0.0.9\` that was *accidentally* deployed. Way to start a new year, eh?`
    ]],
    ["0.0.9", [
        `Added a button to manually mark an episode as watched/unwatched`,
        `Fixed a bug which would render Dolos unable to update the progress on Kitsu`,
        `Fixed a similar bug for MyAnimeList which would break setting the progress on mobile`,
        `Theme selection for website has been fixed`
    ]],
    ["0.0.8", [
        `Fixed being unable to change embedded player`,
        `MyAnimeList Mobile support`
    ]],
    ["0.0.7", [
        `Fixed skip buttons not working on Kitsu`,
        `Fixed loading animation not showing properly`
    ]],
    ["0.0.6", [
        `Embedded Players no longer reload upon opening the selection menu`,
        `Highlighting new version`,
    ]],
    ["0.0.5", [
        `Fixed styling issue with player which would lead to ugly borders`,
        `Added button to player to switch between dolos player (if possible) and embedded players`
    ]],
    ["0.0.4", [
        `Added this changelog. *Oh and I won't translate this to other languages so you may f*ck right off!*`,
        `**Embed selection** for episodes without direct streams`,
        `Automatic Anime **progress update**`,
    ]]
]) as Changelog;

export default CHANGELOG;