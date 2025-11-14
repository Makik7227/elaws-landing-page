import { createContext } from "react";

export type ThemeMode = "light" | "dark";

export interface ThemeContextProps {
    mode: ThemeMode;
    toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextProps>({
    mode: "light",
    toggleTheme: () => {},
});
