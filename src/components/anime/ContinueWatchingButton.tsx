/**
 * @module components/anime
 */

import Button from "@material-ui/core/Button";
import {Theme} from "@material-ui/core/styles/createMuiTheme";
import createStyles from "@material-ui/core/styles/createStyles";
import withStyles, {WithStyles} from "@material-ui/core/styles/withStyles";
import Tooltip from "@material-ui/core/Tooltip";
import PlayCircleIcon from "@material-ui/icons/PlayCircleFilled";
import {Service} from "dolos/common";
import {AnimePage} from "dolos/common/pages";
import * as React from "react";
import {Subscription} from "rxjs";
import _ = chrome.i18n.getMessage;

/** @ignore */
const styles = (theme: Theme) => createStyles({
    buttonIconLeft: {
        marginRight: theme.spacing(1),
    },
});

export interface ContinueWatchingButtonState {
    href?: string;
    onClick?: () => void;
    tooltip: string;
    buttonText: string;
    disabled: boolean;
}

export interface ContinueWatchingButtonProps extends WithStyles<typeof styles> {
    animePage: AnimePage<Service>;
}

// tslint:disable-next-line:variable-name
export const ContinueWatchingButton = withStyles(styles)(
    class extends React.Component<ContinueWatchingButtonProps, ContinueWatchingButtonState> {
        private episodesWatchedSub?: Subscription;

        constructor(props: ContinueWatchingButtonProps) {
            super(props);

            this.state = {
                buttonText: _("anime__continue_watching__loading"),
                disabled: true,
                tooltip: _("anime__continue_watching__loading"),
            };
        }

        public async componentDidMount() {
            const {animePage} = this.props;
            this.episodesWatchedSub = (await animePage.getEpisodesWatched$())
                .subscribe(epsWatched => this.handleEpisodesWatchedChanged(epsWatched));
        }

        public componentWillUnmount(): void {
            if (this.episodesWatchedSub) this.episodesWatchedSub.unsubscribe();
        }

        public async showEpisode(episodeIndex: number) {
            const {animePage} = this.props;

            const success = await animePage.showEpisode(episodeIndex);
            if (!success)
                animePage.service.showErrorSnackbar(_("anime__show_episode__failed"));
        }

        public async handleEpisodesWatchedChanged(epsWatched?: number) {
            const {animePage} = this.props;
            // TODO if this takes too long, show a "take me to the next episode anyway" kind of button
            const anime = await animePage.getAnime();

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

        public render() {
            const {classes} = this.props;
            const {tooltip, buttonText, href, onClick, disabled} = this.state;

            const handleClick = (event: React.MouseEvent) => {
                event.preventDefault();
                if (onClick) onClick();
            };

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
    },
);
