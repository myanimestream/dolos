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
There's the simple [MyAnimeList Service][] and the more complex [Kitsu Service]


## Example of the fictitious
### Setup
Probably the most cumbersome part is setting up the required folder structure/files.
