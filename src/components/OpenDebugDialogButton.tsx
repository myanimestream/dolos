/** @module components */

import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import IconButton from "@material-ui/core/IconButton";
import BuildOutlinedIcon from "@material-ui/icons/BuildOutlined";
import {Debug, DebugProps} from "dolos/debug";
import {useObservableMemo} from "dolos/hooks";
import {store} from "dolos/store";
import * as React from "react";

/**
 * [[Debug]] menu in a dialog which can be opened by pressing the button.
 */
export function OpenDebugDialogButton(props: DebugProps) {
    const [open, setOpen] = React.useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    return (
        <>
            <IconButton color="secondary" onClick={handleOpen}>
                <BuildOutlinedIcon/>
            </IconButton>

            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="lg"
            >
                <DialogTitle>Debug</DialogTitle>

                <DialogContent>
                    {open && <Debug {...props}/>}
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleClose} color="primary">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

/**
 * Same as [[OpenDebugDialogButton]] but only exists if [[Config.debugMode]] is
 * true.
 */
export function SmartOpenDebugDialogButton(props: DebugProps) {
    const config = useObservableMemo(() => store.getConfig$(), [store]);
    if (!(config && config.debugMode)) return null;

    return (
        <div><OpenDebugDialogButton {...props}/></div>
    );
}
