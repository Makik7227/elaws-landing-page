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
import { Link as RouterLink } from "react-router-dom";
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
    recommendedLabel,
    currentLabel,
}: {
    plan: Plan;
    current: boolean;
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

                </Stack>
            </CardContent>
        </Card>
    );
};

const PricingPage: React.FC = () => {
    const theme = useTheme();
    const { t } = useTranslation();
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
                    const snap = await getDoc(doc(db, "users", user.uid));
                    const tier = (snap.exists() && (snap.data().subscriptionTier as PlanId)) || "free";
                    setCurrentTier(tier);
                } else {
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
                                currentLabel={t("pricingPage.plans.currentLabel")}
                            />
                        ))}
                    </Stack>
                    <Stack alignItems="center" mt={4}>
                        <Button
                            component={RouterLink}
                            to="/signup"
                            variant="contained"
                            sx={{ borderRadius: 3, fontWeight: 800 }}
                        >
                            {t("auth.createAccount")}
                        </Button>
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

                </Container>
            </Box>
        </>
    );
};

export default PricingPage;
