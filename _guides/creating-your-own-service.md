---
title: Creating your own Service
excerpt: Extending Dolos to support other sites.
---

## What is a "Service"?

A "service" is the abstract concept of an interface between the core
Dolos functionality and a website. Instead of rewriting everything from
scratch for every site we want to support there's only a *comparatively*
tiny amount of code to write thanks to services. The behaviour of Dolos
is standardised. It should work the same for every site, thus one only
needs to provide logic required to interact with the page to adapt to a
new site.

Adding a new Service is very easy in *most* cases.

Dolos already has two Services which may serve as good reference points.
There's the simple [MyAnimeList Service][docs-mal-service] and the more
complex [Kitsu Service][docs-kitsu-service].

## Example for [aniDB](https://anidb.net)

Instead of having to read my incoherent blabbering, let's instead take a
different approach and build our own little Service together, shall we?

Don't be afraid, it *probably* won't take that long and it's gonna be a
fun adventure for you and me.

> This guide is written for Dolos version
> [`0.3.0`](https://github.com/myanimestream/dolos/releases/tag/v0.3.0).
> If the current version of Dolos no longer matches this one I encourage
> you to extrapolate from this guide to the new version.

We're going to setup the page [anidb.net](https://anidb.net) to work
with Dolos. We're in luck, the page seems to be "static". What do I mean
by that? Well, [Kitsu](https://kitsu.io) for example uses the Ember
framework which makes it much more complex to handle. This page,
however, seems to be very generic without all that much Javascript
action going on. That's a good thing!

But enough talk for now, let's get started!

### Getting ready for development

If you haven't already, please read the
[Getting ready for development guide]({{ site.baseurl }}{% link
_guides/getting-ready-for-development.md %}). It guides you through
downloading the code, installing its dependencies, building the
extension and installing it.

From this point on it's assumed that you have **webpack running in watch
mode and the extension installed**.

### Adding files for the new Service

Before we get to the fun part, that is, writing code, we should first
setup the basic structure for the new service. Switch to the `src`
directory because that's where Dolos' code resides. Unless otherwise
specified we assume that we're in the `src` directory.

In this directory you'll find a folder called "services". This is a
special folder added in `v0.2.3` to group the different services in one
place. That's not the reason it's special though. It's special because
all folders inside of it are automatically compiled to a javascript file
with the same name in the `/dist/js` directory.

If you take a peek at the contents of the "services" folder you'll see
folders like "myanimelist" and "kitsu" which contain the services for
the respective sites.

As you might expect we're going to add a new folder to the bunch. Create
a new folder called `anidb` in the "services" folder and in it an empty
file `index.ts`. The `index.ts` is what's being used as an entry point
so it's what's being run when the user opens the aniDB website.

To check whether this works, let's put a little something in the index
file. If you're not already using one, now's probably a good time to
switch to an editor. Anything will do, really, but I recommend using
something like [Visual Studio Code](https://code.visualstudio.com/) or
[Atom](https://atom.io/) because working with the system's built-in text
editor won't bring you very far. Open the `index.ts` file you just
created and add something like:

```typescript
console.log("Hello World from Dolos on aniDB");
```

We will use this to check whether the code is actually being run.

Okay great, let's check whether it wo-... No! Don't even try it, of
course it won't work yet. The extension doesn't mysteriously know that
it should run the script when you visit the page. How could it? We need
to first tell it to be run. And if you take a look at the `/dist/js`
folder there's not even a file for it... What?

The reason for the absence of the file is that webpack doesn't notice
that there's a new service. To fix that you simply have to restart the
webpack watch service.

After it's done you should see an `anidb.js` file appear in `/dist/js`.

Now you might be tempted to try it out now but I need you to wait a
little longer, because even though now there's a Javascript file the
extension still doesn't know when to run it. We want to tell the
extension to run the `anidb.js` file whenever the user navigates to a
anidb.net site. To do this, open the `manifest.json` file found in the
`/dist` directory. In it you'll find the key `"content_scripts"` which
holds a list of objects.

Add the following entry to the list:

```json
{
    "matches": [
        "*://anidb.net/*"
    ],
    "js": [
        "js/anidb.js"
    ],
    "run_at": "document_end"
}
```

To give a brief overview of what this does:
- **matches** tells the browser *when* to run the script. In our case it
  should run for all anidb.net pages.
- **js** contains a list of javascript files to be run. We only want to
  run the `js/anidb.js` file.
- **run_at** tells the browser at what point it should run the code. If
  you're interested about this, you can
  [read about it here](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/content_scripts#run_at).

You might've noticed that there are multiple `manifest.json` files in
there. While it's not necessary right now, **please also add the entry
to the other files**!


**Now we're ready to give it a shot!** If you're using `npx web-ext run`
(Firefox) it should've already automatically reloaded the extension and
if you're using Chrome you need to manually reload the extension by
going to `chrome://extensions/` and pressing the reload button.

Open a new tab and go to [https://anidb.net](https://anidb.net). Open
the Web Console (Press F12 and switch to the console tab) and you should
see the beautiful "Hello World from Dolos on aniDB" text from before.

> If you don't see it, please make sure that webpack has rebuilt the
> Javascript and you've reloaded the extension!

#### Quick Recap because I've heard those are useful

- We created a new directory for our service called `anidb` in the
  `services` folder.
- Added an `index.ts` file to said folder with some debug code to check
  whether it works.
- Restarted webpack to make it compile our new service to the `/dist`
  directory,
- Edited the `manifest.json` files so that our file is being run when
  the user visits anidb.net.

Alright, it's been a journey. We're done... Well... at least somewhat
done. From now on we actually get to write some code. Isn't that nice?


### Writing the code for our new Service

Open the `index.ts` file again and start by removing the `console.info`
line. We know the code is being loaded, we don't need to test it any
more.

As I've already slightly touched upon in the introductory paragraph,
Dolos already does all of the heavy lifting for you, you only need to
write a shallow wrapper for Dolos to be able to interact with the page.
Dolos does this by exposing a bunch of
[abstract classes](https://www.typescriptlang.org/docs/handbook/classes.html#abstract-classes).
One of which is the [`Service`][docs-common-service] class. It doesn't
do very much, but it provides a good framework to work with. So let's
use it!

First, we need to import it in our file. To do that, add the following
line to the top of the file:

```typescript
import {Service} from "dolos/common";
```

> `dolos/common` contains a whole bunch of useful stuff and you'll see
> it a lot.

Create a class called `AniDB` which extends `Service`:

```typescript
export default class AniDB extends Service {
    // to be written
}
```

**Because we're going to use it in other modules be sure to export the
class as the default export.**


And there it is. Our own little Service, thanks for readin... - oh...
Have a look at the output of webpack:

```
TS2515: Non-abstract class 'AniDB' does not implement inherited abstract member 'route' from class 'Service'.
```

*You think I've overdone this bait-and-switch by now?*

What this error message is trying to tell us is that we haven't
implemented the necessary abstract methods yet - namely
[`route`][docs-common-service-route]. It's the only abstract method
[`Service`][docs-common-service] has. It takes a
[`URL`](https://developer.mozilla.org/en-US/docs/Web/API/URL) object for
the current location and should "route" based on it.

I think this is as good a point as any to tell you about the concept of
[`ServicePage`][docs-common-servicepage]s. A service page is Dolos'
abstract representation of a view (think: page) on the service (i.e. on
the website). The service itself doesn't really interact with the page
all that much, it passes it on to the service page. There are two
noteworthy service pages we're going to use.
[`AnimePage`][docs-common-pages-animepage] and
[`EpisodePage`][docs-common-pages-episodepage] but more on that later.

The [`route`][docs-common-service-route] method should delegate which
service page to show.

We need to find out how to determine which service page to show, but for
now let's just add the method to stop webpack from complaining. Place
the following code in the AniDB class body.

```typescript
async route(url: URL): Promise<void> {
}
```

Okay, now it compiles again, but how do we determine which service page
to show?

#### Routing

After browsing on [anidb.net](https://anidb.net) for a bit we can see,
that the url of an Anime looks something like this:
`https://anidb.net/perl-bin/animedb.pl?show=anime&aid=69`. The first
part always stays the same, but the query string looks very interesting.
it contains `show=anime` and `aid=69`. To detect whether we're on an
Anime page we can simply check whether the `show` parameter is "anime".

To do that, we can use the
[`URL.searchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URL/searchParams)
attribute of the url that was passed to the route method. It gives us
access to a
[`URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)
object which has the
[`URLSearchParams.get`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/get)
method. So `url.searchParams.get("show")` will give us the value of the
"show" parameter.

We can add a check to our route method for this:

```typescript
if (url.searchParams.get("show") === "anime") {
    // show anime service page
}
```

Actually "showing" (more like loading) the service page is very simple.
The [`Service`][docs-common-service] class exposes the method
[`showAnimePage`][docs-common-service-showanimepage] which does exactly
that.

> Side-note: Most of Dolos' code is async and thus returns Promises.
> Please use `async`/`await` syntax instead of operating on the promises
> directly.

All we have to do is add

```typescript
await this.showAnimePage();
```

to the if-clause and we're done.

The second route we would like to support is for specific episodes. I
mean, the entire premise of Dolos is showing episode streams so of
course we need to support that.

Looking at the url of an episode we can easily tell that, again, it uses
query parameters and has a "show" parameter which now has the value
"ep": `https://anidb.net/perl-bin/animedb.pl?show=ep&eid=440`

So should we just use `url.searchParams.get("show")` again to check
whether the value is "ep" this time? Well, we could... But this screams
like an opportunity to use a switch statement, doesn't it?

Let's refactor our logic to use a switch statement:

```typescript
switch (url.searchParams.get("show")) {
    case "anime":
        // load anime service page
        await this.showAnimePage();
        break;
    case "ep":
        // load episode service page
        await this.showEpisodePage();
        break;
}
```

Thankfully the service page exposes the method
[`showEpisodePage`][docs-common-service-showepisodepage] which is
analogous to the [`showAnimePage`][docs-common-service-showanimepage]
method from before.

At this point you should justifiably get suspicious of me pulling
another bait-and-switch. Fret not, this time I trust that you've already
sensed the problem. It builds, but something is clearly wrong because
we're never explicitly constructing an instance of `AniDB`, nor have we
coded any service page logic yet...

The problem surfaces when we try to construct an instance of our new
service. To start our service we need to call the
[`load`][docs-common-service-load] method on an instance. Since we want
to load it as soon as the code is executed, i.e. the anidb website is
loaded, we can add the following line to the end of the file:

```typescript
// create a new instance and call load on it
new AniDB().load();
```

But - oh, here we go. There's our problem: `Constructor of class
'Service' is protected and only accessible within the class
declaration.` This means that we can't just construct our Service like
that, because we need to provide our own constructor for the service.

Well, that's an easy fix, right? Just add a constructor which then calls
[`super`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/super).
But this is the point where our dreams come crashing down. When we look
at the signature of the [`constructor`][docs-common-service-constructor]
for a service we can see that it takes three arguments. A service id,
the anime page, and the episode page.

The first one is easy, it's used to uniquely identify the service. We're
going to use `anidb`.

The other arguments, however, require us to pass service page classes...
No wonder nothing complained so far. Well, we're going to write them
soon enough, for now let's just pass `undefined`.

TypeScript won't like that at all, so let's add `// @ts-ignore` above
the line to make TypeScript ignore it.

So the constructor should look like this:

```
constructor() {
    // @ts-ignore
    super("anidb", undefined, undefined);
}
```

Of course we can't expect this to do anything or even work for that
matter, but at least it builds and we can focus on writing the service
pages now.

Our code so far:

```typescript
// /src/services/anidb/index.ts:

import { Service } from "dolos/common";

export default class AniDB extends Service {
    // Override constructor for convenience.
    constructor() {
        // we haven't coded the service pages yet
        // @ts-ignore
        super("anidb", undefined, undefined);
    }

    async route(url: URL): Promise<void> {
        switch (url.searchParams.get("show")) {
            case "anime":
                // load anime service page
                await this.showAnimePage();
                break;
            case "ep":
                // load episode service page
                await this.showEpisodePage();
                break;
        }
    }
}

// load the service as soon as the code is executed.
new AniDB().load();
```

#### Anime Service Page

Because "a" comes before "e" we're going to start with writing the anime
service page. A service page extends the abstract class
[`ServicePage`][docs-common-servicepage]. As you can see it doesn't have
a very broad spectrum of methods. But we're not going to deal with it
directly anyway, because there's already a specific service page for
Anime service pages. It's called - you've guessed it -
[`AnimePage`][docs-common-pages-animepage]. *(If you've guessed
"AnimeServicePage" then you're already a lot smarter than I was when I
named it)*

All we need to do is create a class for anidb that extends
[`AnimePage`][docs-common-pages-animepage] and implements a few *cough*
**10** *cough* abstract methods. **NO, PLEASE COME BACK!** It's not as
bad as it sounds. These methods are really basic.

Okay, thanks for trusting me. Have a cookie or something...

Anyway, let's start by creating a new file in the `anidb` directory
called `anime.ts` and open it. To extend
[`AnimePage`][docs-common-pages-animepage] we have to get access to it
first. Import it using `import {AnimePage} from "dolos/common/pages";`.
Add a new class `AniDBAnimePage` which extends AnimePage and
default-export it:

```typescript
export default AniDBAnimePage extends AnimePage {
}
```

Upon saving you'll find a TON of errors from webpack. Most of them are
there because we haven't implemented the abstract methods yet, but
there's one error that isn't like the others: `TS2314: Generic type
'AnimePage<T>' requires 1 type argument(s).`

You see, the AnimePage class is a
[generic class](https://www.typescriptlang.org/docs/handbook/generics.html#generic-classes).
It takes the type of the Service it belongs to.

Import the AniDB service class from the index file: `import AniDB from
"./index";` and replace `extends AnimePage` with `extends
AnimePage<AniDB>`. Now it knows that this is a service page belonging to
AniDB.

Now it's time to implement the abstract methods. We need to implement
the following method signatures, but don't worry, we'll go over them one
by one:
- `async getAnimeIdentifier(): Promise<string | undefined>`
- `async getAnimeSearchQuery(): Promise<string | undefined>`
- `async getAnimeURL(): Promise<string | undefined>`
- `async getEpisodeURL(episodeIndex: number): Promise<string |
  undefined>`
- `async showEpisode(episodeIndex: number): Promise<boolean>`
- `async getEpisodeCount(): Promise<number | undefined>`
- `async canSetEpisodesWatched(): Promise<boolean>`
- `protected async _setEpisodesWatched(progress: number):
  Promise<boolean>`
- `protected async _getEpisodesWatched(): Promise<number | undefined>`
- `async injectAnimeStatusBar(statusBar: Element): Promise<void>`

But take a second to look at the names. It may look like a lot of
methods, but they really only do one specific thing, so most of them are
no longer than one line of code. That's easy, right?

Okay so here goes!

##### getAnimeIdentifier

This method should return a string that identifies the Anime. You don't
have to return something like the name of the Anime. Often you can
actually just use parts of the url (preferred). The goal here is to have
something very quickly that can be used to store information for an
Anime.

For aniDB this is easy. Next to the "show" parameter we've also seen
"aid" which presumably stands for anime id. We can just use that!

##### getAnimeSearchQuery

Return the search query that should be passed to the
[search endpoint of Grobber](https://grobber.docs.apiary.io/#reference/anime/anime/search-anime/).
I don't think there's a situation where you wouldn't just return the
title of the Anime, but who knows?

aniDB displays the title in a table cell on the right which we can
target using the selector `td.value > span[itemprop="name"]`.

##### getAnimeURL

You might think: "What the hell, why don't you just use location.href?"
Well, you can do that if you want, but it might lead to some problems
which will become apparent later on. It's a good idea to build the url
from scratch. We can do that by using the base url of an anime and
setting the show parameter to "anime" and the aid parameter to the anime
identifier from `getAnimeIdentifier`.

##### getEpisodeURL

This method should return the url for a given episode index. This is
relatively simple for most sites because the episodes have an url like
`/episode/5`. aniDB, instead, decided to express f*ck all in their urls.
It's just a number...

Because of this ~~questionable~~ decision we have take a different
approach. At the bottom of the page there's a table with all episodes in
it, we're going to add a helper function that parses this table:

```typescript
async getEpisodeURLs(): Promise<{ [key: string]: string }> {
    // get all episode links
    const epLinks = document.querySelectorAll(`#eplist > tbody > tr > td > a[itemprop="url"]`);

    const urls: { [key: string]: string } = {};

    for (const epLink of Array.from(epLinks)) {
        // get the url of the episode
        const url = (epLink as HTMLLinkElement).href;
        if (!url) continue;

        // get the episode text
        const epText = epLink.textContent;
        if (!epText) continue;

        const episode = epText.trim();
        urls[episode] = url;
    }

    return urls;
}
```

This returns an object which maps an episode number to its url.

We can use this in our actual implementation of `getEpisodeURL`:

```typescript
async getEpisodeURL(episodeIndex: number): Promise<string | undefined> {
    const episodes = await this.getEpisodeURLs();
    // get episode number from index and convert to string
    const episode = (episodeIndex + 1).toString();

    // return the url
    return episodes[episode];
}
```

> Dolos generally uses indices (i.e. starting from 0) to index episodes.
> Please stick to this convention!

##### showEpisode

Take the user to the given episode. In many cases this will just be
manipulating the url, but Kitsu, for example, can smoothly transition to
a different page. aniDB doesn't do anything fancy like that, so we can
just assign the url we get from `getEpisodeURL` to the location.

##### getEpisodeCount

Returns the amount of episodes the Anime has. aniDB makes this
relatively easy, it displays the episode count in a span tag with the
class `amountOfEpisodes`. Unless it's a movie, then it shows the text
"Movie" instead. Could be worse...

```typescript
async getEpisodeCount(): Promise<number | undefined> {
    const animeType = document.querySelector("div.pane.info tr.type > td.value");
    if (!animeType) return;

    // get the episode count. Not present for movies for example
    const episodeCount = animeType.querySelector(`span[itemprop="numberOfEpisodes"]`);
    if (episodeCount) return parseInt(episodeCount.innerHTML);

    // if it's a movie return 1
    if (animeType.innerHTML === "Movie") return 1;

    return undefined;
}
```

##### canSetEpisodesWatched

Indicates whether Dolos can keep track of the amount of episodes the
user has watched. This is usually true when the user is logged-in and
false otherwise. In this case we're just going to return false mainly
because I can't be bothered to actually create an account to test this.
The implementation of this is left as an exercise to the reader.

##### _setEpisodesWatched

Is used to set the amount of episodes the user has watched. It returns
whether the operation was successful. Since we're not doing this part we
can just return `false` again.

##### _getEpisodesWatched

Return the amount of episodes the user has already seen, or undefined.
We're going to return `undefined` here because again, not bothering with
this part.


##### injectAnimeStatusBar

THE FINAL METHOD, FINALLY! This method takes an
[`Element`](https://developer.mozilla.org/en-US/docs/Web/API/Element)
which it should add to the DOM somewhere. The element in question
happens to be the
[`AnimeStatusBar`][docs-common-components-anime-animestatusbar] which
consists of a continue watching and a subscribe button.

For aniDB there seems to be a lot of space just below the Anime poster,
so let's insert it there.

```typescript
async injectAnimeStatusBar(statusBar: Element): Promise<void> {
    const imgContainer = document.querySelector("div.image > div.container");
    if (!imgContainer) return;

    // insert the status bar after the image
    imgContainer.insertAdjacentElement("afterend", statusBar);
    this.injected(statusBar);
}
```

"But what is that last line exactly", I'm sure you're wondering. It's
simple, that last line is absolutely useless in this case. You see,
since Dolos supports dynamic pages which don't reload everything when
they're changing to a different page it has to make sure to remove its
elements so that they don't slowly fill-up the view because they're
never removed. For static pages like anidb.net this doesn't matter all
that much, because everything is reloaded when changing to a different
page, but it's still a good thing to do!


The entire implementation of the `anime.ts` file should looks like this:

```typescript
// /src/services/anidb/anime.ts:

import { AnimePage } from "dolos/common/pages";
import AniDB from "./index";

export default class AniDBAnimePage extends AnimePage<AniDB> {
    async persistentStore(key: string, value: any): Promise<void> {
        const prefix = await this.getAnimeIdentifier();
        key = `${prefix}-${key}`;

        localStorage.setItem(key, JSON.stringify(value));
    }

    async persistentLoad(key: string): Promise<any | null> {
        const prefix = await this.getAnimeIdentifier();
        key = `${prefix}-${key}`;

        const serVal = localStorage.getItem(key);
        if (serVal === null) return serVal;
        return JSON.parse(serVal);
    }

    async getAnimeIdentifier(): Promise<string | undefined> {
        // parse the current url into a URL object because
        // it's easier to work with and return the "aid" parameter.
        // searchParams.get returns null when the parameter doesn't exist,
        // but we need it to return undefined, thus the "|| undefined"
        return new URL(location.href).searchParams.get("aid") || undefined;
    }

    async getAnimeSearchQuery(): Promise<string | undefined> {
        // find the "Main Title" table cell.
        const mainTitle = document.querySelector(`td.value > span[itemprop="name"]`);
        // return its content if it was found or undefined otherwise
        return mainTitle ? mainTitle.innerHTML : undefined;
    }

    async getAnimeURL(): Promise<string | undefined> {
        // we know that our anime identifier is the aid parameter
        const animeID = await this.getAnimeIdentifier();
        // if aid is undefined, return undefined!
        if (!animeID) return;

        const url = new URL("https://anidb.net/perl-bin/animedb.pl");
        // add ?show=anime
        url.searchParams.set("show", "anime");
        // and &aid=<anime id>
        url.searchParams.set("aid", animeID);

        // return the string representation
        return url.href;
    }

    async getEpisodeURLs(): Promise<{ [key: string]: string }> {
        // if we already have it stored reuse that
        const storedURLs = await this.persistentLoad("episodeURLs");
        if (storedURLs) return storedURLs;

        // get all episode links
        const epLinks = document.querySelectorAll(`#eplist > tbody > tr > td > a[itemprop="url"]`);

        const urls: { [key: string]: string } = {};

        for (const epLink of Array.from(epLinks)) {
            // get the url of the episode
            const url = (epLink as HTMLLinkElement).href;
            if (!url) continue;

            const epText = epLink.textContent;
            if (!epText) continue;

            const episode = epText.trim();
            urls[episode] = url;
        }

        // store urls
        await this.persistentStore("episodeURLs", urls);
        return urls;
    }

    async getEpisodeURL(episodeIndex: number): Promise<string | undefined> {
        const episodes = await this.getEpisodeURLs();
        // get episode number from index and convert to string
        const episode = (episodeIndex + 1).toString();

        // return the url
        return episodes[episode];
    }

    async showEpisode(episodeIndex: number): Promise<boolean> {
        const episodeURL = await this.getEpisodeURL(episodeIndex);
        // if we don't know the url then we don't even have to bother
        if (!episodeURL) return false;

        location.assign(episodeURL);
        return true;
    }

    async getEpisodeCount(): Promise<number | undefined> {
        const storedEpCount = await this.persistentLoad("episodeCount");
        if (storedEpCount) return storedEpCount;

        // just wrap it in a function, this way we don't have to handle
        // each "return" individually.
        const epCount = (() => {
            const animeType = document.querySelector("div.pane.info tr.type > td.value");
            if (!animeType) return;

            // get the episode count. Not present for movies for example
            const episodeCount = animeType.querySelector(`span[itemprop="numberOfEpisodes"]`);
            if (episodeCount) return parseInt(episodeCount.innerHTML);

            // if it's a movie return 1
            if (animeType.innerHTML === "Movie") return 1;

            return undefined;
        })();

        await this.persistentStore("episodeCount", epCount);
        return epCount;
    }

    async canSetEpisodesWatched(): Promise<boolean> {
        return false;
    }

    protected async _setEpisodesWatched(progress: number): Promise<boolean> {
        return false;
    }

    protected async _getEpisodesWatched(): Promise<number | undefined> {
        return undefined;
    }

    async injectAnimeStatusBar(statusBar: Element): Promise<void> {
        const imgContainer = document.querySelector("div.image > div.container");
        if (!imgContainer) return;

        // insert the status bar after the image
        imgContainer.insertAdjacentElement("afterend", statusBar);

        // good practise!
        this.injected(statusBar);
    }
}
```


And we're done! That's our Anime service page. All that's left to do is
adding it to the AniDB service. To do that simply open the `index.ts`
file again, import the service page using `import AniDBAnimePage from
"./anime";` and replace the first `undefined` with `AniDBAnimePage`:

```typescript
super("anidb", AniDBAnimePage, undefined);
```

If you feel tempted to try it out right now then please do so. But let
me warn you, it looks like absolute sh*t! You see the design of
anidb.net is interfering with Dolos and making is look like a mess. What
are we gonna do about it? Well... Nothing. If I had known this in
advance I would've chosen a different website. But fact of the matter is
that I didn't.

<figure class="align-center">
  <img src="{{ site.baseurl }}/images/guides/creating-your-own-service/anime-page.png" alt="Anime Page">
  <figcaption>Just to be sure; that's not what Dolos usually looks like!</figcaption>
</figure>


There are ways to get around this, using
[Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM),
[iframes](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe)
and what have you, but this would be totally out-of-scope for this
guide.

At least now you know how to write an anime service page, but we're
still missing the most important thing: The episode page. In the next
chapter we're going to do exactly that!


#### Episode Service Page

Writing an episode service page is very similar to writing an anime
service page. Most of the code is already written for you and exposed
through the abstract [`EpisodePage`][docs-common-pages-episodepage].
And, believe it or not, writing the episode page is actually easier than
the anime page. We only have to implement the following abstract
methods:
- `async getEpisodeIndex(): Promise<number | undefined>`
- `async nextEpisodeButton(): Promise<SkipButton | undefined>`
- `async showNextEpisode(): Promise<void>`
- `async prevEpisodeButton(): Promise<SkipButton | undefined>`
- `async showPrevEpisode(): Promise<void>`
- `async injectEmbed(embed: Element): Promise<void>`
- `buildAnimePage(): EpisodeAnimePageLike<AniDB>`

You see? Only 7 methods! Looking at these methods you might be
wondering: "what is that EpisodeAnimePageLike thing we're supposed to
build though?"

And I would be forced to answer: "Our downfall". You'll find out why
later.

Let's go through the methods one by one again.

##### getEpisodeIndex

Get the episode index of the episode. This can be done by parsing the
title of the page which contains the episode number. Again, Dolos uses
0-based indices so we subtract 1 from the episode number.

```typescript
async getEpisodeIndex(): Promise<number | undefined> {
    // get title from page
    const titleContainer = document.querySelector("h1.ep");
    if (!titleContainer) return;
    const epTitle = titleContainer.innerHTML;

    // extract episode number
    const match = /^Episode: .+ - (\d+) - .+$/.exec(epTitle);
    if (!match) return;
    return parseInt(match[1]) - 1;
}
```

##### nextEpisodeButton

Get the [SkipButton][docs-common-components-anime-skip_button] for the
next episode. What is a "SkipButton"? Well, it contains the necessary
information for the button that is shown on the episode embed which
takes you to the next episode. It can take a `href` and an `onClick`
handler. For our case `href` is totally sufficient:

```typescript
async nextEpisodeButton(): Promise<SkipButton | undefined> {
    const nextEpBtn = document.querySelector(".links > .next a");
    if (!nextEpBtn) return;

    return {
        href: (nextEpBtn as HTMLLinkElement).href,
    };
}
```

##### showNextEpisode

Navigate the user to the next episode. We can just use the data from the
`nextEpisodeButton` method to get the href attribute.

##### prevEpisodeButton

Same as nextEpisodeButton but the other way around:

```typescript
async prevEpisodeButton(): Promise<SkipButton | undefined> {
    const prevEpBtn = document.querySelector(".links > .prev a");
    if (!prevEpBtn) return;

    return {
        href: (prevEpBtn as HTMLLinkElement).href,
    };
}
```

##### showPrevEpisode

Same as showNextEpisode but for the previous episode using the
`prevEpisodeButton` method.


##### injectEmbed

Add the episode embed (think: episode player) to the page. The episode
page has an "airing schedule" table. Let's insert it right above it:

```typescript
async injectEmbed(embed: Element): Promise<void> {
    // insert the embed just above the airing schedule table
    const schedule = document.querySelector("#schedule");
    if (!schedule) throw new Error("Couldn't find schedule");

    schedule.insertAdjacentElement("beforebegin", embed);
    // good practise!
    this.injected(embed);
}
```

##### buildAnimePage

Now this is where things go south again. I mean, let me just quickly
tell you what exactly the point of this function is. A lot of
functionality is normally shared between anime and episode pages. I say
normally because anidb **doesn't**. So while normally

```typescript
buildAnimePage(): EpisodeAnimePageLike<AniDB> {
    return new AniDBEpisodeAnimePage(this.service);
}
```

Normally we could just return an instance of `AniDBAnimePage` here (see
the myanimelist episode service page) but as said, anidb has a very
different site structure for the episode page than the anime page.

To fix this we use a super type which bridges these differences by
overriding the relevant methods.


```typescript
// override some AniDBAnimePage methods because
// they the episode page is nowhere near the same
// as the anime page.
class AniDBEpisodeAnimePage extends AniDBAnimePage {
    async getAnimeIdentifier(): Promise<string | undefined> {
        const animeLink = document.querySelector(".main-tabs > .anime a");
        if (!animeLink) return;
        // this is the same url format as seen on the real anime page.
        // actually, now that I think about it, that's quite obvious...
        const animeURL = new URL((animeLink as HTMLLinkElement).href);

        return animeURL.searchParams.get("aid") || undefined;
    }

    async getAnimeSearchQuery(): Promise<string | undefined> {
        // get title from page
        const titleContainer = document.querySelector("h1.ep");
        if (!titleContainer) return;
        const epTitle = titleContainer.innerHTML;

        // extract title
        const match = /^Episode: (.+) - \d+ - .+$/.exec(epTitle);
        if (!match) return;
        return match[1];
    }

    async injectAnimeStatusBar(statusBar: Element): Promise<void> {
        // we don't want to inject the anime status bar.
        return;
    }
}
```

> If anidb wasn't static but dynamic like Kitsu we would have to worry
> about transitions as well. Dolos has a transition framework between
> service pages and normally the transition from anime page to episode
> page automatically passes the anime page to be reused. This would be
> problematic in our case because we need a custom anime page. Luckily
> for us this transition doesn't happen because the entire website is
> reloaded between page switches.


With that out of the way, this is what the `episode.ts` file looks like:

```typescript
// /src/services/anidb/episode.ts:

import AniDB from "./index";
import { EpisodePage, EpisodeAnimePageLike } from "dolos/common/pages";
import { SkipButton } from "dolos/common/components/anime";
import AniDBAnimePage from "./anime";

// override some AniDBAnimePage methods because
// they the episode page is nowhere near the same
// as the anime page.
class AniDBEpisodeAnimePage extends AniDBAnimePage {
    async getAnimeIdentifier(): Promise<string | undefined> {
        const animeLink = document.querySelector(".main-tabs > .anime a");
        if (!animeLink) return;
        // this is the same url format as seen on the real anime page.
        // actually, now that I think about it, that's quite obvious...
        const animeURL = new URL((animeLink as HTMLLinkElement).href);

        return animeURL.searchParams.get("aid") || undefined;
    }

    async getAnimeSearchQuery(): Promise<string | undefined> {
        // get title from page
        const titleContainer = document.querySelector("h1.ep");
        if (!titleContainer) return;
        const epTitle = titleContainer.innerHTML;

        // extract title
        const match = /^Episode: (.+) - \d+ - .+$/.exec(epTitle);
        if (!match) return;
        return match[1];
    }

    async injectAnimeStatusBar(statusBar: Element): Promise<void> {
        // we don't want to inject the anime status bar.
        return;
    }
}

export default class AniDBEpisodePage extends EpisodePage<AniDB> {
    buildAnimePage(): EpisodeAnimePageLike<AniDB> {
        return new AniDBEpisodeAnimePage(this.service);
    }

    async getEpisodeIndex(): Promise<number | undefined> {
        // get title from page
        const titleContainer = document.querySelector("h1.ep");
        if (!titleContainer) return;
        const epTitle = titleContainer.innerHTML;

        // extract episode number
        const match = /^Episode: .+ - (\d+) - .+$/.exec(epTitle);
        if (!match) return;
        return parseInt(match[1]) - 1;
    }

    async injectEmbed(embed: Element): Promise<void> {
        // insert the embed just above the airing schedule table
        const schedule = document.querySelector("#schedule");
        if (!schedule) throw new Error("Couldn't find schedule");

        schedule.insertAdjacentElement("beforebegin", embed);
        // good practise!
        this.injected(embed);
    }

    async nextEpisodeButton(): Promise<SkipButton | undefined> {
        const nextEpBtn = document.querySelector(".links > .next a");
        if (!nextEpBtn) return;

        return {
            href: (nextEpBtn as HTMLLinkElement).href,
        };
    }

    async showNextEpisode(): Promise<void> {
        // use the SkipButton data
        const data = await this.nextEpisodeButton();
        if (!data) return;

        location.assign(data.href as string);
    }

    async prevEpisodeButton(): Promise<SkipButton | undefined> {
        const prevEpBtn = document.querySelector(".links > .prev a");
        if (!prevEpBtn) return;

        return {
            href: (prevEpBtn as HTMLLinkElement).href,
        };
    }

    async showPrevEpisode(): Promise<void> {
        // use the SkipButton data
        const data = await this.prevEpisodeButton();
        if (!data) return;

        location.assign(data.href as string);
    }
}
```

Now we can go back and add the AniDBEpisodePage to the AniDB service and
then we're done!

The final `index.ts` file:

```typescript
// /src/services/anidb/anime.ts:

import { Service } from "dolos/common";
import AniDBAnimePage from "./anime";
import AniDBEpisodePage from "./episode";

export default class AniDB extends Service {
    constructor() {
        // provide service pages and service id
        super("anidb", AniDBAnimePage, AniDBEpisodePage);
    }

    async route(url: URL): Promise<void> {
        switch (url.searchParams.get("show")) {
            case "anime":
                // load anime service page
                await this.showAnimePage();
                break;
            case "ep":
                // load episode service page
                await this.showEpisodePage();
                break;
        }
    }
}

// load the service as soon as the code is executed.
new AniDB().load();
```

And what does the episode page look like? This:

<figure class="align-center">
  <img src="{{ site.baseurl }}/images/guides/creating-your-own-service/episode-page.png" alt="Episode Page">
  <figcaption>Gotta love those check marks!</figcaption>
</figure>

Yes, I know, it's kind of disappointing how everything looks like sh\*t,
but this only served to illustrate how easy it is to add a new service
even if it doesn't quite work out in the end.


#### What have we done??

Even though it looks absolutely horrendous and we had to bend reality a
little bit, it works. Of course we haven't even touched the entire idea
of setting the watch progress, but still, what we have can be considered
a success. Let no one tell you otherwise.

The lack of "automated watch progress tracking" and the visual bugs are
just some of the reasons why this isn't part of Dolos yet.

If you wish, please feel free to extend this to properly support
anidb.net and then open a pull request!


[docs-kitsu-service]: {{ site.baseurl }}/docs/modules/kitsu.html
[docs-mal-service]: {{ site.baseurl }}/docs/modules/myanimelist.html

[docs-common-service]: {{ site.baseurl }}/docs/classes/common.service.html
[docs-common-service-constructor]: {{ site.baseurl }}/docs/classes/common.service.html#constructor
[docs-common-service-load]: {{ site.baseurl }}/docs/classes/common.service.html#load
[docs-common-service-route]: {{ site.baseurl }}/docs/classes/common.service.html#route
[docs-common-service-showanimepage]: {{ site.baseurl }}/docs/classes/common.service.html#showanimepage
[docs-common-service-showepisodepage]: {{ site.baseurl }}/docs/classes/common.service.html#showepisodepage
[docs-common-servicepage]: {{ site.baseurl }}/docs/classes/common.servicepage.html

[docs-common-pages-animepage]: {{ site.baseurl }}/docs/classes/common_pages.animepage.html
[docs-common-pages-episodepage]: {{ site.baseurl }}/docs/classes/common_pages.episodepage.html

[docs-common-components-anime-animestatusbar]: {{ site.baseurl }}/docs/modules/common_components_anime.html#animestatusbar
[docs-common-components-anime-skip_button]:{{ site.baseurl }}/docs/interfaces/common_components_anime.skipbutton.html
