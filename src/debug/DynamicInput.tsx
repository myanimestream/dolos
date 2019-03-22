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
import {isPrimitive} from "dolos/store";
import * as React from "react";

/**
 * Check whether something is numeric.
 */
function isNumeric(n: any): n is number {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

/** @ignore */
const useInputStyles = makeStyles((theme: Theme) => ({
    slider: {
        alignItems: "center",
        display: "flex",
        justifyContent: "space-between",
    },
    textFieldRight: {
        marginLeft: theme.spacing(2),
    },
}));

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
export function DynamicInput<T>({value, onChange}: { value: T, onChange: (value: T) => void }) {
    const classes = useInputStyles();

    const [error, setError] = React.useState(false);

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const serValue = e.target.value;
        let parsedValue;
        try {
            parsedValue = JSON.parse(serValue);
        } catch {
            setError(true);
            return;
        }

        onChange(parsedValue);
        setError(false);
    };

    if (typeof value === "boolean") {
        // @ts-ignore
        const handleChange = () => handleInternalChange(!internalValue);

        return (
            <Switch checked={value} onChange={handleChange}/>
        );
    } else if (typeof value === "string") {
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value as any);

        return (
            <TextField
                value={value}
                onChange={handleChange}
                fullWidth
            />
        );
    } else if (isNumeric(value) && value >= 0 && value <= 1) {
        const handleChange = (...args: any[]) => onChange(Number(args[1].toFixed(2)) as any);

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
    } else if (!isPrimitive(value)) {
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
    } else {
        return (
            <TextField
                value={JSON.stringify(value)}
                onChange={handleTextChange}
                error={error}
            />
        );
    }
}
