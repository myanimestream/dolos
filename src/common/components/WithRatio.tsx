/**
 * @module common.components
 */

import Paper from "@material-ui/core/Paper";
import createStyles from "@material-ui/core/styles/createStyles";
import withStyles, {WithStyles} from "@material-ui/core/styles/withStyles";
import * as React from "react";

/** @ignore */
const styles = () => createStyles({
    ratioContainer: {
        alignItems: "center",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "center",
        position: "absolute",
        width: "100%",
    },
    ratioSpacer: {
        position: "relative",
        width: "100%",
    },
});

interface WithRatioProps extends WithStyles<typeof styles> {
    children: React.ReactNode;
    ratio: number;
}

// tslint:disable-next-line:variable-name
export const WithRatio = withStyles(styles)(
    class extends React.Component<WithRatioProps> {
        public render() {
            const {classes, children, ratio} = this.props;

            return (
                <Paper className={classes.ratioSpacer} style={{paddingBottom: `${100 * (1 / ratio)}%`}}>
                    <div className={classes.ratioContainer}>
                        {children}
                    </div>
                </Paper>
            );
        }
    },
);
