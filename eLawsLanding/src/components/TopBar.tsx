import {
    AppBar,
    Toolbar,
    Box,
    useScrollTrigger,
    alpha,
    Container,
} from "@mui/material";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import type { User } from "firebase/auth";
import MotionTypography from "./MotionTypography";
import MotionButton from "./MotionButton";
import { auth } from "../../firebase.ts"; // keep your existing path

const TopBar = () => {
    const trigger = useScrollTrigger({ disableHysteresis: true, threshold: 10 });
    const navigate = useNavigate();
    const location = useLocation();

    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => setUser(u));
        return () => unsub();
    }, []);

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

    const isActive = (to: string) =>
        location.pathname === to || location.pathname.startsWith(to + "/");

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
                <Toolbar sx={{ display: "flex", justifyContent: "space-between", py: 1 }}>
                    {/* Logo */}
                    <MotionTypography
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        variant="h5"
                        component={RouterLink}
                        to="/"
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

                    {/* Nav Links with persistent active underline */}
                    <Box sx={{ display: "flex", gap: 3 }}>
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
                                        "&:hover:after": {
                                            width: "100%",
                                        },
                                    }}
                                >
                                    {label}
                                </MotionTypography>
                            );
                        })}
                    </Box>

                    {/* Right side: Auth-aware */}
                    <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                        {user ? (
                            <>
                                <MotionButton
                                    component={RouterLink}
                                    to="/manage"
                                    variant="contained"
                                    color="primary"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    sx={{ borderRadius: 2, px: 2.5, fontWeight: 700, textTransform: "none" }}
                                >
                                    My Account
                                </MotionButton>
                                <MotionButton
                                    onClick={handleLogout}
                                    variant="outlined"
                                    color="primary"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    sx={{ borderRadius: 2, px: 2.5, fontWeight: 600, textTransform: "none" }}
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
            </Container>
        </AppBar>
    );
};

export default TopBar;