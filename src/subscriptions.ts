/**
 * A module containing some helper functions for accessing subscriptions.
 *
 * @module subscriptions
 */

/** @ignore */

import {AnimeSubscriptionInfo} from "dolos/models";
import {store} from "dolos/store";
import {Observable} from "rxjs";
import {distinctUntilChanged, map} from "rxjs/operators";

// TODO this should just be part of the Dolos store, shouldn't it?
// I don't know, you tell me!

/** Get an observable for a list of subscriptions with unseen episodes */
export function getAnimeSubsWithUnseenEps$(): Observable<AnimeSubscriptionInfo[]> {
    return store.getAnimeSubscriptions$().pipe(
        map(subs => Object.values(subs)
            .filter(sub => sub.anime.episodes - sub.episodesWatched > 0),
        ),
    );
}

/**
 * Get an observable for the amount of subscriptions with unseen episodes
 *
 * @see [[getAnimeSubsWithUnseenEps$]]
 */
export function getAnimeSubsWithUnseenEpsCount$(): Observable<number> {
    const unseen$ = getAnimeSubsWithUnseenEps$();
    return unseen$.pipe(
        map(unseen => unseen.length),
        distinctUntilChanged(),
    );
}
