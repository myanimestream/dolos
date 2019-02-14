/**
 * @module options/tabs
 */

import List from "@material-ui/core/List";
import ListSubheader from "@material-ui/core/ListSubheader";
import WebAssetIcon from "@material-ui/icons/WebAsset";
import {Config} from "dolos/models";
import {StoreElementProxy} from "dolos/store";
import * as React from "react";
import {SettingsTabContentProps, SettingsToggle} from "../SettingsTab";
import _ = chrome.i18n.getMessage;

/**
 * [[SettingsTabContent]] for settings related to embed providers.
 */
export function EmbedProviders({config}: SettingsTabContentProps) {

    return (
        <>
            <List subheader={<ListSubheader>{_("options__embed_providers__general__title")}</ListSubheader>}>
                <SettingsToggle
                    configKey="allowUnknown"
                    messageKey="options__embed_providers__general__allow_unknown"
                    icon={WebAssetIcon}
                    config={config.embedProviders as StoreElementProxy<Config["embedProviders"]>}
                />
            </List>

            <List subheader={<ListSubheader>{_("options__embed_providers__blacklist__title")}</ListSubheader>}>
                WIPIPW
            </List>
        </>
    );
}
