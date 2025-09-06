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

const TimelineItem = ({
                          year,
                          title,
                          desc,
                      }: {
    year: string;
    title: string;
    desc: string;
}) => (
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

const AboutPage: React.FC = () => {
    const theme = useTheme();
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
                        label="About"
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
                        Making legal help fast, clear, and accessible
                    </Typography>
                    <Typography sx={{ opacity: 0.95, mt: 1.25 }}>
                        E-Laws is your AI legal copilot — built to answer questions,
                        generate documents, and guide you through procedures with privacy by
                        default.
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
                            Our Features
                        </Button>
                        <Button
                            component={RouterLink}
                            to="/signup"
                            variant="contained"
                            sx={{ borderRadius: 3, fontWeight: 800 }}
                            startIcon={<RocketLaunchRoundedIcon />}
                        >
                            Get Started
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
                                    Our mission
                                </Typography>
                                <Typography color="text.secondary">
                                    People deserve understandable, actionable legal guidance — not
                                    endless jargon and wait times. We combine reliable AI with
                                    country-aware context to help you draft, decide, and move
                                    forward.
                                </Typography>

                                <Stack
                                    direction={{ xs: "column", sm: "row" }}
                                    spacing={2}
                                    useFlexGap
                                    flexWrap="wrap"
                                >
                                    <Pill icon={<GavelRoundedIcon fontSize="small" />} text="Jurisdiction-aware answers" />
                                    <Pill icon={<PublicRoundedIcon fontSize="small" />} text="Local procedures & presets" />
                                    <Pill icon={<ShieldRoundedIcon fontSize="small" />} text="Privacy-first by design" />
                                    <Pill icon={<BoltRoundedIcon fontSize="small" />} text="Fast and reliable responses" />
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
                    <Stat value="10k+" label="Users helped" />
                    <Stat value="30+" label="Countries supported" />
                    <Stat value="50ms" label="Avg. response prep" />
                </Stack>
            </Container>

            {/* HOW WE BUILD TRUST */}
            <Box sx={{ py: { xs: 6, md: 8 } }}>
                <Container maxWidth="md">
                    <Stack spacing={1.25} mb={2}>
                        <Typography variant="overline" color="text.secondary">
                            Trust & Safety
                        </Typography>
                        <Typography variant="h4" fontWeight={900}>
                            Designed to be dependable
                        </Typography>
                    </Stack>

                    <Card elevation={2} sx={{ borderRadius: 3 }}>
                        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                            <Stack spacing={1.25}>
                                {[
                                    "Clear citations and jurisdictional hints where relevant",
                                    "No sale of your personal data — you control exports",
                                    "Role-based access and encryption at rest",
                                    "Human-readable docs you can edit and sign",
                                ].map((line) => (
                                    <Stack key={line} direction="row" spacing={1.25} alignItems="flex-start">
                                        <CheckCircleRoundedIcon fontSize="small" />
                                        <Typography variant="body2" color="text.secondary">
                                            {line}
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
                            Our story
                        </Typography>
                        <Typography variant="h4" fontWeight={900}>
                            From idea to everyday copilot
                        </Typography>
                    </Stack>

                    <Stack spacing={2.5}>
                        <TimelineItem
                            year="2024"
                            title="Prototype"
                            desc="We shipped our first jurisdiction-aware chat with document drafting."
                        />
                        <TimelineItem
                            year="2025"
                            title="Cases & Procedures"
                            desc="Added local procedures, saved notes, and structured case management."
                        />
                        <TimelineItem
                            year="Today"
                            title="Scaling globally"
                            desc="Improving multilingual guidance, performance, and lawyer workflows."
                        />
                    </Stack>
                </Container>
            </Box>

            {/* TEAM / CONTACT CTA */}
            <Box sx={{ py: { xs: 6, md: 8 } }}>
                <Container maxWidth="sm">
                    <Stack spacing={1.5} textAlign="center" alignItems="center">
                        <PeopleAltRoundedIcon />
                        <Typography variant="h5" fontWeight={900}>
                            Want to partner or have feedback?
                        </Typography>
                        <Typography color="text.secondary">
                            We collaborate with lawyers and organizations to make legal help accessible.
                        </Typography>

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="center" mt={1}>
                            <Button
                                component={RouterLink}
                                to="/contact"
                                variant="contained"
                                sx={{ borderRadius: 3, fontWeight: 800 }}
                            >
                                Contact us
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
                                See pricing
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