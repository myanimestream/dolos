import * as Sentry from "@sentry/browser";
import * as React from "react";

interface SentryLoggerState {
    error: Error;
}

export default class SentryLogger extends React.Component<{}, SentryLoggerState> {
    constructor(props) {
        super(props);
        this.state = {error: null};
    }

    componentDidCatch(error, errorInfo) {
        this.setState({error});

        Sentry.withScope(scope => {
            Object.keys(errorInfo).forEach(key => {
                scope.setExtra(key, errorInfo[key]);
            });
            Sentry.captureException(error);
        });
    }

    render() {
        if (this.state.error) return (
            <a onClick={() => Sentry.showReportDialog()}>Report feedback</a>
        );
        else return this.props.children;
    }
}