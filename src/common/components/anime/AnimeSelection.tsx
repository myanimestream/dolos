/**
 * @module common.components.anime
 */

import GridList from "@material-ui/core/GridList";
import GridListTile from "@material-ui/core/GridListTile";
import createStyles from "@material-ui/core/styles/createStyles";
import withStyles, {WithStyles} from "@material-ui/core/styles/withStyles";
import {AnimeInfo} from "dolos/grobber";
import * as React from "react";
import {AnimeCard} from ".";

/** @ignore */
const styles = () => createStyles({
    listTile: {
        overflow: "visible",
    },
});

export interface AnimeSelectionProps extends WithStyles<typeof styles, true> {
    anime: AnimeInfo[];
    currentUID?: string;
    onSelect?: (anime: AnimeInfo) => void;
}

// tslint:disable-next-line:variable-name
export const AnimeSelection = withStyles(styles, {withTheme: true})(
    class extends React.Component<AnimeSelectionProps> {
        public onSelect(anime: AnimeInfo) {
            const {onSelect} = this.props;
            if (onSelect) onSelect(anime);
        }

        public render(): React.ReactNode {
            const {theme, anime} = this.props;

            const renderAnimeTile = this.renderTile.bind(this);

            return (
                <GridList cellHeight="auto" cols={4} spacing={2 * theme.spacing.unit}>
                    {anime.map(renderAnimeTile)}
                </GridList>
            );
        }

        private renderTile(anime: AnimeInfo) {
            const {classes, currentUID} = this.props;

            const handleSelect = () => this.onSelect(anime);

            return (
                <GridListTile key={anime.uid} classes={{tile: classes.listTile}}>
                    <AnimeCard
                        animeInfo={anime}
                        current={currentUID === anime.uid}
                        onClick={handleSelect}
                    />
                </GridListTile>
            );
        }
    },
);
