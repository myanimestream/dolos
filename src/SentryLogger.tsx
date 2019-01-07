import Button from "@material-ui/core/Button";
import Card from "@material-ui/core/Card";
import CardActionArea from "@material-ui/core/CardActionArea";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import withTheme, {WithTheme} from "@material-ui/core/styles/withTheme";
import Typography from "@material-ui/core/Typography";
import * as Sentry from "@sentry/browser";
import * as React from "react";
import {CopyToClipboard} from "react-copy-to-clipboard";
import _ = chrome.i18n.getMessage;


interface SentryLoggerProps extends WithTheme {
}

interface SentryLoggerState {
    error?: Error;
    eventId?: string;
}

export default withTheme()(
    class SentryLogger extends React.Component<SentryLoggerProps, SentryLoggerState> {
        constructor(props) {
            super(props);
            this.state = {};
        }

        componentDidCatch(error, errorInfo) {
            this.setState({error});

            Sentry.withScope(scope => {
                Object.keys(errorInfo).forEach(key => {
                    scope.setExtra(key, errorInfo[key]);
                });

                const eventId = Sentry.captureException(error);
                this.setState({eventId});
            });
        }

        render() {
            const {error, eventId} = this.state;
            const {theme} = this.props;

            if (error) return (
                <Card>
                    <CardActionArea>
                        <CardContent>
                            <Typography gutterBottom variant="h5">{_("sentry__title")}</Typography>
                            <Typography>{_("sentry__description")}</Typography>
                            {eventId && <>
                                <Typography>
                                    {_("sentry__event_id")}
                                    <span style={{color: theme.palette.error.main}}> {eventId}</span>
                                </Typography>
                            </>}

                        </CardContent>
                    </CardActionArea>
                    <CardActions>
                        <Button size="small" color="primary" onClick={() => Sentry.showReportDialog()}>
                            {_("sentry__report")}
                        </Button>
                        <CopyToClipboard text={eventId}>
                            <Button size="small" color="primary">
                                {_("sentry__copy_event_id")}
                            </Button>
                        </CopyToClipboard>
                    </CardActions>
                </Card>
            );
            else return this.props.children;
        }
    }
);