/**
 * @module common/components
 */

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
import {EmbedInfo, StableIFrame, WithRatio} from ".";
import _ = chrome.i18n.getMessage;

/** @ignore */
const styles = (theme: Theme) => createStyles({
    embedIFrame: {
        border: "none",
        height: "100%",
        width: "100%",
    },
    embedInfoAvatar: {
        borderRadius: 0,
        height: 2 * theme.spacing.unit,
        width: 2 * theme.spacing.unit,
    },
    embedInfoText: {},
    embedSelect: {
        "& $embedInfoAvatar": {
            display: "none",
        },
        "& $embedInfoText": {
            padding: 0,
        },
    },
    embedToolbar: {
        flexWrap: "wrap",
        justifyContent: "space-between",
        marginBottom: theme.spacing.unit,
    },
});

interface EmbedPlayerState {
    currentEmbedSelected: number;
    embedSelectionOpen: boolean;
}

interface EmbedPlayerProps extends WithStyles<typeof styles> {
    embeds: EmbedInfo[];
}

// tslint:disable-next-line:variable-name
export const EmbedPlayer = withStyles(styles)(
    class extends React.Component<EmbedPlayerProps, EmbedPlayerState> {
        constructor(props: EmbedPlayerProps) {
            super(props);
            this.state = {
                currentEmbedSelected: 0,
                embedSelectionOpen: false,
            };
        }

        public setCurrentEmbed(embedIndex: number) {
            this.setState({currentEmbedSelected: embedIndex});
        }

        public render() {
            const {classes, embeds} = this.props;
            const {currentEmbedSelected, embedSelectionOpen} = this.state;

            const currentEmbed = embeds[currentEmbedSelected];

            const handleEmbedSelectOpen = () => this.setState({embedSelectionOpen: true});
            const handleEmbedSelectClose = () => this.setState({embedSelectionOpen: false});
            const handleEmbedSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) =>
                this.setCurrentEmbed(parseInt(event.target.value, 10));
            const embedSelectInputProps = {
                id: "embed-selection-control",
                name: _("episode__switch_embed"),
            };

            let embeddedPlayer;

            if (currentEmbed)
                embeddedPlayer = (
                    <StableIFrame
                        src={currentEmbed.url}
                        className={classes.embedIFrame}
                        allowFullScreen={true}
                    />
                );

            return (
                <>
                    <Paper>
                        <Toolbar className={classes.embedToolbar}>
                            <Tooltip title={_("episode__embedded_stream__warning")} placement="bottom">
                                <span>
                                    <Typography
                                        variant="h6"
                                        color="textSecondary"
                                        style={{display: "inline"}}
                                        noWrap={true}
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
                                    onOpen={handleEmbedSelectOpen}
                                    onClose={handleEmbedSelectClose}
                                    value={currentEmbedSelected}
                                    onChange={handleEmbedSelectChange}
                                    inputProps={embedSelectInputProps}
                                >
                                    {this.renderEmbedProviders()}
                                </Select>
                            </FormControl>
                        </Toolbar>
                    </Paper>

                    <WithRatio ratio={16 / 9}>
                        {embeddedPlayer}
                    </WithRatio>
                </>
            );
        }

        private renderEmbedProviders() {
            const {classes, embeds} = this.props;

            const onAvatarError = (event: React.SyntheticEvent<any>) => (event.target as Element).remove();
            const renderEmbedIcon = (embed: EmbedInfo) => (
                <ListItemAvatar>
                    <Avatar
                        src={embed.icon}
                        className={classes.embedInfoAvatar}
                        onError={onAvatarError}
                    />
                </ListItemAvatar>
            );

            return (
                embeds.map((embed, index) => (
                    <MenuItem value={index} key={embed.url}>
                        {embed.icon && renderEmbedIcon(embed)}
                        <ListItemText className={classes.embedInfoText}>{embed.name}</ListItemText>
                    </MenuItem>
                ))
            );
        }
    },
);
