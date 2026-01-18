import { useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { sendPasswordResetEmail } from "firebase/auth";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageHero from "../components/PageHero";
import { auth } from "../../firebase";

const ForgotPasswordPage = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        setError("");
        setSuccess("");

        if (!email.trim()) {
            setError(t("forgotPasswordPage.errors.missingEmail"));
            return;
        }

        setSubmitting(true);
        try {
            await sendPasswordResetEmail(auth, email.trim());
            setSuccess(t("forgotPasswordPage.success"));
        } catch (err) {
            console.error("Failed to send reset email", err);
            setError(t("forgotPasswordPage.errors.failed"));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <PageHero
                title={t("forgotPasswordPage.hero.title")}
                subtitle={t("forgotPasswordPage.hero.subtitle")}
                badge={t("forgotPasswordPage.hero.badge")}
                align="center"
                variant="soft"
            />
            <Container maxWidth="sm" sx={{ py: { xs: 6, md: 8 } }}>
                <Card sx={{ borderRadius: 4 }}>
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                        <Stack spacing={3}>
                            <Box>
                                <Typography variant="h5" fontWeight={800} gutterBottom>
                                    {t("forgotPasswordPage.form.title")}
                                </Typography>
                                <Typography color="text.secondary">
                                    {t("forgotPasswordPage.hero.subtitle")}
                                </Typography>
                            </Box>
                            <TextField
                                label={t("forgotPasswordPage.form.emailLabel")}
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                fullWidth
                            />
                            {error && <Alert severity="error">{error}</Alert>}
                            {success && <Alert severity="success">{success}</Alert>}
                            <Stack spacing={1.5}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                >
                                    {t("forgotPasswordPage.form.submit")}
                                </Button>
                                <Button component={RouterLink} to="/login" variant="text">
                                    {t("forgotPasswordPage.form.backToLogin")}
                                </Button>
                            </Stack>
                        </Stack>
                    </CardContent>
                </Card>
            </Container>
        </>
    );
};

export default ForgotPasswordPage;
