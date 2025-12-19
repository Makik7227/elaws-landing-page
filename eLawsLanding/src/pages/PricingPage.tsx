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
import { auth, db } from "../../firebase.ts";
import { useTranslation } from "react-i18next";

type PlanId = "free" | "plus" | "premium";

type Plan = {
    id: PlanId;
    name: string;
    priceLabel: string;
    per?: string;
    tokens: string;
    features: string[];
};

type ButtonMeta = {
    label: string;
    disabled: boolean;
    variant: "contained" | "outlined" | "text";
    actionHref: string; // where we navigate
};

type PlanDefinition = {
    id: PlanId;
    nameKey: string;
    priceLabel: string;
    perKey?: string;
    tokensKey: string;
    featuresKeys: string[];
};

const PLAN_DEFINITIONS: PlanDefinition[] = [
    {
        id: "free",
        nameKey: "pricingPage.plans.free.name",
        priceLabel: "$0",
        tokensKey: "pricingPage.plans.free.tokens",
        featuresKeys: [
            "pricingPage.plans.free.features.chatBasic",
            "pricingPage.plans.free.features.policeShortcut",
        ],
    },
    {
        id: "plus",
        nameKey: "pricingPage.plans.plus.name",
        priceLabel: "$9.99",
        perKey: "pricingPage.plans.perMonth",
        tokensKey: "pricingPage.plans.plus.tokens",
        featuresKeys: [
            "pricingPage.plans.plus.features.documents",
            "pricingPage.plans.plus.features.encryptedChat",
            "pricingPage.plans.plus.features.chatEnhanced",
            "pricingPage.plans.plus.features.policeShortcut",
        ],
    },
    {
        id: "premium",
        nameKey: "pricingPage.plans.premium.name",
        priceLabel: "$19.99",
        perKey: "pricingPage.plans.perMonth",
        tokensKey: "pricingPage.plans.premium.tokens",
        featuresKeys: [
            "pricingPage.plans.premium.features.plusAll",
            "pricingPage.plans.premium.features.clientChat",
            "pricingPage.plans.premium.features.caseManagement",
            "pricingPage.plans.premium.features.prioritySupport",
        ],
    },
];

const INCLUDED_FEATURES = [
    { icon: <ChatRoundedIcon />, labelKey: "pricingPage.included.chat" },
    { icon: <DescriptionRoundedIcon />, labelKey: "pricingPage.included.docs" },
    { icon: <GavelRoundedIcon />, labelKey: "pricingPage.included.localGuidance" },
    { icon: <ShieldRoundedIcon />, labelKey: "pricingPage.included.security" },
    { icon: <BoltRoundedIcon />, labelKey: "pricingPage.included.speed" },
];

