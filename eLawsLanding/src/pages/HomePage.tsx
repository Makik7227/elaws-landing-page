import * as React from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    LinearProgress,
    Stack,
    Typography,
    alpha,
    useTheme,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import ChatRoundedIcon from "@mui/icons-material/ChatRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
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
                        ? "0 18px 40px rgba(15,16,20,0.08)"
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

const HOW_IT_WORKS = [
    { step: 1, titleKey: "home.steps.pickCountry.title", descKey: "home.steps.pickCountry.desc" },
    { step: 2, titleKey: "home.steps.chatDraft.title", descKey: "home.steps.chatDraft.desc" },
    { step: 3, titleKey: "home.steps.saveCollaborate.title", descKey: "home.steps.saveCollaborate.desc" },
];

const HERO_STATUS = [
    { value: "12", labelKey: "home.hero.widget.status.cases" },
    { value: "5", labelKey: "home.hero.widget.status.tasks" },
    { value: "6h", labelKey: "home.hero.widget.status.sla" },
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

const VALUE_PROPS = [
    {
        icon: <VerifiedRoundedIcon />,
        titleKey: "home.benefits.compliance.title",
        descKey: "home.benefits.compliance.desc",
    },
    {
        icon: <DashboardRoundedIcon />,
        titleKey: "home.benefits.workspace.title",
        descKey: "home.benefits.workspace.desc",
    },
    {
        icon: <AutoAwesomeRoundedIcon />,
        titleKey: "home.benefits.guidance.title",
        descKey: "home.benefits.guidance.desc",
    },
    {
        icon: <ScheduleRoundedIcon />,
        titleKey: "home.benefits.speed.title",
        descKey: "home.benefits.speed.desc",
    },
];

const TIMELINE_STEPS = [
    { titleKey: "home.timeline.steps.intake.title", descKey: "home.timeline.steps.intake.desc" },
    { titleKey: "home.timeline.steps.drafting.title", descKey: "home.timeline.steps.drafting.desc" },
    { titleKey: "home.timeline.steps.review.title", descKey: "home.timeline.steps.review.desc" },
    { titleKey: "home.timeline.steps.share.title", descKey: "home.timeline.steps.share.desc" },
];

const HomePage: React.FC = () => {
    const theme = useTheme();
    const [user, setUser] = useState<User | null>(null);
    const { t } = useTranslation();
    const navigate = useNavigate();

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => setUser(u));
        return () => unsub();
    }, []);

    const gradient = `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${
        theme.palette.secondary.main
    } 60%, ${theme.palette.primary.main} 100%)`;

    const handleBrowseProcedures = () => {
        navigate(user ? "/procedures" : "/login");
    };

    return (
        <>
            {/* HERO */}
            <Box
                component="section"
                sx={{
                    mt: { xs: "calc(-1 * var(--topbar-height-mobile))", md: "calc(-1 * var(--topbar-height-desktop))" },
                    pt: {
                        xs: "calc(var(--topbar-height-mobile) + 48px)",
                        md: "calc(var(--topbar-height-desktop) + 72px)",
                    },
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
                        background: alpha(theme.palette.common.white, 0.14),
                        filter: "blur(40px)",
                    },
                    "&:after": {
                        content: '""',
                        position: "absolute",
                        width: 360,
                        height: 360,
                        bottom: -160,
                        left: -120,
                        borderRadius: "50%",
                        background: alpha(theme.palette.common.white, 0.08),
                        filter: "blur(50px)",
                    },
                }}
            >
                <Container sx={{ position: "relative" }}>
                    <Grid container spacing={{ xs: 6, md: 8 }} alignItems="center">
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Stack spacing={3}>
                                <Chip
                                    label={t("home.hero.badge")}
                                    variant="outlined"
                                    sx={{
                                        color: "inherit",
                                        borderColor: alpha(theme.palette.common.white, 0.4),
                                        bgcolor: alpha(theme.palette.common.white, 0.08),
                                        fontWeight: 600,
                                        width: "fit-content",
                                    }}
                                />
                                <Stack spacing={1.5}>
                                    <Typography
                                        component="h1"
                                        sx={{
                                            fontSize: { xs: 40, sm: 56, md: 64 },
                                            fontWeight: 900,
                                            letterSpacing: -0.8,
                                            lineHeight: 1.05,
                                            maxWidth: 620,
                                        }}
                                    >
                                        {t("home.hero.title")}
                                    </Typography>
                                    <Typography sx={{ maxWidth: 560, opacity: 0.92, fontSize: { xs: 16, md: 18 } }}>
                                        {t("home.hero.subtitle")}
                                    </Typography>
                                </Stack>
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
                                            borderRadius: 3,
                                        }}
                                    >
                                        {user ? t("home.hero.ctaDashboard") : t("home.hero.ctaPrimary")}
                                    </Button>
                                    {!user && (
                                        <Button
                                            component={RouterLink}
                                            to="/ai/chat"
                                            variant="outlined"
                                            size="large"
                                            sx={{
                                                px: 4,
                                                py: 1.2,
                                                fontWeight: 700,
                                                color: "inherit",
                                                borderWidth: 2,
                                                borderColor: alpha(theme.palette.common.white, 0.7),
                                                bgcolor: alpha(theme.palette.common.white, 0.12),
                                                borderRadius: 3,
                                                "&:hover": {
                                                    borderColor: theme.palette.common.white,
                                                    bgcolor: alpha(theme.palette.common.white, 0.2),
                                                },
                                            }}
                                        >
                                            {t("home.hero.ctaSecondary")}
                                        </Button>
                                    )}
                                </Stack>
                                <Box
                                    sx={{
                                        p: { xs: 2.5, sm: 3 },
                                        borderRadius: 4,
                                        bgcolor: alpha(theme.palette.common.white, 0.08),
                                        border: `1px solid ${alpha(theme.palette.common.white, 0.12)}`,
                                    }}
                                >
                                    <Stack
                                        direction={{ xs: "column", sm: "row" }}
                                        spacing={{ xs: 2, sm: 5 }}
                                        justifyContent="space-between"
                                        alignItems={{ xs: "flex-start", sm: "center" }}
                                    >
                                        {HERO_METRICS.map((metric) => (
                                            <Stack key={metric.labelKey} spacing={0.5}>
                                                <Typography variant="h4" fontWeight={900}>
                                                    {metric.value}
                                                </Typography>
                                                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                                    {t(metric.labelKey)}
                                                </Typography>
                                            </Stack>
                                        ))}
                                    </Stack>
                                </Box>
                            </Stack>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box sx={{ position: "relative" }}>
                                <Card
                                    sx={{
                                        borderRadius: 5,
                                        p: { xs: 3, md: 4 },
                                        bgcolor: alpha(theme.palette.background.paper, 0.1),
                                        border: `1px solid ${alpha(theme.palette.common.white, 0.15)}`,
                                        boxShadow: "0 25px 65px rgba(11,16,18,0.32)",
                                        backdropFilter: "blur(6px)",
                                    }}
                                >
                                    <Stack spacing={3}>
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <Box
                                                sx={{
                                                    width: 44,
                                                    height: 44,
                                                    borderRadius: 2,
                                                    bgcolor: alpha(theme.palette.secondary.light, 0.2),
                                                    display: "grid",
                                                    placeItems: "center",
                                                }}
                                            >
                                                <AutoAwesomeRoundedIcon />
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight={700} sx={{ opacity: 0.9 }}>
                                                    {t("home.hero.widget.title")}
                                                </Typography>
                                                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                                    {t("home.hero.widget.subtitle")}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                        <Typography variant="h5" fontWeight={800}>
                                            {t("home.hero.widget.headline")}
                                        </Typography>
                                        <Box>
                                            <Stack direction="row" justifyContent="space-between" mb={0.5}>
                                                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                                    {t("home.hero.widget.progressLabel")}
                                                </Typography>
                                                <Typography variant="caption" fontWeight={700}>
                                                    86%
                                                </Typography>
                                            </Stack>
                                            <LinearProgress
                                                variant="determinate"
                                                value={86}
                                                sx={{
                                                    height: 10,
                                                    borderRadius: 999,
                                                    bgcolor: alpha(theme.palette.common.white, 0.2),
                                                    "& .MuiLinearProgress-bar": {
                                                        borderRadius: 999,
                                                            background: "linear-gradient(90deg, #FCE7B0, #FFD37A, #FFB347)",
                                                    },
                                                }}
                                            />
                                        </Box>
                                        <Stack direction="row" spacing={2} justifyContent="space-between">
                                            {HERO_STATUS.map((item) => (
                                                <Box key={item.labelKey}>
                                                    <Typography variant="h6" fontWeight={800}>
                                                        {item.value}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                                        {t(item.labelKey)}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Stack>
                                    </Stack>
                                </Card>
                            </Box>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* ONE-TIME PROCEDURES */}
            {!user && (
                <Box component="section" sx={{ py: { xs: 6, md: 8 }, bgcolor: theme.palette.background.default }}>
                    <Container>
                        <Card
                            sx={{
                                borderRadius: 4,
                                p: { xs: 3, md: 4 },
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
                            <Grid container spacing={3} alignItems="center">
                                <Grid size={{ xs: 12, md: 7 }}>
                                    <Stack spacing={1.5}>
                                        <Chip
                                            label={t("home.proceduresPurchase.badge")}
                                            color="primary"
                                            variant="outlined"
                                            sx={{ width: "fit-content", fontWeight: 700 }}
                                        />
                                        <Typography variant="h4" fontWeight={800}>
                                            {t("home.proceduresPurchase.title")}
                                        </Typography>
                                        <Typography color="text.secondary">
                                            {t("home.proceduresPurchase.subtitle")}
                                        </Typography>
                                        <Stack spacing={0.5}>
                                            <Typography variant="body2" fontWeight={600}>
                                                {t("home.proceduresPurchase.pointOne")}
                                            </Typography>
                                            <Typography variant="body2" fontWeight={600}>
                                                {t("home.proceduresPurchase.pointTwo")}
                                            </Typography>
                                            <Typography variant="body2" fontWeight={600}>
                                                {t("home.proceduresPurchase.pointThree")}
                                            </Typography>
                                        </Stack>
                                        <Typography variant="body2" color="text.secondary">
                                            {t("home.proceduresPurchase.message")}
                                        </Typography>
                                    </Stack>
                                </Grid>
                                <Grid size={{ xs: 12, md: 5 }}>
                                    <Stack spacing={1.5} alignItems={{ xs: "stretch", md: "flex-end" }}>
                                        <Button
                                            component={RouterLink}
                                            to="/procedures-purchase"
                                            variant="contained"
                                            size="large"
                                            sx={{ px: 4, py: 1.2, fontWeight: 800, borderRadius: 3 }}
                                        >
                                            {t("home.proceduresPurchase.cta")}
                                        </Button>
                                        <Typography variant="caption" color="text.secondary">
                                            {t("home.proceduresPurchase.helper")}
                                        </Typography>
                                    </Stack>
                                </Grid>
                            </Grid>
                        </Card>
                    </Container>
                </Box>
            )}

            {/* VALUE PROPS */}
            <Box
                component="section"
                sx={{
                    py: { xs: 8, md: 10 },
                    bgcolor: theme.palette.background.default,
                }}
            >
                <Container>
                    <Stack spacing={1} mb={5} textAlign="center">
                        <Typography variant="overline" color="text.secondary">
                            {t("home.benefits.overline")}
                        </Typography>
                        <Typography variant="h4" fontWeight={800}>
                            {t("home.benefits.title")}
                        </Typography>
                        <Typography color="text.secondary" maxWidth={680} mx="auto">
                            {t("home.benefits.subtitle")}
                        </Typography>
                    </Stack>
                    <Grid container spacing={3}>
                        {VALUE_PROPS.map((card) => (
                            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.titleKey}>
                                <Card
                                    sx={{
                                        height: "100%",
                                        borderRadius: 4,
                                        p: 3,
                                        border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                                        background: theme.palette.mode === "light"
                                            ? "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(246,242,236,0.98))"
                                            : alpha(theme.palette.background.paper, 0.8),
                                        boxShadow:
                                            theme.palette.mode === "light"
                                                ? "0 25px 60px rgba(15,16,20,0.08)"
                                                : "0 25px 60px rgba(0,0,0,0.55)",
                                    }}
                                >
                                    <Stack spacing={2}>
                                        <Box
                                            sx={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: 2,
                                                display: "grid",
                                                placeItems: "center",
                                                bgcolor: alpha(theme.palette.primary.main, 0.12),
                                                color: theme.palette.primary.main,
                                            }}
                                        >
                                            {card.icon}
                                        </Box>
                                        <Typography fontWeight={700}>{t(card.titleKey)}</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {t(card.descKey)}
                                        </Typography>
                                    </Stack>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
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
                                        ? "0 30px 80px rgba(15,16,20,0.12)"
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

            {/* TIMELINE */}
            <Box component="section" sx={{ py: { xs: 8, md: 10 }, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                <Container>
                    <Grid container spacing={{ xs: 4, md: 8 }} alignItems="center">
                        <Grid size={{ xs: 12, md: 5 }}>
                            <Stack spacing={2}>
                                <Chip label={t("home.timeline.badge")} color="primary" variant="outlined" sx={{ width: "fit-content" }} />
                                <Typography variant="h4" fontWeight={800}>
                                    {t("home.timeline.title")}
                                </Typography>
                                <Typography color="text.secondary">
                                    {t("home.timeline.subtitle")}
                                </Typography>
                                <Stack spacing={1}>
                                    <Typography variant="body2" color="text.secondary">
                                        {t("home.timeline.etaLabel")}
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={92}
                                        sx={{
                                            height: 12,
                                            borderRadius: 999,
                                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                                            "& .MuiLinearProgress-bar": {
                                                borderRadius: 999,
                                                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                            },
                                        }}
                                    />
                                </Stack>
                                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                                    <Button onClick={handleBrowseProcedures} variant="contained">
                                        {t("home.timeline.primaryCta")}
                                    </Button>
                                    <Button component={RouterLink} to="/dashboard" variant="text">
                                        {t("home.timeline.secondaryCta")}
                                    </Button>
                                </Stack>
                            </Stack>
                        </Grid>
                        <Grid size={{ xs: 12, md: 7 }}>
                            <Stack spacing={2}>
                                {TIMELINE_STEPS.map((step, idx) => (
                                    <Card
                                        key={step.titleKey}
                                        sx={{
                                            p: 3,
                                            borderRadius: 4,
                                            border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                                            background: theme.palette.mode === "light"
                                                ? "linear-gradient(120deg, rgba(255,255,255,0.95), rgba(245,240,232,0.88))"
                                                : alpha(theme.palette.background.paper, 0.8),
                                        }}
                                    >
                                        <Stack direction="row" spacing={2} alignItems="flex-start">
                                            <Chip label={`0${idx + 1}`} color="primary" variant="filled" sx={{ borderRadius: 999 }} />
                                            <Box>
                                                <Typography fontWeight={700}>{t(step.titleKey)}</Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {t(step.descKey)}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </Card>
                                ))}
                            </Stack>
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
                                            borderWidth: 2,
                                            borderColor: "currentColor",
                                            bgcolor: alpha(theme.palette.common.white, 0.12),
                                            "&:hover": {
                                                borderColor: "currentColor",
                                                bgcolor: alpha(theme.palette.common.white, 0.2),
                                            },
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

        </>
    );
};

export default HomePage;
