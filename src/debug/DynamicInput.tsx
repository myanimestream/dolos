/**
 * @module debug
 */

import {Theme} from "@material-ui/core/styles/createMuiTheme";
import Switch from "@material-ui/core/Switch";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableRow from "@material-ui/core/TableRow";
import TextField from "@material-ui/core/TextField";
import Slider from "@material-ui/lab/Slider";
import makeStyles from "@material-ui/styles/makeStyles";
import * as React from "react";

/**
 * Check whether something is numeric.
 */
function isNumeric(value: any): value is number {
    return typeof value === "number" && isFinite(value);
}

/**
 * Check whether the given value is an object.
 */
function isObject(value: any): value is object {
    return value !== null && typeof value === "object";
}

export interface DynamicInputProps<T> {
    value: T;
    error?: boolean;
    onChange: (value: T) => void;
    setError?: (hasError: boolean) => void;
}

/**
 * A flexible input container which handles all kinds of values.
 * Uses an internal value state so it doesn't depend on you actually changing
 * the value.
 *
 * `boolean`: switch
 *
 * `number`:
 *      between 0 and 1 inclusive: slider
 *      otherwise: text field
 *
 *  other: text field
 */
export function DynamicInput<T>(props: DynamicInputProps<T>) {
    const [error, setError] = React.useState(false);

    const value = props.value;

    let type: React.ComponentType<DynamicInputProps<any>>;
    if (typeof value === "boolean")
        type = BooleanInput;
    else if (typeof value === "string")
        type = StringInput;
    else if (isNumeric(value) && value >= 0 && value <= 1)
        type = PercentageInput;
    else if (isObject(value))
        type = ObjectInput;
    else
        type = JSONInput;

    return React.createElement(type, {error, setError, ...props});
}

function createJSONChangeHandler<T>(onChange: DynamicInputProps<T>["onChange"],
                                    setError: DynamicInputProps<T>["setError"]):
    (e: React.ChangeEvent<HTMLInputElement>) => void {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;

        let parsedValue;
        try {
            parsedValue = JSON.parse(rawValue);
        } catch {
            if (setError) setError(true);
            return;
        }

        onChange(parsedValue);
        if (setError) setError(false);
    };
}

function BooleanInput({value, onChange}: DynamicInputProps<boolean>) {
    const handleChange = () => onChange(!value);

    return (
        <Switch
            checked={value}
            onChange={handleChange}
        />
    );
}

function StringInput({value, error, onChange}: DynamicInputProps<string>) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value);

    return (
        <TextField
            value={value}
            onChange={handleChange}
            error={error}
            fullWidth
        />
    );
}

/** @ignore */
const usePercentageInputStyles = makeStyles((theme: Theme) => ({
    slider: {
        alignItems: "center",
        display: "flex",
        justifyContent: "space-between",
    },
    textFieldRight: {
        marginLeft: theme.spacing(2),
    },
}));

function PercentageInput({value, error, onChange, setError}: DynamicInputProps<number>) {
    const classes = usePercentageInputStyles();

    const handleChange = (...args: any[]) => onChange(Number(args[1].toFixed(2)));
    const handleTextChange = createJSONChangeHandler(onChange, setError);

    return (
        <div className={classes.slider}>
            <Slider value={value} min={0} max={1} step={0.01} onChange={handleChange}/>
            <TextField
                className={classes.textFieldRight}
                value={JSON.stringify(value)}
                onChange={handleTextChange}
                margin="normal"
                error={error}
            />
        </div>
    );
}

function ObjectInput({value, onChange}: DynamicInputProps<object>) {
    const fields = [];

    for (const [fieldKey, fieldValue] of Object.entries(value)) {
        const handleValueChange = (newValue: any) => onChange({
            ...value,
            [fieldKey]: newValue,
        });

        fields.push((
            <TableRow key={fieldKey}>
                <TableCell>{fieldKey}</TableCell>

                <TableCell>
                    <DynamicInput value={fieldValue} onChange={handleValueChange}/>
                </TableCell>
            </TableRow>
        ));
    }

    return (
        <Table>
            <TableBody>
                {fields}
            </TableBody>
        </Table>
    );
}

function JSONInput({value, error, onChange, setError}: DynamicInputProps<any>) {
    const handleTextChange = createJSONChangeHandler(onChange, setError);

    return (
        <TextField
            value={JSON.stringify(value)}
            onChange={handleTextChange}
            error={error}
        />
    );
}
