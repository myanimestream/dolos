/**
 * @module debug
 */

import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import {Theme} from "@material-ui/core/styles/createMuiTheme";
import Switch from "@material-ui/core/Switch";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableRow from "@material-ui/core/TableRow";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Slider from "@material-ui/lab/Slider";
import makeStyles from "@material-ui/styles/makeStyles";
import * as React from "react";

type TypeID =
    | "array"
    | "boolean"
    | "number"
    | "object"
    | "string"
    | "undefined"
    | "unknown";

/**
 * Get the type of the given value.
 */
function getType(value: any): TypeID {
    if (value === undefined || value === null) return "undefined";
    if (typeof value === "boolean") return "boolean";
    if (typeof value === "string") return "string";
    if (isArray(value)) return "array";
    if (isNumeric(value)) return "number";
    if (isObject(value)) return "object";

    return "unknown";
}

const allTypeIDs: TypeID[] = [
    "array",
    "boolean",
    "number",
    "object",
    "string",
    "undefined",
];

/**
 * Create and return the empty value for the given type.
 */
function createEmpty(type: TypeID): any {
    switch (type) {
        case "array":
            return [];
        case "boolean":
            return false;
        case "number":
            return 0;
        case "string":
            return "";
        case "undefined":
            return undefined;

        default:
            return {};
    }
}

type Transformer<T, V> = (v: T) => V | undefined;

const typeTransformers = new Map<string, Transformer<any, any>>([
    ["array>boolean", (v: any[]) => v.length !== 0],
    ["array>number", (v: any[]) => v.length],
    ["array>object", (v: any[]) => ({...v})],
    ["array>string", (v: any[]) => v.join(", ")],

    ["boolean>number", (v: boolean) => Number(v)],
    ["boolean>string", (v: boolean) => String(v)],

    ["number>array", (v: number) => Array(v).fill(undefined)],
    ["number>boolean", (v: number) => v !== 0],
    ["number>string", (v: number) => String(v)],

    ["object>array", (v: object) => Object.values(v)],
    ["object>boolean", (v: object) => Object.keys(v).length !== 0],
    ["object>string", (v: object) => JSON.stringify(v)],

    ["string>array", (v: string) => v.split(",").map(a => a.trim())],
    ["string>boolean", (v: string) => ["true", "1"].indexOf(v.toLowerCase()) > -1],
    ["string>number", (v: string) => Number(v)],
    ["string>object", (v: string) => {
        const maybeObj = JSON.parse(v);
        return isObject(maybeObj) ? maybeObj : undefined;
    }],
]);

function hasTransformer(aType: TypeID, bType: TypeID): boolean {
    return typeTransformers.has(`${aType}>${bType}`);
}

/**
 * Convert the given value to the given type.
 *
 * Uses a transformer if possible, otherwise returns a new empty value of
 * the type created using [[createEmpty]].
 */
