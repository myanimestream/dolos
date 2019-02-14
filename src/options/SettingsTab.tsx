/**
 * @module options
 */

import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemText from "@material-ui/core/ListItemText";
import {SvgIconProps} from "@material-ui/core/SvgIcon";
import Switch from "@material-ui/core/Switch";
import {makeStyles} from "@material-ui/styles";
import {Config} from "dolos/models";
import {StoreElementProxy} from "dolos/store";
import * as React from "react";
import _ = chrome.i18n.getMessage;

/**
 * Props passed to [[SettingsTabContent]].
 */
export interface SettingsTabContentProps {
    config: StoreElementProxy<Config>;
}

/**
 * Group of settings that can be displayed by [[SettingsTab]].
 */
export type SettingsTabContent = React.ComponentType<SettingsTabContentProps>;

/** @ignore */
const useStyles = makeStyles(() => ({
    root: {
        display: "flex",
        flexDirection: "column",
    },
}));

/**
 * @see [[SettingsTab]]
 */
export interface SettingsTabProps extends SettingsTabContentProps {
    content: SettingsTabContent;
}

/**
 * Wrapper around [[SettingsTabContent]].
 */
export function SettingsTab(props: SettingsTabProps) {
    const {config} = props;

    const classes = useStyles();
    const content = React.createElement(props.content, {config});

    return (
        <div className={classes.root}>
            {content}
        </div>
    );
}

/**
 * React props for [[SettingsToggle]]
 */
export interface SettingsToggleProps<T> {
    config: StoreElementProxy<T>;
    configKey: keyof T;
    messageKey: string;
    icon: React.ComponentType<SvgIconProps>;
}

/**
 * React Component for boolean [[Config]] keys.
 *
 * Displays the text specified by the `messageKey` with the subtitle
 * `messageKey`__on / `messageKey`__off based on the current value.
 *
 * Shows a switch which controls the [[Config]] value specified by `configKey`
 */
export function SettingsToggle<T>({config, configKey, messageKey, icon}: SettingsToggleProps<T>) {
    const [value, toggleValue] = useConfigToggle(config, configKey);

    const iconEl = React.createElement(icon);

    return (
        <ListItem alignItems="flex-start">
            <ListItemIcon>
                {iconEl}
            </ListItemIcon>

            <ListItemText
                primary={_(messageKey)}
                secondary={_(`${messageKey}__${value ? "on" : "off"}`)}
            />

            <ListItemSecondaryAction>
                <Switch
                    onChange={toggleValue}
                    checked={value}
                />
            </ListItemSecondaryAction>
        </ListItem>
    );
}

export function useConfigChange<TConfig, K extends keyof TConfig, VConfig extends TConfig[K]>(
    config: StoreElementProxy<TConfig>,
    key: K): [VConfig, (newValue: VConfig) => void];
export function useConfigChange<TConfig, K extends keyof TConfig, VConfig extends TConfig[K], V>(
    config: StoreElementProxy<TConfig>,
    key: K,
    valueCallback?: (currentValue: VConfig, newValue: V) => VConfig): [VConfig, (newValue: V) => void];
export function useConfigChange<TConfig, K extends keyof TConfig, VConfig extends TConfig[K], V>(
    config: StoreElementProxy<TConfig>,
    key: K,
    valueCallback?: (currentValue: VConfig, newValue?: V) => VConfig): [VConfig, (newValue?: V) => void];

/**
 * Similar to React's `useState` but specifically for the [[Config]].
 */
export function useConfigChange<TConfig, K extends keyof TConfig, VConfig extends TConfig[K], V>(
    config: StoreElementProxy<TConfig>,
    key: K,
    valueCallback?: (currentValue: VConfig, newValue?: V) => VConfig): [VConfig, (newValue?: V) => void] {
    // @ts-ignore
    const [configValue, setConfigValue] = React.useState(config[key] as VConfig);

    const changer = (value?: V) => {
        if (valueCallback) {
            // @ts-ignore
            value = valueCallback(config[key], value);
        }

        // @ts-ignore
        config[key] = value;
        setConfigValue(value as unknown as VConfig);
    };

    return [configValue, changer];
}

/**
 * Specialised [[useConfigChange]] for boolean values.
 */
export function useConfigToggle<TConfig, K extends keyof TConfig>(
    config: StoreElementProxy<TConfig>,
    key: K): [boolean, () => void] {
    // @ts-ignore
    return useConfigChange(config, key, (current: boolean) => !current);
}
