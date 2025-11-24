import React from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    Divider,
    Stack,
    Typography,
    useTheme,
} from "@mui/material";
import {
    ChatRounded as ChatIcon,
    DescriptionOutlined as DocIcon,
    GavelRounded as GavelIcon,
    FolderSharedOutlined as CasesIcon,
    NoteAlt as NotesIcon,
    FlagOutlined as ProceduresIcon,
    LockOutlined as LockIcon,
    BoltOutlined as SpeedIcon,
} from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

type Feature = {
    titleKey: string;
    descKey: string;
    icon: React.ReactNode;
    to?: string;
    ctaKey?: string;
};

const FeatureCard = ({ title, desc, icon, to, cta }: { title: string; desc: string; icon: React.ReactNode; to?: string; cta?: string }) => {
    return (
        <Card
            elevation={3}
            sx={{
                flex: "1 1 280px",
                maxWidth: 420,
                borderRadius: 3,
                transition: "transform 200ms ease, box-shadow 200ms ease",
                "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 14px 40px rgba(0,0,0,.12)",
                },
            }}
        >
            <CardContent>
                <Box
                    sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        display: "grid",
                        placeItems: "center",
                        mb: 1.5,
                        bgcolor: (t) =>
                            t.palette.mode === "light"
                                ? t.palette.primary.main + "20"
                                : t.palette.primary.main + "30",
                    }}
                >
                    {icon}
                </Box>
                <Typography variant="h6" fontWeight={800} gutterBottom>
                    {title}
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                    {desc}
                </Typography>

                {to && (
                    <Button
                        component={RouterLink}
                        to={to}
                        variant="contained"
                        sx={{ borderRadius: 2, fontWeight: 700 }}
                    >
                        {cta}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
};

const FeaturesPage: React.FC = () => {
    const theme = useTheme();
    const { t } = useTranslation();
    const gradient = `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 60%, ${theme.palette.primary.main} 100%)`;

    const core: Feature[] = [
        {
            titleKey: "featuresPage.core.aiChat.title",
            descKey: "featuresPage.core.aiChat.desc",
            icon: <ChatIcon />,
            to: "/chat",
            ctaKey: "featuresPage.core.aiChat.cta",
        },
        {
            titleKey: "featuresPage.core.documents.title",
            descKey: "featuresPage.core.documents.desc",
            icon: <DocIcon />,
            to: "/documents/generate",
            ctaKey: "featuresPage.core.documents.cta",
        },
        {
            titleKey: "featuresPage.core.cases.title",
            descKey: "featuresPage.core.cases.desc",
            icon: <CasesIcon />,
            to: "/cases",
            ctaKey: "featuresPage.core.cases.cta",
        },
        {
            titleKey: "featuresPage.core.notes.title",
            descKey: "featuresPage.core.notes.desc",
            icon: <NotesIcon />,
            to: "/notes",
            ctaKey: "featuresPage.core.notes.cta",
        },
    ];

    const more: Feature[] = [
        {
            titleKey: "featuresPage.more.procedures.title",
            descKey: "featuresPage.more.procedures.desc",
            icon: <ProceduresIcon />,
            to: "/procedures/saved-procedures",
            ctaKey: "featuresPage.more.procedures.cta",
        },
        {
            titleKey: "featuresPage.more.presets.title",
            descKey: "featuresPage.more.presets.desc",
            icon: <GavelIcon />,
            to: "/chat",
            ctaKey: "featuresPage.more.presets.cta",
        },
        {
            titleKey: "featuresPage.more.privacy.title",
            descKey: "featuresPage.more.privacy.desc",
            icon: <LockIcon />,
        },
        {
            titleKey: "featuresPage.more.speed.title",
            descKey: "featuresPage.more.speed.desc",
            icon: <SpeedIcon />,
        },
    ];

    return (
        <>
            {/* HERO */}
            <Box
                sx={{
                    background: gradient,
                    color: theme.palette.getContrastText(theme.palette.primary.main),
                    py: { xs: 8, md: 10 },
                    textAlign: "center",
                }}
            >
                <Container maxWidth="md">
                    <Chip
                        label={t("featuresPage.hero.badge")}
                        variant="outlined"
                        sx={{
                            color: "inherit",
                            borderColor: "currentColor",
                            bgcolor: "transparent",
                            fontWeight: 700,
                            mb: 2,
                        }}
                    />
                    <Typography
                        variant="h3"
                        fontWeight={900}
                        sx={{ letterSpacing: -0.5, mb: 1 }}
                    >
                        {t("featuresPage.hero.title")}
                    </Typography>
                    <Typography sx={{ opacity: 0.95 }}>
                        {t("featuresPage.hero.subtitle")}
                    </Typography>
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1.5}
                        justifyContent="center"
                        sx={{ mt: 3 }}
                    >
                        <Button
                            component={RouterLink}
                            to="/signup"
                            variant="contained"
                            sx={{ borderRadius: 3, fontWeight: 800 }}
                        >
                            {t("featuresPage.hero.primaryCta")}
                        </Button>
                        <Button
                            component={RouterLink}
                            to="/chat"
                            variant="outlined"
                            sx={{
                                borderRadius: 3,
                                color: "inherit",
                                borderColor: "currentColor",
                                "&:hover": { borderColor: "currentColor" },
                            }}
                        >
                            {t("featuresPage.hero.secondaryCta")}
                        </Button>
                    </Stack>
                </Container>
            </Box>

            {/* CORE FEATURES */}
            <Box sx={{ py: { xs: 6, md: 8 } }}>
                <Container>
                    <Stack spacing={1} mb={3} textAlign="center">
                        <Typography variant="overline" color="text.secondary">
                            {t("featuresPage.coreSection.overline")}
                        </Typography>
                        <Typography variant="h4" fontWeight={900}>
                            {t("featuresPage.coreSection.title")}
                        </Typography>
                    </Stack>

                    <Stack
                        direction="row"
                        spacing={3}
                        useFlexGap
                        flexWrap="wrap"
                        justifyContent="center"
                    >
                        {core.map((f) => (
                            <FeatureCard
                                key={f.titleKey}
                                icon={f.icon}
                                title={t(f.titleKey)}
                                desc={t(f.descKey)}
                                to={f.to}
                                cta={f.ctaKey ? t(f.ctaKey) : t("featuresPage.cards.defaultCta")}
                            />
                        ))}
                    </Stack>
                </Container>
            </Box>

            {/* DIVIDER */}
            <Container>
                <Divider sx={{ my: { xs: 2, md: 3 } }} />
            </Container>

            {/* MORE */}
            <Box sx={{ py: { xs: 6, md: 8 } }}>
                <Container>
                    <Stack spacing={1} mb={3} textAlign="center">
                        <Typography variant="overline" color="text.secondary">
                            {t("featuresPage.moreSection.overline")}
                        </Typography>
                        <Typography variant="h4" fontWeight={900}>
                            {t("featuresPage.moreSection.title")}
                        </Typography>
                    </Stack>

                    <Stack
                        direction="row"
                        spacing={3}
                        useFlexGap
                        flexWrap="wrap"
                        justifyContent="center"
                    >
                        {more.map((f) => (
                            <FeatureCard
                                key={f.titleKey}
                                icon={f.icon}
                                title={t(f.titleKey)}
                                desc={t(f.descKey)}
                                to={f.to}
                                cta={f.ctaKey ? t(f.ctaKey) : undefined}
                            />
                        ))}
                    </Stack>

                    <Stack alignItems="center" mt={6}>
                        <Button
                            component={RouterLink}
                            to="/pricing"
                            variant="contained"
                            sx={{ borderRadius: 3, fontWeight: 800 }}
                        >
                            {t("featuresPage.moreSection.cta")}
                        </Button>
                    </Stack>
                </Container>
            </Box>
        </>
    );
};

export default FeaturesPage;
