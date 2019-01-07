import GridList from "@material-ui/core/GridList";
import GridListTile from "@material-ui/core/GridListTile";
import {Theme} from "@material-ui/core/styles/createMuiTheme";
import createStyles from "@material-ui/core/styles/createStyles";
import withStyles, {WithStyles} from "@material-ui/core/styles/withStyles";
import * as React from "react";
import {AnimeInfo} from "../../models";
import AnimeCard from "./AnimeCard";

const styles = (theme: Theme) => createStyles({
    listTile: {
        overflow: "visible",
    },
});

interface AnimeSelectionProps extends WithStyles<typeof styles> {
    anime: AnimeInfo[];
    currentUID?: string;
}

export default withStyles(styles)(
    class AnimeSelection extends React.Component<AnimeSelectionProps> {
        render(): React.ReactNode {
            const {classes, anime, currentUID} = this.props;

            return (
                <GridList cellHeight="auto" cols={3}>
                    {anime.map(anime => (
                        <GridListTile key={anime.uid} classes={{tile: classes.listTile}}>
                            <AnimeCard animeInfo={anime} current={currentUID === anime.uid}/>
                        </GridListTile>
                    ))}
                </GridList>
            );
        }
    }
);