/** @module common/components */

import {Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton} from "@material-ui/core";
import BuildIcon from "@material-ui/icons/Build";
import {Debug, DebugProps} from "dolos/debug";
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
            <IconButton color="secondary" onClick={handleOpen}><BuildIcon/></IconButton>

            <Dialog
                open={open}
                onClose={handleClose}
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
