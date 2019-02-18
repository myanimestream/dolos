/**
 * @module options
 */

import AppBar from "@material-ui/core/AppBar";
import CssBaseline from "@material-ui/core/CssBaseline";
import Drawer from "@material-ui/core/Drawer";
import Hidden from "@material-ui/core/Hidden";
import IconButton from "@material-ui/core/IconButton";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import {fade} from "@material-ui/core/styles/colorManipulator";
import {Theme} from "@material-ui/core/styles/createMuiTheme";
import SwipeableDrawer from "@material-ui/core/SwipeableDrawer";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import BuildIcon from "@material-ui/icons/Build";
import FeaturedVideoIcon from "@material-ui/icons/FeaturedVideo";
import MenuIcon from "@material-ui/icons/Menu";
import SettingsInputComponentIcon from "@material-ui/icons/SettingsInputComponent";
import VideoLibraryIcon from "@material-ui/icons/VideoLibrary";
import makeStyles from "@material-ui/styles/makeStyles";
import useTheme from "@material-ui/styles/useTheme";
import {usePromiseMemo} from "dolos/hooks";
import * as React from "react";
import {HashRouter, NavLink, Redirect, Route, Switch} from "react-router-dom";
import Store from "../store";
import {SettingsTab, SettingsTabContentProps} from "./SettingsTab";
import {Debug, EmbedProviders, SiteIntegration, Video} from "./tabs";
import _ = chrome.i18n.getMessage;

/** @ignore */
const useStyles = makeStyles((theme: Theme) => {
    const drawerWidth = 240;

    return {
        activeDrawerLink: {
            "& *": {
                color: theme.palette.primary.main,
            },
            "backgroundColor": fade(theme.palette.primary.main, .12),
        },
        appBar: {
            marginLeft: drawerWidth,
            [theme.breakpoints.up("sm")]: {
                width: `calc(100% - ${drawerWidth}px)`,
            },
        },
        badge: {
            paddingRight: 2 * theme.spacing.unit,
        },
        buttonIconLeft: {
            marginRight: theme.spacing.unit,
        },
        content: {
            flexGrow: 1,
            padding: 2 * theme.spacing.unit,
        },
        drawer: {
            [theme.breakpoints.up("sm")]: {
                flexShrink: 0,
                width: drawerWidth,
            },
        },
        drawerPaper: {
            width: drawerWidth,
        },
        grow: {
            flexGrow: 1,
        },
        menuButton: {
            marginRight: 20,
            [theme.breakpoints.up("sm")]: {
                display: "none",
            },
        },
        root: {
            display: "flex",
        },
        toolbar: theme.mixins.toolbar,
    };
});

/**
 * React Component which provides the user with the option (hah)
 * to manipulate the [[Config]] values used by Dolos.
 *
 * The settings are structured into [[SettingsTabContent]].
 */
export function Settings() {
    const classes = useStyles();
    const theme: Theme = useTheme();

    const config = usePromiseMemo(() => Store.getConfig());

    const [drawerOpen, setDrawerOpen] = React.useState(false);
    const toggleDrawer = () => setDrawerOpen(!drawerOpen);

    function renderSettingsTab(content: React.ComponentType<SettingsTabContentProps>) {
        if (!config) return null;
        return (<SettingsTab config={config} content={content}/>);
    }

    const tabs = [
        {
            icon: VideoLibraryIcon,
            path: "/video",
            render: () => renderSettingsTab(Video),
            text: _("options__video__title"),
        },
        {
            icon: FeaturedVideoIcon,
            path: "/embed-providers",
            render: () => renderSettingsTab(EmbedProviders),
            text: _("options__embed_providers__title"),
        },
        {
            icon: SettingsInputComponentIcon,
            path: "/site-integration",
            render: () => renderSettingsTab(SiteIntegration),
            text: _("options__site_integration"),
        },
        {
            icon: BuildIcon,
            path: "/debug",
            render: () => renderSettingsTab(Debug),
            text: _("options__debug"),
        },
    ];

    const navLinks = (() => {
        const tabNav = tabs.map(target => {
            const icon = React.createElement(target.icon);

            const link = (props: {}) => (
                <NavLink
                    to={target.path}
                    activeClassName={classes.activeDrawerLink}
                    {...props}
                />
            );

            return (
                <ListItem key={target.path} button component={link}>
                    <ListItemIcon>
                        {icon}
                    </ListItemIcon>
                    <ListItemText primary={target.text}/>
                </ListItem>
            );
        });

        return (
            <List>
                {tabNav}
            </List>
        );
    })();

    const contentRoutes = (() => {
        const routes = tabs.map(tab => (
            <Route key={tab.path} path={tab.path} render={tab.render}/>
        ));

        return (<>{routes}</>);
    })();

    return (
        <HashRouter>
            <div className={classes.root}>
                <CssBaseline/>

                <AppBar position="fixed" className={classes.appBar}>
                    <Toolbar>
                        <IconButton
                            color="inherit"
                            className={classes.menuButton}
                            onClick={toggleDrawer}
                        >
                            <MenuIcon/>
                        </IconButton>
                        <Typography
                            className={classes.grow}
                            variant="h6"
                            color="inherit"
                            noWrap
                        >
                            {_("options__header")}
                        </Typography>
                    </Toolbar>
                </AppBar>

                <nav className={classes.drawer}>
                    <Hidden smUp implementation="css">
                        <SwipeableDrawer
                            variant="temporary"
                            anchor={theme.direction === "rtl" ? "right" : "left"}
                            open={drawerOpen}
                            onOpen={toggleDrawer}
                            onClick={toggleDrawer}
                            onClose={toggleDrawer}
                            classes={{paper: classes.drawerPaper}}
                            ModalProps={{keepMounted: true}}
                        >
                            {navLinks}
                        </SwipeableDrawer>
                    </Hidden>

                    <Hidden xsDown implementation="css">
                        <Drawer
                            classes={{paper: classes.drawerPaper}}
                            variant="permanent"
                            open
                        >
                            {navLinks}
                        </Drawer>
                    </Hidden>
                </nav>

                <main className={classes.content}>
                    <div className={classes.toolbar}/>
                    <Switch>
                        <Redirect exact path="/" to="/video"/>

                        {contentRoutes}
                    </Switch>
                </main>
            </div>
        </HashRouter>
    );
}
