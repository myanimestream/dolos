/**
 * @module common/components
 */

/** @ignore */

import Button, {ButtonProps} from "@material-ui/core/Button";
import {useSubscription} from "dolos/hooks";
import {InjectedNotistackProps, OptionsObject, SnackbarProvider, VariantType, withSnackbar} from "notistack";
import * as React from "react";
import {Subject} from "rxjs";
import _ = chrome.i18n.getMessage;

export interface SnackbarAction {
    text: string;
    /**
     * Props passed to the underlying [[Button]]
     * By default the props consist of:
     * ```typescript
     *
     * {
     *     color: "secondary",
     *     size: "small"
     * }
     * ```
     */
    buttonProps?: ButtonProps;
    /**
     * Really just a "nicer" way of specifying [[SnackbarMessage.onClickAction]]
     */
    onClick?: () => void;
}

function isSnackbarAction(action: any): action is SnackbarAction {
    // ignore primitive
    if (typeof action !== "object" || action === null)
        return false;

    return [
        "text",
    ].every(attr => attr in action);
}

/**
 * Template for a Snackbar which can be displayed using [[SnackbarQueue]].
 */
export interface SnackbarMessage extends OptionsObject {
    message: string;
    action?: React.ReactNode | SnackbarAction;
}

/**
 * Convenience function to create a snackbar message.
 */
export function resolveSnackbarMessage(message: string | SnackbarMessage, variant?: VariantType): SnackbarMessage {
    if (typeof message === "string") message = {message};

    message.variant = variant;
    return message;
}

interface SnackbarListenerProps {
    snackbarMessage$: Subject<SnackbarMessage>;
}

/**
 * Because [[SnackbarProvider]] passes the [[enqueueSnackbar]] down to its
 * children using a React context it isn't accessible to the [[SnackbarQueue]].
 *
 * This is a hidden component which subscribes to the [[SnackbarListenerProps.snackbarMessage$]]
 * observable and calls [[enqueueSnackbar]].
 */
// tslint:disable-next-line:variable-name
const SnackbarListener = withSnackbar(
    (props: SnackbarListenerProps & InjectedNotistackProps) => {
        useSubscription(props.snackbarMessage$, msg => {
            const action = msg.action;
            if (isSnackbarAction(action)) {
                const buttonProps: ButtonProps = {
                    color: "secondary",
                    size: "small",
                };

                if (action.buttonProps)
                    Object.assign(buttonProps, action.buttonProps);

                msg.action = (
                    <Button {...buttonProps}>
                        {action.text}
                    </Button>
                );

                if (action.onClick)
                    msg.onClickAction = action.onClick;
            }

            props.enqueueSnackbar(msg.message, msg);
        });

        return null;
    },
);

export interface SnackbarQueueProps extends SnackbarListenerProps {
    /** defaults to 3 */
    maxMessages?: number;
}

/**
 * A Snackbar queue which takes snackbars from an observable
 * ([[SnackbarListenerProps.snackbarMessage$]]) and shows them.
 */
export function SnackbarQueue(props: SnackbarQueueProps) {
    const {maxMessages} = props;

    const snackbarAction = (
        <Button color="secondary" size="small">
            {_("snackbar__dismiss")}
        </Button>
    );

    return (
        <SnackbarProvider
            maxSnack={maxMessages || 3}
            action={snackbarAction}
        >
            <SnackbarListener {...props}/>
        </SnackbarProvider>
    );
}