function transformValue(value: any, toType: TypeID): any {
    const valueType = getType(value);

    if (valueType === toType) return value;

    const transformer = typeTransformers.get(`${valueType}>${toType}`);

    let transformedValue: any | undefined;
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

/**
 * Get the set of allowed types by taking the intersection of whitelist and blacklist.
 * If whitelist isn't specified, all types are used.
 */
function getAllowedTypes(whitelist?: Iterable<TypeID>, blacklist?: Iterable<TypeID>): Set<TypeID> {
    let allowed: Set<TypeID>;

    if (whitelist === undefined)
        allowed = new Set(allTypeIDs);
    else
        allowed = new Set(whitelist);

    if (blacklist !== undefined) {
        for (const type of blacklist)
            allowed.delete(type);
    }

    return allowed;
}

function conformValueToType(value: any, allowedTypes: Set<TypeID>): [any, TypeID] {
    const valueType = getType(value);
    if (allowedTypes.has(valueType)) return [value as any, valueType];

    let allowedType: TypeID | undefined;
    for (allowedType of allowedTypes.values()) {
        if (hasTransformer(valueType, allowedType))
            return transformValue(value, allowedType);
    }

    return createEmpty(allowedType || "unknown");
}

export interface DynamicInputProps<T> extends TypedInputProps<T> {
    whitelistTypes?: Iterable<TypeID>;
    blacklistTypes?: Iterable<TypeID>;
}

/**
 * A flexible input container which handles all kinds of values.
 */
export function DynamicInput<T>(props: DynamicInputProps<T>) {
    const [error, setError] = React.useState(false);

    const {whitelistTypes, blacklistTypes} = props;
    const allowedTypes = React.useMemo(
        () => getAllowedTypes(whitelistTypes, blacklistTypes),
        [whitelistTypes, blacklistTypes],
    );

    const [conformedValue, conformedType] = React.useMemo(
        () => conformValueToType(props.value, allowedTypes),
        [props.value, allowedTypes],
    );

    const changeType = React.useCallback((newType: TypeID) => {
        const newValue = transformValue(props.value, newType);
        props.onChange(newValue);
    }, [props.value, props.onChange]);

    const type = typedInputComponentMap[conformedType] || JSONInput;

    const valueContainer = React.createElement(type, {
        onChange: props.onChange,
        value: conformedValue,

        error,
        setError,
    });

    return (
        <>
            <InputTypeSelect type={conformedType} changeType={changeType}/>
            {valueContainer}
        </>
    );
}

function InputTypeSelect({type, changeType}: { type: TypeID, changeType: (newType: TypeID) => void }) {
    const handleChangeType = (e: React.ChangeEvent<{ value: unknown }>) => changeType(e.target.value as TypeID);

    const choices = React.useMemo(() => allTypeIDs.map(typeID => (
        <MenuItem key={typeID} value={typeID}>{typeID}</MenuItem>
    )), []);

    return (
        <Select
            variant="filled"
            value={type}
            onChange={handleChangeType}
        >
            {choices}
        </Select>
    );
}

export interface TypedInputProps<T> {
    value: T;
    error?: boolean;
    onChange: (value: T) => void;
    setError?: (hasError: boolean) => void;
}

export type TypedInputComponent<T> = React.ComponentType<TypedInputProps<T>>;

const typedInputComponentMap: { [key: string]: TypedInputComponent<any> } = {
    array: ArrayInput,
    boolean: BooleanInput,
    number: NumberInput,
    object: ObjectInput,
    string: StringInput,
    undefined: UndefinedInput,
};

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

    const multiline = React.useMemo(() => {
        return value.length >= 60 || value.indexOf("\n") > -1;
    }, [value]);

    return (
        <TextField
            value={value}
            onChange={handleChange}
            error={error}
            multiline={multiline}
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

function NumberInput({value, error, onChange, setError}: TypedInputProps<number>) {
    const classes = usePercentageInputStyles();

    const handleSliderChange = (_: any, newVal: number) => onChange(Math.round(100 * newVal) / 100);
    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = Number(e.target.value);
        if (!isNaN(newValue))
            onChange(newValue);
        else if (setError)
            setError(true);
    };

    if (value > 0 && value < 1) {
        // let's just go ahead and assume this is a percentage
        return (
            <div className={classes.slider}>
                <Slider value={value} min={0} max={1} step={0.01} onChange={handleSliderChange}/>
                <TextField
                    type="number"
                    margin="normal"
                    className={classes.textFieldRight}
                    value={value.toString()}
                    onChange={handleTextChange}
                    error={error}
                />
            </div>
        );
    } else {
        return (
            <TextField
                type="number"
                value={value.toString()}
                onChange={handleTextChange}
                error={error}
            />
        );
    }
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
                    {...{colSpan: 2}}
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
            variant="filled"
            value={rawJSON}
            onChange={handleTextChange}
            error={error}
            fullWidth
            multiline
        />
    );
}

function UndefinedInput({value}: TypedInputProps<undefined | null>) {
    return (
        <Typography color="textPrimary">{value}</Typography>
    );
}
