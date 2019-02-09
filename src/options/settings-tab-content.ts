import {Config} from "dolos/models";
import * as React from "react";

export interface SettingsTabContentProps {
    config: Config;
    changeConfig: (key: string, value: any) => void;
}

export class SettingsTabContent<P extends SettingsTabContentProps = SettingsTabContentProps,
    S = {}> extends React.Component<P, S> {
    public toggle(param: keyof Config) {
        this.change(param, !this.props.config[param]);
    }

    public change(param: keyof Config, value: any) {
        this.props.changeConfig(param, value);
    }
}
