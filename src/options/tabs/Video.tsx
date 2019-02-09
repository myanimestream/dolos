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
import * as React from "react";
import {SettingsTabContent} from "../settings-tab-content";
import _ = chrome.i18n.getMessage;

export default class Video extends SettingsTabContent {
    public render() {
        const config = this.props.config;

        const onAutoplayChange = () => this.toggle("autoplay");
        const onAutoNextChange = () => this.toggle("autoNext");
        const onLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => this.change("language", e.target.value);
        const onTranslationTypeChange = () => this.toggle("dubbed");
        const translationTypeSwitch = (
            <Switch
                onChange={onTranslationTypeChange}
                checked={config.dubbed}
            />
        );
        return (
            <>
                <List subheader={<ListSubheader>{_("options__general__title")}</ListSubheader>}>
                    <ListItem>
                        <ListItemIcon>
                            <PlayArrowIcon/>
                        </ListItemIcon>
                        <ListItemText primary={_("options__general__autoplay")}/>
                        <ListItemSecondaryAction>
                            <Switch
                                onChange={onAutoplayChange}
                                checked={config.autoplay}
                            />
                        </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                        <ListItemIcon>
                            <PlaylistPlayIcon/>
                        </ListItemIcon>
                        <ListItemText primary={_("options__general__auto_next")}/>
                        <ListItemSecondaryAction>
                            <Switch
                                onChange={onAutoNextChange}
                                checked={config.autoNext}
                            />
                        </ListItemSecondaryAction>
                    </ListItem>
                </List>

                <List subheader={<ListSubheader>{_("options__language__title")}</ListSubheader>}>
                    <ListItem>
                        <ListItemIcon>
                            <LanguageIcon/>
                        </ListItemIcon>
                        <ListItemText primary={_("options__language__language")}/>
                        <ListItemSecondaryAction>
                            <Select
                                onChange={onLanguageChange}
                                value={config.language}
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
                        <ListItemText primary={_("options__language__translation_type")}/>
                        <ListItemSecondaryAction>
                            <FormControlLabel
                                control={translationTypeSwitch}
                                label={_(`language__translation_type__${config.dubbed ? "dubbed" : "subbed"}`)}
                                labelPlacement="start"
                            />
                        </ListItemSecondaryAction>
                    </ListItem>
                </List>
            </>
        );
    }
}
