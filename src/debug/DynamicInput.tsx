/**
 * @module debug
 */

import {ListItem} from "@material-ui/core";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import List from "@material-ui/core/List";
import ListItemText from "@material-ui/core/ListItemText";
import {Theme} from "@material-ui/core/styles/createMuiTheme";
import Switch from "@material-ui/core/Switch";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableRow from "@material-ui/core/TableRow";
import TextField from "@material-ui/core/TextField";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Slider from "@material-ui/lab/Slider";
import makeStyles from "@material-ui/styles/makeStyles";
import * as React from "react";

type Type<T> = string;

/**
 * Get the type of the given value.
 */
function getType<T>(value: T): Type<T> {
    if (typeof value === "boolean") return "boolean";
    if (typeof value === "string") return "string";
    if (isNumeric(value)) return "number";
    if (isArray(value)) return "array";
    if (isObject(value)) return "object";

    return "unknown";
}

/**
 * Create and return the empty value for the given type.
 */
function createEmpty<T>(type: Type<T>): T {
    if (type === "boolean") return false as any;
    if (type === "string") return "" as any;
    if (type === "number") return 0 as any;
    if (type === "array") return [] as any;

    return {} as any;
}

type TransformerKey<T, V> = [Type<T>, Type<V>];
type Transformer<T, V> = (v: T) => V | undefined;

const typeTransformers = new Map<TransformerKey<any, any>, Transformer<any, any>>([
    [["boolean", "string"], (v: boolean) => String(v)],
    [["boolean", "number"], (v: boolean) => Number(v)],

    [["string", "boolean"], (v: string) => v.toLowerCase() === "true"],
    [["string", "number"], (v: string) => Number(v)],
    [["string", "array"], (v: string) => v.split(",").map(a => a.trim())],
    [["string", "object"], (v: string) => {
        const maybeObj = JSON.parse(v);
        return isObject(maybeObj) ? maybeObj : undefined;
    }],

    [["number", "boolean"], (v: number) => v !== 0],
    [["number", "string"], (v: number) => String(v)],
    [["number", "array"], (v: number) => Array(v).fill(undefined)],

    [["array", "boolean"], (v: any[]) => v.length !== 0],
    [["array", "string"], (v: any[]) => v.join(", ")],
    [["array", "number"], (v: any[]) => v.length],
    [["array", "object"], (v: any[]) => ({...v})],

    [["object", "boolean"], (v: object) => Object.keys(v).length !== 0],
    [["object", "string"], (v: object) => JSON.stringify(v)],
]);

/**
 * Convert the given value to the given type.
 *
 * Uses a transformer if possible, otherwise returns a new empty value of
 * the type created using [[createEmpty]].
 */
function transformValue<T, V>(value: T, toType: Type<V>): V {
    const valueType = getType(value);
    const transformer = typeTransformers.get([valueType, toType]);

    let transformedValue: V | undefined;
    if (transformer) {
        try {
            transformedValue = transformer(value);
        } catch {
            transformedValue = undefined;
        }
    }

    return transformedValue === undefined ? createEmpty(toType) : transformedValue;
}

/**
 * Check whether the value is numeric.
 */
function isNumeric(value: any): value is number {
    return typeof value === "number" && isFinite(value);
}

/**
 * Check whether the value is of a primitive type.
 */
function isPrimitive(value: any): boolean {
    return !isObjectLike(value);
}

/**
 * Check whether the given value is an object.
 *
 * The definition of an object in javascript also includes the array type.
 * If you don't want an array to be counted as an object use [[isObject]].
 */
function isObjectLike(value: any): value is object {
    return value !== null && typeof value === "object";
}

/**
 * Check whether the value is a "true" object.
 */
function isObject(value: any): value is object {
    return isObjectLike(value) && value.constructor === Object;
}

/**
 * Check whether the value is an array.
 */
function isArray(value: any): value is any[] {
    return Array.isArray(value);
}

export interface DynamicInputProps<T> extends TypedInputProps<T> {
    whitelistTypes?: Iterable<Type<any>>;
    blacklistTypes?: Iterable<Type<any>>;
}

/**
 * A flexible input container which handles all kinds of values.
 */
export function DynamicInput<T>(props: DynamicInputProps<T>) {
    const [error, setError] = React.useState(false);

    const value = props.value;

    let type: React.ComponentType<TypedInputProps<any>>;
    if (typeof value === "boolean")
        type = BooleanInput;
    else if (typeof value === "string")
        type = StringInput;
    else if (isNumeric(value))
        if (value >= 0 && value <= 1) type = PercentageInput;
        else type = JSONInput;
    else if (isArray(value))
        type = ArrayInput;
    else if (isObject(value))
        type = ObjectInput;
    else
        type = JSONInput;

    return React.createElement(type, {error, setError, ...props});
}

export interface TypedInputProps<T> {
    value: T;
    error?: boolean;
    onChange: (value: T) => void;
    setError?: (hasError: boolean) => void;
}

