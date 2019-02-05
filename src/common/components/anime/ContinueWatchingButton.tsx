/**
 * @module common.components.anime
 */

import Button from "@material-ui/core/Button";
import {Theme} from "@material-ui/core/styles/createMuiTheme";
import createStyles from "@material-ui/core/styles/createStyles";
import withStyles, {WithStyles} from "@material-ui/core/styles/withStyles";
import Tooltip from "@material-ui/core/Tooltip";
import PlayCircleIcon from "@material-ui/icons/PlayCircleFilled";
import Service from "dolos/common/service";
import * as React from "react";
import {Subscription} from "rxjs";
import {AnimePage} from "../../pages";
import _ = chrome.i18n.getMessage;

/** @ignore */
const styles = (theme: Theme) => createStyles({
    buttonIconLeft: {
        marginRight: theme.spacing.unit,
    }
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

export default withStyles(styles)(
    class ContinueWatchingButton extends React.Component<ContinueWatchingButtonProps, ContinueWatchingButtonState> {
        private episodesWatchedSub?: Subscription;

        constructor(props: ContinueWatchingButtonProps) {
            super(props);

            this.state = {
                tooltip: _("anime__continue_watching__loading"),
                buttonText: _("anime__continue_watching"),
                disabled: true,
            }
        }

        async componentDidMount() {
            const {animePage} = this.props;
            this.episodesWatchedSub = (await animePage.getEpisodesWatched$())
                .subscribe((epsWatched) => this.handleEpisodesWatchedChanged(epsWatched));
        }

        componentWillUnmount(): void {
            if (this.episodesWatchedSub) this.episodesWatchedSub.unsubscribe();
        }

        async handleEpisodesWatchedChanged(epsWatched?: number) {
            const {animePage} = this.props;
            const anime = await animePage.getAnime();

            if (!anime) {
                const msg = _("anime__continue_watching__anime_unknown");

                this.setState({
                    tooltip: msg,
                    disabled: true,
                });

                animePage.service.showWarningSnackbar(msg);

                return;
            }

            let buttonText;

            // either undefined or 0 i.e. the user hasn't started the Anime
            if (!epsWatched) {
                const msg = _("anime__continue_watching__unknown");

                this.setState({
                    tooltip: msg,

                    disabled: true,
                });

                epsWatched = 0;
                buttonText = _("anime__continue_watching__start");
            } else {
                buttonText = _("anime__continue_watching");
            }

            if (anime.episodes > epsWatched) {
                const href = await animePage.getEpisodeURL(epsWatched);

                this.setState({
                    href,
                    buttonText,
                    onClick: () => animePage.showEpisode(epsWatched as number),
                    tooltip: _("anime__continue_watching__available", [epsWatched + 1]),
                    disabled: false,
                });
            } else {
                const totalEpisodes = await animePage.getEpisodeCount();
                if (epsWatched === totalEpisodes) {
                    this.setState({
                        buttonText,
                        tooltip: _("anime__continue_watching__completed"),
                        disabled: true,
                    });
                } else {
                    this.setState({
                        buttonText,
                        tooltip: _("anime__continue_watching__unavailable", [epsWatched + 1]),
                        disabled: true,
                    });
                }
            }
        }

        render() {
            const {classes} = this.props;
            const {tooltip, buttonText, href, onClick, disabled} = this.state;

            return (
                <Tooltip title={tooltip}>
                    <div>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={event => {
                                event.preventDefault();
                                if (onClick)
                                    onClick();
                            }}
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
    }
);