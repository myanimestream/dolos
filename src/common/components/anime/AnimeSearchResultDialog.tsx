/**
 * @module common.components.anime
 */

import {Typography} from "@material-ui/core";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/es/DialogTitle";
import InputBase from "@material-ui/core/InputBase";
import {fade} from "@material-ui/core/styles/colorManipulator";
import {Theme} from "@material-ui/core/styles/createMuiTheme";
import createStyles from "@material-ui/core/styles/createStyles";
import withStyles, {WithStyles} from "@material-ui/core/styles/withStyles";
import Toolbar from "@material-ui/core/Toolbar";
import withMobileDialog, {InjectedProps as WithMobileDialog} from "@material-ui/core/withMobileDialog";
import SearchIcon from "@material-ui/icons/Search";
// @ts-ignore
import AwesomeDebouncePromise from "awesome-debounce-promise";
import {AnimeInfo, GrobberClient} from "dolos/grobber";
import * as React from "react";
import AnimePage from "../../pages/anime";
import AnimeSelection from "./AnimeSelection";
import _ = chrome.i18n.getMessage;

/** @ignore */
const styles = (theme: Theme) => createStyles({
    grow: {
        flexGrow: 1,
    },
    search: {
        position: "relative",
        borderRadius: theme.shape.borderRadius,
        backgroundColor: fade(theme.palette.secondary.main, 0.15),
        "&:hover": {
            backgroundColor: fade(theme.palette.secondary.main, 0.25),
        },
        marginLeft: 0,
        width: "100%",
        [theme.breakpoints.up("sm")]: {
            marginLeft: theme.spacing.unit,
            width: "auto",
        },
    },
    searchIcon: {
        width: theme.spacing.unit * 4,
        height: "100%",
        position: "absolute",
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    inputRoot: {
        color: "inherit",
        width: "100%",
    },
    inputInput: {
        paddingTop: theme.spacing.unit,
        paddingRight: theme.spacing.unit,
        paddingBottom: theme.spacing.unit,
        paddingLeft: theme.spacing.unit * 5,
        transition: theme.transitions.create("width"),
        width: "100%",
        [theme.breakpoints.up("sm")]: {
            width: 120,
            "&:focus": {
                width: 200,
            },
        },
    },
    content: {
        textAlign: "center",
    },
});

interface AnimeSearchResultDialogProps extends WithStyles<typeof styles>, WithMobileDialog {
    open: boolean;
    onClose?: (anime?: AnimeInfo) => void;
    animePage: AnimePage<any>;
}

interface AnimeSearchResultDialogState {
    loading: boolean;
    results?: AnimeInfo[];
    searchQuery?: string;
    currentAnimeUID?: string;
    currentAnime?: AnimeInfo;
}

export default withStyles(styles)(withMobileDialog<AnimeSearchResultDialogProps>()(
    class AnimeSearchResultDialog extends React.Component<AnimeSearchResultDialogProps, AnimeSearchResultDialogState> {
        searchDebounced = AwesomeDebouncePromise(async (query: string) => {
            await this.search(query);
        }, 500);

        constructor(props: AnimeSearchResultDialogProps) {
            super(props);
            this.state = {
                loading: true,
            };
        }

        async handleDialogEnter() {
            const {animePage} = this.props;

            (async () => {
                const currentAnimeUID = await animePage.getAnimeUID();
                this.setState({currentAnimeUID});
            })();

            const searchQuery = await animePage.getAnimeSearchQuery();
            if (!searchQuery) {
                this.setState({loading: false});
                return;
            }

            await this.search(searchQuery);
        }

        async search(query: string) {
            const {animePage} = this.props;
            const state = animePage.state;

            this.setState({loading: true, searchQuery: query});

            let results: AnimeInfo[] | undefined;
            const config = await state.config;
            const searchResults = await GrobberClient.searchAnime(query, 10);
            if (searchResults) {
                let consideration = searchResults
                    .filter(res => res.certainty >= config.minCertaintyForSearchResult);

                if (consideration.length === 0) consideration = searchResults;

                results = consideration
                    .map(res => res.anime);
            }

            this.setState({loading: false, results});
        }

        handleSelect(anime: AnimeInfo) {
            const {currentAnimeUID} = this.state;
            if (anime.uid == currentAnimeUID) return;

            this.setState({currentAnimeUID: anime.uid, currentAnime: anime});
        }

        renderContent(): React.ReactNode {
            const {loading, results, currentAnimeUID} = this.state;

            if (loading) {
                return (
                    <CircularProgress/>
                );
            } else if (results && results.length > 0) {
                return (
                    <AnimeSelection anime={results} currentUID={currentAnimeUID}
                                    onSelect={(anime) => this.handleSelect(anime)}/>
                );
            } else {
                return (
                    <Typography variant="overline">{_("anime__search__no_results")}</Typography>
                );
            }
        }

        render(): React.ReactNode {
            const {classes, open, onClose, fullScreen} = this.props;
            const {searchQuery, currentAnime} = this.state;

            return (
                <Dialog
                    fullScreen={fullScreen}
                    open={open}
                    onEnter={() => this.handleDialogEnter()}
                    onBackdropClick={() => onClose && onClose()}
                    scroll="paper"
                    aria-labelledby="anime-search-result-dialog-title"
                    style={{zIndex: 10000}}
                >
                    <Toolbar>
                        <DialogTitle id="anime-search-result-dialog-title">
                            {_("anime__search__title")}
                        </DialogTitle>
                        <div className={classes.grow}/>
                        {searchQuery && (
                            <div className={classes.search}>
                                <div className={classes.searchIcon}>
                                    <SearchIcon/>
                                </div>
                                <InputBase
                                    placeholder={_("anime__search__search_placeholder")}
                                    defaultValue={searchQuery}
                                    onChange={event => this.searchDebounced(event.target.value)}
                                    classes={{
                                        root: classes.inputRoot,
                                        input: classes.inputInput,
                                    }}
                                />
                            </div>
                        )}
                    </Toolbar>
                    <DialogContent className={classes.content}>
                        {this.renderContent()}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => onClose && onClose()} color="primary">
                            {_("anime__search__abort")}
                        </Button>
                        {currentAnime && (
                            <Button onClick={() => onClose && onClose(currentAnime)} variant="contained"
                                    color="primary">
                                {_("anime__search__pick")}
                            </Button>
                        )}
                    </DialogActions>
                </Dialog>
            );
        }
    }
));