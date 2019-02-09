/**
 * @module options
 */

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
import {Theme} from "@material-ui/core/styles/createMuiTheme";
import createStyles from "@material-ui/core/styles/createStyles";
import withStyles, {WithStyles} from "@material-ui/core/styles/withStyles";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import BuildIcon from "@material-ui/icons/Build";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import MenuIcon from "@material-ui/icons/Menu";
import SettingsInputComponentIcon from "@material-ui/icons/SettingsInputComponent";
import VideoLibraryIcon from "@material-ui/icons/VideoLibrary";
import classNames from "classnames";
import * as React from "react";
import {HashRouter, Link, Redirect, Route, RouteComponentProps, Switch} from "react-router-dom";
import {Config} from "../models";
import Store from "../store";
import SettingsTab from "./SettingsTab";
import {Debug, SiteIntegration, Video} from "./tabs";
import _ = chrome.i18n.getMessage;

const drawerWidth = 240;

const styles = (theme: Theme) => createStyles({
    appBar: {
        transition: theme.transitions.create(["width", "margin"], {
            duration: theme.transitions.duration.leavingScreen,
            easing: theme.transitions.easing.sharp,
        }),
        zIndex: theme.zIndex.drawer + 1,
    },
    appBarShift: {
        marginLeft: drawerWidth,
        transition: theme.transitions.create(["width", "margin"], {
            duration: theme.transitions.duration.enteringScreen,
            easing: theme.transitions.easing.sharp,
        }),
        width: `calc(100% - ${drawerWidth}px)`,
    },
    appBarSpacer: theme.mixins.toolbar,
    content: {
        flexGrow: 1,
        height: "100vh",
        overflow: "auto",
        padding: theme.spacing.unit * 3,
    },
    drawerPaper: {
        position: "relative",
        transition: theme.transitions.create("width", {
            duration: theme.transitions.duration.enteringScreen,
            easing: theme.transitions.easing.sharp,
        }),
        whiteSpace: "nowrap",
        width: drawerWidth,
    },
    drawerPaperClose: {
        overflowX: "hidden",
        transition: theme.transitions.create("width", {
            duration: theme.transitions.duration.leavingScreen,
            easing: theme.transitions.easing.sharp,
        }),
        width: theme.spacing.unit * 7,
        [theme.breakpoints.up("sm")]: {
            width: theme.spacing.unit * 9,
        },
    },
    link: {
        textDecoration: "none",
    },
    menuButton: {
        marginLeft: 12,
        marginRight: 36,
    },
    menuButtonHidden: {
        display: "none",
    },
    root: {
        display: "flex",
    },
    title: {
        flexGrow: 1,
    },
    toolbar: {
        paddingRight: 24, // keep right padding when drawer closed
    },
    toolbarIcon: {
        alignItems: "center",
        display: "flex",
        justifyContent: "flex-end",
        padding: "0 8px",
        ...theme.mixins.toolbar,
    },
});

interface SettingsProps extends WithStyles<typeof styles> {
}

interface SettingsState {
    drawerOpen: boolean;
    configPromise: Promise<Config>;
}

export default withStyles(styles)(
    class extends React.Component<SettingsProps, SettingsState> {
        constructor(props: SettingsProps) {
            super(props);
            this.state = {
                configPromise: Store.getConfig(),
                drawerOpen: false,
            };
        }

        public render() {
            const {classes} = this.props;

            const renderRoutes = this.renderRoutes.bind(this);

            const drawerClasses = {
                paper: classNames(classes.drawerPaper, !this.state.drawerOpen && classes.drawerPaperClose),
            };

            const openDrawerClassName = classNames(
                classes.menuButton,
                this.state.drawerOpen && classes.menuButtonHidden,
            );
            return (
                <HashRouter>
                    <div className={classes.root}>
                        <CssBaseline/>
                        <AppBar
                            position="fixed"
                            className={classNames(classes.appBar, this.state.drawerOpen && classes.appBarShift)}
                        >
                            <Toolbar disableGutters={!this.state.drawerOpen} className={classes.toolbar}>
                                <IconButton
                                    color="inherit"
                                    onClick={this.handleDrawerOpen}
                                    className={openDrawerClassName}
                                >
                                    <MenuIcon/>
                                </IconButton>
                                <Typography
                                    component="h1"
                                    variant="h6"
                                    color="inherit"
                                    noWrap={true}
                                    className={classes.title}
                                >
                                    Dolos Settings
                                </Typography>
                            </Toolbar>
                        </AppBar>
                        <Drawer
                            variant="permanent"
                            classes={drawerClasses}
                            open={this.state.drawerOpen}
                        >
                            <div className={classes.toolbarIcon}>
                                <IconButton onClick={this.handleDrawerClose}>
                                    <ChevronLeftIcon/>
                                </IconButton>
                            </div>
                            <Divider/>
                            <Route
                                path="/"
                                render={renderRoutes}
                            />
                        </Drawer>
                        <main className={classes.content}>
                            <div className={classes.appBarSpacer}/>
                            <Switch>
                                <Redirect exact={true} path="/" to="/video"/>
                                <Route path="/video" render={this.getSettingsTab}/>
                                <Route path="/site-integration" render={this.getSettingsTab}/>
                                <Route path="/debug" render={this.getSettingsTab}/>
                            </Switch>
                        </main>
                    </div>
                </HashRouter>
            );
        }

        private handleDrawerOpen = () => this.setState({drawerOpen: true});

        private handleDrawerClose = () => this.setState({drawerOpen: false});

        private saveConfig = async (config: Config) => {
            await Store.set("config", config);
            this.setState({configPromise: Promise.resolve(config)});
        };

        private getSettingsTab = (props: React.ComponentProps<any>) => {
            let content;

            switch (props.match.path) {
                case "/video":
                    content = Video;
                    break;
                case "/site-integration":
                    content = SiteIntegration;
                    break;
                case "/debug":
                    content = Debug;
                    break;
            }

            if (!content) return undefined;

            const getConfig = () => this.state.configPromise;

            return (
                <SettingsTab
                    getConfig={getConfig}
                    saveConfig={this.saveConfig}
                    content={content}
                />);
        };

        private renderRoutes(props: RouteComponentProps<any>) {
            const {classes} = this.props;
            return (
                <List>
                    <ListSubheader inset={true}>Options</ListSubheader>
                    <Link className={classes.link} to="/video">
                        <ListItem button={true}>
                            <ListItemIcon>
                                <VideoLibraryIcon
                                    color={props.location.pathname === "/video" ? "primary" : "inherit"}
                                />
                            </ListItemIcon>
                            <ListItemText primary={_("options__video")}/>
                        </ListItem>
                    </Link>
                    <Link className={classes.link} to="/site-integration">
                        <ListItem button={true}>
                            <ListItemIcon>
                                <SettingsInputComponentIcon
                                    color={props.location.pathname === "/site-integration" ? "primary" : "inherit"}
                                />
                            </ListItemIcon>
                            <ListItemText primary={_("options__site_integration")}/>
                        </ListItem>
                    </Link>
                    <Link className={classes.link} to="/debug">
                        <ListItem button={true}>
                            <ListItemIcon>
                                <BuildIcon
                                    color={props.location.pathname === "/debug" ? "primary" : "inherit"}
                                />
                            </ListItemIcon>
                            <ListItemText primary={_("options__debug")}/>
                        </ListItem>
                    </Link>
                </List>
            );
        }
    },
);
