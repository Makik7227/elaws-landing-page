import { IconButton } from "@mui/material";
import { DarkMode, LightMode } from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import {useThemeMode} from "../theme/useThemeMode.ts";

const MotionIconButton = motion(IconButton);

const ThemeToggleButton = () => {
    const { mode, toggleTheme } = useThemeMode();

    return (
        <MotionIconButton
            onClick={toggleTheme}
            whileTap={{ scale: 0.8, rotate: 15 }}
            whileHover={{
                scale: 1.15,
                boxShadow:
                    mode === "light"
                        ? "0 0 12px rgba(126,87,194,0.6)"
                        : "0 0 15px rgba(255,213,79,0.7)",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            sx={{
                position: "relative",
                width: 42,
                height: 42,
                borderRadius: "50%",
                overflow: "hidden",
                backdropFilter: "blur(8px)",
                border: (theme) =>
                    `1px solid ${theme.palette.divider}`,
                backgroundColor: () =>
                    mode === "light"
                        ? "rgba(255,255,255,0.6)"
                        : "rgba(30,30,30,0.4)",
                color: "primary.main",
            }}
        >
            <AnimatePresence mode="wait" initial={false}>
                {mode === "light" ? (
                    <motion.div
                        key="light"
                        initial={{ y: -15, opacity: 0, rotate: -90 }}
                        animate={{ y: 0, opacity: 1, rotate: 0 }}
                        exit={{ y: 15, opacity: 0, rotate: 90 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        style={{ position: "absolute" }}
                    >
                        <LightMode />
                    </motion.div>
                ) : (
                    <motion.div
                        key="dark"
                        initial={{ y: -15, opacity: 0, rotate: 90 }}
                        animate={{ y: 0, opacity: 1, rotate: 0 }}
                        exit={{ y: 15, opacity: 0, rotate: -90 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        style={{ position: "absolute" }}
                    >
                        <DarkMode />
                    </motion.div>
                )}
            </AnimatePresence>
        </MotionIconButton>
    );
};

export default ThemeToggleButton;
