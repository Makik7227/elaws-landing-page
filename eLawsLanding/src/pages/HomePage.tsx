import * as React from "react";
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
    alpha,
    useTheme,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { Link as RouterLink } from "react-router-dom";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import ChatRoundedIcon from "@mui/icons-material/ChatRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../../firebase.ts";
import { useTranslation } from "react-i18next";

const FeatureCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    desc: string;
}> = ({ icon, title, desc }) => {
    const theme = useTheme();
    return (
        <Card
            elevation={3}
            sx={{
                height: "100%",
                borderRadius: 3,
                bgcolor: theme.palette.background.paper,
                boxShadow: `0 6px 20px rgba(0,0,0,0.06)`,
            }}
        >
            <CardContent>
                <Box
                    sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2,
                        display: "grid",
                        placeItems: "center",
                        mb: 1.5,
                        bgcolor:
                            theme.palette.mode === "light"
                                ? theme.palette.primary.main + "20"
                                : theme.palette.primary.main + "30",
                    }}
                >
                    {icon}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {title}
                </Typography>
                <Typography color="text.secondary">{desc}</Typography>
            </CardContent>
        </Card>
    );
};

const StepCard: React.FC<{
    step: number;
    title: string;
    desc: string;
}> = ({ step, title, desc }) => {
    const theme = useTheme();
    return (
        <Stack
            spacing={1.5}
            sx={{
                p: 3,
                borderRadius: 3,
                flex: 1,
                minWidth: 240,
                position: "relative",
                overflow: "hidden",
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                boxShadow:
                    theme.palette.mode === "light"
                        ? "0 18px 40px rgba(18,10,40,0.08)"
                        : "0 18px 45px rgba(0,0,0,0.55)",
            }}
        >
            <Chip
                label={`0${step}`}
                color="primary"
                sx={{ fontWeight: 700, width: "fit-content", borderRadius: 999 }}
            />
            <Typography variant="subtitle1" fontWeight={800}>
                {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
                {desc}
            </Typography>
            <Box
                sx={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    background: `radial-gradient(circle at top, ${alpha(
                        theme.palette.primary.main,
                        0.08
                    )}, transparent 55%)`,
                }}
            />
        </Stack>
    );
};

const HERO_METRICS = [
    { labelKey: "home.hero.metrics.questions", value: "2.3M+" },
    { labelKey: "home.hero.metrics.docs", value: "640K" },
    { labelKey: "home.hero.metrics.response", value: "6.4s" },
];

const TRUSTED_LOGOS = ["LexisLink", "NovaLegal", "Atlas Law", "CivicTech"];

const HOW_IT_WORKS = [
    { step: 1, titleKey: "home.steps.pickCountry.title", descKey: "home.steps.pickCountry.desc" },
    { step: 2, titleKey: "home.steps.chatDraft.title", descKey: "home.steps.chatDraft.desc" },
    { step: 3, titleKey: "home.steps.saveCollaborate.title", descKey: "home.steps.saveCollaborate.desc" },
];

const HERO_HIGHLIGHTS = [
    { icon: <LockRoundedIcon fontSize="small" />, labelKey: "home.hero.highlights.security" },
    { icon: <LanguageRoundedIcon fontSize="small" />, labelKey: "home.hero.highlights.localization" },
    { icon: <AssessmentRoundedIcon fontSize="small" />, labelKey: "home.hero.highlights.citations" },
];

const FEATURE_LIST = [
    {
        icon: <GavelRoundedIcon />,
        titleKey: "home.features.cards.countryChat.title",
        descKey: "home.features.cards.countryChat.desc",
    },
    {
        icon: <ChatRoundedIcon />,
        titleKey: "home.features.cards.topicPresets.title",
        descKey: "home.features.cards.topicPresets.desc",
    },
    {
        icon: <LockRoundedIcon />,
        titleKey: "home.features.cards.privacy.title",
        descKey: "home.features.cards.privacy.desc",
    },
    {
        icon: <BoltRoundedIcon />,
        titleKey: "home.features.cards.speed.title",
        descKey: "home.features.cards.speed.desc",
    },
];

const WORKFLOW_POINTS = [
    {
        icon: <ChatRoundedIcon />,
        titleKey: "home.workflow.points.workspace.title",
        descKey: "home.workflow.points.workspace.desc",
    },
    {
        icon: <BoltRoundedIcon />,
        titleKey: "home.workflow.points.realtime.title",
        descKey: "home.workflow.points.realtime.desc",
    },
    {
        icon: <GavelRoundedIcon />,
        titleKey: "home.workflow.points.local.title",
        descKey: "home.workflow.points.local.desc",
    },
];

