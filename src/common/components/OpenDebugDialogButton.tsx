/** @module common/components */

import {Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton} from "@material-ui/core";
import {BuildOutlined as BuildOutlinedIcon} from "@material-ui/icons";
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
            <IconButton color="secondary" onClick={handleOpen}><BuildOutlinedIcon/></IconButton>

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
