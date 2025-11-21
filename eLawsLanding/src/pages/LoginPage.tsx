import { useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    Link,
    Stack,
    TextField,
    Typography,
    alpha,
    useTheme,
} from "@mui/material";
import Grid from "@mui/material/Grid";
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
        } catch (error) {
            console.error("Failed to sign in", error);
            setError("Invalid email or password");
        }
    };

    const accentGradient = `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 70%)`;

    return (
        <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
            <Grid container spacing={{ xs: 4, md: 6 }} alignItems="stretch">
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card
                        sx={{
                            height: "100%",
                            borderRadius: 5,
                            background: accentGradient,
                            color: theme.palette.getContrastText(theme.palette.primary.main),
                        }}
                    >
                        <CardContent sx={{ p: { xs: 4, md: 5 } }}>
                            <Chip
                                label="Security-first"
                                variant="outlined"
                                sx={{
                                    color: "inherit",
                                    borderColor: alpha(theme.palette.common.white, 0.4),
                                    bgcolor: alpha(theme.palette.common.white, 0.08),
                                    mb: 3,
                                }}
                            />
                            <Typography variant="h4" fontWeight={900} gutterBottom>
                                Welcome back 👋
                            </Typography>
                            <Typography sx={{ opacity: 0.8 }}>
                                Pick up any case, chat thread, or document exactly where you left it.
                                Your workspace syncs instantly across devices.
                            </Typography>

                            <Stack spacing={2.5} mt={5}>
                                {[
                                    "Access AI chat, docs, cases, and notes",
                                    "Stay in sync with real-time collaboration",
                                    "SOC2-friendly architecture with audit trails",
                                ].map((item) => (
                                    <Stack direction="row" spacing={1.5} alignItems="center" key={item}>
                                        <Box
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: 999,
                                                bgcolor: alpha(theme.palette.common.white, 0.15),
                                                display: "grid",
                                                placeItems: "center",
                                                fontWeight: 700,
                                            }}
                                        >
                                            •
                                        </Box>
                                        <Typography>{item}</Typography>
                                    </Stack>
                                ))}
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{ height: "100%", borderRadius: 5 }}>
                        <CardContent sx={{ p: { xs: 4, md: 5 } }}>
                            <Stack spacing={3}>
                                <Box>
                                    <Chip label="Sign in" color="primary" variant="outlined" sx={{ mb: 1 }} />
                                    <Typography variant="h5" fontWeight={800}>
                                        Enter your workspace
                                    </Typography>
                                    <Typography color="text.secondary">
                                        Use your account email and password. Two-factor kicks in automatically if enabled.
                                    </Typography>
                                </Box>

                                <Stack spacing={1.5}>
                                    <TextField
                                        label="Email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        fullWidth
                                    />
                                    <TextField
                                        label="Password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        fullWidth
                                    />
                                </Stack>

                                {error && <Alert severity="error">{error}</Alert>}

                                <Button size="large" variant="contained" onClick={handleSignIn}>
                                    Sign in
                                </Button>

                                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                                    <Link component={RouterLink} to="/forgot-password" underline="hover">
                                        Forgot password?
                                    </Link>
                                    <Typography variant="body2">
                                        New here? {" "}
                                        <Link component={RouterLink} to="/signup" underline="hover" fontWeight={600}>
                                            Create account
                                        </Link>
                                    </Typography>
                                </Stack>

                                <Button component={RouterLink} to="/" variant="text">
                                    ← Back to site
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
};

export default LoginPage;
