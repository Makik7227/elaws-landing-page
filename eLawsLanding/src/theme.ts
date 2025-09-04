import { createTheme } from "@mui/material/styles";
import { lightColors, darkColors } from "./colors"; // put your objects here

export const lightTheme = createTheme({
    palette: {
        mode: "light",
        primary: {
            main: lightColors.primary,
        },
        secondary: {
            main: lightColors.secondary,
        },
        error: {
            main: lightColors.error,
        },
        background: {
            default: lightColors.background,
            paper: lightColors.surface,
        },
        text: {
            primary: lightColors.text,
            secondary: lightColors.textSecondary,
        },
        warning: {
            main: lightColors.warning,
        },
    },
    typography: {
        fontFamily: "Inter, Roboto, Helvetica, Arial, sans-serif",
    },
});

export const darkTheme = createTheme({
    palette: {
        mode: "dark",
        primary: {
            main: darkColors.primary,
        },
        secondary: {
            main: darkColors.secondary,
        },
        error: {
            main: darkColors.error,
        },
        background: {
            default: darkColors.background,
            paper: darkColors.surface,
        },
        text: {
            primary: darkColors.text,
            secondary: darkColors.textSecondary,
        },
        warning: {
            main: darkColors.warning,
        },
    },
    typography: {
        fontFamily: "Inter, Roboto, Helvetica, Arial, sans-serif",
    },
});
