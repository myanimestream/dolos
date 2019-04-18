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
import {Config} from "dolos/models";
import {StoreElementProxy} from "dolos/store";
import {arrayElementsEqual} from "dolos/utils";
import * as React from "react";
import {ValueType} from "react-select/lib/types";
import {SortableContainer, SortableElement, SortableHandle, SortEnd} from "react-sortable-hoc";
import {SettingsTabContentProps, SettingsToggle} from "../SettingsTab";
import _ = chrome.i18n.getMessage;

const providerSuggestions = embedProviders.map(provider => ({
    label: provider.name,
    value: provider.id,
}));

function BlockedEmbedProviders({blocked, onChange}: { blocked: string[], onChange: (blocked: string[]) => void }) {
    const [currentBlocked, setInternalBlocked] = React.useState(blocked.map(id => {
        const provider = getEmbedProviderFromID(id);

        return {
            label: provider ? provider.name : id,
            value: id,
        };
    }) as ValueType<{ label: string; value: string }>);

    function setCurrentBlocked(value: ValueType<{ label: string; value: string }>) {
        setInternalBlocked(value);

        if (Array.isArray(value))
            onChange(value.map(val => val.value));
        else
            onChange([]);
    }

    return (
        <MUICreatable
            value={currentBlocked}
            onChange={setCurrentBlocked}
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

function EmbedProviderOrder({order, onChange}: { order: string[], onChange: (order: string[]) => void }) {
    const classes = useEmbedProviderStyles();
    const [internalOrder, setInternalOrder] = React.useState(order);

    function setOrder(newOrder: string[]) {
        if (arrayElementsEqual(internalOrder, newOrder)) return;

        setInternalOrder(newOrder);
        onChange(newOrder);
    }

    function handleSortEnd(sort: SortEnd) {
        const newOrder = [...internalOrder];
        newOrder[sort.newIndex] = internalOrder[sort.oldIndex];
        newOrder[sort.oldIndex] = internalOrder[sort.newIndex];
        setOrder(newOrder);
    }

    function handleProviderRemove(index: number) {
        const newOrder = [...internalOrder];
        newOrder.splice(index, 1);
        setOrder(newOrder);
    }

    function handleProviderAdd(provider: ValueType<{ label: string; value: string }>) {
        if (!provider || Array.isArray(provider)) return;

        const providerID = provider.value;
        if (internalOrder.indexOf(providerID) > -1) return;

        setOrder([...internalOrder, providerID]);
    }

    const validOptions = providerSuggestions
        .filter(suggestion => internalOrder.indexOf(suggestion.value) === -1);

    let containerContent;
    if (internalOrder.length > 0) {
        containerContent = (
            <SortableEmbedProviderList
                providerIDs={internalOrder}
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
export function EmbedProviders({config}: SettingsTabContentProps) {
    const embedProviderConfig = config.embedProviders as StoreElementProxy<Config["embedProviders"]>;

    function handleBlockedChange(blocked: string[]) {
        embedProviderConfig.blocked = blocked;
    }

    function handleOrderChange(order: string[]) {
        embedProviderConfig.order = order;
    }

    return (
        <>
            <List subheader={<ListSubheader>{_("options__embed_providers__general__title")}</ListSubheader>}>
                <SettingsToggle
                    configKey="allowUnknown"
                    messageKey="options__embed_providers__general__allow_unknown"
                    icon={WebAssetIcon}
                    config={embedProviderConfig}
                />
            </List>

            <List subheader={<ListSubheader>{_("options__embed_providers__blocked__title")}</ListSubheader>}>
                <BlockedEmbedProviders onChange={handleBlockedChange} blocked={embedProviderConfig.blocked}/>
            </List>

            <List subheader={<ListSubheader>{_("options__embed_providers__order__title")}</ListSubheader>}>
                <EmbedProviderOrder onChange={handleOrderChange} order={embedProviderConfig.order}/>
            </List>
        </>
    );
}
