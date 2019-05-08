/**
 * A module containing some helper functions for accessing subscriptions.
 *
 * @module subscriptions
 */

/** @ignore */

import {useObservableMemo} from "dolos/hooks";
import {AnimeSubscriptionInfo, AnimeSubscriptions} from "dolos/models";
import Store, {DolosStore} from "dolos/store";
import {Observable} from "rxjs";
import {distinctUntilChanged, map} from "rxjs/operators";

/**
 * React hook for getting the [[AnimeSubscriptions]]
 */
export function useAnimeSubscriptions(dolosStore?: DolosStore): AnimeSubscriptions | undefined {
    const store = dolosStore || Store;

    return useObservableMemo(() => store.getAnimeSubscriptions$());
}

/** Get an observable for a list of subscriptions with unseen episodes */
export function getAnimeSubsWithUnseenEps$(dolosStore?: DolosStore): Observable<AnimeSubscriptionInfo[]> {
    const store = dolosStore || Store;

    return store.getAnimeSubscriptions$().pipe(
        map(subs =>
            Object.values(subs).filter(sub => sub.anime.episodes - sub.episodesWatched > 0),
        ),
    );
}

/**
 * Get an observable for the amount of subscriptions with unseen episodes
 *
 * @see [[getAnimeSubsWithUnseenEps$]]
 */
export function getAnimeSubsWithUnseenEpsCount$(dolosStore?: DolosStore): Observable<number> {
    const unseen$ = getAnimeSubsWithUnseenEps$(dolosStore);
    return unseen$.pipe(
        map(unseen => unseen.length),
        distinctUntilChanged(),
    );
}
