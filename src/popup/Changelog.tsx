import * as React from "react";

type Change = React.ReactElement<any>;

interface Changelog {
    [version: string]: Change[];
}

const CHANGELOG: Changelog = {
    "0.0.5": [
        <>Fixed styling issue with player which would lead to ugly borders</>,
        <>Added button to player to switch between dolos player (if possible) and embedded players</>
    ],
    "0.0.4": [
        <>Added this changelog. <i>Oh and I won't translate this to other languages so you may f*ck right off!</i></>,
        <><b>Embed selection</b> for episodes without direct streams</>,
        <>Automatic Anime <b>progress update</b></>,
    ],
    "0.0.3": [
        <>You would think that I would remember the things I changed only a few days ago. But you would be wrong.</>
    ],
    "0.0.0": [
        <>Don't think this version ever existed?</>
    ]
};

export default CHANGELOG;