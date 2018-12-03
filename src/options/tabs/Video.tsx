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

import {SettingsTabContent} from "../SettingsTab";

const _ = chrome.i18n.getMessage;

export default class Video extends SettingsTabContent {
    constructor(props) {
        super(props);
        this.state = {
            contracted: new Set<number>()
        };
    }

    toggle(param: string) {
        this.change(param, !this.props.config[param]);
    }

    change(param: string, value: any) {
        this.props.changeConfig(param, value);
    }

    togglePanel = (panel: number) => {
        const contracted = this.state.contracted;

        if (contracted.has(panel))
            contracted.delete(panel);
        else
            contracted.add(panel);
        this.forceUpdate();
    };

    render() {
        const config = this.props.config;

        return (
            <div>
                <List subheader={<ListSubheader>{_("options__general__title")}</ListSubheader>}>
                    <ListItem>
                        <ListItemIcon>
                            <PlayArrowIcon/>
                        </ListItemIcon>
                        <ListItemText primary={_("options__general__autoplay")}/>
                        <ListItemSecondaryAction>
                            <Switch
                                onChange={() => this.toggle("autoplay")}
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
                                onChange={() => this.toggle("autoNext")}
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
                                onChange={(e) => this.change("language", e.target.value)}
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
                            <FormControlLabel control={
                                <Switch
                                    onChange={() => this.toggle("dubbed")}
                                    checked={config.dubbed}
                                />
                            } label={config.dubbed ? _("language__translation_type__dubbed") : _("language__translation_type__subbed")}
                                              labelPlacement="start"
                            />
                        </ListItemSecondaryAction>
                    </ListItem>
                </List>
            </div>
        );
    }
}