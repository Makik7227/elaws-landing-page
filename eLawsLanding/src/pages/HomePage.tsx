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
import {useEffect, useState} from "react";
import {onAuthStateChanged, type User} from "firebase/auth";
import {auth} from "../../firebase.ts";

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
    { label: "Questions answered", value: "2.3M+" },
    { label: "Docs drafted", value: "640K" },
    { label: "Avg. response time", value: "6.4s" },
];

const TRUSTED_LOGOS = ["LexisLink", "NovaLegal", "Atlas Law", "CivicTech"];

const HOW_IT_WORKS = [
    { step: 1, title: "Pick country & topic", desc: "We tailor the AI context to local legislation and practice." },
    { step: 2, title: "Chat, draft, or plan", desc: "Ask follow ups, generate filings, or spin up guided procedures." },
    { step: 3, title: "Save & collaborate", desc: "Store insights, export docs, and loop in lawyers when needed." },
];

const HERO_HIGHLIGHTS = [
    { icon: <LockRoundedIcon fontSize="small" />, label: "End-to-end security" },
    { icon: <LanguageRoundedIcon fontSize="small" />, label: "Country-aware guidance" },
    { icon: <AssessmentRoundedIcon fontSize="small" />, label: "Cited answers" },
];

const FEATURE_LIST = [
    {
        icon: <GavelRoundedIcon />,
        title: "Country-specific chat",
        desc: "Ask in natural language and get answers tuned to your jurisdiction.",
    },
    {
        icon: <ChatRoundedIcon />,
        title: "Topic presets",
        desc: "Civil, criminal, business, labor, tax… jump in with curated prompts.",
    },
    {
        icon: <LockRoundedIcon />,
        title: "Privacy by default",
        desc: "Secure storage, strict access controls, and audit trails built in.",
    },
    {
        icon: <BoltRoundedIcon />,
        title: "Lightning fast",
        desc: "Optimized pipeline and caching. Answers in seconds, not minutes.",
    },
];

const WORKFLOW_POINTS = [
    {
        icon: <ChatRoundedIcon />,
        title: "Unified workspace",
        desc: "Chat, notes, cases, and procedures share the same context so nothing gets lost.",
    },
    {
        icon: <BoltRoundedIcon />,
        title: "Real-time AI",
        desc: "We stream responses, highlight citations, and let you branch threads instantly.",
    },
    {
        icon: <GavelRoundedIcon />,
        title: "Local expertise",
        desc: "Country packs bake in regulations, forms, and deadlines unique to your region.",
    },
];

const HomePage: React.FC = () => {
    const theme = useTheme();
    const [user, setUser] = useState<User | null>(null);

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
                            label="AI legal copilot"
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
                            E-Laws — legal help, on-demand.
                        </Typography>
                        <Typography
                            sx={{
                                maxWidth: 780,
                                opacity: 0.9,
                                fontSize: { xs: 16, md: 18 },
                            }}
                        >
                            Ask questions, generate documents, and chat with a legal assistant
                            tuned to your jurisdiction. Privacy-first. Built for legal teams and
                            solo founders alike.
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
                                {user ? "Go to dashboard" : "Create free account"}
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
                                    Try the Demo
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
                                            <Stack key={metric.label} spacing={0.5} alignItems={{ xs: "flex-start", sm: "center" }}>
                                                <Typography variant="h4" fontWeight={900}>
                                                    {metric.value}
                                                </Typography>
                                                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                                    {metric.label}
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
                                    key={item.label}
                                    icon={item.icon}
                                    label={item.label}
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
                            <Typography variant="body2">Trusted by modern legal teams:</Typography>
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
                            What you get
                        </Typography>
                        <Typography variant="h4" fontWeight={800}>
                            Built for real-world legal tasks
                        </Typography>
                        <Typography color="text.secondary">
                            Designed for SaaS simplicity: clear modules, instant context, and beautiful defaults.
                        </Typography>
                    </Stack>
                    <Grid container spacing={3}>
                        {FEATURE_LIST.map((feature) => (
                            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={feature.title}>
                                <FeatureCard {...feature} />
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
                                <Chip label="Workflow" color="primary" variant="outlined" sx={{ width: "fit-content" }} />
                                <Typography variant="h4" fontWeight={800}>
                                    Everything teams need—without the clunky UI.
                                </Typography>
                                <Typography color="text.secondary">
                                    We borrowed the best SaaS patterns: left-hand navigation, delightful cards, progressive disclosure, and optional dark mode. It feels like your favorite productivity suite, not old-school legal tech.
                                </Typography>
                                <Stack spacing={2}>
                                    {WORKFLOW_POINTS.map((point) => (
                                        <Stack direction="row" spacing={2} key={point.title} alignItems="flex-start">
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
                                                <Typography fontWeight={700}>{point.title}</Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {point.desc}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    ))}
                                </Stack>
                                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                                    <Button component={RouterLink} to="/features" variant="contained">
                                        Explore the product
                                    </Button>
                                    <Button component={RouterLink} to="/pricing" variant="text">
                                        View pricing →
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
                                    Live preview
                                </Typography>
                                <Stack spacing={2}>
                                    {["Draft NDA", "Labor dispute chat", "Immigration checklist"].map((title, idx) => (
                                        <Card key={title} sx={{ borderRadius: 4, borderColor: alpha(theme.palette.primary.main, 0.08) }}>
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
                                                    <Typography fontWeight={700}>{title}</Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {idx === 0 && "AI-built in 35 seconds."}
                                                        {idx === 1 && "Summaries + citations ready to share."}
                                                        {idx === 2 && "Checklist auto-adjusts to your country."}
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
                                    <Typography fontWeight={700}>Dark mode ready</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Toggle it anytime from the nav.
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
                            How it works
                        </Typography>
                        <Typography variant="h4" fontWeight={800}>
                            Three steps. Zero confusion.
                        </Typography>
                        <Typography color="text.secondary">
                            Guided flows keep complex procedures approachable. Every workspace feels familiar.
                        </Typography>
                    </Stack>

                    <Grid container spacing={3} justifyContent="center">
                        {HOW_IT_WORKS.map((step) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={step.step}>
                                <StepCard {...step} />
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
                                        Start your first case in minutes
                                    </Typography>
                                    <Typography sx={{opacity: 0.9}}>
                                        Free plan available. Upgrade anytime.
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
                                        Create account
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
                                        See pricing
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
                                Privacy
                            </Typography>
                            <Typography
                                component={RouterLink}
                                to="/terms"
                                color="text.secondary"
                                variant="body2"
                                sx={{ "&:hover": { color: "text.primary" } }}
                            >
                                Terms
                            </Typography>
                            <Typography
                                component={RouterLink}
                                to="/contact"
                                color="text.secondary"
                                variant="body2"
                                sx={{ "&:hover": { color: "text.primary" } }}
                            >
                                Contact
                            </Typography>
                        </Stack>
                    </Stack>
                </Container>
            </Box>
        </>
    );
};

export default HomePage;