const PREVIEW_ITEMS = [
    { titleKey: "home.workflow.preview.draftNda.title", descKey: "home.workflow.preview.draftNda.desc" },
    { titleKey: "home.workflow.preview.laborChat.title", descKey: "home.workflow.preview.laborChat.desc" },
    { titleKey: "home.workflow.preview.immigration.title", descKey: "home.workflow.preview.immigration.desc" },
];

const HomePage: React.FC = () => {
    const theme = useTheme();
    const [user, setUser] = useState<User | null>(null);
    const { t } = useTranslation();

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => setUser(u));
        return () => unsub();
    }, []);

    const gradient = `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${
        theme.palette.secondary.main
    } 60%, ${theme.palette.primary.main} 100%)`;

    return (
        <>
            {/* HERO */}
            <Box
                component="section"
                sx={{
                    pt: { xs: 8, md: 12 },
                    pb: { xs: 8, md: 12 },
                    background: gradient,
                    position: "relative",
                    color: theme.palette.getContrastText(theme.palette.primary.main),
                    overflow: "hidden",
                    "&:before": {
                        content: '""',
                        position: "absolute",
                        width: 420,
                        height: 420,
                        top: -120,
                        right: -80,
                        borderRadius: "50%",
                        background: alpha(theme.palette.common.white, 0.1),
                        filter: "blur(40px)",
                    },
                }}
            >
                <Container sx={{ position: "relative" }}>
                    <Stack spacing={4} alignItems="center" textAlign="center">
                        <Chip
                            label={t("home.hero.badge")}
                            variant="outlined"
                            sx={{
                                color: "inherit",
                                borderColor: alpha(theme.palette.common.white, 0.4),
                                bgcolor: "transparent",
                                fontWeight: 600,
                                px: 2,
                            }}
                        />
                        <Typography
                            component="h1"
                            sx={{
                                fontSize: { xs: 40, sm: 56, md: 64 },
                                fontWeight: 900,
                                letterSpacing: -0.8,
                                lineHeight: 1.02,
                                maxWidth: 900,
                            }}
                        >
                            {t("home.hero.title")}
                        </Typography>
                        <Typography
                            sx={{
                                maxWidth: 780,
                                opacity: 0.9,
                                fontSize: { xs: 16, md: 18 },
                            }}
                        >
                            {t("home.hero.subtitle")}
                        </Typography>

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                            <Button
                                component={RouterLink}
                                to={user ? "/dashboard" : "/signup"}
                                variant="contained"
                                size="large"
                                sx={{
                                    px: 4,
                                    py: 1.2,
                                    fontWeight: 800,
                                }}
                            >
                                {user ? t("home.hero.ctaDashboard") : t("home.hero.ctaPrimary")}
                            </Button>
                            {!user && (
                                <Button
                                    component={RouterLink}
                                    to="/chat"
                                    variant="outlined"
                                    size="large"
                                    sx={{
                                        px: 4,
                                        py: 1.2,
                                        fontWeight: 700,
                                        color: "inherit",
                                        borderColor: alpha(theme.palette.common.white, 0.4),
                                        bgcolor: alpha(theme.palette.common.white, 0.06),
                                        "&:hover": { borderColor: "inherit" },
                                    }}
                                >
                                    {t("home.hero.ctaSecondary")}
                                </Button>
                            )}
                        </Stack>

                        <Stack
                            direction={{ xs: "column", md: "row" }}
                            spacing={3}
                            justifyContent="center"
                            alignItems="stretch"
                            sx={{ width: "100%", maxWidth: 900 }}
                        >
                            <Card
                                sx={{
                                    flex: 1,
                                    bgcolor: alpha(theme.palette.common.white, 0.08),
                                    borderColor: alpha(theme.palette.common.white, 0.12),
                                }}
                            >
                                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                                    <Stack
                                        direction={{ xs: "column", sm: "row" }}
                                        spacing={{ xs: 2, sm: 3 }}
                                        justifyContent="space-between"
                                        alignItems={{ xs: "flex-start", sm: "center" }}
                                    >
                                        {HERO_METRICS.map((metric) => (
                                            <Stack
                                                key={metric.labelKey}
                                                spacing={0.5}
                                                alignItems={{ xs: "flex-start", sm: "center" }}
                                            >
                                                <Typography variant="h4" fontWeight={900}>
                                                    {metric.value}
                                                </Typography>
                                                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                                    {t(metric.labelKey)}
                                                </Typography>
                                            </Stack>
                                        ))}
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Stack>

                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1.5}
                            justifyContent="center"
                            flexWrap="wrap"
                        >
                            {HERO_HIGHLIGHTS.map((item) => (
                                <Chip
                                    key={item.labelKey}
                                    icon={item.icon}
                                    label={t(item.labelKey)}
                                    variant="outlined"
                                    sx={{
                                        color: "inherit",
                                        borderColor: alpha(theme.palette.common.white, 0.4),
                                        bgcolor: alpha(theme.palette.common.white, 0.06),
                                    }}
                                />
                            ))}
                        </Stack>

                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={2}
                            alignItems="center"
                            justifyContent="center"
                            sx={{ opacity: 0.8 }}
                        >
                            <Typography variant="body2">{t("home.hero.trustedBy")}</Typography>
                            <Divider flexItem orientation={"vertical"} sx={{ display: { xs: "none", sm: "block" } }} />
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 1, sm: 3 }} alignItems="center">
                                {TRUSTED_LOGOS.map((logo) => (
                                    <Typography key={logo} variant="body2" sx={{ letterSpacing: 2 }}>
                                        {logo}
                                    </Typography>
                                ))}
                            </Stack>
                        </Stack>
                    </Stack>
                </Container>
            </Box>

            {/* FEATURES */}
            <Box component="section" sx={{ py: { xs: 8, md: 10 } }}>
                <Container>
                    <Stack spacing={1} mb={4} textAlign="center">
                        <Typography variant="overline" color="text.secondary">
                            {t("home.features.overline")}
                        </Typography>
                        <Typography variant="h4" fontWeight={800}>
                            {t("home.features.title")}
                        </Typography>
                        <Typography color="text.secondary">
                            {t("home.features.subtitle")}
                        </Typography>
                    </Stack>
                    <Grid container spacing={3}>
                        {FEATURE_LIST.map((feature) => (
                            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={feature.titleKey}>
                                <FeatureCard
                                    icon={feature.icon}
                                    title={t(feature.titleKey)}
                                    desc={t(feature.descKey)}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* PLATFORM SNAPSHOT */}
            <Box component="section" sx={{ py: { xs: 6, md: 9 } }}>
                <Container>
                    <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Stack spacing={2}>
                                <Chip label={t("home.workflow.badge")} color="primary" variant="outlined" sx={{ width: "fit-content" }} />
                                <Typography variant="h4" fontWeight={800}>
                                    {t("home.workflow.title")}
                                </Typography>
                                <Typography color="text.secondary">
                                    {t("home.workflow.description")}
                                </Typography>
                                <Stack spacing={2}>
                                    {WORKFLOW_POINTS.map((point) => (
                                        <Stack direction="row" spacing={2} key={point.titleKey} alignItems="flex-start">
                                            <Box
                                                sx={{
                                                    width: 44,
                                                    height: 44,
                                                    borderRadius: 2,
                                                    display: "grid",
                                                    placeItems: "center",
                                                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                                                    color: theme.palette.primary.main,
                                                }}
                                            >
                                                {point.icon}
                                            </Box>
                                            <Box>
                                                <Typography fontWeight={700}>{t(point.titleKey)}</Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {t(point.descKey)}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    ))}
                                </Stack>
                                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                                    <Button component={RouterLink} to="/features" variant="contained">
                                        {t("home.workflow.primaryCta")}
                                    </Button>
                                    <Button component={RouterLink} to="/pricing" variant="text">
                                        {t("home.workflow.secondaryCta")}
                                    </Button>
                                </Stack>
                            </Stack>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box
                                sx={{
                                    borderRadius: 5,
                                    p: { xs: 3, md: 4 },
                                    bgcolor: theme.palette.background.paper,
                                    position: "relative",
                                    overflow: "hidden",
                                    border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                                    boxShadow: theme.palette.mode === "light"
                                        ? "0 30px 80px rgba(18,10,40,0.12)"
                                        : "0 30px 90px rgba(0,0,0,0.65)",
                                }}
                            >
                                <Typography variant="subtitle2" fontWeight={700} mb={2}>
                                    {t("home.workflow.preview.title")}
                                </Typography>
                                <Stack spacing={2}>
                                    {PREVIEW_ITEMS.map((item, idx) => (
                                        <Card
                                            key={item.titleKey}
                                            sx={{ borderRadius: 4, borderColor: alpha(theme.palette.primary.main, 0.08) }}
                                        >
                                            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                                <Box
                                                    sx={{
                                                        width: 42,
                                                        height: 42,
                                                        borderRadius: 999,
                                                        bgcolor: alpha(theme.palette.primary.main, 0.15),
                                                        display: "grid",
                                                        placeItems: "center",
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    {idx + 1}
                                                </Box>
                                                <Box>
                                                    <Typography fontWeight={700}>{t(item.titleKey)}</Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {t(item.descKey)}
                                                    </Typography>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </Stack>
                                <Box
                                    sx={{
                                        mt: 3,
                                        borderRadius: 3,
                                        border: `1px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
                                        p: 3,
                                        textAlign: "center",
                                    }}
                                >
                                    <Typography fontWeight={700}>{t("home.workflow.preview.footerTitle")}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {t("home.workflow.preview.footerDesc")}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* HOW IT WORKS */}
            <Box
                component="section"
                sx={{
                    py: { xs: 8, md: 10 },
                    bgcolor: theme.palette.background.default,
                }}
            >
                <Container>
                    <Stack spacing={1.5} mb={5} textAlign="center">
                        <Typography variant="overline" color="text.secondary">
                            {t("home.steps.overline")}
                        </Typography>
                        <Typography variant="h4" fontWeight={800}>
                            {t("home.steps.title")}
                        </Typography>
                        <Typography color="text.secondary">
                            {t("home.steps.subtitle")}
                        </Typography>
                    </Stack>

                    <Grid container spacing={3} justifyContent="center">
                        {HOW_IT_WORKS.map((step) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={step.step}>
                                <StepCard
                                    step={step.step}
                                    title={t(step.titleKey)}
                                    desc={t(step.descKey)}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* CTA BAND */}
            {!user &&
                <Box component="section" sx={{py: {xs: 6, md: 8}}}>
                <Container>
                    <Card
                        sx={{
                            borderRadius: 4,
                            overflow: "hidden",
                            background: gradient,
                            color: theme.palette.getContrastText(theme.palette.primary.main),
                            boxShadow: "0 20px 50px rgba(0,0,0,.25)",
                        }}
                        elevation={0}
                    >
                        <CardContent>
                            <Stack
                                direction={{xs: "column", md: "row"}}
                                alignItems={{xs: "flex-start", md: "center"}}
                                justifyContent="space-between"
                                spacing={2}
                            >
                                <Box>
                                    <Typography variant="h5" fontWeight={800}>
                                        {t("home.ctaBand.title")}
                                    </Typography>
                                    <Typography sx={{opacity: 0.9}}>
                                        {t("home.ctaBand.subtitle")}
                                    </Typography>
                                </Box>
                                <Stack direction={{xs: "column", sm: "row"}} spacing={1.5}>
                                    <Button
                                        component={RouterLink}
                                        to="/signup"
                                        variant="contained"
                                        size="large"
                                        sx={{borderRadius: 3, fontWeight: 800}}
                                    >
                                        {t("home.ctaBand.primary")}
                                    </Button>
                                    <Button
                                        component={RouterLink}
                                        to="/pricing"
                                        variant="outlined"
                                        size="large"
                                        sx={{
                                            borderRadius: 3,
                                            color: "inherit",
                                            borderColor: "currentColor",
                                            "&:hover": {borderColor: "currentColor"},
                                        }}
                                    >
                                        {t("home.ctaBand.secondary")}
                                    </Button>
                                </Stack>
                            </Stack>
                        </CardContent>
                    </Card>
                </Container>
            </Box>}

            {/* FOOTER */}
            <Box
                component="footer"
                sx={{
                    py: 4,
                    borderTop: `1px solid ${theme.palette.divider}`,
                    bgcolor: theme.palette.background.paper,
                }}
            >
                <Container>
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        alignItems="center"
                        justifyContent="space-between"
                        spacing={2}
                    >
                        <Typography variant="body2" color="text.secondary">
                            © {new Date().getFullYear()} E-Laws
                        </Typography>
                        <Stack direction="row" spacing={3}>
                            <Typography
                                component={RouterLink}
                                to="/privacy"
                                color="text.secondary"
                                variant="body2"
                                sx={{ "&:hover": { color: "text.primary" } }}
                            >
                                {t("home.footer.privacy")}
                            </Typography>
                            <Typography
                                component={RouterLink}
                                to="/terms"
                                color="text.secondary"
                                variant="body2"
                                sx={{ "&:hover": { color: "text.primary" } }}
                            >
                                {t("home.footer.terms")}
                            </Typography>
                            <Typography
                                component={RouterLink}
                                to="/contact"
                                color="text.secondary"
                                variant="body2"
                                sx={{ "&:hover": { color: "text.primary" } }}
                            >
                                {t("home.footer.contact")}
                            </Typography>
                        </Stack>
                    </Stack>
                </Container>
            </Box>
        </>
    );
};

export default HomePage;
