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

type Feature = {
    title: string;
    desc: string;
    icon: React.ReactNode;
    to?: string;
    cta?: string;
};

const FeatureCard = ({ title, desc, icon, to, cta = "Explore" }: Feature) => {
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
    const gradient = `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 60%, ${theme.palette.primary.main} 100%)`;

    const core: Feature[] = [
        {
            title: "AI Legal Chat",
            desc: "Ask jurisdiction-aware legal questions and get concise, cited guidance.",
            icon: <ChatIcon />,
            to: "/chat",
            cta: "Start chatting",
        },
        {
            title: "Generate Documents",
            desc: "Draft contracts, letters, and filings with AI, then edit and export.",
            icon: <DocIcon />,
            to: "/documents/generate",
            cta: "Create a doc",
        },
        {
            title: "Manage Cases",
            desc: "Open, track, and review your legal matters in one place.",
            icon: <CasesIcon />,
            to: "/cases",
            cta: "View cases",
        },
        {
            title: "Saved Notes",
            desc: "Capture important answers and keep them organized by topic.",
            icon: <NotesIcon />,
            to: "/notes",
            cta: "Open notes",
        },
    ];

    const more: Feature[] = [
        {
            title: "Country-specific Procedures",
            desc: "Step-by-step playbooks tailored to your country’s rules.",
            icon: <ProceduresIcon />,
            to: "/procedures/saved-procedures",
            cta: "Browse procedures",
        },
        {
            title: "Legal Topics Presets",
            desc: "Jump straight into Civil, Criminal, Business, Labor, Tax, and more.",
            icon: <GavelIcon />,
            to: "/chat", // preset selection can live in chat UI
            cta: "Choose a topic",
        },
        {
            title: "Privacy by Default",
            desc: "Your data stays yours — secure storage and strict access controls.",
            icon: <LockIcon />,
        },
        {
            title: "Fast & Reliable",
            desc: "Optimized pipeline and caching for snappy, consistent responses.",
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
                        label="Features"
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
                        Built for real-world legal work
                    </Typography>
                    <Typography sx={{ opacity: 0.95 }}>
                        From quick answers to full documents and organized cases — all in one
                        place.
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
                            Get started
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
                            Try the demo
                        </Button>
                    </Stack>
                </Container>
            </Box>

            {/* CORE FEATURES */}
            <Box sx={{ py: { xs: 6, md: 8 } }}>
                <Container>
                    <Stack spacing={1} mb={3} textAlign="center">
                        <Typography variant="overline" color="text.secondary">
                            Core
                        </Typography>
                        <Typography variant="h4" fontWeight={900}>
                            Everything you need to get moving
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
                            <FeatureCard key={f.title} {...f} />
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
                            And more
                        </Typography>
                        <Typography variant="h4" fontWeight={900}>
                            Practical details that actually matter
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
                            <FeatureCard key={f.title} {...f} />
                        ))}
                    </Stack>

                    <Stack alignItems="center" mt={6}>
                        <Button
                            component={RouterLink}
                            to="/pricing"
                            variant="contained"
                            sx={{ borderRadius: 3, fontWeight: 800 }}
                        >
                            See pricing
                        </Button>
                    </Stack>
                </Container>
            </Box>
        </>
    );
};

export default FeaturesPage;