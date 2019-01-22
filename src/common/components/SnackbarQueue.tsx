/**
 * @module common.components
 */

import amber from "@material-ui/core/colors/amber";
import green from "@material-ui/core/colors/green";
import IconButton from "@material-ui/core/IconButton";
import Snackbar from "@material-ui/core/Snackbar";
import {Theme} from "@material-ui/core/styles/createMuiTheme";
import createStyles from "@material-ui/core/styles/createStyles";
import withStyles, {WithStyles} from "@material-ui/core/styles/withStyles";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import CloseIcon from "@material-ui/icons/Close";
import ErrorIcon from "@material-ui/icons/Error";
import InfoIcon from "@material-ui/icons/Info";
import WarningIcon from "@material-ui/icons/Warning";
import * as React from "react";
import * as rxjs from "rxjs";

export interface SnackbarMessage {
    key?: any;
    message: string;
    type?: "info" | "success" | "error" | "warning";
    autoHideDuration?: number;
}

const SnackbarMessageDefaults: Partial<SnackbarMessage> = {
    autoHideDuration: 6000,
};

const iconVariant = {
    success: CheckCircleIcon,
    warning: WarningIcon,
    error: ErrorIcon,
    info: InfoIcon,
};

/** @ignore */
const styles = (theme: Theme) => createStyles({
    success: {
        backgroundColor: green[600],
    },
    error: {
        backgroundColor: theme.palette.error.dark,
    },
    info: {
        backgroundColor: theme.palette.primary.dark,
    },
    warning: {
        backgroundColor: amber[700],
    },
    iconVariant: {
        fontSize: 20,
        opacity: 0.9,
        marginRight: theme.spacing.unit,
    },
    message: {
        display: "flex",
        alignItems: "center",
    },
});

interface SnackbarQueueProps extends WithStyles<typeof styles> {
    snackbarMessage$: rxjs.Subject<SnackbarMessage>
}

interface SnackbarQueueState {
    snackbarMessage?: SnackbarMessage;
    open: boolean;
}

export default withStyles(styles)(class SnackbarQueue extends React.Component<SnackbarQueueProps, SnackbarQueueState> {
    snackbarMessageSub?: rxjs.Subscription;

    constructor(props: SnackbarQueueProps) {
        super(props);
        this.state = {
            open: false,
        };
    }

    componentDidMount() {
        const {snackbarMessage$} = this.props;

        this.snackbarMessageSub = snackbarMessage$.subscribe(message => {
            message = Object.assign({},
                SnackbarMessageDefaults,
                {key: new Date().getTime()},
                message);

            this.setState({snackbarMessage: message, open: true});
        });
    }

    componentWillUnmount() {
        if (this.snackbarMessageSub) this.snackbarMessageSub.unsubscribe();
    }

    handleClose() {
        this.setState({open: false});
    }

    render() {
        const {classes} = this.props;
        const {open, snackbarMessage} = this.state;
        if (!snackbarMessage) return false;

        const Icon = snackbarMessage.type ? iconVariant[snackbarMessage.type] : undefined;
        const snackbarClassName = snackbarMessage.type ? classes[snackbarMessage.type] : undefined;

        return (
            <Snackbar
                key={snackbarMessage.key}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left",
                }}
                open={open}
                autoHideDuration={snackbarMessage.autoHideDuration}
                onClose={(_, reason) => {
                    if (reason !== "clickaway") this.handleClose();
                }}

                ContentProps={{
                    "aria-describedby": "message-id",
                    className: snackbarClassName
                }}

                message={
                    <span id="message-id" className={classes.message}>
                        {Icon && <Icon className={classes.iconVariant}/>}
                        {snackbarMessage.message}
                    </span>
                }

                action={[
                    <IconButton
                        key="close"
                        aria-label="Close"
                        color="inherit"
                        onClick={() => this.handleClose()}
                    >
                        <CloseIcon/>
                    </IconButton>
                ]}
            />
        );
    }
});