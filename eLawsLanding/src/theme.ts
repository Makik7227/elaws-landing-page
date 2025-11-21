import { createTheme, type ThemeOptions } from "@mui/material/styles";
import type { PaletteMode } from "@mui/material";
import { lightColors, darkColors } from "./colors";

const typography: NonNullable<ThemeOptions["typography"]> = {
    fontFamily:
        "'InterVariable', 'Inter', 'Space Grotesk', 'Sora', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    h1: {
        fontSize: "3.5rem",
        fontWeight: 800,
        letterSpacing: -1.2,
        lineHeight: 1.05,
    },
    h2: {
        fontSize: "2.75rem",
        fontWeight: 800,
        letterSpacing: -0.8,
        lineHeight: 1.08,
    },
    h3: {
        fontSize: "2.15rem",
        fontWeight: 800,
        letterSpacing: -0.5,
        lineHeight: 1.15,
    },
    h4: {
        fontSize: "1.75rem",
        fontWeight: 700,
        letterSpacing: -0.2,
        lineHeight: 1.2,
    },
    h5: {
        fontWeight: 700,
        letterSpacing: -0.1,
    },
    h6: {
        fontWeight: 700,
    },
    subtitle1: {
        fontWeight: 600,
        letterSpacing: 0.1,
    },
    button: {
        fontWeight: 700,
        textTransform: "none",
        letterSpacing: 0.1,
    },
    body1: {
        fontSize: "1rem",
        lineHeight: 1.65,
    },
    body2: {
        fontSize: "0.95rem",
        lineHeight: 1.55,
    },
};

const toNumeric = (value: number | string) => (typeof value === "number" ? value : Number.parseFloat(value));

const components: ThemeOptions["components"] = {
    MuiCssBaseline: {
        styleOverrides: (theme) => ({
            body: {
                backgroundColor: theme.palette.background.default,
                backgroundImage:
                    theme.palette.mode === "light"
                        ? `radial-gradient(circle at top, rgba(126,87,194,0.18), transparent 45%),
                           radial-gradient(circle at 20% 20%, rgba(255,213,79,0.25), transparent 35%)`
                        : `radial-gradient(circle at top, rgba(179,157,219,0.08), transparent 55%),
                           radial-gradient(circle at 80% 10%, rgba(255,213,79,0.08), transparent 45%)`,
                minHeight: "100vh",
                color: theme.palette.text.primary,
            },
            "*::selection": {
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.getContrastText(theme.palette.primary.main),
            },
        }),
    },
    MuiButton: {
        defaultProps: {
            disableElevation: true,
        },
        styleOverrides: {
            root: ({ theme }) => {
                const baseRadius = toNumeric(theme.shape.borderRadius);
                return {
                    borderRadius: baseRadius * 1.5,
                    paddingInline: 24,
                    paddingBlock: 12,
                    fontWeight: 700,
                    letterSpacing: 0.2,
                };
            },
            contained: {
                boxShadow: "0 15px 35px rgba(0,0,0,0.15)",
            },
        },
    },
    MuiCard: {
        styleOverrides: {
            root: ({ theme }) => ({
                borderRadius: 14,
                border: `1px solid ${theme.palette.divider}`,
                backgroundImage:
                    theme.palette.mode === "light"
                        ? "linear-gradient(145deg, rgba(255,255,255,0.95), rgba(245,243,255,0.85))"
                        : "linear-gradient(145deg, rgba(27,24,39,0.95), rgba(18,17,30,0.9))",
                boxShadow:
                    theme.palette.mode === "light"
                        ? "0 25px 45px rgba(18,10,40,0.08)"
                        : "0 25px 45px rgba(0,0,0,0.45)",
                backdropFilter: "blur(14px)",
            }),
        },
    },
    MuiCardContent: {
        styleOverrides: {
            root: {
                padding: 28,
                "&:last-child": { paddingBottom: 28 },
            },
        },
    },
    MuiPaper: {
        styleOverrides: {
            root: ({ theme }) => ({
                borderRadius: 12,
                border: `1px solid ${theme.palette.divider}`,
            }),
        },
    },
    MuiChip: {
        styleOverrides: {
            root: ({ theme }) => ({
                borderRadius: theme.shape.borderRadius,
                fontWeight: 600,
                letterSpacing: 0.2,
                paddingInline: 8,
            }),
        },
    },
    MuiOutlinedInput: {
        styleOverrides: {
            root: ({ theme }) => ({
                borderRadius: 9,
                backgroundColor:
                    theme.palette.mode === "light"
                        ? "rgba(255,255,255,0.9)"
                        : "rgba(255,255,255,0.03)",
                boxShadow:
                    theme.palette.mode === "light"
                        ? "0 8px 20px rgba(15,10,45,0.05)"
                        : "0 8px 25px rgba(0,0,0,0.55)",
                "& fieldset": {
                    borderWidth: 1,
                    borderColor:
                        theme.palette.mode === "light"
                            ? "rgba(126,87,194,0.15)"
                            : "rgba(255,255,255,0.08)",
                },
                "&:hover fieldset": {
                    borderColor: theme.palette.primary.main,
                },
            }),
            input: {
                padding: "14px 18px",
            },
        },
    },
    MuiInputLabel: {
        styleOverrides: {
            root: {
                fontWeight: 600,
            },
        },
    },
    MuiDialog: {
        styleOverrides: {
            paper: ({ theme }) => ({
                borderRadius: 16,
                border: `1px solid ${theme.palette.divider}`,
                paddingBlock: 8,
                boxShadow:
                    theme.palette.mode === "light"
                        ? "0 30px 60px rgba(12,6,32,0.18)"
                        : "0 30px 80px rgba(0,0,0,0.65)",
            }),
        },
    },
    MuiTooltip: {
        styleOverrides: {
            tooltip: {
                borderRadius: 6,
                fontSize: "0.85rem",
                backgroundColor: "rgba(28,22,38,0.9)",
            },
        },
    },
    MuiDivider: {
        styleOverrides: {
            root: ({ theme }) => ({
                borderColor:
                    theme.palette.mode === "light"
                        ? "rgba(126,87,194,0.15)"
                        : "rgba(255,255,255,0.08)",
            }),
        },
    },
};

const shape: ThemeOptions["shape"] = {
    borderRadius: 12,
};

const buildPalette = (mode: PaletteMode) => {
    const colors = mode === "light" ? lightColors : darkColors;
    return {
        mode,
        primary: { main: colors.primary },
        secondary: { main: colors.secondary },
        error: { main: colors.error },
        warning: { main: colors.warning },
        background: {
            default: colors.background,
            paper: colors.surface,
        },
        text: {
            primary: colors.text,
            secondary: colors.textSecondary,
        },
    };
};

const baseTheme = { typography, components, shape } satisfies ThemeOptions;

export const lightTheme = createTheme({
    ...baseTheme,
    palette: buildPalette("light"),
});

export const darkTheme = createTheme({
    ...baseTheme,
    palette: buildPalette("dark"),
});
