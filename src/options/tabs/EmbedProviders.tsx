/**
 * @module options/tabs
 */

import Avatar from "@material-ui/core/Avatar";
import Chip from "@material-ui/core/Chip";
import List from "@material-ui/core/List";
import ListSubheader from "@material-ui/core/ListSubheader";
import WebAssetIcon from "@material-ui/icons/WebAsset";
import {embedProviders, getEmbedProviderFromID} from "dolos/common";
import {Config} from "dolos/models";
import {StoreElementProxy} from "dolos/store";
import * as React from "react";
import {Creatable} from "react-select";
import {ValueType} from "react-select/lib/types";
import {SettingsTabContentProps, SettingsToggle} from "../SettingsTab";
import _ = chrome.i18n.getMessage;

interface EmbedProviderProps {
    providerID: string;
}

function EmbedProviderChip({providerID}: EmbedProviderProps) {
    let name = providerID;
    let iconElement;

    const provider = getEmbedProviderFromID(providerID);
    if (provider) {
        iconElement = (<Avatar src={provider.icon}/>);
        name = provider.name;
    }

    return (
        <Chip icon={iconElement} label={name}/>
    );
}

function BlockedEmbedProviders({blocked, onChange}: { blocked: string[], onChange: (blocked: string[]) => void }) {
    const suggestions = React.useMemo(
        () => embedProviders.map(provider => ({label: provider.name, value: provider.id})),
        [],
    );

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
        <Creatable
            value={currentBlocked}
            onChange={setCurrentBlocked}
            options={suggestions}
            placeholder={_("options__embed_providers__blocked__placeholder")}
            isClearable
            isMulti
        />
    );
}

/**
 * [[SettingsTabContent]] for settings related to embed providers.
 */
export function EmbedProviders({config}: SettingsTabContentProps) {
    const embedProviderConfig = config.embedProviders as StoreElementProxy<Config["embedProviders"]>;

    const embedProviderOrder = embedProviderConfig.order.map(providerID => (
        <EmbedProviderChip key={providerID} providerID={providerID}/>
    ));

    function handleBlockedChange(blocked: string[]) {
        embedProviderConfig.blocked = blocked;
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
                {embedProviderOrder}
            </List>
        </>
    );
}
