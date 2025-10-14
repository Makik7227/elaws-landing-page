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
    useTheme,
} from "@mui/material";
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
            direction="row"
            spacing={2}
            sx={{
                p: 2.5,
                borderRadius: 2.5,
                margin: 10,
                alignItems: "flex-start",
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
            }}
        >
            <Chip label={step} color="primary" sx={{ fontWeight: 700, borderRadius: 2 }} />
            <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                    {title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {desc}
                </Typography>
            </Box>
        </Stack>
    );
};

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
                }}
            >
                <Box
                    sx={{
                        position: "absolute",
                        inset: 0,
                        opacity: theme.palette.mode === "light" ? 0.04 : 0.08,
                        background: "#000",
                    }}
                />
                <Container sx={{ position: "relative" }}>
                    <Stack spacing={3} alignItems="center" textAlign="center">
                        <Chip
                            label="AI legal copilot"
                            variant="outlined"
                            sx={{
                                color: "inherit",
                                borderColor: "currentColor",
                                bgcolor: "transparent",
                                fontWeight: 600,
                            }}
                        />
                        <Typography
                            component="h1"
                            sx={{
                                fontSize: { xs: 40, sm: 56, md: 64 },
                                fontWeight: 800,
                                letterSpacing: -0.5,
                                lineHeight: 1.05,
                            }}
                        >
                            E-Laws — legal help, on demand.
                        </Typography>
                        <Typography
                            sx={{
                                maxWidth: 820,
                                opacity: 0.9,
                                fontSize: { xs: 16, md: 18 },
                            }}
                        >
                            Ask questions, generate documents, and chat with a legal assistant
                            tailored to your country — all in one place. Privacy-first. Fast
                            as hell.
                        </Typography>

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mt={1}>
                            <Button
                                component={RouterLink}
                                to={user ? "/dashboard" : "/signup"}
                                variant="contained"
                                size="large"
                                sx={{
                                    px: 4,
                                    py: 1.2,
                                    fontWeight: 700,
                                    borderRadius: 3,
                                    boxShadow: "0 10px 24px rgba(0,0,0,.18)",
                                }}
                            >
                                {user ? "Dashboard" :"Get Started"}
                            </Button>
                            {!user &&
                                <Button
                                component={RouterLink}
                                to="/chat"
                                variant="outlined"
                                size="large"
                                sx={{
                                    px: 4,
                                    py: 1.2,
                                    fontWeight: 700,
                                    borderRadius: 3,
                                    bgcolor:
                                        theme.palette.mode === "light"
                                            ? "rgba(255,255,255,.12)"
                                            : "rgba(0,0,0,.18)",
                                    borderColor: "currentColor",
                                }}
                            >
                                Try the Demo
                            </Button>}
                        </Stack>

                        <Stack
                            direction="row"
                            spacing={2}
                            mt={4}
                            sx={{ opacity: 0.9, flexWrap: "wrap", justifyContent: "center" }}
                        >
                            <Stack direction="row" spacing={1} alignItems="center">
                                <LockRoundedIcon fontSize="small" />
                                <Typography variant="body2">End-to-end security</Typography>
                            </Stack>
                            <Divider orientation="vertical" flexItem />
                            <Stack direction="row" spacing={1} alignItems="center">
                                <LanguageRoundedIcon fontSize="small" />
                                <Typography variant="body2">Country-aware guidance</Typography>
                            </Stack>
                            <Divider orientation="vertical" flexItem />
                            <Stack direction="row" spacing={1} alignItems="center">
                                <AssessmentRoundedIcon fontSize="small" />
                                <Typography variant="body2">Clear, cited answers</Typography>
                            </Stack>
                        </Stack>
                    </Stack>
                </Container>
            </Box>

            {/* FEATURES */}
            <Box component="section" sx={{ py: { xs: 8, md: 10 } }}>
                <Container>
                    <Stack spacing={1.5} mb={4} textAlign="center">
                        <Typography variant="overline" color="text.secondary">
                            What you get
                        </Typography>
                        <Typography variant="h4" fontWeight={800}>
                            Built for real-world legal tasks
                        </Typography>
                    </Stack>
                    <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={3}
                        justifyContent="center"
                        flexWrap="wrap"
                    >
                        <Stack direction='row' sx={{ paddingBottom: 4}} spacing={2}>
                        <FeatureCard
                            icon={<GavelRoundedIcon />}
                            title="Country-specific chat"
                            desc="Ask in plain language and get answers tuned to your jurisdiction."
                        />
                        <FeatureCard
                            icon={<ChatRoundedIcon />}
                            title="Topic presets"
                            desc="Civil, criminal, business, labor, tax… jump in with one tap."
                        />
                            </Stack>
                        <Stack direction='row' spacing={2}>
                            <FeatureCard
                                icon={<LockRoundedIcon />}
                                title="Privacy by default"
                                desc="Secure storage and strict access. Your data stays yours."
                            />
                            <FeatureCard
                                icon={<BoltRoundedIcon />}
                                title="Lightning fast"
                                desc="Optimized pipeline and caching. Answers in seconds."
                            />
                        </Stack>
                    </Stack>
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
                <Container sx={{ maxWidth: '60%' }}>
                    <Stack spacing={1.5} mb={4} textAlign="center">
                        <Typography variant="overline" color="text.secondary">
                            How it works
                        </Typography>
                        <Typography variant="h4" fontWeight={800}>
                            Three steps. Simple as that.
                        </Typography>
                    </Stack>

                    <Stack
                        direction={{ xs: "column", md: "row" }}
                        justifyContent="center"
                        flexWrap="wrap"
                        spacing={2}
                    >
                        <Stack direction="row">
                            <StepCard
                                step={1}
                                title="Pick country & topic"
                                desc="We tailor context to your jurisdiction and area of law."
                            />
                            <StepCard
                                step={2}
                                title="Ask or generate"
                                desc="Chat with AI, draft documents, or create procedures."
                            />
                        </Stack>
                        <StepCard
                            step={3}
                            title="Save & share"
                            desc="Store notes, export docs, or loop in a lawyer when needed."
                        />
                    </Stack>
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