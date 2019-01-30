/** @module common.components.anime */

/** @ignore */

import CircularProgress from "@material-ui/core/CircularProgress";
import Fade from "@material-ui/core/Fade";
import IconButton from "@material-ui/core/IconButton";
import Tooltip from "@material-ui/core/Tooltip";
import {makeStyles} from "@material-ui/styles";
import * as React from "react";

/** @ignore */
const useStyles = makeStyles(() => ({
    container: {
        position: "relative",
        display: "inline-block",
    },
    progress: {
        position: "absolute",
        top: "50%",
        left: "50%",
        marginTop: -12,
        marginLeft: -12,
    },
}));

export interface ToggleProps {
    icon: React.ReactNode;
    iconToggled: React.ReactNode;

    tooltip: string;
    tooltipToggled: string;

    toggled: boolean;
    canToggle: boolean;

    onToggle: (toggled: boolean) => Promise<any> | any;
}

/**
 * A glorified IconButton with a loading animation appearing after 800ms.
 * The `onToggle` function may return a promise which is awaited before
 * the loading animation ends.
 */
export function Toggle(props: ToggleProps) {
    const {
        icon, iconToggled,
        tooltip, tooltipToggled,
        toggled, canToggle,
        onToggle
    } = props;

    const classes = useStyles();
    const [loading, setLoading] = React.useState(false);

    async function handleToggle() {
        setLoading(true);

        try {
            await Promise.resolve(onToggle(!toggled));
        } finally {
            setLoading(false);
        }
    }

    const toggleDisabled = loading || !canToggle;

    return (
        <Tooltip title={toggled ? tooltipToggled : tooltip}>
            <div className={classes.container}>
                <IconButton onClick={handleToggle} color="primary" disabled={toggleDisabled}>
                    {toggled ? iconToggled : icon}
                </IconButton>
                <Fade
                    in={loading}
                    style={{
                        transitionDelay: loading ? "800ms" : "0ms",
                    }}
                    unmountOnExit
                >
                    <CircularProgress size={24} className={classes.progress}/>
                </Fade>
            </div>
        </Tooltip>
    );
}