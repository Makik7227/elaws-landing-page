import React from "react";
import { Box, Button, Card, CardContent, Chip, Container, Stack, Typography, alpha } from "@mui/material";
import Grid from "@mui/material/Grid";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageHero from "../components/PageHero";

const HERO_METRICS = [
    { value: "180+", labelKey: "documentsLanding.metrics.templates", defaultLabel: "Template variations" },
    { value: "45s", labelKey: "documentsLanding.metrics.speed", defaultLabel: "Avg. generation time" },
    { value: "99.5%", labelKey: "documentsLanding.metrics.accuracy", defaultLabel: "Structured compliance" },
];

const HIGHLIGHT_CARDS = [
    {
        icon: <AutoAwesomeRoundedIcon />,
        titleKey: "documentsLanding.highlights.templates.title",
        defaultTitle: "Guided templates",
        descKey: "documentsLanding.highlights.templates.desc",
        defaultDesc: "Pick pre-vetted structures for NDAs, employment contracts, GDPR notices, and more.",
    },
    {
        icon: <ShieldRoundedIcon />,
        titleKey: "documentsLanding.highlights.audit.title",
        defaultTitle: "Audit-ready output",
        descKey: "documentsLanding.highlights.audit.desc",
        defaultDesc: "Exports include signature blocks, version history, and jurisdiction context for traceability.",
    },
    {
        icon: <BoltRoundedIcon />,
        titleKey: "documentsLanding.highlights.sync.title",
        defaultTitle: "One-click sharing",
        descKey: "documentsLanding.highlights.sync.desc",
        defaultDesc: "Send final drafts to clients, attach to cases, or store to your secure library instantly.",
    },
];

