/**
 * @module components/anime
 */

import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import InputBase from "@material-ui/core/InputBase";
import {fade} from "@material-ui/core/styles/colorManipulator";
import {Theme} from "@material-ui/core/styles/createMuiTheme";
import createStyles from "@material-ui/core/styles/createStyles";
import withStyles, {WithStyles} from "@material-ui/core/styles/withStyles";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import withMobileDialog, {WithMobileDialog} from "@material-ui/core/withMobileDialog";
import SearchIcon from "@material-ui/icons/Search";
import {Service} from "dolos/common";
import {AnimePage} from "dolos/common/pages";
import {GrobberMedium, remoteGrobberClient} from "dolos/grobber";
import {useSubscription} from "dolos/hooks";
import * as React from "react";
import {defer, EMPTY, Observable, of, Subject, SubscriptionLike} from "rxjs";
import {debounceTime, map, switchMap, tap, withLatestFrom} from "rxjs/operators";
import {AnimeSearchSelection} from "./index";
import _ = chrome.i18n.getMessage;

/** @ignore */
const styles = (theme: Theme) => createStyles({
    content: {
        textAlign: "center",
    },
    grow: {
        flexGrow: 1,
    },
    inputInput: {
        padding: theme.spacing(1, 1, 1, 5),
        transition: theme.transitions.create("width"),
        width: "100%",
        [theme.breakpoints.up("sm")]: {
            "&:focus": {
                width: 200,
            },
            "width": 120,
        },
    },
    inputRoot: {
        color: "inherit",
        width: "100%",
    },
    search: {
        "&:hover": {
            backgroundColor: fade(theme.palette.secondary.main, 0.25),
        },
        "backgroundColor": fade(theme.palette.secondary.main, 0.15),
        "borderRadius": theme.shape.borderRadius,
        "marginLeft": 0,
        "position": "relative",
        "width": "100%",
        [theme.breakpoints.up("sm")]: {
            marginLeft: theme.spacing(1),
            width: "auto",
        },
    },
    searchIcon: {
        alignItems: "center",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        pointerEvents: "none",
        position: "absolute",
        width: theme.spacing(4),
    },
});

/**
 * Required [[AnimePage]] properties for [[AnimeSearchDialog]].
 */
export type AnimeSearchDialogAnimePage = Pick<AnimePage<Service>,
    | "getUID$"
    | "getAnimeSearchQuery"
    | "state">;

export interface AnimeSearchDialogProps extends WithStyles<typeof styles>, WithMobileDialog {
    open: boolean;
    onClose?: (medium?: GrobberMedium) => void;
    animePage: AnimeSearchDialogAnimePage;
}

export interface AnimeSearchDialogState {
    loading: boolean;
    results?: GrobberMedium[];
    searchQuery?: string;
    currentAnimeUID?: string;
    currentAnime?: GrobberMedium;
}

