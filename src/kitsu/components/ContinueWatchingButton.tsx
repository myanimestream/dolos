import IconButton from "@material-ui/core/IconButton";
import {Theme} from "@material-ui/core/styles/createMuiTheme";
import createStyles from "@material-ui/core/styles/createStyles";
import withStyles, {WithStyles} from "@material-ui/core/styles/withStyles";
import PlayCircleIcon from "@material-ui/icons/PlayCircleFilled";
import * as React from "react";

const styles = (theme: Theme) => createStyles({
    buttonContinue: {
        backgroundColor: theme.palette.primary.main,
        marginLeft: "10px",
    }
});

interface ContinueWatchingButtonProps extends WithStyles<typeof styles> {
    href: string;
    disabled: boolean;
}

export default withStyles(styles)(class ContinueWatchingButton extends React.Component<ContinueWatchingButtonProps> {

    render() {
        const {classes, href, disabled} = this.props;

        return (
            <IconButton
                className={`button button--primary button--quick-update hint--left hint--medium hint--bounce hint--rounded ${classes.buttonContinue}`}
                aria-label="Continue"
                {...{href, disabled}}
            >
                <PlayCircleIcon/>
            </IconButton>
        );
    }
});