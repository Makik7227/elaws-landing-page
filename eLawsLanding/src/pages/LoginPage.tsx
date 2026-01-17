import { useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
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
import { auth } from "../../firebase";
import { useTranslation } from "react-i18next";

const LoginPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSignIn = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate("/dashboard");
        } catch (error) {
            console.error("Failed to sign in", error);
            setError(t("loginPage.errors.invalidCredentials"));
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
                            <Typography variant="h4" fontWeight={900} gutterBottom>
                                {t("loginPage.hero.title")}
                            </Typography>
                            <Typography sx={{ opacity: 0.8 }}>
                                {t("loginPage.hero.subtitle")}
                            </Typography>

                            <Stack spacing={2.5} mt={5}>
                                {["featureOne", "featureTwo", "featureThree"].map((item) => (
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
                                        <Typography>{t(`loginPage.hero.features.${item}`)}</Typography>
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
                                    <Typography variant="h5" fontWeight={800}>
                                        {t("loginPage.form.title")}
                                    </Typography>
                                    <Typography color="text.secondary">
                                        {t("loginPage.form.subtitle")}
                                    </Typography>
                                </Box>

                                <Stack spacing={1.5}>
                                    <TextField
                                        label={t("loginPage.form.emailLabel")}
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        fullWidth
                                    />
                                    <TextField
                                        label={t("loginPage.form.passwordLabel")}
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        fullWidth
                                    />
                                </Stack>

                                {error && <Alert severity="error">{error}</Alert>}

                                <Button size="large" variant="contained" onClick={handleSignIn}>
                                    {t("loginPage.form.submit")}
                                </Button>

                                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                                    <Link component={RouterLink} to="/forgot-password" underline="hover">
                                        {t("loginPage.links.forgotPassword")}
                                    </Link>
                                    <Typography variant="body2">
                                        {t("loginPage.links.newHere")}{" "}
                                        <Link component={RouterLink} to="/signup" underline="hover" fontWeight={600}>
                                            {t("loginPage.links.createAccount")}
                                        </Link>
                                    </Typography>
                                </Stack>

                                <Button component={RouterLink} to="/" variant="text">
                                    {t("loginPage.links.backToSite")}
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
