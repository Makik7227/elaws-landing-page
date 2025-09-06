import React, { useEffect, useMemo, useState } from "react";
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
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import ChatRoundedIcon from "@mui/icons-material/ChatRounded";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {auth, db} from "../../firebase.ts";

type PlanId = "free" | "plus" | "premium";

type Plan = {
    id: PlanId;
    name: string;
    priceLabel: string;
    per?: string;
    tokens: string;
    badge?: "Best value" | "Recommended";
    features: string[];
    cta: string;
};

const PlanCard = ({
                      plan,
                      current,
                      onSelect,
                      recommended,
                  }: {
    plan: Plan;
    current: boolean;
    onSelect: () => void;
    recommended?: boolean;
}) => {
    return (
        <Card
            elevation={current ? 6 : 3}
            sx={{
                flex: "1 1 280px",
                maxWidth: 420,
                borderRadius: 3,
                position: "relative",
                outline: current ? "2px solid" : "none",
                outlineColor: current ? "primary.main" : "transparent",
                transition: "transform 200ms ease, box-shadow 200ms ease",
                "&:hover": {
                    transform: current ? "none" : "translateY(-4px)",
                    boxShadow: current ? undefined : "0 14px 40px rgba(0,0,0,.12)",
                },
            }}
        >
            {recommended && (
                <Chip
                    icon={<StarRoundedIcon />}
                    color="primary"
                    label="Recommended"
                    sx={{ position: "absolute", top: 12, right: 12, borderRadius: 2 }}
                />
            )}

            <CardContent sx={{ p: 3 }}>
                <Stack spacing={1}>
                    <Typography variant="h6" fontWeight={900}>
                        {plan.name}
                    </Typography>

                    <Stack direction="row" spacing={1} alignItems="baseline">
                        <Typography variant="h4" fontWeight={900}>
                            {current ? "Current Plan" : plan.priceLabel}
                        </Typography>
                        {!current && plan.per && (
                            <Typography variant="body2" color="text.secondary">
                                {plan.per}
                            </Typography>
                        )}
                    </Stack>

                    <Chip
                        variant="outlined"
                        icon={<BoltRoundedIcon />}
                        label={plan.tokens}
                        sx={{ alignSelf: "flex-start" }}
                    />

                    <Divider sx={{ my: 1.5 }} />

                    <Stack spacing={1.25}>
                        {plan.features.map((f) => (
                            <Stack key={f} direction="row" spacing={1.25} alignItems="flex-start">
                                <CheckCircleRoundedIcon fontSize="small" />
                                <Typography variant="body2" color="text.secondary">
                                    {f}
                                </Typography>
                            </Stack>
                        ))}
                    </Stack>

                    <Button
                        variant={current ? "outlined" : "contained"}
                        disabled={current}
                        onClick={onSelect}
                        sx={{ mt: 2, borderRadius: 2, fontWeight: 800 }}
                    >
                        {current ? "You're on this plan" : plan.cta}
                    </Button>
                </Stack>
            </CardContent>
        </Card>
    );
};

