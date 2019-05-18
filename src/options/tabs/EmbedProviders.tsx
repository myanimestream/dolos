/**
 * @module options/tabs
 */

import Avatar from "@material-ui/core/Avatar";
import IconButton from "@material-ui/core/IconButton";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import Paper from "@material-ui/core/Paper";
import {Theme} from "@material-ui/core/styles/createMuiTheme";
import Typography from "@material-ui/core/Typography";
import DeleteIcon from "@material-ui/icons/Delete";
import DragHandleIcon from "@material-ui/icons/DragHandle";
import WebAssetIcon from "@material-ui/icons/WebAsset";
import makeStyles from "@material-ui/styles/makeStyles";

import {embedProviders, getEmbedProviderFromID} from "dolos/common";
import {MUICreatable} from "dolos/components";
import {arrayElementsEqual} from "dolos/utils";
import * as React from "react";
import {ValueType} from "react-select/lib/types";
import {SortableContainer, SortableElement, SortableHandle, SortEnd} from "react-sortable-hoc";
import {SettingsToggle, useConfigChange} from "../SettingsTab";
import _ = chrome.i18n.getMessage;

const providerSuggestions = embedProviders.map(provider => ({
    label: provider.name,
    value: provider.id,
}));

function BlockedEmbedProviders() {
    const [blockedIDs, setBlockedIDs] = useConfigChange<string[]>("embedProviders.blocked");

    const blocked: ValueType<{ label: string; value: string }> = blockedIDs.map(id => {
        const provider = getEmbedProviderFromID(id);

        return {
            label: provider ? provider.name : id,
            value: id,
        };
    });

    function setBlocked(value: ValueType<{ label: string; value: string }>): Promise<void> {
        if (Array.isArray(value))
            return setBlockedIDs(value.map(val => val.value));
        else
            return setBlockedIDs([]);
    }

    return (
        <MUICreatable
            value={blocked}
            onChange={setBlocked}
            options={providerSuggestions}
            placeholder={_("options__embed_providers__blocked__placeholder")}
            isClearable
            isMulti
        />
    );
}

interface EmbedProviderItemProps {
    providerID: string;
    onRemove?: React.MouseEventHandler;
}

// tslint:disable-next-line:variable-name
const SortableDragHandle = SortableHandle(() => <DragHandleIcon/>);

// tslint:disable-next-line:variable-name
const SortableEmbedProviderItem = SortableElement(({providerID, onRemove}: EmbedProviderItemProps) => {
    let name = providerID;
    let iconElement;

    const provider = getEmbedProviderFromID(providerID);
    if (provider) {
        name = provider.name;

        iconElement = (
            <ListItemAvatar>
                <Avatar src={provider.icon}/>
            </ListItemAvatar>
        );
    }

    return (
        <ListItem>
            <ListItemIcon>
                <SortableDragHandle/>
            </ListItemIcon>

            {iconElement}

            <ListItemText primary={name}/>

            <ListItemSecondaryAction>
                <IconButton onClick={onRemove}>
                    <DeleteIcon/>
                </IconButton>
            </ListItemSecondaryAction>
        </ListItem>
    );
});

interface SortableEmbedProviderListProps {
    providerIDs: string[];
    onRemove?: (index: number) => void;
}

// tslint:disable-next-line:variable-name
const SortableEmbedProviderList = SortableContainer(({providerIDs, onRemove}: SortableEmbedProviderListProps) => {
    const contents = providerIDs.map((providerID, index) => {
        function handleDeleteClick() {
            if (onRemove) onRemove(index);
        }

        return (
            <SortableEmbedProviderItem key={index} index={index} providerID={providerID} onRemove={handleDeleteClick}/>
        );
    });

    return (
        <List>
            {contents}
        </List>
    );
});

const useEmbedProviderStyles = makeStyles((theme: Theme) => ({
    container: {
        marginBottom: theme.spacing(1),
        padding: theme.spacing(2, 0),
    },
}));

function EmbedProviderOrder() {
    const classes = useEmbedProviderStyles();

    const [order, setOrder] = useConfigChange("embedProviders.order");

    async function setOrderDedup(newOrder: string[]): Promise<void> {
        if (arrayElementsEqual(order, newOrder)) return;

        return await setOrder(newOrder);
    }

    function handleSortEnd(sort: SortEnd): Promise<void> {
        const newOrder = [...order];
        newOrder[sort.newIndex] = order[sort.oldIndex];
        newOrder[sort.oldIndex] = order[sort.newIndex];

        return setOrderDedup(newOrder);
    }

    function handleProviderRemove(index: number): Promise<void> {
        const newOrder = [...order];
        newOrder.splice(index, 1);

        // no deduplication required
        return setOrder(newOrder);
    }

    async function handleProviderAdd(provider: ValueType<{ label: string; value: string }>): Promise<void> {
        if (!provider || Array.isArray(provider)) return;

        const providerID = (provider as { value: string }).value;
        if (order.indexOf(providerID) > -1) return;

        return await setOrder([...order, providerID]);
    }

    const validOptions = providerSuggestions
        .filter(suggestion => order.indexOf(suggestion.value) === -1);

    let containerContent;
    if (order.length > 0) {
        containerContent = (
            <SortableEmbedProviderList
                providerIDs={order}
                onSortEnd={handleSortEnd}
                onRemove={handleProviderRemove}
                useDragHandle
            />
        );
    } else {
        containerContent = (
            <Typography align="center">{_("options__embed_providers__order__placeholder")}</Typography>
        );
    }

    return (
        <>
            <Paper className={classes.container} elevation={1}>
                {containerContent}
            </Paper>

            <MUICreatable
                value={null}
                onChange={handleProviderAdd}
                options={validOptions}
                placeholder={_("options__embed_providers__order__add_provider")}
            />
        </>
    );
}

/**
 * [[SettingsTabContent]] for settings related to embed providers.
 */
export function EmbedProviders() {
    return (
        <>
            <List subheader={<ListSubheader>{_("options__embed_providers__general__title")}</ListSubheader>}>
                <SettingsToggle
                    configPath="embedProviders.allowUnknown"
                    messageKey="options__embed_providers__general__allow_unknown"
                    icon={WebAssetIcon}
                />
            </List>

            <List subheader={<ListSubheader>{_("options__embed_providers__blocked__title")}</ListSubheader>}>
                <BlockedEmbedProviders/>
            </List>

            <List subheader={<ListSubheader>{_("options__embed_providers__order__title")}</ListSubheader>}>
                <EmbedProviderOrder/>
            </List>
        </>
    );
}
