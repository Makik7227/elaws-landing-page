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
import { Link as RouterLink } from "react-router-dom";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { useTranslation } from "react-i18next";

const Stat = ({ label, value }: { label: string; value: string }) => (
    <Stack alignItems="center" spacing={0.5} sx={{ minWidth: 120 }}>
        <Typography variant="h4" fontWeight={900} lineHeight={1}>
            {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
            {label}
        </Typography>
    </Stack>
);

const Pill = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
    <Stack direction="row" spacing={1} alignItems="center">
        <Box
            sx={{
                width: 28,
                height: 28,
                borderRadius: 1,
                display: "grid",
                placeItems: "center",
                bgcolor: (t) =>
                    t.palette.mode === "light"
                        ? t.palette.primary.main + "20"
                        : t.palette.primary.main + "30",
            }}
        >
            {icon}
        </Box>
        <Typography variant="body2" color="text.secondary">
            {text}
        </Typography>
    </Stack>
);

const TimelineItem = ({ year, title, desc }: { year: string; title: string; desc: string }) => (
    <Stack direction="row" spacing={2} alignItems="flex-start">
        <Chip label={year} size="small" color="primary" sx={{ borderRadius: 2 }} />
        <Box>
            <Typography variant="subtitle1" fontWeight={800}>
                {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
                {desc}
            </Typography>
        </Box>
    </Stack>
);

const STATS = [
    { value: "10k+", labelKey: "about.stats.users" },
    { value: "30+", labelKey: "about.stats.countries" },
    { value: "50ms", labelKey: "about.stats.response" },
];

const MISSION_PILLS = [
    { icon: <GavelRoundedIcon fontSize="small" />, textKey: "about.mission.pills.jurisdiction" },
    { icon: <PublicRoundedIcon fontSize="small" />, textKey: "about.mission.pills.local" },
    { icon: <ShieldRoundedIcon fontSize="small" />, textKey: "about.mission.pills.privacy" },
    { icon: <BoltRoundedIcon fontSize="small" />, textKey: "about.mission.pills.speed" },
];

const TRUST_POINTS = [
    "about.trust.points.citations",
    "about.trust.points.control",
    "about.trust.points.security",
    "about.trust.points.editable",
];

const TIMELINE = [
    { year: "2024", titleKey: "about.story.timeline.2024.title", descKey: "about.story.timeline.2024.desc" },
    { year: "2025", titleKey: "about.story.timeline.2025.title", descKey: "about.story.timeline.2025.desc" },
    { year: "Today", titleKey: "about.story.timeline.today.title", descKey: "about.story.timeline.today.desc" },
];

const AboutPage: React.FC = () => {
    const theme = useTheme();
    const { t } = useTranslation();
    const gradient = `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 60%, ${theme.palette.primary.main} 100%)`;

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
                        label={t("about.hero.badge")}
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
                        {t("about.hero.title")}
                    </Typography>
                    <Typography sx={{ opacity: 0.95, mt: 1.25 }}>
                        {t("about.hero.subtitle")}
                    </Typography>

                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1.5}
                        justifyContent="center"
                        sx={{ mt: 3 }}
                    >
                        <Button
                            component={RouterLink}
                            to="/features"
                            variant="outlined"
                            sx={{
                                borderRadius: 3,
                                color: "inherit",
                                borderColor: "currentColor",
                                "&:hover": { borderColor: "currentColor" },
                            }}
                        >
                            {t("about.hero.secondaryCta")}
                        </Button>
                        <Button
                            component={RouterLink}
                            to="/signup"
                            variant="contained"
                            sx={{ borderRadius: 3, fontWeight: 800 }}
                            startIcon={<RocketLaunchRoundedIcon />}
                        >
                            {t("about.hero.primaryCta")}
                        </Button>
                    </Stack>
                </Container>
            </Box>

            {/* MISSION */}
            <Box sx={{ py: { xs: 6, md: 8 } }}>
                <Container maxWidth="md">
                    <Card elevation={3} sx={{ borderRadius: 3 }}>
                        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                            <Stack spacing={2.5}>
                                <Typography variant="h5" fontWeight={900}>
                                    {t("about.mission.title")}
                                </Typography>
                                <Typography color="text.secondary">
                                    {t("about.mission.subtitle")}
                                </Typography>

                                <Stack
                                    direction={{ xs: "column", sm: "row" }}
                                    spacing={2}
                                    useFlexGap
                                    flexWrap="wrap"
                                >
                                    {MISSION_PILLS.map((pill) => (
                                        <Pill key={pill.textKey} icon={pill.icon} text={t(pill.textKey)} />
                                    ))}
                                </Stack>
                            </Stack>
                        </CardContent>
                    </Card>
                </Container>
            </Box>

            {/* NUMBERS */}
            <Container>
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={{ xs: 3, sm: 6 }}
                    justifyContent="center"
                    alignItems="center"
                >
                    {STATS.map((stat) => (
                        <Stat key={stat.labelKey} value={stat.value} label={t(stat.labelKey)} />
                    ))}
                </Stack>
            </Container>

            {/* HOW WE BUILD TRUST */}
            <Box sx={{ py: { xs: 6, md: 8 } }}>
                <Container maxWidth="md">
                    <Stack spacing={1.25} mb={2}>
                        <Typography variant="overline" color="text.secondary">
                            {t("about.trust.overline")}
                        </Typography>
                        <Typography variant="h4" fontWeight={900}>
                            {t("about.trust.title")}
                        </Typography>
                    </Stack>

                    <Card elevation={2} sx={{ borderRadius: 3 }}>
                        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                            <Stack spacing={1.25}>
                                {TRUST_POINTS.map((line) => (
                                    <Stack key={line} direction="row" spacing={1.25} alignItems="flex-start">
                                        <CheckCircleRoundedIcon fontSize="small" />
                                        <Typography variant="body2" color="text.secondary">
                                            {t(line)}
                                        </Typography>
                                    </Stack>
                                ))}
                            </Stack>
                        </CardContent>
                    </Card>
                </Container>
            </Box>

            {/* STORY / TIMELINE */}
            <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: theme.palette.background.default }}>
                <Container maxWidth="md">
                    <Stack spacing={1.25} mb={2}>
                        <Typography variant="overline" color="text.secondary">
                            {t("about.story.overline")}
                        </Typography>
                        <Typography variant="h4" fontWeight={900}>
                            {t("about.story.title")}
                        </Typography>
                    </Stack>

                    <Stack spacing={2.5}>
                        {TIMELINE.map((item) => (
                            <TimelineItem
                                key={item.year}
                                year={item.year}
                                title={t(item.titleKey)}
                                desc={t(item.descKey)}
                            />
                        ))}
                    </Stack>
                </Container>
            </Box>

            {/* TEAM / CONTACT CTA */}
            <Box sx={{ py: { xs: 6, md: 8 } }}>
                <Container maxWidth="sm">
                    <Stack spacing={1.5} textAlign="center" alignItems="center">
                        <PeopleAltRoundedIcon />
                        <Typography variant="h5" fontWeight={900}>
                            {t("about.cta.title")}
                        </Typography>
                        <Typography color="text.secondary">
                            {t("about.cta.subtitle")}
                        </Typography>

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="center" mt={1}>
                            <Button
                                component={RouterLink}
                                to="/contact"
                                variant="contained"
                                sx={{ borderRadius: 3, fontWeight: 800 }}
                            >
                                {t("about.cta.primary")}
                            </Button>
                            <Button
                                component={RouterLink}
                                to="/pricing"
                                variant="outlined"
                                sx={{
                                    borderRadius: 3,
                                    "&:hover": { borderColor: "currentColor" },
                                }}
                            >
                                {t("about.cta.secondary")}
                            </Button>
                        </Stack>
                    </Stack>
                </Container>
            </Box>

            {/* FOOTER DIVIDER */}
            <Container>
                <Divider sx={{ my: { xs: 2, md: 3 } }} />
            </Container>
        </>
    );
};

export default AboutPage;
