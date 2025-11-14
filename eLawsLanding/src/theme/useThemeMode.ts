import { useContext } from "react";
import { ThemeContext } from "./ThemeContext.tsx";

export const useThemeMode = () => useContext(ThemeContext);
