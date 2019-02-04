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

            if (epsWatched === undefined) {
                const msg = _("anime__continue_watching__unknown");

                this.setState({
                    tooltip: msg,
                    disabled: true,
                });

                animePage.service.showWarningSnackbar(msg);

                return;
            }

            if (anime.episodes > epsWatched) {
                const href = await animePage.getEpisodeURL(epsWatched);

                this.setState({
                    href,
                    onClick: () => animePage.showEpisode(epsWatched),
                    tooltip: _("anime__continue_watching__available", [epsWatched + 1]),
                    disabled: false,
                });
            } else {
                const totalEpisodes = await animePage.getEpisodeCount();
                if (epsWatched === totalEpisodes) {
                    this.setState({
                        tooltip: _("anime__continue_watching__completed"),
                        disabled: true,
                    });
                } else {
                    this.setState({
                        tooltip: _("anime__continue_watching__unavailable", [epsWatched + 1]),
                        disabled: true,
                    });
                }
            }
        }

        render() {
            const {classes} = this.props;
            const {tooltip, href, onClick, disabled} = this.state;

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
                            {_("anime__continue_watching")}
                        </Button>
                    </div>
                </Tooltip>
            );
        }
    }
);