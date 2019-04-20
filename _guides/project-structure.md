---
title: Project structure
excerpt: Take the tour around Dolos.
---

This guide serves to give you a quick introduction on how Dolos is
structured.


## Branches

Dolos has 3 main branches: `master`, `development`, and `gh-pages`. All
other branches are feature branches and should not be depended upon.

#### master

The master branch contains stable code. Not necessarily the code used in
production as that's based on the releases, but it certainly shouldn't
house broken code that doesn't even run.

#### development

As the name implies this is where development happens. This branch
doesn't have any restrictions other than it has to be up to, if not
ahead of the master branch.

#### gh-pages

This branch holds the documentation of Dolos including the very text
you're reading right now. It contains the TypeScript docs from the
master branch. In general the documentation should be written for the
master branch.


## Toolchain

Dolos uses [CircleCI](https://circleci.com/gh/myanimestream) for
continuous integration.

[Crowdin](https://crowdin.com/project/dolos) is used for localisation.


## Dependencies

#### UI & Design

Dolos uses [React](https://reactjs.org/) for its user interfaces and
sticks to [Google's Material Design](https://material.io/design/) using
the [Material-UI](https://material-ui.com/) library.

#### Bundling

The TypeScript files are bundled using
[webpack](https://webpack.js.org/) and stored in the `dist/js`
directory.

#### Testing

Testing is done using [Jest](https://jestjs.io/). It is preferred to
have `name.test.ts` files instead of a separate `__tests__` folder. But
if one is testing the contents of a directory that only serves one
purpose such as `src/popup` for example, the `__tests__` folder should
be used.

#### Error Reporting

Dolos uses [Sentry](https://sentry.io/welcome/) to keep track of errors.
The DSN is specified in the `dolos-secrets.json` file or using the
`DOLOS_SENTRYDSN` environment variable.


## Workflow

New features are first introduced to the development branch. After
enough changes have accumulated to justify a new release they are merged
into the master branch and tagged. At this point the continuous
integration takes over and deploys the next version of the extension.


## Code

The TypeScript code of Dolos resides in the `src` folder which is
structured as following:

- `@types`: custom TypeScript type declarations used by Dolos.

- `assets`: various assets that are used **in** the code, such as custom
  [Material-UI icons](https://material-ui.com/style/icons/).

- `background`:
  [Background page](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background)
  scripts. You mustn't import this from the outside.

- `common`: Code that is "common" (heh) between content scripts (i.e.
  services)
  * `pages`: Pre-defined service pages.

- `components`: React components
  * `anime`: React components related to Anime

- `debug`: Debug utilities

- `grobber`: A client for interacting with the
  [Grobber API](https://grobber.docs.apiary.io/).

- `options`: Extension settings page

- `popup`: Extension popup

- `services`: Service implementations of the various supported websites

There's quite a bit of code in the top-level as well. This is code that
is usable throughout the entire code base. That's not necessarily saying
that the other parts aren't, but these things were written with that in
mind.
