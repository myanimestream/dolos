/**
 * @module debug
 */

import {CssBaseline, Typography} from "@material-ui/core";
import Store from "dolos/store";
import * as React from "react";
import {StoreComponent} from "./Store";

export function Debug() {
    return (
        <>
            <CssBaseline/>

            <Typography variant="h4" gutterBottom>Store</Typography>
            <Typography paragraph>
                This is a list of all values in the Dolos store.
                Please be careful when editing values as it directly manipulates
                the actual values used by Dolos.

                There is no input validation other than the basic type distinction.
            </Typography>

            <StoreComponent store={Store}/>
        </>
    );
}
