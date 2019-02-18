/**
 * @module debug
 */

import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import List from "@material-ui/core/List";
import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import {ElementMemory, flattenNamespace, Memory, Namespace} from "dolos/memory";
import * as React from "react";
import {DynamicInput} from "./DynamicInput";

/**
 * Component for displaying a memory [[Namespace]].
 */
function NamespaceComponent({namespace}: { namespace: Namespace }) {
    let valueDisplay;
    if ("__value" in namespace) {
        const handleChange = (newValue: any) => namespace.__value = newValue;

        valueDisplay = (
            <DynamicInput value={namespace.__value} onChange={handleChange}/>
        );
    }

    const children = [];
    for (const [key, ns] of Object.entries(namespace)) {
        if (key === "__value") continue;
        children.push((
            <ExpansionPanel key={key}>
                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                    <Typography variant="h6">{key}</Typography>
                </ExpansionPanelSummary>

                <ExpansionPanelDetails>
                    <NamespaceComponent namespace={ns}/>
                </ExpansionPanelDetails>
            </ExpansionPanel>
        ));
    }

    return (
        <div>
            {valueDisplay}

            <List>
                {children}
            </List>
        </div>
    );
}

export function MemoryComponent({memory}: { memory: Memory }) {
    // @ts-ignore
    const memoryNamespace = (<NamespaceComponent namespace={memory.internalMemory}/>);

    let elementNamespace;
    if (memory instanceof ElementMemory) {
        // // @ts-ignore
        // elementNamespace = (<NamespaceComponent namespace={memory.internalInjectedMemory}/>);

        // @ts-ignore
        const injectedAmount = Object.keys(flattenNamespace(memory.internalInjectedMemory)).length;
        elementNamespace = (<Typography>{injectedAmount.toString()} injected element(s)</Typography>);
    }

    return (
        <>
            <Typography variant="h5">Memory</Typography>
            {memoryNamespace}

            {elementNamespace && <Typography variant="h5">Elements</Typography>}
            {elementNamespace}
        </>
    );
}
