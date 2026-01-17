import React from "react";
import {
    Box,
    Card,
    CardContent,
    Chip,
    Container,
    Stack,
    Typography,
    useTheme,
} from "@mui/material";
import { useTranslation } from "react-i18next";

const CONTACT_EMAIL = "maks.dylag@mentorsoftware.pl";
const CONTACT_NAME = "Maksymilian Dyląg";

const ContactPage: React.FC = () => {
    const theme = useTheme();
    const { t } = useTranslation();
    const gradient = `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 60%, ${theme.palette.primary.main} 100%)`;

    return (
        <>
            <Box
                sx={{
                    height: { xs: "64px", md: "80px" },
                    background: gradient,
                }}
            />
            <Box
                sx={{
                    mt: { xs: -8, md: -10 },
                    background: gradient,
                    color: theme.palette.getContrastText(theme.palette.primary.main),
                    py: { xs: 8, md: 10 },
                    textAlign: "center",
                }}
            >
                <Container maxWidth="md">
                    <Chip
                        label={t("contactPage.hero.badge")}
                        variant="outlined"
                        sx={{
                            color: "inherit",
                            borderColor: "currentColor",
                            bgcolor: "transparent",
                            fontWeight: 700,
                            mb: 2,
                        }}
                    />
                    <Typography variant="h3" fontWeight={900} sx={{ letterSpacing: -0.5 }}>
                        {t("contactPage.hero.title")}
                    </Typography>
                    <Typography sx={{ opacity: 0.95, mt: 1.25 }}>
                        {t("contactPage.hero.subtitle")}
                    </Typography>
                </Container>
            </Box>

            <Box sx={{ py: { xs: 6, md: 8 } }}>
                <Container maxWidth="sm">
                    <Card elevation={3} sx={{ borderRadius: 3 }}>
                        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                            <Stack spacing={2.5}>
                                <Typography variant="h5" fontWeight={900}>
                                    {t("contactPage.card.title")}
                                </Typography>
                                <Stack spacing={1.5}>
                                    <Box>
                                        <Typography variant="overline" color="text.secondary">
                                            {t("contactPage.details.nameLabel")}
                                        </Typography>
                                        <Typography fontWeight={700}>{CONTACT_NAME}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="overline" color="text.secondary">
                                            {t("contactPage.details.roleLabel")}
                                        </Typography>
                                        <Typography fontWeight={700}>
                                            {t("contactPage.details.roleValue")}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography
                                            component="a"
                                            href={`mailto:${CONTACT_EMAIL}`}
                                            color="primary"
                                            sx={{ fontWeight: 700, textDecoration: "none" }}
                                        >
                                            {CONTACT_EMAIL}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Stack>
                        </CardContent>
                    </Card>
                </Container>
            </Box>
        </>
    );
};

export default ContactPage;
