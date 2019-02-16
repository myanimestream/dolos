/**
 * @module debug
 */

import {
    ExpansionPanel,
    ExpansionPanelDetails,
    ExpansionPanelSummary,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from "@material-ui/core";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import {usePromiseMemo} from "dolos/hooks";
import {useConfigChange} from "dolos/options/SettingsTab";
import {Store, StoreElement} from "dolos/store";
import * as React from "react";
import {DynamicInput} from "./DynamicInput";

/**
 * Wrapper for store element values which uses [[StoreElementInput]]
 * to display itself and uses [[useConfigChange]] to keep itself updated.
 */
function StoreElementValue({element, propKey}: { element: StoreElement<any>, propKey: any }) {
    const [value, setValue] = useConfigChange(element, propKey);
    return (<DynamicInput value={value} onChange={setValue}/>);
}

/**
 * React component for displaying a [[StoreElement]].
 * This is for debug purposes only. All values are shown with [[StoreElementValue]]
 * and as such may be edited.
 */
export function StoreElementComponent({element}: { element: StoreElement<any> }) {
    const entries = element.ownKeys().map(key => [key, element.get(key)]);

    const fieldRows = entries.map(([key, value]) => {
        let valueCellContent;

        if (value instanceof StoreElement)
            valueCellContent = (<StoreElementComponent element={value}/>);
        else
            valueCellContent = (<StoreElementValue element={element} propKey={key}/>);

        return (
            <TableRow key={key}>
                <TableCell>{key}</TableCell>
                <TableCell>{valueCellContent}</TableCell>
            </TableRow>
        );
    });

    return (
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell>Key</TableCell>
                    <TableCell>Value</TableCell>
                </TableRow>
            </TableHead>

            <TableBody>
                {fieldRows}
            </TableBody>
        </Table>
    );
}

/**
 * React component for displaying the contents of the extension storage.
 * Uses [[Store]] to get [[StoreElement]] wrappers around the actual object.
 *
 * Doesn't display primitive values.
 */
export function StoreComponent({store}: { store: Store }) {
    const elements = usePromiseMemo(() => store.getAllStoreElements(), {});

    const elementComponents = Object.entries(elements).map(([key, element]) => {
        return (
            <ExpansionPanel key={key}>
                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                    <Typography variant="h6" gutterBottom>{key}</Typography>
                </ExpansionPanelSummary>

                <ExpansionPanelDetails>
                    <StoreElementComponent element={element}/>
                </ExpansionPanelDetails>
            </ExpansionPanel>
        );
    });

    return (
        <>
            {elementComponents}
        </>
    );
}
