import Page from "./index";
import config, {saveConfig} from "../../config";

export default class SettingsPage extends Page {
    static addSettingsButton() {
    }

    async render() {
        await this.showSettings();
    }

    async showSettings() {
    }


    formParseValue(value) {
        switch (value) {
            case "true":
                return true;
            case "false":
                return false;
        }
    }


    async submitSettings(dataArray) {
        dataArray.forEach((item) => {
            config[item.name] = this.formParseValue(item.value);
        });

        return await saveConfig();
    }
}