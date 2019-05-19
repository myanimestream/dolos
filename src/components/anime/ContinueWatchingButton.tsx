/**
 * @module components/anime
 */

import Button from "@material-ui/core/Button";
import {Theme} from "@material-ui/core/styles/createMuiTheme";
import Tooltip from "@material-ui/core/Tooltip";
import PlayCircleIcon from "@material-ui/icons/PlayCircleFilled";
import makeStyles from "@material-ui/styles/makeStyles";
import {Service} from "dolos/common";
import {AnimePage} from "dolos/common/pages";
import {AnimeInfo} from "dolos/grobber";
import * as React from "react";
import {combineLatest, of} from "rxjs";
import {SubscriptionLike} from "rxjs/internal/types";
import {catchError} from "rxjs/operators";
import _ = chrome.i18n.getMessage;

/** @ignore */
const useStyles = makeStyles((theme: Theme) => ({
    buttonIconLeft: {
        marginRight: theme.spacing(1),
    },
}));

interface ContinueWatchingButtonComponentProps {
    href?: string;
    onClick?: () => void;
    tooltip: string;
    buttonText: string;
    disabled: boolean;
}

function ContinueWatchingButtonComponent({
                                             tooltip,
                                             buttonText,
                                             href,
                                             onClick,
                                             disabled,
                                         }: ContinueWatchingButtonComponentProps) {
    const classes = useStyles();

    const handleClick = React.useCallback((event: React.MouseEvent) => {
        event.preventDefault();
        if (onClick) onClick();
    }, [onClick]);

    return (
        <Tooltip title={tooltip}>
            <div>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleClick}
                    fullWidth
                    {...{href, disabled}}
                >
                    <PlayCircleIcon className={classes.buttonIconLeft}/>
                    {buttonText}
                </Button>
            </div>
        </Tooltip>
    );
}

type ContinueWatchingButtonState = ContinueWatchingButtonComponentProps;

export interface ContinueWatchingButtonProps {
    animePage: AnimePage<Service>;
}

export class ContinueWatchingButton extends React.Component<ContinueWatchingButtonProps, ContinueWatchingButtonState> {
    private readonly subscriptions: SubscriptionLike[];

    constructor(props: ContinueWatchingButtonProps) {
        super(props);

        this.state = {
            buttonText: _("anime__continue_watching__loading"),
            disabled: true,
            tooltip: _("anime__continue_watching__loading"),
        };

        this.subscriptions = [];
    }

    public async componentDidMount() {
        const {animePage} = this.props;

        this.subscriptions.push(
            combineLatest([
                // TODO if this takes too long, show a "take me to the next episode anyway" kind of button
                animePage.getInfo$().pipe(catchError(() => of(undefined))),
                animePage.getEpisodesWatched$(),
            ]).subscribe(([anime, episodesWatched]) => this.handleEpisodesWatchedChanged(anime, episodesWatched)),
        );
    }

    public componentWillUnmount(): void {
        while (this.subscriptions.length > 0)
            this.subscriptions.pop()!.unsubscribe();
    }

    public render() {
        return <ContinueWatchingButtonComponent {...this.state}/>;
    }

    private async showEpisode(episodeIndex: number) {
        const {animePage} = this.props;

        const success = await animePage.showEpisode(episodeIndex);
        if (!success)
            animePage.service.showErrorSnackbar(_("anime__show_episode__failed"));
    }

    private async handleEpisodesWatchedChanged(anime: AnimeInfo | undefined, epsWatched: number | undefined) {
        const {animePage} = this.props;

        if (!anime) {
            const msg = _("anime__continue_watching__anime_unknown");

            this.setState({
                disabled: true,
                tooltip: msg,
            });

            animePage.service.showWarningSnackbar(msg);

            return;
        }

        let buttonText;

        // either undefined or 0 i.e. the user hasn't started the Anime
        if (!epsWatched) {
            const msg = _("anime__continue_watching__unknown");

            this.setState({
                disabled: true,
                tooltip: msg,
            });

            epsWatched = 0;
            buttonText = _("anime__continue_watching__start");
        } else {
            buttonText = _("anime__continue_watching");
        }

        if (anime.episodes > epsWatched) {
            const href = await animePage.getEpisodeURL(epsWatched);
            if (href) {
                this.setState({
                    buttonText,
                    disabled: false,
                    href,
                    onClick: () => this.showEpisode(epsWatched as number),
                    tooltip: _("anime__continue_watching__available", [epsWatched + 1]),
                });
            } else {
                // this isn't technically the truth but sometimes it's easier to lie
                this.setState({
                    buttonText,
                    disabled: true,
                    tooltip: _("anime__continue_watching__unavailable", [epsWatched + 1]),
                });
            }
        } else {
            const totalEpisodes = await animePage.getEpisodeCount();
            if (epsWatched === totalEpisodes) {
                this.setState({
                    buttonText,
                    disabled: true,
                    tooltip: _("anime__continue_watching__completed"),
                });
            } else {
                this.setState({
                    buttonText,
                    disabled: true,
                    tooltip: _("anime__continue_watching__unavailable", [epsWatched + 1]),
                });
            }
        }
    }
}
