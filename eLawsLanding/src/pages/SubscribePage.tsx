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
import { useTranslation } from "react-i18next";
import DashboardBackButton from "../components/DashboardBackButton.tsx";
import PageHero from "../components/PageHero";

type PlanId = "free" | "plus" | "premium";

interface Plan {
    id: PlanId;
    name: string;
    subtitle: string;
    priceLabel: string;
    priceMonthly: number;
    tokens: string;
    badge?: string;
    priceId?: string | null;
    features: string[];
    cta: string;
}

const priceIds: Record<Exclude<PlanId, "free">, string> = {
    plus: "price_1SqYQyDKm7GEuUIUq2hPdly1",
    premium: "price_1SqYRZDKm7GEuUIU1EDwvSOf",
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
    const { t, i18n } = useTranslation();
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
            if (!timestamp) return t("subscribePage.banner.when.endOfCycle");
            const date = new Date(timestamp);
            return t("subscribePage.banner.when.date", {
                date: date.toLocaleDateString(i18n.language, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                }),
            });
        };

        if (pendingDowngradeTier) {
            const planName = t(`subscribePage.plans.${pendingDowngradeTier}.name`);
            return t("subscribePage.banner.downgrade", {
                plan: planName,
                when: formatDate(pendingDowngradeDate),
            });
        }

        if (subscriptionCancelAtPeriodEnd) {
            return t("subscribePage.banner.cancelToFree", {
                when: formatDate(subscriptionCancelDate),
            });
        }

        return null;
    }, [pendingDowngradeTier, pendingDowngradeDate, subscriptionCancelAtPeriodEnd, subscriptionCancelDate, t, i18n.language]);

    const plans: Plan[] = useMemo(() => {
        return [
            {
                id: "free",
                name: t("subscribePage.plans.free.name"),
                subtitle: t("subscribePage.plans.free.subtitle"),
                priceLabel: "$0",
                priceMonthly: 0,
                tokens: t("subscribePage.plans.free.tokens"),
                features: t("subscribePage.plans.free.features", { returnObjects: true }) as string[],
                cta:
                    activePlan === "free"
                        ? t("subscribePage.cta.current", { plan: t("subscribePage.plans.free.name") })
                        : t("subscribePage.cta.downgrade", { plan: t("subscribePage.plans.free.name") }),
            },
            {
                id: "plus",
                name: t("subscribePage.plans.plus.name"),
                subtitle: t("subscribePage.plans.plus.subtitle"),
                priceLabel: "$9.99",
                priceMonthly: 9.99,
                tokens: t("subscribePage.plans.plus.tokens"),
                badge: t("subscribePage.plans.plus.badge"),
                priceId: priceIds.plus,
                features: t("subscribePage.plans.plus.features", { returnObjects: true }) as string[],
                cta:
                    activePlan === "premium"
                        ? t("subscribePage.cta.downgrade", { plan: t("subscribePage.plans.plus.name") })
                        : activePlan === "plus"
                            ? t("subscribePage.cta.current", { plan: t("subscribePage.plans.plus.name") })
                            : t("subscribePage.cta.upgrade", { plan: t("subscribePage.plans.plus.name") }),
            },
            {
                id: "premium",
                name: t("subscribePage.plans.premium.name"),
                subtitle: t("subscribePage.plans.premium.subtitle"),
                priceLabel: "$19.99",
                priceMonthly: 19.99,
                tokens: t("subscribePage.plans.premium.tokens"),
                badge: t("subscribePage.plans.premium.badge"),
                priceId: priceIds.premium,
                features: t("subscribePage.plans.premium.features", { returnObjects: true }) as string[],
                cta:
                    activePlan === "premium"
                        ? t("subscribePage.cta.current", { plan: t("subscribePage.plans.premium.name") })
                        : t("subscribePage.cta.upgrade", { plan: t("subscribePage.plans.premium.name") }),
            },
        ];
    }, [activePlan, t]);

    // 🔹 Handle subscribe, downgrade, and undo
    const handleAction = async (targetPlan: PlanId) => {
        if (!userId) return;
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            if (pendingDowngradeTier || subscriptionCancelAtPeriodEnd) {
                setError(t("subscribePage.errors.pendingDowngrade"));
                return;
            }

            if (targetPlan === activePlan) {
                setError(t("subscribePage.errors.samePlan"));
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
                    data.message || t("subscribePage.success.downgradeScheduled")
                );
                return;
            }

            if (activePlan === "plus" && targetPlan === "premium") {
                const data = await postJson<{ clientSecret?: string }>(ENDPOINTS.premiumUpgrade, { uid: userId });
                if (!data.clientSecret) {
                    throw new Error(t("subscribePage.errors.missingClientSecret"));
                }
                setPaymentDialog({
                    clientSecret: data.clientSecret,
                    planName: t("subscribePage.payment.premiumUpgrade.planName"),
                    amountLabel: t("subscribePage.payment.premiumUpgrade.amount"),
                    helperText: t("subscribePage.payment.premiumUpgrade.helper"),
                    completionMessage: t("subscribePage.payment.premiumUpgrade.success"),
                });
                return;
            }

            const plan = plans.find((p) => p.id === targetPlan);
            if (!plan?.priceId) {
                setError(t("subscribePage.errors.missingPriceId"));
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
                    planName: t("subscribePage.payment.default.planName", { plan: plan.name }),
                    amountLabel: plan.id === "free" ? plan.priceLabel : `${plan.priceLabel}/mo`,
                    helperText: t("subscribePage.payment.default.helper"),
                    completionMessage: t("subscribePage.payment.default.success"),
                });
                return;
            }

            setSuccessMessage(data.message || t("subscribePage.success.subscriptionUpdated"));
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : typeof err === "string" ? err : t("subscribePage.errors.generic");
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
            setSuccessMessage(data.message || t("subscribePage.success.undo"));
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : typeof err === "string" ? err : t("subscribePage.errors.unexpected");
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <PageHero
                title={t("subscribePage.hero.title")}
                subtitle={t("subscribePage.hero.subtitle")}
                actions={<DashboardBackButton />}
                align="center"
                variant="soft"
                maxWidth="md"
            />
            <Container maxWidth="md" sx={{ py: { xs: 5, md: 8 } }}>

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
                            {t("subscribePage.banner.undo")}
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
                                            ? t("subscribePage.cta.currentPlan")
                                            : isPending
                                                ? t("subscribePage.cta.pending")
                                                : loading
                                                    ? t("subscribePage.cta.loading")
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
        </>
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