const PricingPage: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [uid, setUid] = useState<string | null>(null);
    const [currentTier, setCurrentTier] = useState<PlanId | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const gradient = useMemo(
        () =>
            `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 60%, ${theme.palette.primary.main} 100%)`,
        [theme]
    );

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            setLoading(true);
            try {
                if (user) {
                    setUid(user.uid);
                    const snap = await getDoc(doc(db, "users", user.uid));
                    const tier = (snap.exists() && (snap.data().subscriptionTier as PlanId)) || "free";
                    setCurrentTier(tier);
                } else {
                    setUid(null);
                    setCurrentTier(null);
                }
            } catch {
                // ignore errors; page still works without tier info
            } finally {
                setLoading(false);
            }
        });
        return () => unsub();
    }, []);

    const plans: Plan[] = useMemo(
        () => [
            {
                id: "free",
                name: "Free",
                priceLabel: "$0",
                tokens: "10,000 tokens / month",
                features: [
                    "AI legal chat (basic)",
                    "“Stopped by Police” quick access",
                ],
                cta: "Start for free",
            },
            {
                id: "plus",
                name: "Plus",
                priceLabel: "$9.99",
                per: "/ month",
                tokens: "100,000 tokens / month",
                badge: "Best value",
                features: [
                    "Secure document generation",
                    "Encrypted chat with your lawyer",
                    "AI legal chat (enhanced)",
                    "“Stopped by Police” quick access",
                ],
                cta: "Upgrade to Plus",
            },
            {
                id: "premium",
                name: "Premium",
                priceLabel: "$19.99",
                per: "/ month",
                tokens: "500,000 tokens / month",
                badge: "Recommended",
                features: [
                    "Everything in Plus",
                    "Encrypted chat with your clients",
                    "Case management for clients",
                    "Priority support",
                ],
                cta: "Go Premium",
            },
        ],
        []
    );

    const handleSelect = (planId: PlanId) => {
        if (!uid) {
            // not logged in → sign up first, pass intended plan
            navigate(`/signup?plan=${planId}`);
            return;
        }
        // logged in → take them to subscribe flow
        navigate(`/subscribe?plan=${planId}`);
    };

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
                        label="Pricing"
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
                        Simple, fair, and flexible
                    </Typography>
                    <Typography sx={{ opacity: 0.95, mt: 1.25 }}>
                        Pick what fits your workflow. Cancel anytime.
                    </Typography>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="center" sx={{ mt: 3 }}>
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
                            See Features
                        </Button>
                        <Button
                            component={RouterLink}
                            to={uid ? "/cases" : "/signup"}
                            variant="contained"
                            sx={{ borderRadius: 3, fontWeight: 800 }}
                        >
                            {uid ? "Open App" : "Create Account"}
                        </Button>
                    </Stack>
                </Container>
            </Box>

            {/* PLANS */}
            <Box sx={{ py: { xs: 6, md: 8 } }}>
                <Container>
                    <Stack
                        direction="row"
                        spacing={3}
                        useFlexGap
                        flexWrap="wrap"
                        justifyContent="center"
                    >
                        {plans.map((p) => (
                            <PlanCard
                                key={p.id}
                                plan={p}
                                current={!loading && currentTier === p.id}
                                recommended={p.id === "premium"}
                                onSelect={() => handleSelect(p.id)}
                            />
                        ))}
                    </Stack>
                </Container>
            </Box>

            {/* WHAT'S INCLUDED */}
            <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: theme.palette.background.default }}>
                <Container>
                    <Stack spacing={1} mb={3} textAlign="center">
                        <Typography variant="overline" color="text.secondary">
                            What’s included
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
                        {[
                            { icon: <ChatRoundedIcon />, label: "AI legal chat" },
                            { icon: <DescriptionRoundedIcon />, label: "Doc generation" },
                            { icon: <GavelRoundedIcon />, label: "Country-aware guidance" },
                            { icon: <ShieldRoundedIcon />, label: "Privacy-first security" },
                            { icon: <BoltRoundedIcon />, label: "Fast & reliable" },
                        ].map((f) => (
                            <Card
                                key={f.label}
                                elevation={2}
                                sx={{
                                    flex: "1 1 220px",
                                    maxWidth: 360,
                                    borderRadius: 3,
                                    minHeight: 120,
                                }}
                            >
                                <CardContent>
                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                        <Box
                                            sx={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: 2,
                                                display: "grid",
                                                placeItems: "center",
                                                bgcolor: (t) =>
                                                    t.palette.mode === "light"
                                                        ? t.palette.primary.main + "20"
                                                        : t.palette.primary.main + "30",
                                            }}
                                        >
                                            {f.icon}
                                        </Box>
                                        <Typography variant="subtitle1" fontWeight={800}>
                                            {f.label}
                                        </Typography>
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>

                    <Stack alignItems="center" mt={6}>
                        <Button
                            component={RouterLink}
                            to={uid ? "/subscribe" : "/signup"}
                            variant="contained"
                            sx={{ borderRadius: 3, fontWeight: 800 }}
                        >
                            {uid ? "Upgrade now" : "Create your account"}
                        </Button>
                    </Stack>
                </Container>
            </Box>
        </>
    );
};

export default PricingPage;