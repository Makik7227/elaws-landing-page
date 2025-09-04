import {
    AppBar,
    Toolbar,
    Box,
    useScrollTrigger,
    alpha,
    Container,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import MotionTypography from "./MotionTypography";
import MotionButton from "./MotionButton.tsx";


const TopBar = () => {
    const trigger = useScrollTrigger({ disableHysteresis: true, threshold: 10 });
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

                    {/* Auth Buttons */}
                    <Box sx={{ display: "flex", gap: 1.5 }}>
                        <MotionButton
                            component={RouterLink}
                            variant="contained"
                            color="primary"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            sx={{ borderRadius: 2, px: 2.5, fontWeight: 600, textTransform: "none" }}
                        >
                            Login
                        </MotionButton>
                        <MotionButton
                            component={RouterLink}
                            variant="outlined"
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
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
};

export default TopBar;