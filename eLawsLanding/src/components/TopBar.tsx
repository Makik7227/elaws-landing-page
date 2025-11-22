import {
    AppBar,
    Toolbar,
    Box,
    Container,
    IconButton,
    Drawer,
    List,
    ListItemButton,
    ListItemText,
    Stack,
    Divider,
    Typography,
    useMediaQuery,
    useScrollTrigger,
    alpha,
    useTheme,
} from "@mui/material";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import type { User } from "firebase/auth";
import MotionTypography from "./MotionTypography";
import MotionButton from "./MotionButton";
import { auth } from "../../firebase.ts";
import ThemeToggleButton from "./ThemeToggleButton.tsx"; // keep your existing path
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

const TopBar = () => {
    const theme = useTheme();
    const trigger = useScrollTrigger({ disableHysteresis: true, threshold: 10 });
    const navigate = useNavigate();
    const location = useLocation();
    const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

    const [user, setUser] = useState<User | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => setUser(u));
        return () => unsub();
    }, []);

    useEffect(() => {
        if (isDesktop && drawerOpen) {
            setDrawerOpen(false);
        }
    }, [isDesktop, drawerOpen]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate("/");
        } catch (e) {
            console.error("Failed to sign out:", e);
        }
    };

    const NAV = useMemo(
        () => [
            { label: "Home", to: "/" },
            { label: "Features", to: "/features" },
            { label: "Pricing", to: "/pricing" },
            { label: "About", to: "/about" },
        ],
        []
    );

    const APP_NAV = useMemo(
        () => [
            { label: "Dashboard", to: "/dashboard" },
            { label: "AI Chat", to: "/ai/chat" },
            { label: "Documents", to: "/documents" },
            { label: "Procedures", to: "/procedures" },
            { label: "Notes", to: "/dashboard/notes" },
        ],
        []
    );

    const isActive = (to: string) =>
        location.pathname === to || location.pathname.startsWith(to + "/");

    const closeDrawer = () => setDrawerOpen(false);

    return (
        <AppBar
            position="sticky"
            elevation={trigger ? 3 : 0}
            sx={{
                backdropFilter: "blur(16px)",
                backgroundColor: (theme) =>
                    trigger
                        ? alpha(theme.palette.background.paper, 0.9)
                        : alpha(theme.palette.background.paper, 0.6),
                transition: "all 0.3s ease",
            }}
        >
            <Container maxWidth="lg">
                {/* Desktop */}
                <Toolbar
                    sx={{
                        display: { xs: "none", md: "flex" },
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                        py: 1,
                        minHeight: 72,
                    }}
                >
                    <MotionTypography
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        variant="h5"
                        component={RouterLink}
                        to={user ? "/dashboard" : "/"}
                        sx={{
                            textDecoration: "none",
                            color: "primary.main",
                            fontWeight: 800,
                            letterSpacing: -0.5,
                            fontSize: { xs: "1.25rem", md: "1.5rem" },
                        }}
                    >
                        E-Laws
                    </MotionTypography>

                    {/* Desktop nav */}
                    {!user && (
                        <Box sx={{ display: "flex", gap: 3, flexShrink: 0 }}>
                            {NAV.map(({ label, to }) => {
                                const active = isActive(to);
                                return (
                                    <MotionTypography
                                        key={to}
                                        component={RouterLink}
                                        to={to}
                                        color="inherit"
                                        aria-current={active ? "page" : undefined}
                                        whileHover={{ scale: 1.05, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                        sx={{
                                            fontWeight: 600,
                                            fontSize: "0.95rem",
                                            textTransform: "none",
                                            color: active ? "primary.main" : "text.primary",
                                            position: "relative",
                                            "&:after": {
                                                content: '""',
                                                position: "absolute",
                                                left: 0,
                                                bottom: -4,
                                                height: "2px",
                                                width: active ? "100%" : "0%",
                                                backgroundColor: "currentColor",
                                                transition: "width 0.3s ease",
                                            },
                                            "&:hover:after": { width: "100%" },
                                        }}
                                    >
                                        {label}
                                    </MotionTypography>
                                );
                            })}
                        </Box>
                    )}
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexShrink: 0 }}>
                        <ThemeToggleButton />
                        {user ? (
                            <>
                                <MotionButton
                                    component={RouterLink}
                                    to="/dashboard"
                                    variant={isActive("/dashboard") ? "contained" : "outlined"}
                                    color="primary"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    sx={{ borderRadius: 2, px: 2.25, fontWeight: 700, textTransform: "none" }}
                                >
                                    Dashboard
                                </MotionButton>
                                <MotionButton
                                    component={RouterLink}
                                    to="/manage"
                                    variant={isActive("/manage") ? "contained" : "outlined"}
                                    color="primary"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    sx={{ borderRadius: 2, px: 2.25, fontWeight: 700, textTransform: "none" }}
                                >
                                    Account
                                </MotionButton>
                                <MotionButton
                                    onClick={handleLogout}
                                    variant="text"
                                    color="primary"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    sx={{ borderRadius: 2, px: 2, fontWeight: 600, textTransform: "none" }}
                                >
                                    Logout
                                </MotionButton>
                            </>
                        ) : (
                            <>
                                <MotionButton
                                    component={RouterLink}
                                    to="/login"
                                    variant="text"
                                    color="primary"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    sx={{ borderRadius: 2, px: 2, fontWeight: 600, textTransform: "none" }}
                                >
                                    Login
                                </MotionButton>
                                <MotionButton
                                    component={RouterLink}
                                    to="/signup"
                                    variant="contained"
                                    color="primary"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    sx={{
                                        borderRadius: 2,
                                        px: 2.5,
                                        fontWeight: 700,
                                        textTransform: "none",
                                        boxShadow: "0 4px 14px rgba(0,0,0,.15)",
                                    }}
                                >
                                    Sign Up
                                </MotionButton>
                            </>
                        )}
                    </Box>
                </Toolbar>

                {/* Mobile */}
                <Toolbar
                    sx={{
                        display: { xs: "flex", md: "none" },
                        alignItems: "center",
                        justifyContent: "space-between",
                        py: 1,
                        minHeight: 64,
                        gap: 1,
                    }}
                >
                    <MotionTypography
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        variant="h5"
                        component={RouterLink}
                        to={user ? "/dashboard" : "/"}
                        sx={{
                            textDecoration: "none",
                            color: "primary.main",
                            fontWeight: 800,
                            letterSpacing: -0.5,
                        }}
                    >
                        E-Laws
                    </MotionTypography>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                        <ThemeToggleButton />
                        <IconButton
                            color="inherit"
                            aria-label="Open menu"
                            onClick={() => setDrawerOpen(true)}
                            sx={{
                                border: (t) => `1px solid ${alpha(t.palette.text.primary, 0.1)}`,
                            }}
                        >
                            <MenuRoundedIcon />
                        </IconButton>
                    </Stack>
                </Toolbar>
            </Container>
            <Drawer anchor="right" open={drawerOpen} onClose={closeDrawer}>
                <Box
                    sx={{
                        width: 320,
                        maxWidth: "100vw",
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                        px: 3,
                        py: 2.5,
                        gap: 2,
                    }}
                >
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="h6" fontWeight={800}>
                            Menu
                        </Typography>
                        <IconButton aria-label="Close menu" onClick={closeDrawer}>
                            <CloseRoundedIcon />
                        </IconButton>
                    </Stack>
                    <Divider />
                    <List sx={{ flex: 1, py: 0 }}>
                        {(user ? APP_NAV : NAV).map(({ label, to }) => (
                            <ListItemButton
                                key={to}
                                component={RouterLink}
                                to={to}
                                onClick={closeDrawer}
                                selected={isActive(to)}
                                sx={{
                                    borderRadius: 2,
                                    mb: 0.5,
                                }}
                            >
                                <ListItemText primary={label} primaryTypographyProps={{ fontWeight: 600 }} />
                            </ListItemButton>
                        ))}
                    </List>
                    <Divider />
                    <Stack spacing={1.25}>
                        {user ? (
                            <>
                                <MotionButton
                                    component={RouterLink}
                                    to="/dashboard"
                                    fullWidth
                                    variant="contained"
                                    onClick={closeDrawer}
                                    sx={{ borderRadius: 2, fontWeight: 700 }}
                                >
                                    Dashboard
                                </MotionButton>
                                <MotionButton
                                    component={RouterLink}
                                    to="/manage"
                                    fullWidth
                                    variant="outlined"
                                    onClick={closeDrawer}
                                    sx={{ borderRadius: 2, fontWeight: 700 }}
                                >
                                    Account
                                </MotionButton>
                                <MotionButton
                                    fullWidth
                                    variant="text"
                                    color="primary"
                                    onClick={() => {
                                        closeDrawer();
                                        handleLogout();
                                    }}
                                    sx={{ borderRadius: 2, fontWeight: 600 }}
                                >
                                    Logout
                                </MotionButton>
                            </>
                        ) : (
                            <>
                                <MotionButton
                                    component={RouterLink}
                                    to="/login"
                                    fullWidth
                                    variant="outlined"
                                    onClick={closeDrawer}
                                    sx={{ borderRadius: 2, fontWeight: 700 }}
                                >
                                    Login
                                </MotionButton>
                                <MotionButton
                                    component={RouterLink}
                                    to="/signup"
                                    fullWidth
                                    variant="contained"
                                    onClick={closeDrawer}
                                    sx={{ borderRadius: 2, fontWeight: 800 }}
                                >
                                    Create account
                                </MotionButton>
                            </>
                        )}
                        <Stack direction="row" alignItems="center" spacing={1.5} mt={0.5}>
                            <ThemeToggleButton />
                            <Typography variant="body2" color="text.secondary">
                                Toggle theme
                            </Typography>
                        </Stack>
                    </Stack>
                </Box>
            </Drawer>
        </AppBar>
    );
};

export default TopBar;
