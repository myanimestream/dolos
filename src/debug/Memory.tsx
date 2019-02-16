/**
 * @module debug
 */

import {ExpansionPanel, ExpansionPanelDetails, ExpansionPanelSummary, List, Typography} from "@material-ui/core";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import {ElementMemory, Memory, Namespace} from "dolos/memory";
import * as React from "react";
import {DynamicInput} from "./DynamicInput";

/**
 * Component for displaying a memory [[Namespace]].
 */
function NamespaceComponent({namespace}: { namespace: Namespace }) {
    const value = namespace.__value;
    let valueDisplay;
    if (value) {
        const handleChange = () => null;

        valueDisplay = (
            <DynamicInput value={value} onChange={handleChange}/>
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
        // @ts-ignore
        elementNamespace = (<NamespaceComponent namespace={memory.internalInjectedMemory}/>);
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
