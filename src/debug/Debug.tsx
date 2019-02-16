/**
 * @module debug
 */

import {AppBar, CssBaseline, Paper, Tabs, Theme, Typography} from "@material-ui/core";
import Tab from "@material-ui/core/Tab";
import {makeStyles} from "@material-ui/styles";
import {grobberClient as localGrobberClient} from "dolos/grobber";
import {usePromiseMemo} from "dolos/hooks";
import Store from "dolos/store";
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

                There is no input validation other than the basic type distinction.
            </Typography>

            <StoreComponent store={Store}/>
        </>
    );
}

function GrobberClientTab() {
    let background;

    try {
        background = usePromiseMemo(() => getBackgroundWindow());
    } catch {
        background = undefined;
    }

    let grobberClient;
    if (background)
        grobberClient = background.backgroundGrobberClient;
    else
        grobberClient = localGrobberClient;

    return (
        <>
            <Typography paragraph>
                Grobber client cache.
                {`Showing ${!!background ? "background" : "local"} grobber client`}
            </Typography>
            <MemoryComponent memory={grobberClient}/>
        </>
    );
}

const tabs = [
    StoreTab,
    GrobberClientTab,
];

const useDebugStyles = makeStyles((theme: Theme) => ({
    root: {
        flexGrow: 1,
        height: "100%",
    },
    tabValue: {
        ...theme.mixins.gutters,
        margin: 4 * theme.spacing.unit,
    },
}));

export function Debug() {
    const classes = useDebugStyles();
    const [currentTab, setCurrentTab] = React.useState(0);

    function handleTabChange(event: React.ChangeEvent<{}>, newTab: number) {
        setCurrentTab(newTab);
    }

    const tab = React.createElement(tabs[currentTab]);

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
                    <Tab label="Store"/>
                    <Tab label="Grobber Client"/>
                </Tabs>
            </AppBar>

            <main className={classes.tabValue}>
                {tab}
            </main>
        </Paper>
    );
}
