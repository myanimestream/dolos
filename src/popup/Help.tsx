/** @module popup */

import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableRow from "@material-ui/core/TableRow";
import Typography from "@material-ui/core/Typography";
import {remoteGrobberClient} from "dolos/grobber";
import {usePromiseMemo} from "dolos/hooks";
import {getVersion} from "dolos/info";
import * as React from "react";
import _ = chrome.i18n.getMessage;

export function Help() {
    const grobberInfo = usePromiseMemo(() => remoteGrobberClient.getGrobberInfo(), [remoteGrobberClient]);

    return (
        <>
            <Typography variant="h6">{_("popup__help__information__header")}</Typography>
            <Table>
                <TableBody>
                    <TableRow>
                        <TableCell>{_("popup__help__information__dolos_version")}</TableCell>
                        <TableCell>{getVersion()}</TableCell>
                    </TableRow>

                    <TableRow>
                        <TableCell>{_("popup__help__information__grobber_version")}</TableCell>
                        <TableCell>{grobberInfo ? grobberInfo.version : _("general__loading")}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </>
    );
}
