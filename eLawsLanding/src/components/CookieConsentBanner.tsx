import { Box, Button, Card, CardContent, Container, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

interface CookieConsentBannerProps {
    open: boolean;
    onAcceptAll: () => void;
    onRejectNonEssential: () => void;
}

const CookieConsentBanner = ({ open, onAcceptAll, onRejectNonEssential }: CookieConsentBannerProps) => {
    const { t } = useTranslation();

    if (!open) return null;

    return (
        <Box
            sx={{
                position: "fixed",
                left: 0,
                right: 0,
                bottom: { xs: 12, sm: 20 },
                zIndex: 1300,
            }}
        >
            <Container maxWidth="md">
                <Card sx={{ borderRadius: 3, boxShadow: "0 16px 40px rgba(0,0,0,0.18)" }}>
                    <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                        <Stack spacing={2}>
                            <Typography variant="subtitle1" fontWeight={700}>
                                {t("cookieConsent.title")}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {t("cookieConsent.message")}
                            </Typography>
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                                <Button variant="contained" onClick={onAcceptAll}>
                                    {t("cookieConsent.acceptAll")}
                                </Button>
                                <Button variant="outlined" onClick={onRejectNonEssential}>
                                    {t("cookieConsent.rejectNonEssential")}
                                </Button>
                            </Stack>
                        </Stack>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
};

export default CookieConsentBanner;
