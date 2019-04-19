---
title: Getting ready for development
excerpt: Downloading and building Dolos.
---

## Setting up Dolos

The first step is to get the code somehow. Usually guides recommend
cloning the GitHub repository at this point, but I'm not that
opinionated. Download the ZIP file and unpack it for all I care... If
you don't know how to download the code to your filesystem ~~stop
reading right now because this guide probably isn't for you~~ you can
read-up how to do it
[here](https://help.github.com/articles/fork-a-repo/). Once you have
downloaded the code, change into its directory.

Now that we have the code we need to install the dependencies. Use `npm
install` and you're already done. Unless it spits out an error or you
don't even have npm installed. Can't help you with the former, but
[downloading npm is fairly straightforward](https://www.npmjs.com/get-npm).

## Building the extension

### Secrets

They're called "secrets", but it's really just a bunch of variables
passed to the code. They can be set in the `dolos-secrets.json` file.
You may also use environment variables by using the uppercase key from
the file and prefixing it with "DOLOS_".

For example:
> "sentryDSN" -> "DOLOS_SENTRYDSN"

### Bundling the code

To use the extension we first need to build the extension! Why is that?
Well, Dolos is written in TypeScript and ~~most~~ browsers don't run
TypeScript natively *(citation needed)*.

To build the extension you can simply run `npm run watch` in the Dolos
directory. This will, as the name implies, watch your files and re-build
the extension files every time something changes (and it runs at the
very start). This compiles the TypeScript files to JavaScript and stores
it in the `dist/js` folder. Have a look if you're interested (Why would
that be the case? Who knows).

### Node scripts

Here's a rundown of all the `npm run` scripts available:

##### test

Run all available tests using [Jest](https://jestjs.io/).


##### lint

Run [TSLint](https://palantir.github.io/tslint/).

##### build:dev

Run webpack with the `webpack.dev.js` configuration. This creates inline
source-maps and is quite fast.

##### build:production

Run webpack with the `webpack.prod.js` configuration. This configuration
is used to build the production-ready code. It is not suited for
development.

##### watch

Runs webpack with the `build:dev` configuration in watch mode. This
means that the files are re-built when there's a change in the source
files. This is ideal for development.

##### docs

Generate the documentation for Dolos using
[TypeDoc](https://typedoc.org/). After running the documentation can be
found in the `docs` directory.

### Getting i18n localisation files

The Dolos repository doesn't contain the i18n translation files used by
the extension to display messages in different languages. That's because
it uses [Crowdin](https://crowdin.com/) to translate them.

If you wish to use the translated files in the extension you can help
translate and download them from
[Dolos' Crowdin page](https://crowdin.com/project/dolos). This will
download a zip file containing the translations which you need to unpack
to `dist/_locales/`.

## Installing the Extension

Of course we would like to test our extension along the way. To do that
we need to install the extension first. The installation progress
depends on the browser you would like to use during development:

### Firefox

If you want to develop using **Firefox** you need to copy the contents
of `manifest.firefox.json` to `manifest.json` (overwrite it). After that
you can run `npx web-ext run --source-dir dist` which will automatically
start a Firefox browser with the extension installed (If you don't have
npx installed, install it using `npm install --global npx`).

Whenever the code is rebuilt `web-ext` detects it and reloads the
extension for you. This can lead to duplicated elements when it comes to
content scripts so you will have to reload the page manually.

If this approach does not work for you you can visit `about:debugging`
in Firefox, press the `Load Temporary Add-on...` button, navigate to the
`dist/` directory and select the `manifest.json` file. This approach
won't automatically reload the extension, you will have to press the
reload button manually.


### Chrome

If you prefer using **Chrome**, copy the contents of
`manifest.chrome.json` to `manifest.json` (again, overwrite it). To
actually install the extension you need to open the Chrome browser, go
to `chrome://extensions` and click `Load unpacked` which should allow
you to pick a folder. Choose the `dist` folder in the Dolos directory.

Unlike Firefox, Chrome doesn't automatically reload the extension for
you. When you rebuild the extension you need to manually reload the
extension by pressing the reload button.
