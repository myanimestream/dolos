/**
 * @module options
 */

import CircularProgress from "@material-ui/core/CircularProgress";
import {Theme} from "@material-ui/core/styles/createMuiTheme";
import createStyles from "@material-ui/core/styles/createStyles";
import withStyles, {WithStyles} from "@material-ui/core/styles/withStyles";
import * as React from "react";
import {Config} from "../models";
import {SettingsTabContent} from "./settings-tab-content";

const styles = (theme: Theme) => createStyles({
    root: {
        display: "flex",
        flexDirection: "column",
    },
    wrapper: {
        alignSelf: "flex-end",
        margin: theme.spacing.unit,
        position: "relative",
    },
});

interface SettingsTabProps extends WithStyles<typeof styles> {
    getConfig: () => Promise<Config>;
    content: typeof SettingsTabContent;
    saveConfig: (config: Config) => Promise<void>;
}

interface SettingsTabState {
    originalConfig?: Config;
    config?: Partial<Config>;

    showSave: boolean;
    saving: boolean;
    saved: boolean;
}

export default withStyles(styles)(
    class extends React.Component<SettingsTabProps, SettingsTabState> {
        constructor(props: SettingsTabProps) {
            super(props);
            this.state = {
                saved: true,
                saving: false,
                showSave: false,
            };
        }

        public async reloadConfig() {
            const config = await this.props.getConfig();

            const editConfig = new Proxy({}, {
                get(target: {}, p: PropertyKey): any {
                    // @ts-ignore
                    if (p in target) return target[p];
                    // @ts-ignore
                    else return config[p];
                },
                set(target: {}, p: PropertyKey, value: any): boolean {
                    // @ts-ignore
                    if (value === config[p]) delete target[p];
                    // @ts-ignore
                    else target[p] = value;

                    return true;
                },
                has(target: {}, p: PropertyKey): boolean {
                    return p in config;
                },
            });

            this.setState({config: editConfig, originalConfig: config});
        }

        public async componentDidMount() {
            await this.reloadConfig();
        }

        public getDirty(): boolean {
            const config = this.state.config;
            const original = this.state.originalConfig;

            if (config === undefined || original === undefined)
                throw new Error("not ready yet");

            for (const [key, value] of Object.entries(config))
                // @ts-ignore
                if (original[key] !== value)
                    return true;

            return false;
        }

        public changeConfig(param: keyof Config, value: any) {
            const config = this.state.config;
            const original = this.state.originalConfig;

            if (config === undefined || original === undefined)
                throw new Error("not ready yet");

            if (!(param in config))
                return;

            config[param] = value;
            original[param] = value;

            const isDirty = this.getDirty();
            this.setState({config, saved: !isDirty, showSave: isDirty});
        }

        public render() {
            if (!this.state.config) {
                return (
                    <CircularProgress/>
                );
            }

            const {classes} = this.props;

            // @ts-ignore
            const content = React.createElement(this.props.content, {
                changeConfig: (param: keyof Config, value: any) => this.changeConfig(param, value),
                config: this.state.config,
            });

            return (
                <div className={classes.root}>
                    {content}
                </div>
            );
        }
    },
);
