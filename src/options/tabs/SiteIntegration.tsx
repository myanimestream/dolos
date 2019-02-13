/**
 * @module options/tabs
 */

import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import Switch from "@material-ui/core/Switch";
import UpdateIcon from "@material-ui/icons/Update";
import * as React from "react";
import {SettingsTabContentProps, useConfigToggle} from "../SettingsTab";
import _ = chrome.i18n.getMessage;

/**
 * [[SettingsTabContent]] settings related to how Dolos interacts
 * with the Anime database sites.
 */
export function SiteIntegration(props: SettingsTabContentProps) {
    const {config} = props;

    const [updateAnimeProgress, handleUpdateAnimeProgressChange] = useConfigToggle(config, "updateAnimeProgress");

    return (
        <>
            <List subheader={<ListSubheader>{_("options__site_integration__title")}</ListSubheader>}>
                <ListItem>
                    <ListItemIcon>
                        <UpdateIcon/>
                    </ListItemIcon>
                    <ListItemText primary={_("options__site_integration__update_anime_progress")}/>
                    <ListItemSecondaryAction>
                        <Switch
                            onChange={handleUpdateAnimeProgressChange}
                            checked={updateAnimeProgress}
                        />
                    </ListItemSecondaryAction>
                </ListItem>
            </List>
        </>
    );
}
