/**
 * @module popup
 */

import Divider from "@material-ui/core/Divider";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import {Theme} from "@material-ui/core/styles/createMuiTheme";
import createStyles from "@material-ui/core/styles/createStyles";
import withStyles, {WithStyles} from "@material-ui/core/styles/withStyles";
import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import * as React from "react";
import * as ReactMarkdown from "react-markdown";
import CHANGELOG, {Change} from "../changelog";
import {getBackgroundWindow} from "../utils";
import _ = chrome.i18n.getMessage;

/**
 * Regex which matches `MAJOR.MINOR`.
 *
 * @see [[getMinorVersion]]
 */
const MINOR_MATCHER = /\d+\.\d+/;

/**
 * Extract `MAJOR.MINOR` from a version string.
 */
function getMinorVersion(version: string): string | undefined {
    const match = MINOR_MATCHER.exec(version);

    if (match) return match[0];
    else return undefined;
}

/**
 * Get the latest version string from the changelog.
 */
function getCurrentVersion(): string {
    return CHANGELOG.keys().next().value;
}

const styles = (theme: Theme) => createStyles({
    changelogHeader: {
        marginTop: theme.spacing(2),
    },
    expansionPanelDetails: {
        flexDirection: "column",
    },
});

/**
 * Props for [[ChangelogDisplay]].
 */
type ChangelogDisplayProps = WithStyles<typeof styles>;

interface ChangelogDisplayState {
    panelsOpen: Set<string>;
}

/**
 * React component to display a [[Changelog]].
 * Uses an [[ExpansionPanel]] for each version.
 *
 * The current version, determined by [[getCurrentVersion]], is
 * automatically expanded.
 *
 * "Old" logs, i.e. versions which have a different MINOR.MAJOR version
 * from the "current" version are merged based on the MAJOR.MINOR version
 * and labelled with "Previous Versions".
 */
// tslint:disable-next-line:variable-name
export const ChangelogDisplay = withStyles(styles)(
    class extends React.Component<ChangelogDisplayProps, ChangelogDisplayState> {
        constructor(props: ChangelogDisplayProps) {
            super(props);
            this.state = {
                panelsOpen: new Set([getCurrentVersion()]),
            };
        }

        public async componentDidMount() {
            const background = await getBackgroundWindow();
            background.hasNewVersion$.next(false);
        }

        public render() {
            const {classes} = this.props;

            const currentMinor = getMinorVersion(getCurrentVersion());

            const currentChangelog = new Map();
            const oldChangelog = new Map();

            for (const [version, changes] of CHANGELOG.entries()) {
                const minorVersion = getMinorVersion(version);

                if (minorVersion && minorVersion === currentMinor) {
                    currentChangelog.set(version, changes);
                } else {
                    let versionChanges = oldChangelog.get(minorVersion);
                    if (!versionChanges) {
                        versionChanges = [];
                        oldChangelog.set(minorVersion, versionChanges);
                    }

                    versionChanges.push(...changes);
                }
            }

            const renderedCurrentChangelog = Array.from(currentChangelog.entries(),
                ([version, changes]) => this.renderVersionPanel(version, changes));

            const renderedOldChangelog = Array.from(oldChangelog.entries(),
                ([version, changes]) => this.renderVersionPanel(version, changes));

            return (
                <>
                    <Typography className={classes.changelogHeader} variant="h5" color="textPrimary" gutterBottom>
                        {_("changelog__current_version__header")}
                    </Typography>
                    {renderedCurrentChangelog}

                    <Typography className={classes.changelogHeader} variant="h5" color="textPrimary" gutterBottom>
                        {_("changelog__previous_versions__header")}
                    </Typography>
                    {renderedOldChangelog}
                </>
            );
        }

        private togglePanel(key: string) {
            const {panelsOpen} = this.state;

            if (panelsOpen.has(key)) {
                panelsOpen.delete(key);
            } else {
                panelsOpen.add(key);
            }

            this.setState({panelsOpen});
        }

        private renderChange(changes: Change[]) {
            return changes.map((change, index) => (
                <div key={index}>
                    <Typography component="div" paragraph>
                        <ReactMarkdown
                            source={change}
                            linkTarget="_blank"
                        />
                    </Typography>
                    {index < changes.length - 1 && (<Divider/>)}
                </div>
            ));
        }

        private renderVersionPanel(version: string, changes: Change[]) {
            const {classes} = this.props;
            const {panelsOpen} = this.state;

            const renderedChange = this.renderChange(changes);

            const handleTogglePanel = () => this.togglePanel(version);

            return (
                <ExpansionPanel
                    key={version}
                    expanded={panelsOpen.has(version)}
                    onChange={handleTogglePanel}
                >
                    <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                        <Typography color="primary" variant="h6">Version {version}</Typography>
                    </ExpansionPanelSummary>

                    <ExpansionPanelDetails className={classes.expansionPanelDetails}>
                        {renderedChange}
                    </ExpansionPanelDetails>
                </ExpansionPanel>
            );
        }
    },
);
