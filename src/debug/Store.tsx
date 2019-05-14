/**
 * @module debug
 */

import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import {DynamicInput} from "dolos/debug/DynamicInput";
import {useDebouncedState, useObservableMemo} from "dolos/hooks";
import {MutItem, StorageAreaName} from "dolos/store";
import {createAllMutRootItems$, MutItemArray} from "dolos/store/debug";
import * as React from "react";

/**
 * React component for displaying a [[MutItem]].
 */
export function StoreItem({item}: { item: MutItem<any> }) {
    const value = useObservableMemo(() => item.value$, [item]);
    const setValue = React.useCallback((newValue: any) => item.set(newValue), [item]);
    const [internalValue, handleChange] = useDebouncedState(setValue, 200, value);

    return <DynamicInput value={internalValue} onChange={handleChange}/>;
}

/**
 * React component for displaying the contents of the extension storage.
 */
export function StoreComponent() {
    const items: MutItemArray<any> = useObservableMemo(
        () => createAllMutRootItems$(StorageAreaName.Sync), [],
        [] as MutItemArray<any>,
    );

    const elementComponents = items.map(item => {
        const path = item.path;

        // TODO delete button
        return (
            <ExpansionPanel key={path} TransitionProps={{unmountOnExit: true}}>
                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                    <Typography variant="h6" gutterBottom>{path}</Typography>
                </ExpansionPanelSummary>

                <ExpansionPanelDetails>
                    <StoreItem item={item}/>
                </ExpansionPanelDetails>
            </ExpansionPanel>
        );
    });

    return (
        <>{elementComponents}</>
    );
}
