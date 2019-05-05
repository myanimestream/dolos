/**
 * A module containing some helper functions for accessing subscriptions.
 *
 * @module subscriptions
 */

/** @ignore */

import {useObservable, usePromiseMemo} from "dolos/hooks";
import {AnimeSubscriptionInfo, AnimeSubscriptions} from "dolos/models";
import Store, {MutItem} from "dolos/store";
import {EMPTY, Observable} from "rxjs";
import {distinctUntilChanged, map} from "rxjs/operators";

/** React hook for getting the [[AnimeSubscriptions]] */
export function useAnimeSubscriptions(): MutItem<AnimeSubscriptions> {
    Store.getItem$();
    const subs = usePromiseMemo(() => Store.getAnimeSubscriptions());
    const subsObservable = subs ? subs.value$ : EMPTY;

    return useObservable(subsObservable);
}

/** Get an observable for a list of subscriptions with unseen episodes */
export async function getAnimeSubsWithUnseenEps$(): Promise<Observable<AnimeSubscriptionInfo[]>> {
    const subscriptions = await Store.getAnimeSubscriptions();
    return subscriptions.value$.pipe(
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
export async function getAnimeSubsWithUnseenEpsCount$(): Promise<Observable<number>> {
    const unseen$ = await getAnimeSubsWithUnseenEps$();
    return unseen$.pipe(
        map(unseen => unseen.length),
        distinctUntilChanged(),
    );
}
