/**
 * @module common/components
 */

import Chip from "@material-ui/core/Chip";
import MenuItem from "@material-ui/core/MenuItem";
import Paper from "@material-ui/core/Paper";
import {emphasize} from "@material-ui/core/styles/colorManipulator";
import {Theme} from "@material-ui/core/styles/createMuiTheme";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import CancelIcon from "@material-ui/icons/Cancel";
import makeStyles from "@material-ui/styles/makeStyles";
import useTheme from "@material-ui/styles/useTheme";
import classNames from "classnames";
import * as React from "react";
import {CSSProperties} from "react";
import {Creatable} from "react-select";
import {CreatableProps} from "react-select/lib/Creatable";
import {Props as SelectableProps} from "react-select/lib/Select";

/* @ignore */
const useStyles = makeStyles((theme: Theme) => ({
    chip: {
        margin: `${theme.spacing(.5)} ${theme.spacing(.25)}`,
    },
    chipFocused: {
        backgroundColor: emphasize(
            theme.palette.type === "light" ? theme.palette.grey[300] : theme.palette.grey[700],
            0.08,
        ),
    },
    divider: {
        height: theme.spacing(2),
    },
    input: {
        display: "flex",
        padding: 0,
    },
    noOptionsMessage: {
        padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
    },
    paper: {
        left: 0,
        marginTop: theme.spacing(1),
        position: "absolute",
        right: 0,
        zIndex: 2,
    },
    placeholder: {
        fontSize: 16,
        left: 2,
        position: "absolute",
    },
    root: {
        flexGrow: 1,
        height: 250,
    },
    singleValue: {
        fontSize: 16,
    },
    valueContainer: {
        alignItems: "center",
        display: "flex",
        flex: 1,
        flexWrap: "wrap",
        overflow: "hidden",
    },
}));

function NoOptionsMessage(props: React.ComponentProps<any>) {
    return (
        <Typography
            color="textSecondary"
            className={props.selectProps.classes.noOptionsMessage}
            {...props.innerProps}
        >
            {props.children}
        </Typography>
    );
}

function inputComponent({inputRef, ...props}: React.ComponentProps<any>) {
    return <div ref={inputRef} {...props} />;
}

function Control(props: React.ComponentProps<any>) {
    const inputProps = {
        inputComponent,
        inputProps: {
            children: props.children,
            className: props.selectProps.classes.input,
            inputRef: props.innerRef,
            ...props.innerProps,
        },
    };

    return (
        <TextField
            fullWidth
            InputProps={inputProps}
            {...props.selectProps.textFieldProps}
        />
    );
}

function Option(props: React.ComponentProps<any>) {
    const itemStyle = {
        fontWeight: props.isSelected ? 500 : 400,
    };

    return (
        <MenuItem
            buttonRef={props.innerRef}
            selected={props.isFocused}
            component="div"
            style={itemStyle}
            {...props.innerProps}
        >
            {props.children}
        </MenuItem>
    );
}

function Placeholder(props: React.ComponentProps<any>) {
    return (
        <Typography
            color="textSecondary"
            className={props.selectProps.classes.placeholder}
            {...props.innerProps}
        >
            {props.children}
        </Typography>
    );
}

function SingleValue(props: React.ComponentProps<any>) {
    return (
        <Typography className={props.selectProps.classes.singleValue} {...props.innerProps}>
            {props.children}
        </Typography>
    );
}

function ValueContainer(props: React.ComponentProps<any>) {
    return <div className={props.selectProps.classes.valueContainer}>{props.children}</div>;
}

function MultiValue(props: React.ComponentProps<any>) {
    const className = classNames(props.selectProps.classes.chip, {
        [props.selectProps.classes.chipFocused]: props.isFocused,
    });

    return (
        <Chip
            tabIndex={-1}
            label={props.children}
            className={className}
            onDelete={props.removeProps.onClick}
            deleteIcon={<CancelIcon {...props.removeProps} />}
        />
    );
}

function Menu(props: React.ComponentProps<any>) {
    return (
        <Paper square className={props.selectProps.classes.paper} {...props.innerProps}>
            {props.children}
        </Paper>
    );
}

const components = {
    Control,
    Menu,
    MultiValue,
    NoOptionsMessage,
    Option,
    Placeholder,
    SingleValue,
    ValueContainer,
};

export function MUICreatable<OptionsType>(props: SelectableProps<OptionsType> & CreatableProps<OptionsType>) {
    const classes = useStyles();
    const theme: Theme = useTheme();

    const selectStyles = {
        input: (base: CSSProperties) => ({
            ...base,
            "& input": {
                font: "inherit",
            },
            "color": theme.palette.text.primary,
        }),
    };

    return (
        // @ts-ignore
        <Creatable
            classes={classes}
            styles={selectStyles}
            components={components}
            {...props}
        />
    );
}
