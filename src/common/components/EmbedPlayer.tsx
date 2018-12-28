import Avatar from "@material-ui/core/Avatar";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import ListItemText from "@material-ui/core/ListItemText";
import MenuItem from "@material-ui/core/MenuItem";
import Paper from "@material-ui/core/Paper";
import Select from "@material-ui/core/Select";
import {Theme} from "@material-ui/core/styles/createMuiTheme";
import createStyles from "@material-ui/core/styles/createStyles";
import withStyles, {WithStyles} from "@material-ui/core/styles/withStyles";
import Toolbar from "@material-ui/core/Toolbar";
import Tooltip from "@material-ui/core/Tooltip";
import Typography from "@material-ui/core/Typography";
import HelpOutlineIcon from "@material-ui/icons/HelpOutline";
import * as React from "react";
import StableIFrame from "./StableIFrame";
import WithRatio from "./WithRatio";
import _ = chrome.i18n.getMessage;


const styles = (theme: Theme) => createStyles({
    embedIFrame: {
        width: "100%",
        height: "100%",
        border: "none",
    },
    embedToolbar: {
        marginBottom: theme.spacing.unit,
        justifyContent: "space-between",
        flexWrap: "wrap",
    },
    embedSelect: {
        "& $embedInfoAvatar": {
            display: "none",
        },
        "& $embedInfoText": {
            padding: 0,
        }
    },
    embedInfoAvatar: {
        width: 2 * theme.spacing.unit,
        height: 2 * theme.spacing.unit,
        borderRadius: 0,
    },
    embedInfoText: {},
});

export interface EmbedInfo {
    name: string,
    icon?: string,
    url: string,
}

interface EmbedPlayerState {
    currentEmbedSelected: number;
    embedSelectionOpen: boolean;
}

interface EmbedPlayerProps extends WithStyles<typeof styles> {
    embeds: EmbedInfo[];
}

export default withStyles(styles)(class EmbedPlayer extends React.Component<EmbedPlayerProps, EmbedPlayerState> {
    constructor(props: EmbedPlayerProps) {
        super(props);
        this.state = {
            currentEmbedSelected: 0,
            embedSelectionOpen: false,
        };
    }

    render() {
        const {classes, embeds} = this.props;
        const {currentEmbedSelected, embedSelectionOpen} = this.state;

        return (
            <>
                <Paper>
                    <Toolbar className={classes.embedToolbar}>
                        <Tooltip title={_("episode__embedded_stream__warning")} placement="bottom">
                                <span>
                                    <Typography variant="h6" color="textSecondary"
                                                style={{display: "inline"}}
                                                noWrap
                                    >
                                        {_("episode__embedded_stream")}&nbsp;
                                        <HelpOutlineIcon fontSize="small" color="secondary"/>
                                    </Typography>
                                </span>
                        </Tooltip>

                        <FormControl>
                            <InputLabel htmlFor="embed-selection-control">{_("episode__switch_embed")}</InputLabel>
                            <Select
                                className={classes.embedSelect}
                                open={embedSelectionOpen}
                                onOpen={() => this.setState({embedSelectionOpen: true})}
                                onClose={() => this.setState({embedSelectionOpen: false})}
                                value={currentEmbedSelected}
                                onChange={event => this.setState({currentEmbedSelected: parseInt(event.target.value)})}
                                inputProps={{
                                    name: _("episode__switch_embed"),
                                    id: "embed-selection-control"
                                }}
                            >
                                {embeds.map((embed, index) => (
                                    <MenuItem value={index} key={embed.url}>
                                        {embed.icon &&
                                        <ListItemAvatar>
                                            <Avatar src={embed.icon} className={classes.embedInfoAvatar}
                                                    onError={event => (event.target as Element).remove()}/>
                                        </ListItemAvatar>
                                        }
                                        <ListItemText className={classes.embedInfoText}>{embed.name}</ListItemText>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Toolbar>
                </Paper>

                <WithRatio ratio={16 / 9}>
                    <StableIFrame src={embeds[currentEmbedSelected].url} className={classes.embedIFrame}
                                  allowFullScreen/>
                </WithRatio>
            </>
        );
    }
});