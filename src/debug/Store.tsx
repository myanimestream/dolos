/**
 * @module debug
 */

import {
    ExpansionPanel,
    ExpansionPanelDetails,
    ExpansionPanelSummary,
    Paper,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Theme,
    Typography,
} from "@material-ui/core";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import {Slider} from "@material-ui/lab";
import {makeStyles} from "@material-ui/styles";
import {usePromiseMemo} from "dolos/hooks";
import {useConfigChange} from "dolos/options/SettingsTab";
import {Store, StoreElement} from "dolos/store";
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
 *
 * `boolean`: switch
 *
 * `number`:
 *      between 0 and 1 inclusive: slider
 *      otherwise: text field
 *
 *  other: text field
 */
export function StoreElementInput<T>({value, onChange}: { value: T, onChange: (value: T) => void }) {
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
        const handleChange = () => onChange(!value);

        return (
            <Switch checked={value} onChange={handleChange}/>
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
    } else if (typeof value === "string") {
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value as any);
        return (
            <TextField
                value={value}
                onChange={handleChange}
                fullWidth
            />
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

/**
 * Wrapper for store element values which uses [[StoreElementInput]]
 * to display itself and uses [[useConfigChange]] to keep itself updated.
 */
function StoreElementValue({element, propKey}: { element: StoreElement<any>, propKey: any }) {
    const [value, setValue] = useConfigChange(element, propKey);
    return (<StoreElementInput value={value} onChange={setValue}/>);
}

/**
 * React component for displaying a [[StoreElement]].
 * This is for debug purposes only. All values are shown with [[StoreElementValue]]
 * and as such may be edited.
 */
export function StoreElementComponent({element}: { element: StoreElement<any> }) {
    const entries = element.ownKeys().map(key => [key, element.get(key)]);

    const fieldRows = entries.map(([key, value]) => {
        let valueCellContent;

        if (value instanceof StoreElement)
            valueCellContent = (<StoreElementComponent element={value}/>);
        else
            valueCellContent = (<StoreElementValue element={element} propKey={key}/>);

        return (
            <TableRow key={key}>
                <TableCell>{key}</TableCell>
                <TableCell>{valueCellContent}</TableCell>
            </TableRow>
        );
    });

    return (
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell>Key</TableCell>
                    <TableCell>Value</TableCell>
                </TableRow>
            </TableHead>

            <TableBody>
                {fieldRows}
            </TableBody>
        </Table>
    );
}

/**
 * React component for displaying the contents of the extension storage.
 * Uses [[Store]] to get [[StoreElement]] wrappers around the actual object.
 *
 * Doesn't display primitive values.
 */
export function StoreComponent({store}: { store: Store }) {
    const elements = usePromiseMemo(() => store.getAllStoreElements(), {});

    const elementComponents = Object.entries(elements).map(([key, element]) => {
        return (
            <ExpansionPanel key={key}>
                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                    <Typography variant="h6" gutterBottom>{key}</Typography>
                </ExpansionPanelSummary>

                <ExpansionPanelDetails>
                    <StoreElementComponent element={element}/>
                </ExpansionPanelDetails>
            </ExpansionPanel>
        );
    });

    return (
        <Paper>
            {elementComponents}
        </Paper>
    );
}
