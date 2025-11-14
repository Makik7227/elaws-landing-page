import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
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
import { SubscriptionPaymentDialog } from "../components/SubscriptionPaymentDialog.tsx";
import type { PaymentDialogState } from "../components/SubscriptionPaymentDialog.tsx";

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

const FUNCTIONS_BASE_URL = "https://europe-central2-e-lawyer-a3055.cloudfunctions.net";
const ENDPOINTS = {
    createSubscription: `${FUNCTIONS_BASE_URL}/createSubscription`,
    cancelSubscription: `${FUNCTIONS_BASE_URL}/cancelSubscription`,
    undoCancel: `${FUNCTIONS_BASE_URL}/undoCancelSubscription`,
    premiumUpgrade: `${FUNCTIONS_BASE_URL}/createPremiumUpgradePayment`,
};

type CloudResponse<T> = T & { error?: string };

const SubscribePage: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [userId, setUserId] = useState<string | null>(null);
    const [activePlan, setActivePlan] = useState<PlanId>("free");
    const [pendingDowngradeTier, setPendingDowngradeTier] = useState<PlanId | null>(null);
    const [pendingDowngradeDate, setPendingDowngradeDate] = useState<number | null>(null);
    const [subscriptionCancelAtPeriodEnd, setCancelAtPeriodEnd] = useState<boolean>(false);
    const [subscriptionCancelDate, setSubscriptionCancelDate] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [paymentDialog, setPaymentDialog] = useState<PaymentDialogState | null>(null);

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
                setSubscriptionCancelDate(data.subscriptionCancelDate || null);
            });
            return () => unsubUser();
        });
        return () => unsubAuth();
    }, [navigate]);

    const downgradeBanner = useMemo(() => {
        const formatDate = (timestamp: number | null) => {
            if (!timestamp) return "at the end of your billing cycle";
            const date = new Date(timestamp);
            return `on ${date.toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
            })}`;
        };

        if (pendingDowngradeTier) {
            const planName = pendingDowngradeTier.charAt(0).toUpperCase() + pendingDowngradeTier.slice(1);
            return `You've scheduled a downgrade to ${planName}. It will take effect ${formatDate(pendingDowngradeDate)}.`;
        }

        if (subscriptionCancelAtPeriodEnd) {
            return `You've scheduled a downgrade to Free. It will take effect ${formatDate(subscriptionCancelDate)}.`;
        }

        return null;
    }, [pendingDowngradeTier, pendingDowngradeDate, subscriptionCancelAtPeriodEnd, subscriptionCancelDate]);

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
        setSuccessMessage(null);

        try {
            if (pendingDowngradeTier || subscriptionCancelAtPeriodEnd) {
                setError("You already have a pending downgrade. Undo it before making more changes.");
                return;
            }

            if (targetPlan === activePlan) {
                setError("You’re already on this plan.");
                return;
            }

            if (targetPlan === "free" && activePlan !== "free") {
                const data = await postJson<{ message?: string; subscription?: { current_period_end?: number | null } }>(
                    ENDPOINTS.cancelSubscription,
                    { uid: userId }
                );
                setCancelAtPeriodEnd(true);
                const cancelAt = data.subscription?.current_period_end
                    ? data.subscription.current_period_end * 1000
                    : null;
                setSubscriptionCancelDate(cancelAt);
                setPendingDowngradeTier(null);
                setPendingDowngradeDate(null);
                setSuccessMessage(
                    data.message ||
                        "Downgrade scheduled. You’ll keep your current benefits until the billing cycle ends."
                );
                return;
            }

            if (activePlan === "plus" && targetPlan === "premium") {
                const data = await postJson<{ clientSecret?: string }>(ENDPOINTS.premiumUpgrade, { uid: userId });
                if (!data.clientSecret) {
                    throw new Error("No client secret returned for the Premium upgrade.");
                }
                setPaymentDialog({
                    clientSecret: data.clientSecret,
                    planName: "Premium upgrade",
                    amountLabel: "$10.99 upgrade fee",
                    helperText: "We’ll upgrade you to Premium automatically after the payment succeeds.",
                    completionMessage: "Upgrade paid. We’ll switch you to Premium as soon as Stripe confirms the charge.",
                });
                return;
            }

            const plan = plans.find((p) => p.id === targetPlan);
            if (!plan?.priceId) {
                setError("Missing Stripe price ID for the selected plan.");
                return;
            }

            const data = await postJson<{ clientSecret?: string; message?: string }>(
                ENDPOINTS.createSubscription,
                {
                    uid: userId,
                    priceId: plan.priceId,
                }
            );

            if (data.clientSecret) {
                setPaymentDialog({
                    clientSecret: data.clientSecret,
                    planName: `${plan.name} plan`,
                    amountLabel: plan.id === "free" ? plan.priceLabel : `${plan.priceLabel}/mo`,
                    helperText: "Complete payment to finish updating your subscription.",
                    completionMessage: "Payment confirmed. Your subscription will update shortly.",
                });
                return;
            }

            setSuccessMessage(data.message || "Subscription updated.");
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : typeof err === "string" ? err : "Something went wrong.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleUndo = async () => {
        if (!userId) return;
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const data = await postJson<{ message?: string }>(ENDPOINTS.undoCancel, { uid: userId });
            setPendingDowngradeTier(null);
            setPendingDowngradeDate(null);
            setCancelAtPeriodEnd(false);
            setSubscriptionCancelDate(null);
            setSuccessMessage(data.message || "Downgrade cancelled. You’ll stay on your current plan.");
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : typeof err === "string" ? err : "An unexpected error occurred.";
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

                {successMessage && (
                    <Alert severity="success" sx={{ mb: 3 }}>
                        {successMessage}
                    </Alert>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
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
                        const pendingPlanId = pendingDowngradeTier ?? (subscriptionCancelAtPeriodEnd ? "free" : null);
                        const isPending = pendingPlanId === plan.id;
                        const disabled = loading || !!pendingPlanId;

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
            {paymentDialog && (
                <SubscriptionPaymentDialog
                    open
                    clientSecret={paymentDialog.clientSecret}
                    planName={paymentDialog.planName}
                    amountLabel={paymentDialog.amountLabel}
                    helperText={paymentDialog.helperText}
                    completionMessage={paymentDialog.completionMessage}
                    onClose={() => setPaymentDialog(null)}
                    onSuccess={async (message) => {
                        setSuccessMessage(message);
                    }}
                />
            )}
        </Box>
    );
};

export default SubscribePage;

async function postJson<T>(url: string, payload: Record<string, unknown>) {
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const raw = await response.text();
    let data: CloudResponse<T> = {} as CloudResponse<T>;

    if (raw) {
        try {
            data = JSON.parse(raw);
        } catch {
            throw new Error(`Unexpected response format from ${url}`);
        }
    }

    if (!response.ok) {
        const message = data.error || raw || `Request failed with status ${response.status}`;
        throw new Error(message);
    }

    if (data.error) {
        throw new Error(data.error);
    }

    return data;
}
