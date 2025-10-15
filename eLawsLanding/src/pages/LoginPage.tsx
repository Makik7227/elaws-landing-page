import { useState } from "react";
import {
    Box,
    Button,
    Container,
    TextField,
    Typography,
    Alert,
    Stack,
    useTheme,
    Link,
} from "@mui/material";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {auth} from '../../firebase'

const LoginPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSignIn = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate("/dashboard");
        } catch (err: any) {
            setError("Invalid email or password");
        }
    };

    return (
        <Container maxWidth="sm" sx={{ py: { xs: 8, md: 12 } }}>
            <Box
                sx={{
                    p: 4,
                    borderRadius: 3,
                    bgcolor: theme.palette.background.paper,
                    boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
                    textAlign: "center",
                }}
            >
                <Typography variant="h4" fontWeight={800} gutterBottom>
                    Welcome Back 👋
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Sign in to your E-Laws account
                </Typography>

                <Stack spacing={2}>
                    <TextField
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        fullWidth
                        variant="outlined"
                    />
                    <TextField
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        fullWidth
                        variant="outlined"
                    />

                    {error && <Alert severity="error">{error}</Alert>}

                    <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        sx={{ borderRadius: 3, fontWeight: 700, py: 1.2 }}
                        onClick={handleSignIn}
                    >
                        Sign In
                    </Button>

                    <Link
                        component={RouterLink}
                        to="/forgot-password"
                        underline="hover"
                        sx={{ fontSize: "0.9rem" }}
                    >
                        Forgot Password?
                    </Link>

                    <Typography variant="body2">
                        Don’t have an account?{" "}
                        <Link
                            component={RouterLink}
                            to="/signup"
                            underline="hover"
                            color="primary"
                            fontWeight={600}
                        >
                            Sign Up
                        </Link>
                    </Typography>

                    <Button
                        component={RouterLink}
                        to="/"
                        variant="outlined"
                        sx={{ borderRadius: 3, mt: 2 }}
                    >
                        ← Go Back
                    </Button>
                </Stack>
            </Box>
        </Container>
    );
};

export default LoginPage;
