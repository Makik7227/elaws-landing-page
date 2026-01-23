import React, { useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    TextField,
    Typography,
    alpha,
    useTheme,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import CustomCountryPicker from "../components/CustomCountryPicker";
import PageHero from "../components/PageHero";

const FUNCTIONS_BASE_URL =
    import.meta.env.VITE_FUNCTIONS_BASE_URL ??
    "https://europe-central2-e-lawyer-a3055.cloudfunctions.net";

const ProceduresPurchasePage: React.FC = () => {
    const theme = useTheme();
    const { t } = useTranslation();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [country, setCountry] = useState("");
    const [countryCode, setCountryCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleProceduresCheckout = async () => {
        const trimmedEmail = email.trim();

        if (!trimmedEmail) {
            setError(t("home.proceduresPurchase.dialog.errors.emailRequired"));
            return;
        }

        const emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmedEmail);
        if (!emailValid) {
            setError(t("home.proceduresPurchase.dialog.errors.emailInvalid"));
            return;
        }

        if (!country) {
            setError(t("home.proceduresPurchase.dialog.errors.countryRequired"));
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${FUNCTIONS_BASE_URL}/createEmergencyProceduresCheckout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: trimmedEmail,
                    country,
                    successUrl: `${window.location.origin}/procedures-purchase/success`,
                    cancelUrl: `${window.location.origin}/procedures-purchase/cancel`,
                }),
            });

            let data: { url?: string; error?: string } | null = null;
            try {
                data = await response.json();
            } catch (err) {
                console.error("Failed to parse procedures checkout response", err);
            }

            if (!response.ok) {
                throw new Error(data?.error || t("home.proceduresPurchase.dialog.errors.generic"));
            }

            if (!data?.url) {
                throw new Error(t("home.proceduresPurchase.dialog.errors.generic"));
            }

            window.location.assign(data.url);
        } catch (err) {
            setError(err instanceof Error ? err.message : t("home.proceduresPurchase.dialog.errors.generic"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <PageHero
                title={t("home.proceduresPurchase.title")}
                subtitle={t("home.proceduresPurchase.subtitle")}
                badge={t("home.proceduresPurchase.badge")}
                actions={
                    <Button variant="contained" size="large" onClick={() => setDialogOpen(true)}>
                        {t("home.proceduresPurchase.cta")}
                    </Button>
                }
            />
            <Box sx={{ py: { xs: 6, md: 8 } }}>
                <Container maxWidth="md">
                    <Card
                        sx={{
                            borderRadius: 4,
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
                            background: theme.palette.mode === "light"
                                ? "linear-gradient(120deg, rgba(255,255,255,0.98), rgba(244,238,229,0.92))"
                                : alpha(theme.palette.background.paper, 0.9),
                            boxShadow:
                                theme.palette.mode === "light"
                                    ? "0 24px 70px rgba(16,18,20,0.08)"
                                    : "0 24px 70px rgba(0,0,0,0.55)",
                        }}
                    >
                        <CardContent>
                            <Stack spacing={1.5}>
                                <Typography variant="h6" fontWeight={800}>
                                    {t("home.proceduresPurchase.pointOne")}
                                </Typography>
                                <Typography color="text.secondary">
                                    {t("home.proceduresPurchase.pointTwo")}
                                </Typography>
                                <Typography color="text.secondary">
                                    {t("home.proceduresPurchase.pointThree")}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {t("home.proceduresPurchase.message")}
                                </Typography>
                                <Box>
                                    <Button variant="contained" onClick={() => setDialogOpen(true)}>
                                        {t("home.proceduresPurchase.cta")}
                                    </Button>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Container>
            </Box>

            <Dialog open={dialogOpen} onClose={() => !loading && setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{t("home.proceduresPurchase.dialog.title")}</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2}>
                        <Typography variant="body2" color="text.secondary">
                            {t("home.proceduresPurchase.dialog.description")}
                        </Typography>
                        <TextField
                            label={t("home.proceduresPurchase.dialog.emailLabel")}
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            autoComplete="email"
                            fullWidth
                        />
                        <CustomCountryPicker
                            country={country}
                            countryCode={countryCode}
                            enableXReset
                            onSelect={(selected) => {
                                if (selected) {
                                    setCountry(selected.name);
                                    setCountryCode(selected.code);
                                } else {
                                    setCountry("");
                                    setCountryCode("");
                                }
                            }}
                        />
                        {error && <Alert severity="error">{error}</Alert>}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button variant="contained" onClick={handleProceduresCheckout} disabled={loading}>
                        {loading ? t("home.proceduresPurchase.dialog.processing") : t("home.proceduresPurchase.dialog.submit")}
                    </Button>
                    <Button onClick={() => setDialogOpen(false)} disabled={loading}>
                        {t("home.proceduresPurchase.dialog.cancel")}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ProceduresPurchasePage;
