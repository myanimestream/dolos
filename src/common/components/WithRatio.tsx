import Paper from "@material-ui/core/Paper";
import createStyles from "@material-ui/core/styles/createStyles";
import withStyles, {WithStyles} from "@material-ui/core/styles/withStyles";
import * as React from "react";

const styles = () => createStyles({
    ratioSpacer: {
        position: "relative",
        width: "100%",
    },
    ratioContainer: {
        position: "absolute",
        width: "100%",
        height: "100%",
    }
});

interface WithRatioProps extends WithStyles<typeof styles> {
    children: React.ReactNode;
    ratio: number;
}

export default withStyles(styles)(class WithRatio extends React.Component<WithRatioProps> {
    render() {
        const {classes, children, ratio} = this.props;

        return (
            <Paper className={classes.ratioSpacer} style={{paddingBottom: `${100 * (1 / ratio)}%`}}>
                <div className={classes.ratioContainer}>
                    {children}
                </div>
            </Paper>
        );
    }
});