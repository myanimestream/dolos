import Divider from "@material-ui/core/Divider";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import createStyles from "@material-ui/core/styles/createStyles";
import withStyles, {WithStyles} from "@material-ui/core/styles/withStyles";
import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import * as React from "react";
import * as ReactMarkdown from "react-markdown";
import CHANGELOG from "../changelog";
import {getBackgroundWindow} from "../utils";

const styles = () => createStyles({
    expansionPanelDetails: {
        flexDirection: "column",
    },
});

interface ChangelogDisplayProps extends WithStyles<typeof styles> {
}

interface ChangelogDisplayState {
    panelsOpen: Set<string>;
}

class ChangelogDisplay extends React.Component<ChangelogDisplayProps, ChangelogDisplayState> {
    constructor(props: ChangelogDisplayProps) {
        super(props);
        this.state = {
            panelsOpen: new Set([Object.keys(CHANGELOG)[0]]),
        }
    }

    togglePanel(key: string) {
        const {panelsOpen} = this.state;

        if (panelsOpen.has(key)) {
            panelsOpen.delete(key);
        } else {
            panelsOpen.add(key);
        }

        this.setState({panelsOpen,});
    }

    async componentDidMount() {
        const background = await getBackgroundWindow();
        background.hasNewVersion$.next(false);
    }


    render() {
        const {classes} = this.props;
        const {panelsOpen} = this.state;

        return (
            <>
                {Array.from(CHANGELOG.entries()).map(([version, changes]) => (
                    <ExpansionPanel key={version}
                                    expanded={panelsOpen.has(version)}
                                    onChange={() => this.togglePanel(version)}
                    >
                        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                            <Typography color="primary" variant="h6">Version {version}</Typography>
                        </ExpansionPanelSummary>

                        <ExpansionPanelDetails className={classes.expansionPanelDetails}>
                            {changes.map((change, index) => (
                                <div key={index}>
                                    <Typography component="div" paragraph>
                                        <ReactMarkdown source={change}/>
                                    </Typography>
                                    {index < changes.length - 1 && (
                                        <Divider/>
                                    )}
                                </div>
                            ))}
                        </ExpansionPanelDetails>
                    </ExpansionPanel>
                ))
                }
            </>
        );
    }
}

export default withStyles(styles)(ChangelogDisplay);