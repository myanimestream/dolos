/**
 * @module options/tabs
 */

import List from "@material-ui/core/List";
import ListSubheader from "@material-ui/core/ListSubheader";
import * as React from "react";
import {SettingsTabContentProps} from "../SettingsTab";
import _ = chrome.i18n.getMessage;

/**
 * [[SettingsTabContent]] for settings related to embed providers.
 */
export function EmbedProviders({config}: SettingsTabContentProps) {

    return (
        <>
            <List subheader={<ListSubheader>{_("options__embed_providers__blacklist__title")}</ListSubheader>}>
                WIP
            </List>
        </>
    );
}
