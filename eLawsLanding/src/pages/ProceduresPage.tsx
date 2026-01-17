import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    Stack,
    Typography,
} from "@mui/material";
import LocalPoliceRoundedIcon from "@mui/icons-material/LocalPoliceRounded";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageHero from "../components/PageHero";

const CARD_MAX_HEIGHT = 420;

export default function ProceduresView() {
    const { t } = useTranslation();
    const location = useLocation();
    const state = location.state as
        | {
        procedures: string;
        country?: string;
        countryCode?: string;
        tokensUsed?: string;
        tokenLimit?: string;
    }
        | undefined;

    const procedures = state?.procedures || t("proceduresPage.empty");
    const displayCountry = state?.countryCode
        ? t(`countries.${state.countryCode}`, { defaultValue: state?.country || state.countryCode })
        : state?.country || t("proceduresPage.unknown");

    return (
        <>
            <PageHero
                title={t("proceduresPage.title")}
                subtitle={t("proceduresPage.subtitle", {
                    defaultValue: "Step-by-step guidance based on your selected country.",
                })}
                icon={<LocalPoliceRoundedIcon />}
                maxWidth="sm"
                variant="soft"
                actions={
                    <>
                        <Button
                            component={RouterLink}
                            to="/dashboard"
                            variant="text"
                            sx={{ borderRadius: 3 }}
                        >
                            {t("proceduresPage.back")}
                        </Button>
                        <Button
                            component={RouterLink}
                            to="/dashboard/procedures/saved"
                            variant="contained"
                            sx={{ borderRadius: 3, fontWeight: 800 }}
                        >
                            {t("proceduresPage.savedCta", { defaultValue: "Saved procedures" })}
                        </Button>
                    </>
                }
            >
                <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip
                        label={t("proceduresPage.country", { country: displayCountry })}
                        color="primary"
                        variant="outlined"
                    />
                    {state?.tokensUsed && (
                        <Chip
                            label={t("proceduresPage.tokens", {
                                defaultValue: "Tokens used: {{value}}",
                                value: state.tokensUsed,
                            })}
                            variant="outlined"
                        />
                    )}
                    {state?.tokenLimit && (
                        <Chip
                            label={t("proceduresPage.limit", {
                                defaultValue: "Monthly limit: {{value}}",
                                value: state.tokenLimit,
                            })}
                            variant="outlined"
                        />
                    )}
                </Stack>
            </PageHero>
            <Container maxWidth="sm" sx={{ py: { xs: 4, md: 6 } }}>
                <Card
                    elevation={4}
                    sx={{
                        borderRadius: 3,
                        maxHeight: CARD_MAX_HEIGHT,
                        overflow: "auto",
                        mb: 3,
                    }}
                >
                    <CardContent>
                        <Typography
                            variant="body1"
                            sx={{
                                whiteSpace: "pre-line",
                                lineHeight: 1.6,
                                fontSize: "1rem",
                                fontWeight: 500,
                            }}
                        >
                            {procedures}
                        </Typography>
                    </CardContent>
                </Card>
                <Box sx={{ display: "flex", justifyContent: "center" }}>
                    <Button
                        component={RouterLink}
                        to="/dashboard"
                        variant="contained"
                        color="secondary"
                        sx={{ borderRadius: 2, fontWeight: 700 }}
                    >
                        {t("proceduresPage.back")}
                    </Button>
                </Box>
            </Container>
        </>
    );
}
