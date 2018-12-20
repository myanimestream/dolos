import createMuiTheme from "@material-ui/core/styles/createMuiTheme";

const mainTheme = createMuiTheme({
    typography: {
        useNextVariants: true,
    },
    palette: {
        type: "dark",
        primary: {
            main: "#43a047",
        },
        secondary: {
            main: "#cddc39",
        },
    },
});

export default mainTheme;

export const kitsuTheme = createMuiTheme({
    typography: {
        useNextVariants: true,
    },
    palette: {
        primary: {
            main: "#ef5350",
        },
        secondary: {
            main: "#4527a0",
        },
    },
});

export const malTheme = createMuiTheme({
    typography: {
        useNextVariants: true,
    },
    palette: {
        primary: {
            main: "#2e51a2",
        },
        secondary: {
            main: "#4f74c8",
        },
    },
});
