import {
    AppBar,
    Toolbar,
    Box,
    useScrollTrigger,
    alpha,
    Container,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import type { User } from "firebase/auth";
import MotionTypography from "./MotionTypography";
import MotionButton from "./MotionButton";
import {auth} from "../../firebase.ts";

const TopBar = () => {
    const trigger = useScrollTrigger({ disableHysteresis: true, threshold: 10 });
    const navigate = useNavigate();

    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // subscribe to auth changes
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

                    {/* Nav Links */}
                    <Box sx={{ display: "flex", gap: 3 }}>
                        {["Features", "Pricing", "About"].map((item) => (
                            <MotionTypography
                                key={item}
                                component={RouterLink}
                                to={`/${item.toLowerCase()}`}
                                color="inherit"
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                sx={{
                                    fontWeight: 600,
                                    fontSize: "0.95rem",
                                    textTransform: "none",
                                    color: "text.primary",
                                    position: "relative",
                                    "&:after": {
                                        content: '""',
                                        position: "absolute",
                                        width: "0%",
                                        height: "2px",
                                        bottom: -4,
                                        left: 0,
                                        backgroundColor: "currentColor",
                                        transition: "width 0.3s ease",
                                    },
                                    "&:hover:after": { width: "100%" },
                                }}
                            >
                                {item}
                            </MotionTypography>
                        ))}
                    </Box>

                    {/* Right side: Auth-aware */}
                    <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                        {user ? (
                            <>
                                <MotionButton
                                    component={RouterLink}
                                    to="/cases" // change to your dashboard route
                                    variant="contained"
                                    color="primary"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    sx={{ borderRadius: 2, px: 2.5, fontWeight: 700, textTransform: "none" }}
                                >
                                    My Cases
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