function createJSONChangeHandler<T>(onChange: TypedInputProps<T>["onChange"],
                                    setError: TypedInputProps<T>["setError"]):
    React.ChangeEventHandler<HTMLInputElement> {
    return e => {
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

function BooleanInput({value, onChange}: TypedInputProps<boolean>) {
    const handleChange = () => onChange(!value);

    return (
        <Switch
            checked={value}
            onChange={handleChange}
        />
    );
}

function StringInput({value, error, onChange}: TypedInputProps<string>) {
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

function PercentageInput({value, error, onChange, setError}: TypedInputProps<number>) {
    const classes = usePercentageInputStyles();

    const handleChange = (_: any, newVal: number) => onChange(Math.round(100 * newVal) / 100);
    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = Number(e.target.value);
        if (!isNaN(newValue))
            onChange(newValue);
        else if (setError)
            setError(true);
    };

    return (
        <div className={classes.slider}>
            <Slider value={value} min={0} max={1} step={0.01} onChange={handleChange}/>
            <TextField
                className={classes.textFieldRight}
                value={value.toString()}
                onChange={handleTextChange}
                margin="normal"
                error={error}
            />
        </div>
    );
}

/** @ignore */
const useArrayInputItemStyles = makeStyles((theme: Theme) => ({
    indexText: {
        marginRight: theme.spacing(2),
    },
}));

interface ArrayInputItemProps {
    index: number;
    value: any;
    onValueChange: (index: number, newValue: any) => void;
}

function ArrayInputItem({index, value, onValueChange}: ArrayInputItemProps) {
    const classes = useArrayInputItemStyles();

    const handleValueChange = React.useCallback(
        newValue => onValueChange(index, newValue),
        [onValueChange],
    );

    return (
        <ListItem>
            <ListItemText className={classes.indexText} primary={`${index}:`}/>
            <DynamicInput value={value} onChange={handleValueChange}/>
        </ListItem>
    );
}

function ArrayInput({value, onChange}: TypedInputProps<any[]>) {
    const handleArrValueChange = React.useCallback(
        (index: number, newArrValue) => {
            const newValue = [...value];
            newValue[index] = newArrValue;
            onChange(newValue);
        },
        [onChange],
    );

    const items = value.map((arrValue, index) => {
        return (
            <ArrayInputItem
                key={index}
                index={index}
                value={arrValue}
                onValueChange={handleArrValueChange}
            />
        );
    });

    return (
        <List>
            {items}
        </List>
    );
}

/** @ignore */
const useObjectInputRowStyles = makeStyles((theme: Theme) => ({
    expansionPanel: {
        padding: theme.spacing(0, 1) + "!important",
    },
    expansionPanelDetails: {
        padding: theme.spacing(1, 1, 8),
    },
    expansionPanelSummary: {
        padding: theme.spacing(0, 0.5),
    },
}));

interface ObjectInputRowProps {
    propKey: string;
    propValue: any;
    onKeyChange: (oldKey: string, newKey: string) => void;
    onValueChange: (key: string, newValue: any) => void;
}

function ObjectInputRow({propKey, propValue, onKeyChange, onValueChange}: ObjectInputRowProps) {
    const classes = useObjectInputRowStyles();

    const handlePropKeyChange = React.useCallback(
        newKey => onKeyChange(propKey, newKey),
        [onKeyChange],
    );
    const handlePropValueChange = React.useCallback(
        newValue => onValueChange(propKey, newValue),
        [onValueChange],
    );

    if (isPrimitive(propValue)) {
        return (
            <TableRow>
                <TableCell>
                    <StringInput value={propKey} onChange={handlePropKeyChange}/>
                </TableCell>

                <TableCell>
                    <DynamicInput value={propValue} onChange={handlePropValueChange}/>
                </TableCell>
            </TableRow>
        );
    } else {
        return (
            <TableRow>
                <ExpansionPanel
                    className={classes.expansionPanel}
                    TransitionProps={{unmountOnExit: true}}
                    elevation={0}
                    square
                    component={TableCell}
                    colSpan={2}
                >
                    <ExpansionPanelSummary className={classes.expansionPanelSummary} expandIcon={<ExpandMoreIcon/>}>
                        <StringInput value={propKey} onChange={handlePropKeyChange}/>
                    </ExpansionPanelSummary>

                    <ExpansionPanelDetails className={classes.expansionPanelDetails}>
                        <DynamicInput value={propValue} onChange={handlePropValueChange}/>
                    </ExpansionPanelDetails>
                </ExpansionPanel>
            </TableRow>
        );
    }
}

function ObjectInput({value, onChange}: TypedInputProps<object>) {
    const entries = React.useMemo(() => Object.entries(value), [value]);

    const handlePropKeyChange = React.useCallback((oldPropKey: string, newPropKey: string) => {
        const newValue = {...value} as { [keyy: string]: any };
        newValue[newPropKey] = newValue[oldPropKey];
        delete newValue[oldPropKey];

        onChange(newValue);
    }, [onChange]);

    const handlePropValueChange = React.useCallback((propKey: string, newPropValue: any) => {
        const newValue = {...value, [propKey]: newPropValue};

        onChange(newValue);
    }, [onChange]);

    const rows = entries.map(([propKey, propValue]) => {
        return (
            <ObjectInputRow
                key={propKey}
                propKey={propKey}
                propValue={propValue}
                onKeyChange={handlePropKeyChange}
                onValueChange={handlePropValueChange}
            />
        );
    });

    return (
        <Table>
            <TableBody>
                {rows}
            </TableBody>
        </Table>
    );
}

function JSONInput({value, error, onChange, setError}: TypedInputProps<any>) {
    const handleTextChange = React.useMemo(
        () => createJSONChangeHandler(onChange, setError),
        [onChange, setError],
    );

    const rawJSON = React.useMemo(() => JSON.stringify(value, undefined, 2), [value]);

    return (
        <TextField
            value={rawJSON}
            onChange={handleTextChange}
            error={error}
        />
    );
}
