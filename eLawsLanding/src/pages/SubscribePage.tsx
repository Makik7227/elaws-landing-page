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
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { auth, db } from "../../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

type PlanId = "free" | "plus" | "premium";

interface Plan {
    id: PlanId;
    name: string;
    subtitle: string;
    priceLabel: string;
    priceMonthly: number;
    tokens: string;
    badge?: "Recommended" | "Best value";
    priceId?: string | null;
    features: string[];
    cta: string;
}

const priceIds: Record<Exclude<PlanId, "free">, string> = {
    plus: "price_1RuXEoDKm7GEuUIUu8fpazXN",
    premium: "price_1RuXXWDKm7GEuUIUHVmfrGUX",
};

const SubscribePage: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [userId, setUserId] = useState<string | null>(null);
    const [activePlan, setActivePlan] = useState<PlanId>("free");
    const [pendingDowngradeTier, setPendingDowngradeTier] = useState<PlanId | null>(null);
    const [pendingDowngradeDate, setPendingDowngradeDate] = useState<number | null>(null);
    const [subscriptionCancelAtPeriodEnd, setCancelAtPeriodEnd] = useState<boolean>(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubAuth = auth.onAuthStateChanged((user) => {
            if (!user) {
                navigate("/login");
                return;
            }
            setUserId(user.uid);
            const unsubUser = onSnapshot(doc(db, "users", user.uid), (snap) => {
                if (!snap.exists()) return;
                const data = snap.data();
                setActivePlan((data.subscriptionTier as PlanId) || "free");
                setPendingDowngradeTier((data.pendingDowngradeTier as PlanId) || null);
                setPendingDowngradeDate(data.pendingDowngradeDate || null);
                setCancelAtPeriodEnd(!!data.subscriptionCancelAtPeriodEnd);
            });
            return () => unsubUser();
        });
        return () => unsubAuth();
    }, [navigate]);

    const downgradeBanner = useMemo(() => {
        if (!pendingDowngradeTier || !pendingDowngradeDate) return null;
        const date = new Date(pendingDowngradeDate);
        const formatted = date.toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        return `You've scheduled a downgrade to ${pendingDowngradeTier.charAt(0).toUpperCase() + pendingDowngradeTier.slice(1)}. It will take effect on ${formatted}.`;
    }, [pendingDowngradeTier, pendingDowngradeDate]);

    const plans: Plan[] = useMemo(() => {
        return [
            {
                id: "free",
                name: "Free",
                subtitle: "New Account",
                priceLabel: "$0",
                priceMonthly: 0,
                tokens: "10,000 tokens / mo",
                features: [
                    "Chat with AI Law Assistant",
                    `Access to “I Was Stopped by the Police” panic button`,
                ],
                cta:
                    activePlan === "free"
                        ? "You're on Free"
                        : "Downgrade to Free",
            },
            {
                id: "plus",
                name: "Plus",
                subtitle: "Client Account",
                priceLabel: "$9.99",
                priceMonthly: 9.99,
                tokens: "100,000 tokens / mo",
                badge: "Best value",
                priceId: priceIds.plus,
                features: [
                    "Secure document generation",
                    "Encrypted chat with your lawyer",
                    "Chat with AI Law Assistant",
                    `Access to “I Was Stopped by the Police” panic button`,
                ],
                cta:
                    activePlan === "premium"
                        ? "Downgrade to Plus"
                        : activePlan === "plus"
                            ? "You're on Plus"
                            : "Upgrade to Plus",
            },
            {
                id: "premium",
                name: "Premium",
                subtitle: "Client/Lawyer Account",
                priceLabel: "$19.99",
                priceMonthly: 19.99,
                tokens: "500,000 tokens / mo",
                badge: "Recommended",
                priceId: priceIds.premium,
                features: [
                    "Secure document generation",
                    "Encrypted chat with clients",
                    "Case management with assigned clients",
                    "Chat with AI Law Assistant",
                    `Access to “I Was Stopped by the Police” panic button`,
                ],
                cta:
                    activePlan === "premium"
                        ? "You're on Premium"
                        : "Upgrade to Premium",
            },
        ];
    }, [activePlan]);

    // 🔹 Handle subscribe, downgrade, and undo
    const handleAction = async (targetPlan: PlanId) => {
        if (!userId) return;
        setLoading(true);
        setError(null);

        try {
            if (pendingDowngradeTier && subscriptionCancelAtPeriodEnd) {
                setError("You already have a pending downgrade.");
                return;
            }

            // 🔹 Downgrade / cancel
            if (targetPlan === "free" && activePlan !== "free") {
                await fetch("https://europe-central2-e-lawyer-a3055.cloudfunctions.net/cancelSubscription", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ uid: userId }),
                });
                console.log("✅ Downgrade scheduled to Free");
                return;
            }

            // 🔹 Premium → Plus downgrade
            if (activePlan === "premium" && targetPlan === "plus") {
                await fetch("https://europe-central2-e-lawyer-a3055.cloudfunctions.net/cancelSubscription", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ uid: userId }),
                });
                console.log("✅ Downgrade scheduled to Plus");
                return;
            }

            // 🔹 Upgrades
            const plan = plans.find((p) => p.id === targetPlan);
            if (!plan?.priceId) {
                setError("Missing Stripe price ID for selected plan.");
                return;
            }

            await fetch("https://europe-central2-e-lawyer-a3055.cloudfunctions.net/createSubscription", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uid: userId, priceId: plan.priceId }),
            });

            console.log("✅ Subscription upgraded");
        } catch (err: unknown) {
            let message = "Something went wrong.";

            if (err instanceof Error) {
                message = err.message;
            } else if (typeof err === "string") {
                message = err;
            }

            console.error("❌ Subscription error:", message);
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleUndo = async () => {
        if (!userId) return;
        setLoading(true);
        setError(null);
        try {
            await fetch("https://europe-central2-e-lawyer-a3055.cloudfunctions.net/undoCancelSubscription", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uid: userId }),
            });
            console.log("✅ Downgrade undone");
        } catch (err: unknown) {
            let message = "An unexpected error occurred.";

            if (err instanceof Error) {
                message = err.message;
            } else if (typeof err === "string") {
                message = err;
            }

            console.error("❌ Undo error:", message);
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: theme.palette.background.default }}>
            <Container maxWidth="md" sx={{ py: { xs: 5, md: 8 } }}>
                {/* Header */}
                <Stack spacing={1} alignItems="center" textAlign="center" mb={4}>
                    <Typography variant="h4" fontWeight={900}>
                        Manage your E-Lawyer Subscription
                    </Typography>
                    <Typography variant="subtitle1" sx={{ opacity: 0.85 }}>
                        Upgrade, downgrade, or undo changes anytime.
                    </Typography>
                </Stack>

                {/* Banner */}
                {downgradeBanner && (
                    <Box
                        sx={{
                            mb: 3,
                            p: 2,
                            borderRadius: 2,
                            bgcolor: theme.palette.warning.main + "15",
                            border: `1px solid ${theme.palette.warning.main}`,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 2,
                        }}
                    >
                        <Typography color="text.primary" sx={{ fontWeight: 600 }}>
                            {downgradeBanner}
                        </Typography>
                        <Button
                            onClick={handleUndo}
                            variant="outlined"
                            color="warning"
                            disabled={loading}
                            sx={{ borderRadius: 2, fontWeight: 700 }}
                        >
                            Undo
                        </Button>
                    </Box>
                )}

                {error && (
                    <Box
                        sx={{
                            p: 2,
                            mb: 3,
                            borderRadius: 2,
                            bgcolor: theme.palette.error.main + "15",
                            color: theme.palette.error.main,
                            textAlign: "center",
                        }}
                    >
                        {error}
                    </Box>
                )}

                {/* Plans */}
                <Stack
                    direction="row"
                    flexWrap="wrap"
                    justifyContent="center"
                    alignItems="stretch"
                    gap={3}
                >
                    {plans.map((plan) => {
                        const isActive = plan.id === activePlan;
                        const isPending =
                            pendingDowngradeTier && pendingDowngradeTier === plan.id;
                        const disabled = loading || (pendingDowngradeTier && !isPending);

                        return (
                            <Card
                                key={plan.id}
                                elevation={isActive ? 6 : 2}
                                sx={{
                                    borderRadius: 3,
                                    flex: "1 1 320px",
                                    maxWidth: 380,
                                    border: isActive
                                        ? `2px solid ${theme.palette.primary.main}`
                                        : "1px solid transparent",
                                    display: "flex",
                                    flexDirection: "column",
                                }}
                            >
                                <CardContent
                                    sx={{ flex: 1, display: "flex", flexDirection: "column" }}
                                >
                                    <Stack spacing={1.25}>
                                        <Typography variant="h5" fontWeight={900}>
                                            {plan.name}
                                        </Typography>
                                        <Typography color="text.secondary">
                                            {plan.subtitle}
                                        </Typography>
                                        <Divider />
                                        <Typography variant="h4" fontWeight={900}>
                                            {plan.priceLabel}
                                            {plan.id !== "free" && (
                                                <Typography component="span" variant="body2" ml={0.5}>
                                                    /mo
                                                </Typography>
                                            )}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {plan.tokens}
                                        </Typography>
                                        {plan.badge && (
                                            <Chip
                                                icon={<StarRoundedIcon />}
                                                label={plan.badge}
                                                color="secondary"
                                                size="small"
                                            />
                                        )}
                                        <Stack spacing={0.75} mt={1.5}>
                                            {plan.features.map((f, i) => (
                                                <Stack
                                                    direction="row"
                                                    key={i}
                                                    alignItems="center"
                                                    spacing={1}
                                                    sx={{ opacity: 0.9 }}
                                                >
                                                    <CheckCircleOutlineRoundedIcon
                                                        fontSize="small"
                                                        color="success"
                                                    />
                                                    <Typography variant="body2">{f}</Typography>
                                                </Stack>
                                            ))}
                                        </Stack>
                                    </Stack>

                                    <Box flexGrow={1} />

                                    <Button
                                        fullWidth
                                        disabled={disabled || isActive}
                                        variant={isActive ? "contained" : "outlined"}
                                        onClick={() => handleAction(plan.id)}
                                        sx={{ mt: 3, borderRadius: 2, fontWeight: 800 }}
                                    >
                                        {isActive
                                            ? "You're on this plan"
                                            : isPending
                                                ? "Downgrade scheduled"
                                                : loading
                                                    ? "Processing..."
                                                    : plan.cta}
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </Stack>
            </Container>
        </Box>
    );
};

export default SubscribePage;