const DocumentsLandingPage: React.FC = () => {
    const { t } = useTranslation();

    return (
        <>
            <PageHero
                title={t("documentsLanding.hero.title")}
                subtitle={t("documentsLanding.hero.subtitle")}
                badge={t("documentsLanding.hero.badge", { defaultValue: "Workspace" })}
                overline={t("documentsLanding.hero.overline", { defaultValue: "Documents" })}
                icon={<DescriptionOutlinedIcon />}
                actions={
                    <>
                        <Button
                            component={RouterLink}
                            to="/documents/generate"
                            variant="contained"
                            sx={{ borderRadius: 3, fontWeight: 800 }}
                        >
                            {t("documentsLanding.generate.primaryCta")}
                        </Button>
                        <Button
                            component={RouterLink}
                            to="/documents/my"
                            variant="outlined"
                            sx={{ borderRadius: 3 }}
                        >
                            {t("documentsLanding.library.primaryCta")}
                        </Button>
                    </>
                }
            >
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={{ xs: 2, sm: 4 }}
                    flexWrap="wrap"
                    justifyContent="center"
                >
                    {HERO_METRICS.map((metric) => (
                        <Stack key={metric.labelKey} spacing={0.5} textAlign="center" minWidth={140}>
                            <Typography variant="h4" fontWeight={900}>
                                {metric.value}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.85 }}>
                                {t(metric.labelKey, { defaultValue: metric.defaultLabel })}
                            </Typography>
                        </Stack>
                    ))}
                </Stack>
            </PageHero>

            <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
                <Grid container spacing={{ xs: 3, md: 4 }}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Card
                            sx={{
                                borderRadius: 4,
                                height: "100%",
                                background: (theme) =>
                                    `linear-gradient(145deg, ${alpha(theme.palette.primary.light, 0.15)}, ${alpha(
                                        theme.palette.primary.main,
                                        0.12
                                    )})`,
                                border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                            }}
                        >
                            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                                <Stack spacing={2}>
                                    <Box display="flex" alignItems="center" gap={1.5}>
                                        <AddCircleOutlineIcon color="primary" fontSize="large" />
                                        <Typography variant="h5" fontWeight={800}>
                                            {t("documentsLanding.generate.title")}
                                        </Typography>
                                    </Box>
                                    <Typography color="text.secondary">
                                        {t("documentsLanding.generate.description")}
                                    </Typography>
                                    <Stack direction="row" spacing={1} flexWrap="wrap">
                                        <Button
                                            component={RouterLink}
                                            to="/documents/generate"
                                            variant="contained"
                                            startIcon={<DescriptionOutlinedIcon />}
                                            sx={{ borderRadius: 3, fontWeight: 700 }}
                                        >
                                            {t("documentsLanding.generate.primaryCta")}
                                        </Button>
                                        <Button component={RouterLink} to="/documents/my" variant="text">
                                            {t("documentsLanding.generate.secondaryCta")}
                                        </Button>
                                    </Stack>
                                    <Stack direction="row" spacing={1} flexWrap="wrap">
                                        <Chip
                                            label={t("documentsLanding.generate.statTemplates", {
                                                defaultValue: "70+ legal schematics",
                                            })}
                                            size="small"
                                        />
                                        <Chip
                                            label={t("documentsLanding.generate.statGuided", {
                                                defaultValue: "Guided prompts included",
                                            })}
                                            size="small"
                                        />
                                    </Stack>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Card sx={{ borderRadius: 4, height: "100%" }}>
                            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                                <Stack spacing={2}>
                                    <Box display="flex" alignItems="center" gap={1.5}>
                                        <FolderOpenIcon color="primary" fontSize="large" />
                                        <Typography variant="h5" fontWeight={800}>
                                            {t("documentsLanding.library.title")}
                                        </Typography>
                                    </Box>
                                    <Typography color="text.secondary">
                                        {t("documentsLanding.library.description")}
                                    </Typography>
                                    <Stack direction="row" spacing={1} flexWrap="wrap">
                                        <Button component={RouterLink} to="/documents/my" variant="contained" sx={{ borderRadius: 3 }}>
                                            {t("documentsLanding.library.primaryCta")}
                                        </Button>
                                        <Button component={RouterLink} to="/documents/generate" variant="outlined" sx={{ borderRadius: 3 }}>
                                            {t("documentsLanding.library.secondaryCta")}
                                        </Button>
                                    </Stack>
                                    <Stack direction="row" spacing={1} flexWrap="wrap">
                                        <Chip
                                            label={t("documentsLanding.library.statStorage", {
                                                defaultValue: "Encrypted storage",
                                            })}
                                            size="small"
                                        />
                                        <Chip
                                            label={t("documentsLanding.library.statShare", {
                                                defaultValue: "Share with cases & clients",
                                            })}
                                            size="small"
                                        />
                                    </Stack>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                <Box component="section" sx={{ mt: { xs: 6, md: 8 } }}>
                    <Stack spacing={1.5} textAlign="center" mb={4}>
                        <Typography variant="overline" color="text.secondary">
                            {t("documentsLanding.highlights.overline", { defaultValue: "Why teams rely on it" })}
                        </Typography>
                        <Typography variant="h4" fontWeight={900}>
                            {t("documentsLanding.highlights.title", { defaultValue: "Built for legal workflows" })}
                        </Typography>
                        <Typography color="text.secondary">
                            {t("documentsLanding.highlights.subtitle", {
                                defaultValue:
                                    "Everything from prompts to version history is tuned for cross-border compliance.",
                            })}
                        </Typography>
                    </Stack>
                    <Grid container spacing={{ xs: 2, md: 3 }}>
                        {HIGHLIGHT_CARDS.map((card) => (
                            <Grid size={{ xs: 12, md: 4 }} key={card.titleKey}>
                                <Card sx={{ borderRadius: 3, height: "100%" }}>
                                    <CardContent>
                                        <Stack spacing={1.5}>
                                            <Box
                                                sx={{
                                                    width: 44,
                                                    height: 44,
                                                    borderRadius: 2,
                                                    display: "grid",
                                                    placeItems: "center",
                                                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                                                    color: "primary.main",
                                                }}
                                            >
                                                {card.icon}
                                            </Box>
                                            <Typography fontWeight={800}>
                                                {t(card.titleKey, { defaultValue: card.defaultTitle })}
                                            </Typography>
                                            <Typography color="text.secondary">
                                                {t(card.descKey, { defaultValue: card.defaultDesc })}
                                            </Typography>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Container>
        </>
    );
};

export default DocumentsLandingPage;
