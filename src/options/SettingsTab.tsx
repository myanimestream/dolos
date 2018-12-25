import CircularProgress from "@material-ui/core/CircularProgress";
import createStyles from "@material-ui/core/styles/createStyles";
import withStyles, {WithStyles} from "@material-ui/core/styles/withStyles";
import * as React from "react";

import {Config} from "../models";

const styles = theme => createStyles({
    root: {
        display: "flex",
        flexDirection: "column",
    },
    wrapper: {
        margin: theme.spacing.unit,
        position: "relative",
        alignSelf: "flex-end",
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

        getDirty(): boolean {
            const original = this.state.originalConfig;

            for (const [key, value] of Object.entries(this.state.config))
                if (original[key] != value)
                    return true;

            return false;
        }

        changeConfig(param: keyof Config, value: any) {
            const config = this.state.config;

            if (!(param in config))
                return;

            config[param] = value;
            this.state.originalConfig[param] = value;

            let isDirty = this.getDirty();
            this.setState({config, saved: !isDirty, showSave: isDirty});
        }

        render() {
            if (!this.state.config) {
                return (
                    <CircularProgress/>
                );
            }

            const {classes} = this.props;

            // @ts-ignore
            const content = React.createElement(this.props.content, {
                config: this.state.config,
                changeConfig: (param: keyof Config, value: any) => this.changeConfig(param, value)
            });

            return (
                <div className={classes.root}>
                    {content}
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