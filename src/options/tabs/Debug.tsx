/**
 * @module options/tabs
 */

import CircularProgress from "@material-ui/core/CircularProgress";
import FormControl from "@material-ui/core/FormControl";
import Input from "@material-ui/core/Input";
import InputAdornment from "@material-ui/core/InputAdornment";
import InputLabel from "@material-ui/core/InputLabel";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import Switch from "@material-ui/core/Switch";
import BuildIcon from "@material-ui/icons/Build";
import CheckIcon from "@material-ui/icons/Check";
import ErrorOutlineIcon from "@material-ui/icons/ErrorOutline";
import WifiIcon from "@material-ui/icons/Wifi";
import AwesomeDebouncePromise from "awesome-debounce-promise";
import {grobberClient} from "dolos/grobber";
import * as React from "react";
import {useConfigChange, useConfigToggle} from "../SettingsTab";
import _ = chrome.i18n.getMessage;

/**
 * Get the correct input adornment based on the current grobber url checking state.
 */
function getGrobberURLAdornment(checkingURL: boolean, invalidURL: boolean) {
    let grobberURLAdornmentIcon;
    if (checkingURL) grobberURLAdornmentIcon = (<CircularProgress/>);
    else if (invalidURL) grobberURLAdornmentIcon = (<ErrorOutlineIcon/>);
    else grobberURLAdornmentIcon = (<CheckIcon/>);

    return (
        <InputAdornment position="end">
            {grobberURLAdornmentIcon}
        </InputAdornment>
    );
}

/**
 * [[SettingsTabContent]] for debug and developer settings.
 */
export function Debug() {
    const [checkingURL, setCheckingURL] = React.useState(false);
    const [invalidURL, setInvalidURL] = React.useState(undefined as string | undefined);

    const [grobberURL, setGrobberURL] = useConfigChange("grobberUrl");

    const changeGrobberURL = AwesomeDebouncePromise(async (url: string) => {
        if (!url.match(/https?:\/\/.+/)) {
            setInvalidURL(_("options__grobber__url__invalid"));
            return;
        }

        setCheckingURL(true);

        const result = await grobberClient.checkGrobberInfo(url);
        if (result.valid) {
            await setGrobberURL(result.url);
            setInvalidURL(undefined);
        } else {
            const text = `options__grobber__url__${result.hint}`;
            setInvalidURL(_(text));
        }

        setCheckingURL(false);
    }, 500);

    const onGrobberURLChange = (e: React.ChangeEvent<HTMLInputElement>) => changeGrobberURL(e.target.value);

    const grobberURLAdornment = getGrobberURLAdornment(checkingURL, !!invalidURL);

    const [debugMode, handleDebugModeChange] = useConfigToggle("debugMode");

    return (
        <>
            <List subheader={<ListSubheader>{_("options__grobber__title")}</ListSubheader>}>
                <ListItem>
                    <ListItemIcon><WifiIcon/></ListItemIcon>
                    <ListItemText primary={_("options__grobber__url")}/>
                    <ListItemSecondaryAction>
                        <FormControl>
                            <InputLabel htmlFor="grobber-url-input">{invalidURL}</InputLabel>
                            <Input
                                id="grobber-url-input"
                                onChange={onGrobberURLChange}
                                defaultValue={grobberURL}
                                error={!!invalidURL}
                                type="url"
                                endAdornment={grobberURLAdornment}
                            />
                        </FormControl>
                    </ListItemSecondaryAction>
                </ListItem>
            </List>
            <List subheader={<ListSubheader>{_("options__debug__advanced__header")}</ListSubheader>}>
                <ListItem>
                    <ListItemIcon><BuildIcon/></ListItemIcon>
                    <ListItemText primary={_("options__debug__advanced__debug_mode")}/>
                    <ListItemSecondaryAction>
                        <Switch
                            onChange={handleDebugModeChange}
                            checked={debugMode}
                        />
                    </ListItemSecondaryAction>
                </ListItem>
            </List>
        </>
    );
}
