---
title: Creating your own Service
description: Extending Dolos to support other sites.
---

# How to add your own service
A "service" is the abstract concept of an interface between the core Dolos functionality
and a website. Instead of rewriting everything from scratch for every site we want to support
there's only a *comparatively* tiny amount of code to write thanks to Services.
The behaviours of Dolos is standardised. It should work the same for every site, that's why
only very low-level logic needs to be provided to adapt to a new site.

Adding a new Service is very easy in most cases.

Dolos already has two Services which may serve as good reference points.
There's the simple [MyAnimeList Service][docs-mal-service] and the more
complex [Kitsu Service][docs-kitsu-service].

## Example for [aniDB](https://anidb.net)
Instead of having to read my incoherence blabbering, let's instead take a different
approach and build our own little Service together, shall we?

Don't be afraid, it *probably* won't take that long and it's gonna be a fun
adventure for you and me.

We're going to setup the page [anidb.net](https://anidb.net) to work with Dolos.
We're in luck, the page seems to be "static". What do I mean by that? Well,
[Kitsu](https://kitsu.io) for example uses the Ember framework which makes it
much more complex to handle. This page, however, seems to be very generic
without all that much Javascript action going on. That's a good thing!

But enough talk for now, let's get started!

### Setting up Dolos
First we need to setup the environment we're gonna code in. If you already
have everything ready then feel free to skip this one.

The first step is to get the code somehow. Usually guides recommend cloning the GitHub
repository at this point, but I'm not that opinionated. Download the ZIP file and unpack
it for all I care... If you don't know how to download the code to your filesystem
~~stop reading right now because this guide probably isn't for you~~ you can read-up
how to do it [here](https://help.github.com/articles/fork-a-repo/). Once you have
downloaded the code, change into its directory.

Now that we have the code we need to install the dependencies. Use
`npm install` and you're already done. Unless it spits out an error
or you don't even have npm installed. Can't help you with the former, but
[downloading npm is fairly straightforward](https://www.npmjs.com/get-npm).

### Installing the Extension
Of course we would like to test our extension along the way. To do that we
need to install the extension first. But even before that we first
need to build the extension! Why is that? Well, Dolos is written in TypeScript
and ~~most~~ browsers don't run TypeScript natively *(citation needed)*.
To build the extension you can simply run `npm run watch` in the Dolos directory.
This will, as the name implies, watch your files and re-build the extension files
every time something changes (and it runs at the very start). This compiles the
TypeScript files to JavaScript and stores it in the `dist/js` folder.
Have a look if you're interested (Why would that be the case? Who knows).

Now, installing the extension depends on the browser you would like to use during
development:

If you want to develop using **Firefox** you need to copy the contents of
`manifest.firefox.json` to `manifest.json` (overwrite it). After that you can run
`npx web-ext run` which will automatically start a Firefox browser with the extension
installed (If you don't have npx installed, install it using `npm install --global npx`).

If you prefer using **Chrome**, copy the contents of `manifest.chrome.json`
to `manifest.json` (again, overwrite it). To actually install the extension
you need to open the Chrome browser, go to `chrome://extensions` and click
`Load unpacked` which should allow you to pick a folder. Choose the `dist`
folder in the Dolos directory.

At this point you should have the local extension installed and should be ready to start
hacking!

### Adding files for the new Service
Before we get to the fun part, that is, writing code, we should first setup
the basic structure for the new service. Switch to the `src` directory because
that's where Dolos' code resides. Unless otherwise specified we assume that we're
in the `src` directory.

Let's create a new folder called `anidb` and in it an empty file `index.ts`.
We want to run the contents of the index file whenever the user opens the aniDB
website. To check whether this works, let's put a little something in the index file.
If you're not already using one, now's probably a good time to switch to an editor.
Anything will do, really, but I recommend using something like [Visual Studio Code](https://code.visualstudio.com/)
or [Atom](https://atom.io/) because working with the built-in notes editor won't bring
you very far.
Open the `index.ts` file you just created and add something like:

```typescript
console.log("Hello World from Dolos on aniDB");
```

We will use this to check whether the code is actually being run.

Okay great, let's check whether it wo-... No! Don't even try it, of course
it won't work yet. The extension doesn't mysteriously know that it should run
the script when you visit the page. How could it?
We need to first tell it to be run. And if you take a look at the `/dist/js`
folder there's not even a file for it... What?

Well, it's actually quite simple. Webpack, the tool used to build the Javascript
files doesn't do anything unless you tell it to. The first thing we need to adjust
to make our code run when the page is opened is to tell Webpack to "compile" the file.

To do this let's open the `webpack.common.js` file in the root folder. In it
you should find the "entry" object which contains names mapped to paths. The keys
are the names of the output files and the values the location of the source entry file.
Add a new key-value pair at the end for our anidb script. It should look like this:
```typescript
anidb: path.join(__dirname, "src/anidb/index.ts"),
```

This will cause Webpack to generate the file `anidb.js` in the `dist/js` directory.
But for this to take effect we need to restart it first. Stop the previous
`npm run watch` and run the same command again.

After it's done you should see an `anidb.js` file appear in `/dist/js`.

Now you might be tempted to try it out now but I need you to wait a little longer,
because even though now there's a Javascript file the extension still doesn't know
when to run it.
We want to tell the extension to run the `anidb.js` file whenever the user navigates
to a anidb.net site. To do this, open the `manifest.json` file found in the `dist`
directory. In it you'll find the key `"content_scripts"` which holds a list of objects.

Add the following entry to the list:
```json
{
    "matches": [
        "*://anidb.net/*"
    ],
    "js": [
        "js/anidb.js"
    ],
    "run_at": "document_idle"
}
```

To give a brief overview of what this does:
- **matches** tells the browser *when* to run the script. In our case it should run
    for all anidb.net pages.
- **js** contains a list of javascript files to be run. We only want to run the `js/anidb.js`
    file.
- **run_at** tells the browser at what point it should run the code. If you're interested
    about this, you can [read about it here](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/content_scripts#run_at).

You might've noticed that there are multiple `manifest.json` files in there. While it's not
necessary right now, **please also add the entry to the other files**!


**Now we're ready to give it a shot!**
If you're using `npx web-ext run` (Firefox) it should've already automatically reloaded
the extension and if you're using Chrome you need to manually reload the extension
by going to `chrome://extensions/` and pressing the reload button.

Open a new tab and go to [https://anidb.net](https://anidb.net). Open the Web Console
(Press F12 and switch to the console tab) and you should see the beautiful
"Hello World from Dolos on aniDB" text from before.

> If you don't see it, please make sure that Webpack has rebuilt the Javascript and
> you've reloaded the extension!

#### Quick Recap because I've heard those are useful
- We created a new directory for our service called `anidb` in the `src` folder.
- Added an `index.ts` file to said folder with some debug code to check whether it works.
- Changed the Webpack configuration `webpack.common.js` to build our new file
  to a Javascript file in the `dist/js` directory.
- Edited the `manifest.json` files so that our file is being run when the user
  visits anidb.net.

Alright, it's been a journey. We're done... Well... at least somewhat done.
From now on we actually get to write some code. Isn't that nice?


### Writing the code for our new Service
Open the `index.ts` file again and start by removing the `console.info`
line. We know the code is being loaded, we don't need to test it any more.

As I've already slightly touched upon in the introductory paragraph, Dolos
already does all of the heavy lifting for you, you only need to write a shallow
wrapper for Dolos to be able to interact with the page.
Dolos does this by exposing a bunch of [abstract classes](https://www.typescriptlang.org/docs/handbook/classes.html#abstract-classes).
One of which is the [`Service`][docs-common-service]
class. It doesn't do very much, but it provides a good framework to work with.
So let's use it!

First, we need to import it in our file. To do that, add the following line to the top
of the file:
```typescript
import {Service} from "dolos/common";
```

> `dolos/common` contains a whole bunch of useful stuff and you'll see it a lot.

Create a class called `AniDB` which extends `Service`:

```typescript
class AniDB extends Service {
}

```

And there it is. Our own little Service, thanks for readin... - oh...
Have a look at the output of Webpack:
```
TS2515: Non-abstract class 'AniDB' does not implement inherited abstract member 'route' from class 'Service'.
```

*You think I've overdone this bait-and-switch by now?*

What this error message is trying to tell us is that we haven't implemented
the necessary abstract methods yet - namely [`route`][docs-common-service-route].
It's the only abstract method [`Service`][docs-common-service] has.
It take a [`URL`](https://developer.mozilla.org/en-US/docs/Web/API/URL)
object for the current location and should "route" based on it.

I think this is as good a point as any to tell you about the concept of [`ServicePage`][docs-common-servicepage]s.
A service page is Dolos' abstract representation of a view (think: page) on the service
(i.e. on the website). The service itself doesn't really interact with the page all
that much, it passes it on to the service page. There are two noteworthy service pages
we're going to use. [`AnimePage`][docs-common-animepage] and [`EpisodePage`][docs-common-episodepage]
but more on that later.

The [`route`][docs-common-service-route] method should delegate which
service page to show.












[docs-kitsu-service]: {{ site.baseurl }}/docs/modules/kitsu.html
[docs-mal-service]: {{ site.baseurl }}/docs/modules/myanimelist.html

[docs-common-service]: {{ site.baseurl }}/docs/classes/common.service.html
[docs-common-service-route]: {{ site.baseurl }}/docs/classes/common.service.html#route
[docs-common-servicepage]: {{ site.baseurl }}/docs/classes/common.servicepage.html

[docs-common-animepage]: {{ site.baseurl }}/docs/classes/common_pages.animepage.html
[docs-common-episodepage]: {{ site.baseurl }}/docs/classes/common_pages.episodepage.html