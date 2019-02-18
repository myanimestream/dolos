/**
 * @module debug
 */

import {ListItem} from "@material-ui/core";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import List from "@material-ui/core/List";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemText from "@material-ui/core/ListItemText";
import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import {usePromiseMemo} from "dolos/hooks";
import {useConfigChange} from "dolos/options";
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

    const elements = entries.map(([key, value]) => {

        if (value instanceof StoreElement)
            return (
                <ExpansionPanel key={key}>
                    <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                        <Typography variant="h6">{key}</Typography>
                    </ExpansionPanelSummary>

                    <ExpansionPanelDetails>
                        <StoreElementComponent element={value}/>
                    </ExpansionPanelDetails>
                </ExpansionPanel>
            );
        else
            return (
                <ListItem key={key}>
                    <ListItemText primary={key}/>
                    <ListItemSecondaryAction>
                        <StoreElementValue element={element} propKey={key}/>
                    </ListItemSecondaryAction>
                </ListItem>
            );

    });

    return (
        <List style={{width: "100%"}}>
            {elements}
        </List>
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
