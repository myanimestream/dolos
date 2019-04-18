/**
 * @module options/tabs
 */

import FormControlLabel from "@material-ui/core/FormControlLabel";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import Switch from "@material-ui/core/Switch";
import LanguageIcon from "@material-ui/icons/Language";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import PlaylistPlayIcon from "@material-ui/icons/PlaylistPlay";
import SubtitlesIcon from "@material-ui/icons/Subtitles";
import SwitchVideoIcon from "@material-ui/icons/SwitchVideo";
import {Language} from "dolos/grobber";
import * as React from "react";
import {SettingsTabContentProps, SettingsToggle, useConfigChange, useConfigToggle} from "../SettingsTab";
import _ = chrome.i18n.getMessage;

/**
 * [[SettingsTabContent]] for settings related to the video player.
 */
export function Video({config}: SettingsTabContentProps) {
    const [dubbed, handleTranslationTypeChange] = useConfigToggle(config, "dubbed");

    const [language, handleLanguageChange] = useConfigChange(config, "language",
        (current, e: React.ChangeEvent<any>) => e.target.value as Language);

    const translationTypeSwitch = (
        <Switch
            onChange={handleTranslationTypeChange}
            checked={dubbed}
        />
    );

    return (
        <>
            <List subheader={<ListSubheader>{_("options__video__general__title")}</ListSubheader>}>
                <SettingsToggle
                    configKey="autoplay"
                    messageKey="options__video__general__autoplay"
                    icon={PlayArrowIcon}
                    config={config}
                />

                <SettingsToggle
                    configKey="autoNext"
                    messageKey="options__video__general__auto_next"
                    icon={PlaylistPlayIcon}
                    config={config}
                />

                <SettingsToggle
                    configKey="preferDolosPlayer"
                    messageKey="options__video__general__prefer_dolos_player"
                    icon={SwitchVideoIcon}
                    config={config}
                />
            </List>

            <List subheader={<ListSubheader>{_("options__video__language__title")}</ListSubheader>}>
                <ListItem>
                    <ListItemIcon>
                        <LanguageIcon/>
                    </ListItemIcon>
                    <ListItemText primary={_("options__video__language__language")}/>
                    <ListItemSecondaryAction>
                        <Select
                            onChange={handleLanguageChange}
                            value={language}
                        >
                            <MenuItem value="en">{_("language__en")}</MenuItem>
                            <MenuItem value="de">{_("language__de")}</MenuItem>
                        </Select>
                    </ListItemSecondaryAction>
                </ListItem>

                <ListItem>
                    <ListItemIcon>
                        <SubtitlesIcon/>
                    </ListItemIcon>
                    <ListItemText primary={_("options__video__language__translation_type")}/>
                    <ListItemSecondaryAction>
                        <FormControlLabel
                            control={translationTypeSwitch}
                            label={_(`language__translation_type__${dubbed ? "dubbed" : "subbed"}`)}
                            labelPlacement="start"
                        />
                    </ListItemSecondaryAction>
                </ListItem>
            </List>
        </>
    );
}
