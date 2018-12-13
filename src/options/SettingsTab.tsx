import CircularProgress from "@material-ui/core/CircularProgress";
import {green} from "@material-ui/core/colors";

import Fab from "@material-ui/core/Fab";
import createStyles from "@material-ui/core/styles/createStyles";
import withStyles, {WithStyles} from "@material-ui/core/styles/withStyles";

import CheckIcon from "@material-ui/icons/Check";
import SaveIcon from "@material-ui/icons/Save";
import classNames from "classnames";
import * as React from "react";

import Config from "../config";
import {artificialDelay} from "../utils";

const styles = theme => createStyles({
    root: {
        display: "flex",
        flexDirection: "column",
    },
    wrapper: {
        margin: theme.spacing.unit,
        position: "relative",
        alignSelf: "flex-end",
    },
    buttonSuccess: {
        backgroundColor: green[500],
        "&:hover": {
            backgroundColor: green[700],
        },
    },
    fabProgress: {
        color: green[500],
        position: "absolute",
        top: -6,
        left: -6,
        zIndex: 1,
    }
});

interface SettingsTabProps extends WithStyles<typeof styles> {
    getConfig: () => Promise<Config>;
    content: typeof SettingsTabContent;
    saveConfig: (Config) => Promise<void>;
}

interface SettingsTabState {
    originalConfig?: Config;
    config?: Partial<Config>;

    showSave: boolean;
    saving: boolean;
    saved: boolean;
}


export default withStyles(styles)(
    class SettingsTab extends React.Component<SettingsTabProps, SettingsTabState> {
        constructor(props: SettingsTabProps) {
            super(props);
            this.state = {
                showSave: false,
                saving: false,
                saved: true
            };
        }

        async reloadConfig() {
            const config = await this.props.getConfig();

            const editConfig = new Proxy({}, {
                get(target: {}, p: PropertyKey): any {
                    if (p in target) return target[p];
                    else return config[p];
                },
                set(target: {}, p: PropertyKey, value: any): boolean {
                    if (value === config[p]) delete target[p];
                    else target[p] = value;

                    return true;
                },
                has(target: {}, p: PropertyKey): boolean {
                    return p in config;
                }
            });

            this.setState({config: editConfig, originalConfig: config});
        }

        async componentDidMount() {
            await this.reloadConfig();
        }

        async save() {
            if (!this.state.saved && !this.state.saving) {
                this.setState({saving: true});
                await artificialDelay(500);
                await this.reloadConfig();
                this.setState({saving: false, saved: true});
            }
        }

        getDirty(): boolean {
            const original = this.state.originalConfig;

            for (const [key, value] of Object.entries(this.state.config))
                if (original[key] != value)
                    return true;

            return false;
        }

        changeConfig(param: string, value: any) {
            const config = this.state.config;

            if (!(param in config))
                return;

            config[param] = value;
            this.state.originalConfig[param] = value;

            let isDirty = this.getDirty();
            this.setState({config, saved: !isDirty, showSave: isDirty});
        }

        render() {
            if (!this.state.config)
                return (
                    <CircularProgress/>
                );

            // @ts-ignore
            const content = React.createElement(this.props.content, {
                config: this.state.config,
                changeConfig: (param: string, value: any) => this.changeConfig(param, value)
            });

            const classes = this.props.classes;

            const buttonClassname = classNames({
                [classes.buttonSuccess]: this.state.saved,
            });

            return (
                <div className={classes.root}>
                    {content}
                    <div className={classes.wrapper}>
                        <Fab color="primary" className={buttonClassname} onClick={this.save.bind(this)} disabled={!this.state.showSave}>
                            {this.state.showSave && this.state.saved ? <CheckIcon/> : <SaveIcon/>}
                        </Fab>
                        {this.state.saving && <CircularProgress className={classes.fabProgress} size={68}/>}
                    </div>
                </div>
            );
        }
    });

export interface SettingsTabContentProps {
    config: Config;
    changeConfig: (string, any) => void;
}

export class SettingsTabContent<P extends SettingsTabContentProps = SettingsTabContentProps, S = {}> extends React.Component<P, S> {
    toggle(param: keyof Config) {
        this.change(param, !this.props.config[param]);
    }

    change(param: keyof Config, value: any) {
        this.props.changeConfig(param, value);
    }
}