const PlanCard = ({
    plan,
    current,
    cta,
    recommendedLabel,
    currentLabel,
}: {
    plan: Plan;
    current: boolean;
    cta: ButtonMeta;
    recommendedLabel?: string;
    currentLabel: string;
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
            {recommendedLabel && (
                <Chip
                    icon={<StarRoundedIcon />}
                    color="primary"
                    label={recommendedLabel}
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
                            {current ? currentLabel : plan.priceLabel}
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
                        component={RouterLink}
                        to={cta.actionHref}
                        variant={cta.variant}
                        disabled={cta.disabled}
                        sx={{ mt: 2, borderRadius: 2, fontWeight: 800 }}
                    >
                        {cta.label}
                    </Button>
                </Stack>
            </CardContent>
        </Card>
    );
};

const PricingPage: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { t } = useTranslation();
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
        () =>
            PLAN_DEFINITIONS.map((plan) => ({
                id: plan.id,
                name: t(plan.nameKey),
                priceLabel: plan.priceLabel,
                per: plan.perKey ? t(plan.perKey) : undefined,
                tokens: t(plan.tokensKey),
                features: plan.featuresKeys.map((key) => t(key)),
            })),
        [t]
    );

    // compute CTA per plan based on auth + current tier
    const ctaFor = (plan: Plan): ButtonMeta => {
        // not logged in → push to signup
        if (!uid) {
            return {
                label:
                    plan.id === "free"
                        ? t("pricingPage.cta.startFree")
                        : t("pricingPage.cta.upgradeTo", { plan: plan.name }),
                disabled: false,
                variant: "contained",
                actionHref: `/signup?plan=${plan.id}`,
            };
        }

        // logged in
        if (currentTier === plan.id) {
            return {
                label: t("pricingPage.cta.currentPlan"),
                disabled: true,
                variant: "outlined",
                actionHref: "#",
            };
        }

        // switching logic
        if (currentTier === "free" && (plan.id === "plus" || plan.id === "premium")) {
            return {
                label: t("pricingPage.cta.upgradeTo", { plan: plan.name }),
                disabled: false,
                variant: "contained",
                actionHref: `/subscribe?plan=${plan.id}&action=upgrade`,
            };
        }

        if (currentTier === "plus") {
            if (plan.id === "premium") {
                // (RN app has a $10.99 one-time upgrade; keep label simple here)
                return {
                    label: t("pricingPage.cta.upgradeTo", { plan: plan.name }),
                    disabled: false,
                    variant: "contained",
                    actionHref: `/subscribe?plan=premium&action=upgrade`,
                };
            }
            if (plan.id === "free") {
                return {
                    label: t("pricingPage.cta.downgradeTo", { plan: plan.name }),
                    disabled: false,
                    variant: "outlined",
                    actionHref: `/subscribe?plan=free&action=downgrade`,
                };
            }
        }

        if (currentTier === "premium") {
            if (plan.id === "plus") {
                return {
                    label: t("pricingPage.cta.downgradeTo", { plan: plan.name }),
                    disabled: false,
                    variant: "outlined",
                    actionHref: `/subscribe?plan=plus&action=downgrade`,
                };
            }
            if (plan.id === "free") {
                return {
                    label: t("pricingPage.cta.downgradeTo", { plan: plan.name }),
                    disabled: false,
                    variant: "outlined",
                    actionHref: `/subscribe?plan=free&action=downgrade`,
                };
            }
        }

        // fallback
        return {
            label: t("pricingPage.cta.selectPlan", { plan: plan.name }),
            disabled: false,
            variant: "contained",
            actionHref: `/subscribe?plan=${plan.id}`,
        };
    };

    const handleQuickOpen = () => {
        if (!uid) navigate("/signup");
        else navigate("/cases");
    };

    return (
        <>
            <Box
                sx={{
                    height: { xs: "64px", md: "80px" },
                    background: gradient,
                }}
            />
            {/* HERO */}
            <Box
                sx={{
                    mt: { xs: -8, md: -10 },
                    background: gradient,
                    color: theme.palette.getContrastText(theme.palette.primary.main),
                    py: { xs: 8, md: 10 },
                    textAlign: "center",
                }}
            >
                <Container maxWidth="md">
                    <Chip
                        label={t("pricingPage.hero.badge")}
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
                        {t("pricingPage.hero.title")}
                    </Typography>
                    <Typography sx={{ opacity: 0.95, mt: 1.25 }}>
                        {t("pricingPage.hero.subtitle")}
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
                            {t("pricingPage.hero.secondaryCta")}
                        </Button>
                        <Button
                            onClick={handleQuickOpen}
                            variant="contained"
                            sx={{ borderRadius: 3, fontWeight: 800 }}
                        >
                            {uid ? t("pricingPage.hero.openApp") : t("auth.createAccount")}
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
                                recommendedLabel={p.id === "premium" ? t("pricingPage.plans.recommendedTag") : undefined}
                                cta={ctaFor(p)}
                                currentLabel={t("pricingPage.plans.currentLabel")}
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
                            {t("pricingPage.included.overline")}
                        </Typography>
                        <Typography variant="h4" fontWeight={900}>
                            {t("pricingPage.included.title")}
                        </Typography>
                    </Stack>

                    <Stack
                        direction="row"
                        spacing={3}
                        useFlexGap
                        flexWrap="wrap"
                        justifyContent="center"
                    >
                        {INCLUDED_FEATURES.map((f) => (
                            <Card
                                key={f.labelKey}
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
                                            {t(f.labelKey)}
                                        </Typography>
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>

                    <Stack alignItems="center" mt={6}>
                        <Button
                            component={RouterLink}
                            to={uid ? "/dashboard/subscribe" : "/signup"}
                            variant="contained"
                            sx={{ borderRadius: 3, fontWeight: 800 }}
                        >
                            {uid ? t("pricingPage.included.manageButton") : t("pricingPage.included.createAccountButton")}
                        </Button>
                    </Stack>
                </Container>
            </Box>
        </>
    );
};

export default PricingPage;
