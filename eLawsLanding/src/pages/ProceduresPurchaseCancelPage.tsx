import React from "react";
import { Box, Button, Card, CardContent, Container, Stack, Typography, alpha, useTheme } from "@mui/material";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import { Link as RouterLink } from "react-router-dom";
import PageHero from "../components/PageHero";
import { useTranslation } from "react-i18next";

const ProceduresPurchaseCancelPage: React.FC = () => {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <>
            <PageHero
                title={t("home.proceduresPurchaseResult.cancel.title")}
                subtitle={t("home.proceduresPurchaseResult.cancel.subtitle")}
                badge={t("home.proceduresPurchaseResult.cancel.badge")}
                icon={<CancelRoundedIcon />}
                variant="soft"
                actions={
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                        <Button component={RouterLink} to="/" variant="contained">
                            {t("home.proceduresPurchaseResult.cancel.primaryCta")}
                        </Button>
                        <Button component={RouterLink} to="/contact" variant="outlined">
                            {t("home.proceduresPurchaseResult.cancel.secondaryCta")}
                        </Button>
                    </Stack>
                }
            />
            <Box sx={{ py: { xs: 6, md: 8 } }}>
                <Container maxWidth="md">
                    <Card
                        sx={{
                            borderRadius: 4,
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
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
                            <Stack spacing={1}>
                                <Typography variant="h6" fontWeight={800}>
                                    {t("home.proceduresPurchaseResult.cancel.cardTitle")}
                                </Typography>
                                <Typography color="text.secondary">
                                    {t("home.proceduresPurchaseResult.cancel.cardBody")}
                                </Typography>
                            </Stack>
                        </CardContent>
                    </Card>
                </Container>
            </Box>
        </>
    );
};

export default ProceduresPurchaseCancelPage;
