/** @module components/anime */

/** @ignore */

import CircularProgress from "@material-ui/core/CircularProgress";
import Fade from "@material-ui/core/Fade";
import IconButton from "@material-ui/core/IconButton";
import Tooltip from "@material-ui/core/Tooltip";
import makeStyles from "@material-ui/styles/makeStyles";
import * as React from "react";

/** @ignore */
const useStyles = makeStyles(() => ({
    container: {
        display: "inline-block",
        position: "relative",
    },
    progress: {
        left: "50%",
        marginLeft: -12,
        marginTop: -12,
        position: "absolute",
        top: "50%",
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
        onToggle,
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

    const fadeStyle = {
        transitionDelay: loading ? "800ms" : "0ms",
    };

    return (
        <Tooltip title={toggled ? tooltipToggled : tooltip}>
            <div className={classes.container}>
                <IconButton onClick={handleToggle} color="primary" disabled={toggleDisabled}>
                    {toggled ? iconToggled : icon}
                </IconButton>
                <Fade
                    in={loading}
                    style={fadeStyle}
                    unmountOnExit
                >
                    <CircularProgress size={24} className={classes.progress}/>
                </Fade>
            </div>
        </Tooltip>
    );
}
