import React from "react";
import {
    Box,
    Card,
    CardContent,
    Container,
    Stack,
    Typography,
} from "@mui/material";
import MarkunreadMailboxRoundedIcon from "@mui/icons-material/MarkunreadMailboxRounded";
import { useTranslation } from "react-i18next";
import PageHero from "../components/PageHero";

const CONTACT_EMAIL = "maks.dylag@mentorsoftware.pl";
const CONTACT_NAME = "Maksymilian Dyląg";

const ContactPage: React.FC = () => {
    const { t } = useTranslation();

    return (
        <>
            <PageHero
                title={t("contactPage.hero.title")}
                subtitle={t("contactPage.hero.subtitle")}
                badge={t("contactPage.hero.badge")}
                icon={<MarkunreadMailboxRoundedIcon />}
                align="center"
            />

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
