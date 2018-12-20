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
import CheckIcon from "@material-ui/icons/Check";
import ErrorOutlineIcon from "@material-ui/icons/ErrorOutline";
import WifiIcon from "@material-ui/icons/Wifi";
import AwesomeDebouncePromise from "awesome-debounce-promise";
import axios from "axios";
import * as React from "react";
import {SettingsTabContent, SettingsTabContentProps} from "../SettingsTab";


const _ = chrome.i18n.getMessage;

interface DebugState {
    invalidUrl?: string;
    checkingUrl: boolean;
}

interface GrobberUrlCheckResult {
    valid: boolean;
    hint?: "trailing_slash" | "version_mismatch" | "no_grobber";
}

export default class Debug extends SettingsTabContent<SettingsTabContentProps, DebugState> {
    changeGrobberUrl = AwesomeDebouncePromise(async (url: string) => {
        if (!url.match(/https?:\/\/.+/)) {
            this.setState({invalidUrl: _("options__grobber__url__invalid")});
            return;
        }

        this.setState({checkingUrl: true});

        const result = await Debug.checkGrobberUrl(url);
        if (result.valid) {
            await this.change("grobberUrl", url);
            this.setState({invalidUrl: null});
        } else {
            const text = `options__grobber__url__${result.hint || "test_failed"}`;
            this.setState({invalidUrl: _(text)});
        }

        this.setState({checkingUrl: false});
    }, 500);

    constructor(props) {
        super(props);
        this.state = {
            invalidUrl: null,
            checkingUrl: false,
        };
    }

    static async checkGrobberUrl(url: string): Promise<GrobberUrlCheckResult> {
        let resp;

        try {
            resp = await axios.get(url + "/dolos-info", {timeout: 1000});
        } catch (e) {
            const result = {valid: false, hint: null};

            if (url.endsWith("/")) {
                result.hint = "trailing_slash";
            }

            return result;
        }

        const data = resp.data;
        if (data.id !== "grobber") return {valid: false, hint: "no_grobber"};

        if (!data.version.startsWith("3.0")) {
            return {valid: false, hint: "version_mismatch"};
        }

        return {valid: true};
    }

    render() {
        const config = this.props.config;

        return (
            <>
                <List subheader={<ListSubheader>{_("options__grobber__title")}</ListSubheader>}>
                    <ListItem>
                        <ListItemIcon>
                            <WifiIcon/>
                        </ListItemIcon>
                        <ListItemText primary={_("options__grobber__url")}/>
                        <ListItemSecondaryAction>
                            <FormControl>
                                <InputLabel htmlFor="grobber-url-input">{this.state.invalidUrl}</InputLabel>
                                <Input id="grobber-url-input"
                                       onChange={e => this.changeGrobberUrl(e.target.value)}
                                       defaultValue={config.grobberUrl}
                                       error={Boolean(this.state.invalidUrl)}
                                       type="url"
                                       endAdornment={
                                           <InputAdornment position="end">
                                               {this.state.checkingUrl && <CircularProgress/> ||
                                               this.state.invalidUrl && <ErrorOutlineIcon/> ||
                                               <CheckIcon/>}
                                           </InputAdornment>
                                       }
                                />
                            </FormControl>
                        </ListItemSecondaryAction>
                    </ListItem>
                </List>
            </>
        );
    }
}

