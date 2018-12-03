import {WithStyles} from "@material-ui/core";
import AppBar from "@material-ui/core/AppBar";
import CssBaseline from "@material-ui/core/CssBaseline";
import Divider from "@material-ui/core/Divider";
import Drawer from "@material-ui/core/Drawer";
import IconButton from "@material-ui/core/IconButton";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import createStyles from "@material-ui/core/styles/createStyles";
import withStyles from "@material-ui/core/styles/withStyles";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";

import BuildIcon from "@material-ui/icons/Build";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import MenuIcon from "@material-ui/icons/Menu";
import SettingsInputComponentIcon from "@material-ui/icons/SettingsInputComponent";
import VideoLibraryIcon from "@material-ui/icons/VideoLibrary";
import classNames from "classnames";
import * as React from "react";
import Config from "../config";
import * as Store from "../store";
import SettingsTab from "./SettingsTab";

import {Debug, SiteIntegration, Video} from "./tabs";

const _ = chrome.i18n.getMessage;

const drawerWidth = 240;

const styles = theme => createStyles({
    root: {
        display: "flex",
    },
    title: {
        flexGrow: 1,
    },
    toolbar: {
        paddingRight: 24, // keep right padding when drawer closed
    },
    drawerPaper: {
        position: "relative",
        whiteSpace: "nowrap",
        width: drawerWidth,
        transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    },
    drawerPaperClose: {
        overflowX: "hidden",
        transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        width: theme.spacing.unit * 7,
        [theme.breakpoints.up("sm")]: {
            width: theme.spacing.unit * 9,
        },
    },
    toolbarIcon: {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        padding: "0 8px",
        ...theme.mixins.toolbar,
    },
    appBar: {
        zIndex: theme.zIndex.drawer + 1,
        transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
    },
    appBarShift: {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    },
    menuButton: {
        marginLeft: 12,
        marginRight: 36,
    },
    menuButtonHidden: {
        display: "none",
    },
    appBarSpacer: theme.mixins.toolbar,
    content: {
        flexGrow: 1,
        padding: theme.spacing.unit * 3,
        height: "100vh",
        overflow: "auto",
    },
});


interface SettingsProps extends WithStyles<typeof styles> {
}

interface SettingsState {
    drawerOpen: boolean
    activeTab: number
    configPromise: Promise<Config>
}

export default withStyles(styles)(class Settings extends React.Component<SettingsProps, SettingsState> {
    constructor(props: SettingsProps) {
        super(props);
        this.state = {
            drawerOpen: false,
            activeTab: 0,
            configPromise: Store.getConfig()
        };
    }

    switchTab = (value: number) => this.setState({activeTab: value});

    handleDrawerOpen = () => this.setState({drawerOpen: true});

    handleDrawerClose = () => this.setState({drawerOpen: false});

    saveConfig = async (config: Config) => {
        await Store.setConfig(config);
        this.setState({configPromise: Promise.resolve(config)});
    };

    getSettingsTab() {
        let content;
        const value = this.state.activeTab;

        if (value === 0) {
            content = Video;
        } else if (value === 1) {
            content = SiteIntegration;
        } else if (value === 2) {
            content = Debug;
        }

        return (<SettingsTab getConfig={() => this.state.configPromise} saveConfig={this.saveConfig} content={content}/>);
    }

    render() {
        const classes = this.props.classes;
        const value = this.state.activeTab;

        return (
            <div className={classes.root}>
                <CssBaseline/>
                <AppBar position="absolute"
                        className={classNames(classes.appBar, this.state.drawerOpen && classes.appBarShift)}>
                    <Toolbar disableGutters={!this.state.drawerOpen} className={classes.toolbar}>
                        <IconButton
                            color="inherit"
                            aria-label="Open drawer"
                            onClick={this.handleDrawerOpen}
                            className={classNames(
                                classes.menuButton,
                                this.state.drawerOpen && classes.menuButtonHidden,
                            )}
                        >
                            <MenuIcon/>
                        </IconButton>
                        <Typography
                            component="h1"
                            variant="h6"
                            color="inherit"
                            noWrap
                            className={classes.title}
                        >
                            MyAnimeStream
                        </Typography>
                    </Toolbar>
                </AppBar>
                <Drawer
                    variant="permanent"
                    classes={{
                        paper: classNames(classes.drawerPaper, !this.state.drawerOpen && classes.drawerPaperClose),
                    }}
                    open={this.state.drawerOpen}
                >
                    <div className={classes.toolbarIcon}>
                        <IconButton onClick={this.handleDrawerClose}>
                            <ChevronLeftIcon/>
                        </IconButton>
                    </div>
                    <Divider/>
                    <List>
                        <ListSubheader inset>Options</ListSubheader>
                        <ListItem button onClick={() => this.switchTab(0)}>
                            <ListItemIcon><VideoLibraryIcon color={this.state.activeTab === 0 ? "primary" : "inherit"}/></ListItemIcon>
                            <ListItemText primary={_("options__video")}/>
                        </ListItem>
                        <ListItem button onClick={() => this.switchTab(1)}>
                            <ListItemIcon><SettingsInputComponentIcon color={this.state.activeTab === 1 ? "primary" : "inherit"}/></ListItemIcon>
                            <ListItemText primary={_("options__site_integration")}/>
                        </ListItem>
                        <ListItem button onClick={() => this.switchTab(2)}>
                            <ListItemIcon><BuildIcon color={this.state.activeTab === 2 ? "primary" : "inherit"}/></ListItemIcon>
                            <ListItemText primary={_("options__debug")}/>
                        </ListItem>
                    </List>
                </Drawer>
                <main className={classes.content}>
                    <div className={classes.appBarSpacer}/>
                    {this.getSettingsTab()}
                </main>
            </div>
        );
    }
});