// tslint:disable-next-line:variable-name
export const AnimeSearchDialog = withStyles(styles)(withMobileDialog<AnimeSearchDialogProps>()(
    class extends React.Component<AnimeSearchDialogProps, AnimeSearchDialogState> {
        private readonly subscriptions: SubscriptionLike[];
        private readonly searchQuery$: Subject<string>;
        private readonly debouncedSearchQuery$: Subject<string>;

        constructor(props: AnimeSearchDialogProps) {
            super(props);
            this.state = {
                loading: true,
            };

            this.subscriptions = [];
            this.searchQuery$ = new Subject();
            this.debouncedSearchQuery$ = new Subject();
        }

        public handleDialogEnter() {
            const {animePage} = this.props;
            const state = animePage.state;

            const searchQuerySub = this.searchQuery$.pipe(
                switchMap(searchQuery => {
                    if (!searchQuery) {
                        this.setState({
                            results: undefined,
                            searchQuery,
                        });

                        return EMPTY;
                    }

                    return of(searchQuery);
                }),
                // begin loading
                tap(searchQuery => this.setState({loading: true, searchQuery})),
                switchMap(searchQuery => remoteGrobberClient.searchAnime(searchQuery)),
                withLatestFrom(state.config$),
                map(([searchResults, config]) => {
                    if (!searchResults) return;

                    const resultUIDs = new Set();
                    let consideration = searchResults
                        .filter(res => {
                            // make absolutely sure that there are no duplicate UIDs
                            // it shouldn't happen anyway, but Grobber seems to have
                            // some issues which causes duplicates
                            const uid = res.item.uid;
                            if (resultUIDs.has(uid))
                                return false;
                            else
                                resultUIDs.add(uid);

                            return res.certainty >= config.minCertaintyForSearchResult;
                        });

                    if (consideration.length === 0) consideration = searchResults;

                    return consideration.map(res => res.item);
                }),
            ).subscribe(results => this.setState({loading: false, results}));

            this.subscriptions.push(
                searchQuerySub,
                // TODO don't overwrite current anime uid if the user already changed it
                animePage.getUID$().subscribe(currentAnimeUID => this.setState({currentAnimeUID})),
                // TODO don't overwrite if the user changed the search query!
                defer(() => animePage.getAnimeSearchQuery()).pipe(
                    switchMap(searchQuery => {
                        if (!searchQuery) {
                            this.setState({loading: false});
                            return EMPTY;
                        }

                        return of(searchQuery);
                    }),
                ).subscribe(query => this.searchQuery$.next(query)),
                this.debouncedSearchQuery$.pipe(debounceTime(200))
                    .subscribe(this.searchQuery$),
            );
        }

        public handleDialogExit() {
            // unsubscribe from all subscriptions
            while (this.subscriptions.length > 0) {
                this.subscriptions.pop()!.unsubscribe();
            }
        }

        public handleSelect(medium: GrobberMedium) {
            const {currentAnimeUID} = this.state;
            if (medium.uid === currentAnimeUID) return;

            this.setState({currentAnimeUID: medium.uid, currentAnime: medium});
        }

        public renderContent(): React.ReactNode {
            const {loading, results, currentAnimeUID, searchQuery} = this.state;

            const handleSelect = this.handleSelect.bind(this);

            if (loading) {
                return (
                    <CircularProgress/>
                );
            } else if (results && results.length > 0) {
                // noinspection RequiredAttributes
                return (
                    <AnimeSearchSelection
                        media={results}
                        currentUID={currentAnimeUID}
                        onSelect={handleSelect}
                    />
                );
            } else if (!searchQuery) {
                return (
                    <Typography variant="overline">{_("anime__search__no_search_query")}</Typography>
                );
            } else {
                return (
                    <Typography variant="overline">{_("anime__search__no_results")}</Typography>
                );
            }
        }

        public render(): React.ReactNode {
            const {classes, open, onClose, fullScreen} = this.props;
            const {searchQuery, currentAnime} = this.state;

            const handleDialogEnter = this.handleDialogEnter.bind(this);
            const handleDialogExit = this.handleDialogExit.bind(this);
            const handleClose = () => onClose && onClose();

            const handleSearchInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) =>
                this.debouncedSearchQuery$.next(event.target.value);

            const searchInputClasses = {
                input: classes.inputInput,
                root: classes.inputRoot,
            };

            let searchInputField;

            // searchQuery is only undefined right at the beginning
            if (searchQuery !== undefined)
                searchInputField = (
                    <div className={classes.search}>
                        <div className={classes.searchIcon}>
                            <SearchIcon/>
                        </div>
                        <InputBase
                            placeholder={_("anime__search__search_placeholder")}
                            defaultValue={searchQuery}
                            onChange={handleSearchInputChange}
                            classes={searchInputClasses}
                        />
                    </div>
                );

            let pickButton;
            if (currentAnime) {
                const handlePickClick = () => onClose && onClose(currentAnime);
                pickButton = (
                    <Button
                        onClick={handlePickClick}
                        variant="contained"
                        color="primary"
                    >
                        {_("anime__search__pick")}
                    </Button>
                );
            }

            return (
                <Dialog
                    fullScreen={fullScreen}
                    maxWidth="md"
                    fullWidth
                    open={open}
                    onEnter={handleDialogEnter}
                    onExit={handleDialogExit}
                    onBackdropClick={handleClose}
                    scroll="paper"
                    aria-labelledby="anime-search-result-dialog-title"
                    style={{zIndex: 10000}}
                >
                    <Toolbar>
                        <DialogTitle id="anime-search-result-dialog-title">
                            {_("anime__search__title")}
                        </DialogTitle>
                        <div className={classes.grow}/>
                        {searchInputField}
                    </Toolbar>

                    <DialogContent className={classes.content}>
                        {this.renderContent()}
                    </DialogContent>

                    <DialogActions>
                        <Button onClick={handleClose} color="primary">
                            {_("anime__search__abort")}
                        </Button>

                        {pickButton}
                    </DialogActions>
                </Dialog>
            );
        }
    },
));

export interface SearchDialogOpenCommand {
    open: boolean;
    onClose?: (anime?: GrobberMedium) => void;
}

export interface RemoteAnimeSearchDialogProps extends Pick<AnimeSearchDialogProps, "animePage"> {
    open$: Observable<SearchDialogOpenCommand>;
}

/**
 * React component for a "remote" anime dialog which can be opened using an
 * observable.
 *
 * @see [[AnimeSearchDialog]]
 */
export function RemoteAnimeSearchDialog(props: RemoteAnimeSearchDialogProps) {
    const [open, setOpen] = React.useState({open: false} as SearchDialogOpenCommand);
    useSubscription(props.open$, setOpen);

    function handleClose(medium?: GrobberMedium) {
        if (open.onClose) open.onClose(medium);

        setOpen({open: false});
    }

    return (
        <AnimeSearchDialog
            open={open.open}
            animePage={props.animePage}
            onClose={handleClose}
        />
    );
}
