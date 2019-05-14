/**
 * @module debug
 */

import AppBar from "@material-ui/core/AppBar";
import CssBaseline from "@material-ui/core/CssBaseline";
import Paper from "@material-ui/core/Paper";
import {Theme} from "@material-ui/core/styles/createMuiTheme";
import Tab from "@material-ui/core/Tab";
import Tabs from "@material-ui/core/Tabs";
import Typography from "@material-ui/core/Typography";
import makeStyles from "@material-ui/styles/makeStyles";
import Service from "dolos/common/service";
import {grobberClient as localGrobberClient} from "dolos/grobber";
import {usePromiseMemo} from "dolos/hooks";
import {getBackgroundWindow} from "dolos/utils";
import * as React from "react";
import {MemoryComponent} from "./Memory";
import {StoreComponent} from "./Store";

function StoreTab() {
    return (
        <>
            <Typography paragraph>
                This is a list of all values in the Dolos store.
                Please be careful when editing values as it directly manipulates
                the actual values used by Dolos.

                There is no input validation other than the basic type
                distinction which can easily be overwritten.
            </Typography>

            <StoreComponent/>
        </>
    );
}

function GrobberClientTab() {
    const background = usePromiseMemo(() => (async () => {
        try {
            return await getBackgroundWindow();
        } catch {
            return undefined;
        }
    })(), []);

    let grobberClient;
    if (background)
        grobberClient = background.backgroundGrobberClient;
    else
        grobberClient = localGrobberClient;

    return (
        <>
            <Typography paragraph>
                {"Grobber client cache. "}
                {`Showing ${!!background ? "background" : "local"} grobber client`}
            </Typography>

            <MemoryComponent memory={grobberClient}/>
        </>
    );
}

function ServiceTab({service}: DebugProps) {
    if (!service) return null;

    const state = service.state;
    const page = state.page;

    let pageComponent;
    if (page) {
        const backgroundPages = Array.from(page.backgroundPages.entries()).map(([key, bPage]) => (
            <div key={key}>
                <Typography variant="h4" gutterBottom>
                    Background page #{key.toString()} memory
                </Typography>
                <Typography paragraph>
                    Background pages are loaded by the current main page.
                </Typography>

                <MemoryComponent memory={bPage}/>
            </div>
        ));

        pageComponent = (
            <>
                <Typography variant="h4" gutterBottom>
                    Main page memory
                </Typography>
                <Typography paragraph>
                    The main page is the currently active page.
                </Typography>

                <MemoryComponent memory={page}/>

                {backgroundPages}
            </>
        );
    }

    return (
        <>
            <Typography variant="h4" gutterBottom>
                Service state memory
            </Typography>
            <Typography paragraph>
                The service coordinates which page to show and
                can hold data shared between all pages.
            </Typography>

            <MemoryComponent memory={state}/>

            {pageComponent}
        </>
    );
}

const tabContents = [
    StoreTab,
    GrobberClientTab,
    ServiceTab,
];

const useDebugStyles = makeStyles((theme: Theme) => ({
    root: {
        flexGrow: 1,
        height: "100%",
    },
    tabValue: {
        ...theme.mixins.gutters,
        margin: theme.spacing(4),
    },
}));

/**
 * Props for [[Debug]].
 */
export interface DebugProps {
    service?: Service;
}

/**
 * Debug utility which shows various internal things.
 */
export function Debug(props: DebugProps) {
    const classes = useDebugStyles();
    const [currentTab, setCurrentTab] = React.useState(0);

    function handleTabChange(event: React.ChangeEvent<{}>, newTab: number) {
        setCurrentTab(newTab);
    }

    const tabs = [
        "Store",
        "Grobber Client",
    ];

    if (props.service) {
        tabs.push("Service");
    }

    const tabContent = React.createElement(tabContents[currentTab], props);
    const tabNav = tabs.map(tab => (<Tab key={tab} label={tab}/>));

    return (
        <Paper className={classes.root}>
            <CssBaseline/>

            <AppBar position="static" color="default">
                <Tabs
                    value={currentTab}
                    onChange={handleTabChange}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    {tabNav}
                </Tabs>
            </AppBar>

            <main className={classes.tabValue}>
                {tabContent}
            </main>
        </Paper>
    );
}
