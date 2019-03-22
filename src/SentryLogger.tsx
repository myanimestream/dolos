/**
 * @module logging
 */

/** @ignore */

import Button from "@material-ui/core/Button";
import Card from "@material-ui/core/Card";
import CardActionArea from "@material-ui/core/CardActionArea";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import withTheme, {WithTheme} from "@material-ui/core/styles/withTheme";
import Typography from "@material-ui/core/Typography";
import * as Sentry from "@sentry/browser";
import * as React from "react";
import * as CopyToClipboard from "react-copy-to-clipboard";
import _ = chrome.i18n.getMessage;

type SentryLoggerProps = WithTheme;

interface SentryLoggerState {
    error?: Error;
    eventId?: string;
}

/**
 * A wrapper for React element which automatically catches and reports errors.
 *
 * When there is no error it just renders its children.
 * If there is an error it displays an interface providing
 * the user with the option to report this error.
 *
 * @see [[wrapSentryLogger]]
 */
class SentryLogger extends React.Component<SentryLoggerProps, SentryLoggerState> {
    constructor(props: SentryLoggerProps) {
        super(props);
        this.state = {};
    }

    public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        this.setState({error});

        Sentry.withScope(scope => {
            Object.keys(errorInfo).forEach(key => {
                // @ts-ignore
                scope.setExtra(key, errorInfo[key]);
            });

            const eventId = Sentry.captureException(error);
            this.setState({eventId});
        });
    }

    public render() {
        const {error, eventId} = this.state;
        const {theme} = this.props;

        if (error) {
            let eventIDDisplay;
            if (eventId)
                eventIDDisplay = (
                    <Typography>
                        {_("sentry__event_id")}
                        <span style={{color: theme.palette.error.main}}> {eventId}</span>
                    </Typography>
                );

            const showReportDialog = () => Sentry.showReportDialog();

            return (
                <Card>
                    <CardActionArea>
                        <CardContent>
                            <Typography gutterBottom variant="h5">{_("sentry__title")}</Typography>
                            <Typography>{_("sentry__description")}</Typography>
                            {eventIDDisplay}

                        </CardContent>
                    </CardActionArea>
                    <CardActions>
                        <Button size="small" color="primary" onClick={showReportDialog}>
                            {_("sentry__report")}
                        </Button>
                        <CopyToClipboard text={eventId || "?"}>
                            <Button size="small" color="primary">
                                {_("sentry__copy_event_id")}
                            </Button>
                        </CopyToClipboard>
                    </CardActions>
                </Card>
            );
        } else return this.props.children;
    }
}

export default withTheme(SentryLogger);
