/**
 * @module debug
 */

import {Switch, Table, TableBody, TableCell, TableRow, TextField, Theme} from "@material-ui/core";
import {Slider} from "@material-ui/lab";
import {makeStyles} from "@material-ui/styles";
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
        marginLeft: 2 * theme.spacing.unit,
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

    const [internalValue, setInternalValue] = React.useState(value);
    const [error, setError] = React.useState(false);

    const handleInternalChange = (newValue: T) => {
        setInternalValue(newValue);
        onChange(newValue);
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const serValue = e.target.value;
        let parsedValue;
        try {
            parsedValue = JSON.parse(serValue);
        } catch {
            setError(true);
            return;
        }

        handleInternalChange(parsedValue);
        setError(false);
    };

    if (typeof internalValue === "boolean") {
        // @ts-ignore
        const handleChange = () => handleInternalChange(!internalValue);

        return (
            <Switch checked={internalValue} onChange={handleChange}/>
        );
    } else if (typeof internalValue === "string") {
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInternalChange(e.target.value as any);

        return (
            <TextField
                value={internalValue}
                onChange={handleChange}
                fullWidth
            />
        );
    } else if (isNumeric(internalValue) && internalValue >= 0 && internalValue <= 1) {
        const handleChange = (...args: any[]) => handleInternalChange(Number(args[1].toFixed(2)) as any);

        return (
            <div className={classes.slider}>
                <Slider value={internalValue} min={0} max={1} step={0.01} onChange={handleChange}/>
                <TextField
                    className={classes.textFieldRight}
                    value={JSON.stringify(internalValue)}
                    onChange={handleTextChange}
                    margin="normal"
                    error={error}
                />
            </div>
        );
    } else if (!isPrimitive(internalValue)) {
        const fields = [];

        for (const [fieldKey, fieldValue] of Object.entries(internalValue)) {
            // @ts-ignore
            const handleValueChange = (newValue: string) => setInternalValue({
                ...internalValue,
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
                value={JSON.stringify(internalValue)}
                onChange={handleTextChange}
                error={error}
            />
        );
    }
}
