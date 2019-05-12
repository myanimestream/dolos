/**
 * @module options
 */

import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemText from "@material-ui/core/ListItemText";
import {SvgIconProps} from "@material-ui/core/SvgIcon";
import Switch from "@material-ui/core/Switch";
import makeStyles from "@material-ui/styles/makeStyles";
import {useObservableMemo} from "dolos/hooks";
import {DEFAULT_CONFIG} from "dolos/models";
import {applyDefaults, Path, store} from "dolos/store";
import {nsGet, splitPath} from "dolos/store/namespace";
import * as React from "react";
import _ = chrome.i18n.getMessage;

/** @ignore */
const useStyles = makeStyles(() => ({
    root: {
        display: "flex",
        flexDirection: "column",
    },
}));

/**
 * Wrapper around [[SettingsTabContent]].
 */
export function SettingsTab(props: React.ComponentProps<any>) {
    const classes = useStyles();

    return (
        <div className={classes.root}>
            {props.children}
        </div>
    );
}

/**
 * React props for [[SettingsToggle]]
 */
export interface SettingsToggleProps<T> {
    configPath: Path;
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
export function SettingsToggle<T>({configPath, messageKey, icon}: SettingsToggleProps<T>) {
    const [value, toggleValue] = useConfigToggle(configPath);

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

/**
 * Similar to React's `useState` but specifically for the [[Config]].
 *
 * Internally the value is set immediately, but writing to the actual
 * config is debounced.
 */
export function useConfigChange<T>(path: Path): [T, (newValue?: T) => Promise<void>] {
    const item = React.useMemo(() => store.getMutConfig().withPath<T>(path), [path]);

    const defaultValue = nsGet(DEFAULT_CONFIG, splitPath(path)) as T;
    const itemValue = useObservableMemo(() => item.value$.pipe(
        applyDefaults(defaultValue),
    ), defaultValue);

    const itemSetter = (newValue?: T) => item.set(newValue);

    return [itemValue, itemSetter];
}

/**
 * Specialised [[useConfigChange]] for boolean values.
 */
export function useConfigToggle(path: Path): [boolean, () => Promise<void>] {
    const [value, setter] = useConfigChange<boolean>(path);

    const toggle = () => setter(!value);
    return [value, toggle];
}
