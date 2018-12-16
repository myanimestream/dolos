import AppBar from "@material-ui/core/AppBar";
import CssBaseline from "@material-ui/core/CssBaseline";
import Divider from "@material-ui/core/Divider";
import Drawer from "@material-ui/core/Drawer";
import Hidden from "@material-ui/core/Hidden";
import IconButton from "@material-ui/core/IconButton";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import {fade} from "@material-ui/core/styles/colorManipulator";
import {Theme} from "@material-ui/core/styles/createMuiTheme";
import createStyles from "@material-ui/core/styles/createStyles";
import withStyles, {WithStyles} from "@material-ui/core/styles/withStyles";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import TemporaryTestIcon from "@material-ui/icons/BugReport";
import FeedbackIcon from "@material-ui/icons/Feedback";
import HelpIcon from "@material-ui/icons/Help";
import HomeIcon from "@material-ui/icons/Home";
import MenuIcon from "@material-ui/icons/Menu";
import OpenInNewIcon from "@material-ui/icons/OpenInNew";
import SettingsIcon from "@material-ui/icons/Settings";
import * as React from "react";
import {HashRouter, matchPath, NavLink, Redirect, Route, Switch, withRouter} from "react-router-dom";

const drawerWidth = 240;

const styles = (theme: Theme) => createStyles({
    root: {
        ...this.grow,
        minWidth: 300,
        minHeight: 400,
    },
    grow: {
        flexGrow: 1,
    },
    appBar: {
        marginLeft: drawerWidth,
        [theme.breakpoints.up("sm")]: {
            width: `calc(100% - ${drawerWidth}px)`,
        },
    },
    menuButton: {
        marginRight: 20,
        [theme.breakpoints.up("sm")]: {
            display: "none",
        },
    },
    drawer: {
        [theme.breakpoints.up("sm")]: {
            width: drawerWidth,
            flexShrink: 0,
        },
    },
    drawerPaper: {
        width: drawerWidth,
    },
    activeDrawerLink: {
        backgroundColor: fade(theme.palette.primary.main, .12),
        "& *": {
            color: theme.palette.primary.main
        },
    },
    toolbar: theme.mixins.toolbar,
    content: {
        flexGrow: 1,
        padding: theme.spacing.unit * 3,
    },
});

interface PopupProps extends WithStyles<typeof styles, true> {
}

interface PopupState {
    drawerOpen: boolean
}

export default withStyles(styles, {withTheme: true})(class Popup extends React.Component<PopupProps, PopupState> {
    constructor(props: PopupProps) {
        super(props);
        this.state = {
            drawerOpen: false,
        }
    }

    toggleDrawer() {
        this.setState({drawerOpen: !this.state.drawerOpen});
    }

    renderHome = () => {
        return (
            <Typography paragraph>
                Hello World!
            </Typography>);
    };

    renderFeedback = () => {
        return (
            <Typography paragraph>
                Hello World!
            </Typography>);
    };

    renderHelp = () => {
        return (
            <Typography paragraph>
                There's no help yet, sorry boi!
            </Typography>);
    };

    render() {
        const {classes, theme} = this.props;

        const getLink = (target: string) => props => <NavLink to={target} activeClassName={classes.activeDrawerLink} {...props} />;
        const HomeLink = getLink("/home");
        const TestLink = getLink("/test");

        const FeedbackLink = getLink("/feedback");
        const HelpLink = getLink("/help");

        const drawer = (
            <>
                <List>
                    <ListItem button component={HomeLink}>
                        <ListItemIcon><HomeIcon/></ListItemIcon>
                        <ListItemText primary="Home"/>
                    </ListItem>
                    <ListItem button component={TestLink}>
                        <ListItemIcon><TemporaryTestIcon/></ListItemIcon>
                        <ListItemText primary="Test"/>
                    </ListItem>
                </List>
                <Divider/>
                <List>
                    <ListItem button onClick={() => chrome.runtime.openOptionsPage()}>
                        <ListItemIcon><SettingsIcon/></ListItemIcon>
                        <ListItemText primary="Settings"/>
                        <OpenInNewIcon fontSize="small"/>
                    </ListItem>
                    <ListItem button component={FeedbackLink}>
                        <ListItemIcon><FeedbackIcon/></ListItemIcon>
                        <ListItemText primary="Send Feedback"/>
                    </ListItem>
                    <ListItem button component={HelpLink}>
                        <ListItemIcon><HelpIcon/></ListItemIcon>
                        <ListItemText primary="Help"/>
                    </ListItem>
                </List>
            </>
        );

        return (
            <HashRouter>
                <div className={classes.root}>
                    <CssBaseline/>

                    <AppBar position="fixed" className={classes.appBar}>
                        <Toolbar>
                            <IconButton color="inherit" aria-label="Menu" className={classes.menuButton} onClick={() => this.toggleDrawer()}>
                                <MenuIcon/>
                            </IconButton>
                            <Typography variant="h6" color="inherit" className={classes.grow}>
                                MyAnimeStream
                            </Typography>
                        </Toolbar>
                    </AppBar>
                    <nav className={classes.drawer}>
                        <Hidden smUp implementation="css">
                            <Drawer
                                variant="temporary"
                                anchor={theme.direction === "rtl" ? "right" : "left"}
                                open={this.state.drawerOpen}
                                onClick={() => this.toggleDrawer()}
                                onClose={() => this.toggleDrawer()}
                                classes={{
                                    paper: classes.drawerPaper,
                                }}
                                ModalProps={{
                                    keepMounted: true, // Better open performance on mobile.
                                }}
                            >
                                {drawer}
                            </Drawer>
                        </Hidden>
                        <Hidden xsDown implementation="css">
                            <Drawer
                                classes={{
                                    paper: classes.drawerPaper,
                                }}
                                variant="permanent"
                                open
                            >
                                {drawer}
                            </Drawer>
                        </Hidden>
                    </nav>
                    <main className={classes.content}>
                        <div className={classes.toolbar}/>
                        <Switch>
                            <Redirect exact path="/" to="/home"/>
                            <Route path="/home" render={this.renderHome}/>
                            <Route path="/test" render={() => <Typography>"rip?"</Typography>}/>

                            <Route path="/feedback" render={this.renderFeedback}/>
                            <Route path="/help" render={this.renderHelp}/>
                        </Switch>
                    </main>
                </div>
            </HashRouter>
        )
    }
});