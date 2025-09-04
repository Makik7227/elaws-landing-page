import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const TopBar = () => {
    return (
        <AppBar position="static" elevation={0}>
            <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
                {/* Logo / Title */}
                <Typography
                    variant="h6"
                    component={RouterLink}
                    to="/"
                    sx={{ textDecoration: "none", color: "inherit", fontWeight: 600 }}
                >
                    E-Laws
                </Typography>

                {/* Nav Links */}
                <Box sx={{ display: "flex", gap: 2 }}>
                    <Button component={RouterLink} to="/features" color="inherit">
                        Features
                    </Button>
                    <Button component={RouterLink} to="/pricing" color="inherit">
                        Pricing
                    </Button>
                    <Button component={RouterLink} to="/about" color="inherit">
                        About
                    </Button>
                </Box>

                {/* Auth Buttons */}
                <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                        component={RouterLink}
                        to="/login"
                        variant="outlined"
                        color="primary"
                    >
                        Login
                    </Button>
                    <Button
                        component={RouterLink}
                        to="/signup"
                        variant="contained"
                        color="primary"
                    >
                        Sign Up
                    </Button>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default TopBar;
