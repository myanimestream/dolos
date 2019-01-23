/**
 * @module popup
 */

import {Card} from "@material-ui/core";
import AppBar from "@material-ui/core/AppBar";
import Badge from "@material-ui/core/Badge";
import Button from "@material-ui/core/Button";
import CardActionArea from "@material-ui/core/CardActionArea";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
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
import SwipeableDrawer from "@material-ui/core/SwipeableDrawer";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import FeedbackIcon from "@material-ui/icons/Feedback";
import HelpIcon from "@material-ui/icons/Help";
import HistoryIcon from "@material-ui/icons/History";
import HomeIcon from "@material-ui/icons/Home";
import MenuIcon from "@material-ui/icons/Menu";
import OpenInNewIcon from "@material-ui/icons/OpenInNew";
import SettingsIcon from "@material-ui/icons/Settings";
import SubscriptionsIcon from "@material-ui/icons/Subscriptions";
import SubscriptionsDisplay from "dolos/popup/SubscriptionsDisplay";
import * as React from "react";
import {NavLink, Redirect, Route, RouteComponentProps, Switch, withRouter} from "react-router-dom";
import * as rxjs from "rxjs";
import GitHubIcon from "../assets/GitHubIcon";
import * as info from "../info";
import {getBackgroundWindow} from "../utils";
import Changelog from "./ChangelogDisplay";
import _ = chrome.i18n.getMessage;

/** @ignore */
const styles = (theme: Theme) => {
    const drawerWidth = 240;

    const grow = {
        flexGrow: 1,
    };

    return createStyles({
        root: {
            display: "flex",
            minWidth: 300,
            minHeight: 400,
        },
        grow,
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
            padding: 2 * theme.spacing.unit,
        },
        buttonIconLeft: {
            marginRight: theme.spacing.unit,
        }
    });
};

interface PopupProps extends WithStyles<typeof styles, true>, RouteComponentProps<any> {
}

interface PopupState {
    drawerOpen: boolean;
    changelogBadgeVisible: boolean;
}

/**
 * Main react component for the extension popup.
 */
class Popup extends React.Component<PopupProps, PopupState> {
    hasNewVersionSub?: rxjs.Subscription;

    constructor(props: PopupProps) {
        super(props);
        this.state = {
            drawerOpen: false,
            changelogBadgeVisible: false,
        }
    }

    componentWillUnmount() {
        if (this.hasNewVersionSub) this.hasNewVersionSub.unsubscribe();
    }

    async componentDidMount() {
        const {history} = this.props;

        const background = await getBackgroundWindow();
        this.hasNewVersionSub = background.hasNewVersion$.subscribe(changelogBadgeVisible => {
            if (changelogBadgeVisible) history.push("/changelog");
            this.setState({changelogBadgeVisible});
        });
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

    renderSubscriptions = () => {
        return <SubscriptionsDisplay/>;
    };

    renderChangelog = () => {
        return <Changelog/>;
    };

    renderFeedback = () => {
        const {classes} = this.props;

        return (
            <Card>
                <CardActionArea>
                    <CardContent>
                        <Typography gutterBottom variant="h5">GitHub Issues</Typography>
                        <Typography>{_("popup__feedback__github_issues__text")}</Typography>
                    </CardContent>
                </CardActionArea>
                <CardActions>

                    <Button variant="contained" color="primary"
                            onClick={() => window.open("https://github.com/MyAnimeStream/dolos/issues")}
                    >
                        <GitHubIcon className={classes.buttonIconLeft}/>
                        {_("popup__feedback__github_issues__action")}
                    </Button>
                </CardActions>
            </Card>
        );
    };

    renderHelp = () => {
        return (
            <Typography paragraph>
                There's no help yet, sorry boi!
                Version {info.getVersion()}
            </Typography>
        );
    };

    render() {
        const {classes, theme} = this.props;
        const {changelogBadgeVisible} = this.state;

        const getLink = (target: string) => (props: {}) => <NavLink to={target}
                                                                    activeClassName={classes.activeDrawerLink} {...props} />;
        const HomeLink = getLink("/home");
        const SubscriptionsLink = getLink("/subscriptions");
        const ChangelogLink = getLink("/changelog");

        const FeedbackLink = getLink("/feedback");
        const HelpLink = getLink("/help");

        const drawer = (
            <>
                <List>
                    <ListItem button component={HomeLink}>
                        <ListItemIcon><HomeIcon/></ListItemIcon>
                        <ListItemText primary={_("popup__nav__home")}/>
                    </ListItem>
                    <ListItem button component={SubscriptionsLink}>
                        <ListItemIcon><SubscriptionsIcon/></ListItemIcon>
                        <ListItemText primary={_("popup__nav__subscriptions")}/>
                    </ListItem>
                    <ListItem button component={ChangelogLink}>
                        <ListItemIcon>
                            <HistoryIcon/>
                        </ListItemIcon>
                        <Badge color="primary" badgeContent={1} invisible={!changelogBadgeVisible}>
                            <ListItemText primary={_("popup__nav__changelog")}/>
                        </Badge>
                    </ListItem>
                </List>
                <Divider/>
                <List>
                    <ListItem button onClick={() => chrome.runtime.openOptionsPage()}>
                        <ListItemIcon><SettingsIcon/></ListItemIcon>
                        <ListItemText primary={_("popup__nav__settings")}/>
                        <OpenInNewIcon fontSize="small"/>
                    </ListItem>
                    <ListItem button component={FeedbackLink}>
                        <ListItemIcon><FeedbackIcon/></ListItemIcon>
                        <ListItemText primary={_("popup__nav__feedback")}/>
                    </ListItem>
                    <ListItem button component={HelpLink}>
                        <ListItemIcon><HelpIcon/></ListItemIcon>
                        <ListItemText primary={_("popup__nav__help")}/>
                    </ListItem>
                </List>
            </>
        );

        return (
            <div className={classes.root}>
                <CssBaseline/>

                <AppBar position="fixed" className={classes.appBar}>
                    <Toolbar>
                        <IconButton color="inherit" aria-label="Menu" className={classes.menuButton}
                                    onClick={() => this.toggleDrawer()}>
                            <MenuIcon/>
                        </IconButton>
                        <Typography variant="h6" color="inherit" className={classes.grow}>
                            MyAnimeStream
                        </Typography>
                    </Toolbar>
                </AppBar>
                <nav className={classes.drawer}>
                    <Hidden smUp implementation="css">
                        <SwipeableDrawer
                            variant="temporary"
                            anchor={theme.direction === "rtl" ? "right" : "left"}
                            open={this.state.drawerOpen}
                            onOpen={() => this.toggleDrawer()}
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
                        </SwipeableDrawer>
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
                        <Route path="/subscriptions" render={this.renderSubscriptions}/>
                        <Route path="/changelog" render={this.renderChangelog}/>

                        <Route path="/feedback" render={this.renderFeedback}/>
                        <Route path="/help" render={this.renderHelp}/>
                    </Switch>
                </main>
            </div>
        )
    }
}

export default withStyles(styles, {withTheme: true})(withRouter(Popup));