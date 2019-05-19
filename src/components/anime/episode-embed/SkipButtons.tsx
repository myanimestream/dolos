/**
 * Skip buttons.
 *
 * @module components/anime/episode-embed
 */

/** @ignore */

import IconButton from "@material-ui/core/IconButton";
import {SvgIconProps} from "@material-ui/core/SvgIcon";
import Tooltip from "@material-ui/core/Tooltip";
import SkipNextIcon from "@material-ui/icons/SkipNext";
import SkipPreviousIcon from "@material-ui/icons/SkipPrevious";
import * as React from "react";
import _ = chrome.i18n.getMessage;

/**
 * Skip button data
 */
export interface SkipButtonData {
    href?: string;
    onClick?: (e: React.MouseEvent<HTMLElement>) => void;
}

/**
 * @see [[SkipButton]]
 */
export interface SkipButtonProps extends SkipButtonData {
    icon: React.ComponentType<SvgIconProps>;
    title: string;
}

/**
 * Skip button
 */
export function SkipButton({href, onClick, icon, title}: SkipButtonProps) {
    let handleClick: ((e: React.MouseEvent<HTMLElement>) => void) | undefined;

    if (onClick) {
        handleClick = (e: React.MouseEvent<HTMLElement>) => {
            e.preventDefault();
            onClick!(e);
        };
    }

    const disabled = !(onClick || href);

    const iconElement = React.createElement(icon);
    return (
        <Tooltip title={title}>
            <span>
                {/* TODO Material-UI doesn't accept the "href" prop */}
                <IconButton
                    color="primary"
                    aria-label={title}
                    disabled={disabled}
                    onClick={handleClick}
                    {...{href}}
                >
                    {iconElement}
                </IconButton>
            </span>
        </Tooltip>
    );
}

/**
 * Skip to previous and next buttons.
 */
export function SkipButtons({previous, next}: { previous?: SkipButtonData, next?: SkipButtonData }) {
    return (
        <span>
            <SkipButton icon={SkipPreviousIcon} title={_("episode__skip_previous")} {...previous}/>
            <SkipButton icon={SkipNextIcon} title={_("episode__skip_next")} {...next}/>
        </span>
    );
}
