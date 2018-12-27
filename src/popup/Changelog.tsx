import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import createStyles from "@material-ui/core/styles/createStyles";
import withStyles, {WithStyles} from "@material-ui/core/styles/withStyles";
import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import * as React from "react";

type Change = React.ReactElement<any>;

interface Changelog {
    [version: string]: Change[];
}

const CHANGELOG: Changelog = {
    "0.0.5": [
        <>Fixed styling issue with player which would lead to ugly borders</>
    ],
    "0.0.4": [
        <>Added this changelog. <i>Oh and I won't translate this to other languages so you may f*ck right off!</i></>,
        <><b>Embed selection</b> for episodes without direct streams</>,
        <>Automatic Anime <b>progress update</b></>,
    ],
    "0.0.3": [
        <>You would think that I would remember the things I changed only a few days ago. But you would be wrong.</>
    ],
    "0.0.0": [
        <>Don't think this version ever existed?</>
    ]
};

const styles = () => createStyles({
    changelogEntry: {
        "& svg": {
            transform: "translateY(25%)"
        }
    }
});

interface ChangelogDisplayState {
    panelsOpen: Set<string>;
}

export default withStyles(styles)(class ChangelogDisplay extends React.Component<WithStyles<typeof styles>, ChangelogDisplayState> {
    constructor(props) {
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


    render() {
        const {classes} = this.props;
        const {panelsOpen} = this.state;

        return (
            <>
                {Object.entries(CHANGELOG).map(([version, changes]) => (
                    <ExpansionPanel key={version}
                                    expanded={panelsOpen.has(version)}
                                    onChange={() => this.togglePanel(version)}
                    >
                        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                            <Typography color="primary" variant="h6">Version {version}</Typography>
                        </ExpansionPanelSummary>

                        <ExpansionPanelDetails>
                            <List dense>
                                {changes.map((change, index) => (
                                    <ListItem key={index}>
                                        <ListItemText className={classes.changelogEntry}
                                                      primaryTypographyProps={{variant: "body1"}}>{change}</ListItemText>
                                    </ListItem>
                                ))}
                            </List>
                        </ExpansionPanelDetails>
                    </ExpansionPanel>
                ))
                }
            </>
        );
    }
});