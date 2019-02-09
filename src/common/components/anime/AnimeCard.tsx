/**
 * @module common.components.anime
 */

import Card from "@material-ui/core/Card";
import CardActionArea from "@material-ui/core/CardActionArea";
import CardContent from "@material-ui/core/CardContent";
import CardMedia from "@material-ui/core/CardMedia";
import createStyles from "@material-ui/core/styles/createStyles";
import withStyles, {WithStyles} from "@material-ui/core/styles/withStyles";
import Typography from "@material-ui/core/Typography";
import {AnimeInfo} from "dolos/grobber";
import * as React from "react";
import _ = chrome.i18n.getMessage;

/** @ignore */
const styles = () => createStyles({
    animeCard: {},
    thumbnail: {
        objectFit: "cover",
    },
});

export interface AnimeCardProps extends WithStyles<typeof styles> {
    animeInfo: AnimeInfo;
    current?: boolean;
    onClick?: React.ReactEventHandler;
}

// tslint:disable-next-line:variable-name
export const AnimeCard = withStyles(styles)(
    class extends React.Component<AnimeCardProps> {
        public render(): React.ReactNode {
            const {classes, animeInfo, current, onClick} = this.props;

            return (
                <Card className={classes.animeCard} raised={current} onClick={onClick}>
                    <CardActionArea>
                        <CardMedia
                            className={classes.thumbnail}
                            // @ts-ignore
                            component="img"
                            src={animeInfo.thumbnail}
                            title={animeInfo.title}
                        />
                        <CardContent>
                            <Typography gutterBottom={true} variant="caption" color={current ? "primary" : "default"}>
                                {animeInfo.title}
                            </Typography>
                            <Typography variant="subtitle2" color="textSecondary">
                                {_("anime__episode_count", [animeInfo.episodes])}
                            </Typography>
                        </CardContent>
                    </CardActionArea>
                </Card>
            );
        }
    },
);
