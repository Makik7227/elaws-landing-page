import React, { useEffect, useState } from "react";
import {
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    CardActionArea,
    Chip,
    Container,
    Divider,
    LinearProgress,
    Skeleton,
    Stack,
    Typography,
    useTheme,
} from "@mui/material";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import LocalPoliceRoundedIcon from "@mui/icons-material/LocalPoliceRounded";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    where,
    Timestamp,
    QueryDocumentSnapshot,
} from "firebase/firestore";
import { auth, db } from "../../firebase";
import PanicButtonWeb from "../components/PanicButton.tsx";
import SubscriptionButton from "../components/SubscriptionButton.tsx";
import { useTranslation } from "react-i18next";

type Tier = "free" | "plus" | "premium";
type Role = "client" | "lawyer";

type UserDoc = {
    firstName?: string;
    lastName?: string;
    username?: string;
    country?: string;
    countryCode?: string;
    tokenLimit?: number;
    monthlyTokensUsed?: number;
    role?: Role;
    subscriptionTier?: Tier;
    pendingDowngradeTier?: Tier | null;
    pendingDowngradeDate?: number | null;
    subscriptionCancelAtPeriodEnd?: boolean | null;
    subscriptionCancelDate?: number | null;
};

type CaseDoc = {
    id: string;
    title?: string;
    status?: "open" | "closed";
    description?: string;
    updatedAt?: Timestamp | string | number;
};

type ChatMeta = {
    id: string;
    lastMessage?: string;
    lastMessageWasRead?: boolean;
    lastMessageSenderId?: string;
    lastMessageTimestamp?: Timestamp | string | number | null;
    users?: string[];
};

const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));

const Dashboard: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    const [uid, setUid] = useState<string | null>(null);
    const [user, setUser] = useState<UserDoc | null>(null);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [lastCase, setLastCase] = useState<CaseDoc | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
            if (!firebaseUser) {
                navigate("/login");
                return;
            }
            setUid(firebaseUser.uid);
        });
        return () => unsub();
    }, [navigate]);

    useEffect(() => {
        if (!uid) return;
        let unsubChats: (() => void) | null = null;

        (async () => {
            try {
                setLoading(true);
                const snap = await getDoc(doc(db, "users", uid));
                const u = (snap.exists() ? (snap.data() as UserDoc) : {}) || {};
                const merged: UserDoc = {
                    firstName: "",
                    lastName: "",
                    tokenLimit: 100000,
                    monthlyTokensUsed: 0,
                    role: "client",
                    subscriptionTier: "free",
                    pendingDowngradeTier: null,
                    pendingDowngradeDate: null,
                    subscriptionCancelAtPeriodEnd: null,
                    subscriptionCancelDate: null,
                    ...u,
                };
                setUser(merged);

                const qChats = query(
                    collection(db, "userChats"),
                    where("users", "array-contains", uid),
                    orderBy("lastMessageTimestamp", "desc"),
                    limit(20)
                );
                unsubChats = onSnapshot(qChats, (ss) => {
                    const list: ChatMeta[] = ss.docs.map((d: QueryDocumentSnapshot) => {
                        const raw = d.data() as {
                            users?: unknown;
                            lastMessage?: unknown;
                            lastMessageWasRead?: unknown;
                            lastMessageSenderId?: unknown;
                            lastMessageTimestamp?: unknown;
                        };

                        const users =
                            Array.isArray(raw.users) && raw.users.every((x) => typeof x === "string")
                                ? (raw.users as string[])
                                : [];

                        return {
                            id: d.id,
                            users,
                            lastMessage: typeof raw.lastMessage === "string" ? raw.lastMessage : undefined,
                            lastMessageWasRead:
                                typeof raw.lastMessageWasRead === "boolean" ? raw.lastMessageWasRead : false,
                            lastMessageSenderId:
                                typeof raw.lastMessageSenderId === "string" ? raw.lastMessageSenderId : undefined,
                            lastMessageTimestamp:
                                (raw.lastMessageTimestamp as Timestamp | string | number | null | undefined) ?? null,
                        };
                    });
                    const unread = list.filter(
                        (c) => c.lastMessage && c.lastMessageSenderId !== uid && !c.lastMessageWasRead
                    ).length;
                    setUnreadCount(unread);
                });

                let last: CaseDoc | null = null;
                try {
                    const q1 = query(
                        collection(db, "cases"),
                        where("lawyerId", "==", uid),
                        orderBy("created_at", "desc"),
                        limit(1)
                    );
                    const ss1 = await getDocs(q1);
                    if (!ss1.empty) {
                        const d = ss1.docs[0];
                        const raw = d.data() as Partial<CaseDoc>;
                        last = {
                            id: d.id,
                            title: typeof raw.title === "string" ? raw.title : undefined,
                            status: raw.status === "open" || raw.status === "closed" ? raw.status : undefined,
                            description: typeof raw.description === "string" ? raw.description : undefined,
                            updatedAt: raw.updatedAt,
                        };
                    }
                } catch {
                    // ignore; not all projects index this way
                }

                if (!last) {
                    try {
                        const q2 = query(
                            collection(db, "cases"),
                            where("participants", "array-contains", uid),
                            orderBy("updatedAt", "desc"),
                            limit(1)
                        );
                        const ss2 = await getDocs(q2);
                        if (!ss2.empty) {
                            const d = ss2.docs[0];
                            const raw = d.data() as Partial<CaseDoc> & { title?: string; status?: "open" | "closed" };
                            last = {
                                id: d.id,
                                title: typeof raw.title === "string" ? raw.title : undefined,
                                status: raw.status === "open" || raw.status === "closed" ? raw.status : undefined,
                                description: typeof raw.description === "string" ? raw.description : undefined,
                                updatedAt: raw.updatedAt,
                            };
                        }
                    } catch {
                        // ignore gracefully
                    }
                }

                setLastCase(last ?? null);
            } catch (e) {
                console.error("Dashboard load error:", e);
            } finally {
                setLoading(false);
            }
        })();

        return () => {
            if (unsubChats) unsubChats();
        };
    }, [uid]);

    if (!uid || !user) {
        return (
            <Container maxWidth="md" sx={{ py: 10, textAlign: "center" }}>
                <Typography variant="h6" color="text.secondary">
                    {t("dashboard.loading")}
                </Typography>
            </Container>
        );
    }

    const {
        firstName = "",
        lastName = "",
        country,
        tokenLimit = 100000,
        monthlyTokensUsed = 0,
        role = "client",
        subscriptionTier = "free",
        pendingDowngradeTier = null,
        pendingDowngradeDate = null,
        subscriptionCancelAtPeriodEnd = null,
        subscriptionCancelDate = null,
    } = user;

    const formatTierLabel = (tier: Tier | "free") => t(`dashboard.subscription.tiers.${tier}`);

    const pendingDowngradeTarget = pendingDowngradeTier ?? (subscriptionCancelAtPeriodEnd ? "free" : null);
    const pendingDowngradeLabel = pendingDowngradeTarget ? formatTierLabel(pendingDowngradeTarget) : null;
    const pendingDowngradeEffectiveDate =
        pendingDowngradeTarget === "free" ? subscriptionCancelDate : pendingDowngradeDate;
    const locale = i18n.language || undefined;
    const pendingDowngradeDateLabel = pendingDowngradeEffectiveDate
        ? new Date(pendingDowngradeEffectiveDate).toLocaleDateString(locale, {
              year: "numeric",
              month: "long",
              day: "numeric",
          })
        : null;
    const downgradeMessage =
        pendingDowngradeTarget && pendingDowngradeLabel
            ? pendingDowngradeDateLabel
                ? t("dashboard.subscription.downgrade.messageWithDate", {
                      tier: pendingDowngradeLabel,
                      date: pendingDowngradeDateLabel,
                  })
                : t("dashboard.subscription.downgrade.messageNoDate", {
                      tier: pendingDowngradeLabel,
                  })
            : null;
    const downgradeHelp = t("dashboard.subscription.downgrade.help");

    const heroName = firstName || t("dashboard.hero.anonymous");
    const heroRoleLabel = t(`dashboard.hero.roles.${role}`);
    const heroMeta = country
        ? t("dashboard.hero.metaWithCountry", {
              tier: subscriptionTier?.toUpperCase(),
              role: heroRoleLabel,
              country,
          })
        : t("dashboard.hero.meta", {
              tier: subscriptionTier?.toUpperCase(),
              role: heroRoleLabel,
          });
    const initials = ((firstName?.[0] || "") + (lastName?.[0] || "") || "U").toUpperCase();
    const tokenPct = clamp(tokenLimit ? monthlyTokensUsed / tokenLimit : 0);
    const gradient = `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 60%, ${theme.palette.primary.main} 100%)`;
    const unreadText = loading
        ? t("dashboard.info.chats.loading")
        : t("dashboard.info.chats.unread", { count: unreadCount });
    const lastCaseStatusLabel = lastCase?.status
        ? t(`casesPage.status.${lastCase.status}`)
        : t("dashboard.cases.statusUnknown");
    const lastCaseSummary = loading
        ? t("dashboard.info.lastCase.loading")
        : lastCase
            ? t("dashboard.info.lastCase.summary", {
                  title: lastCase.title ?? t("dashboard.cases.untitled"),
                  status: lastCaseStatusLabel,
              })
            : t("dashboard.info.lastCase.empty");

    return (
        <>
            {/* Hero */}
            <Box
                sx={{
                    background: gradient,
                    color: theme.palette.getContrastText(theme.palette.primary.main),
                    py: { xs: 5, md: 7 },
                }}
            >
                <Container maxWidth="lg">
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={2}
                        alignItems={{ xs: "flex-start", sm: "center" }}
                        justifyContent="space-between"
                    >
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar sx={{ bgcolor: theme.palette.secondary.main, width: 56, height: 56 }}>
                                {initials}
                            </Avatar>
                            <Box>
                                <Typography variant="h5" fontWeight={900} lineHeight={1.2}>
                                    {t("dashboard.hero.welcome", { name: heroName })}
                                </Typography>
                                <Typography sx={{ opacity: 0.9 }}>
                                    {heroMeta}
                                </Typography>
                            </Box>
                        </Stack>

                        {/* 💎 Subscription Button */}
                        <SubscriptionButton subscriptionTier={subscriptionTier} />
                    </Stack>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 } }}>
                {pendingDowngradeTarget && (
                    <Box
                        sx={{
                            mb: 3,
                            p: 2.5,
                            borderRadius: 2,
                            border: `1px solid ${theme.palette.warning.main}`,
                            backgroundColor: theme.palette.warning.main + "15",
                        }}
                    >
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={2}
                            alignItems={{ xs: "flex-start", sm: "center" }}
                            justifyContent="space-between"
                        >
                            <Box>
                                <Typography variant="subtitle2" sx={{ textTransform: "uppercase", fontWeight: 700 }}>
                                    {t("dashboard.subscription.downgrade.title")}
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                    {downgradeMessage}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {downgradeHelp}
                                </Typography>
                            </Box>
                            <Button
                                component={RouterLink}
                                to="/subscribe"
                                variant="outlined"
                                color="warning"
                                sx={{ fontWeight: 700, borderRadius: 2 }}
                            >
                                {t("dashboard.subscription.downgrade.cta")}
                            </Button>
                        </Stack>
                    </Box>
                )}
                <Stack spacing={3}>
                    {/* Usage + Panic */}
                    <Card elevation={4} sx={{ borderRadius: 3 }}>
                        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                            <Stack
                                direction={{ xs: "column", md: "row" }}
                                alignItems={{ xs: "stretch", md: "center" }}
                                justifyContent="space-between"
                                spacing={3}
                            >
                                <Box sx={{ flex: 1, minWidth: 260 }}>
                                    {loading ? (
                                        <Stack spacing={1.5}>
                                            <Skeleton variant="text" width="70%" />
                                            <Skeleton variant="rounded" height={14} />
                                        </Stack>
                                    ) : (
                                        <Stack spacing={1}>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Chip icon={<GavelRoundedIcon />} label={t("dashboard.usage.tokenLabel")} size="small" />
                                                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                                    {monthlyTokensUsed.toLocaleString()} / {tokenLimit.toLocaleString()}
                                                </Typography>
                                            </Stack>
                                            <LinearProgress
                                                variant="determinate"
                                                value={Math.round(tokenPct * 100)}
                                                sx={{
                                                    height: 10,
                                                    borderRadius: 10,
                                                    "& .MuiLinearProgress-bar": { borderRadius: 10 },
                                                }}
                                            />
                                        </Stack>
                                    )}
                                </Box>

                                <Divider flexItem orientation="vertical" sx={{ display: { xs: "none", md: "block" }, mx: 1 }} />

                                <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
                                    <Box>
                                        <Typography fontWeight={800} display="flex" alignItems="center" gap={1}>
                                            <LocalPoliceRoundedIcon /> {t("dashboard.panic.title")}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {t("dashboard.panic.subtitle")}
                                        </Typography>
                                    </Box>
                                    {loading ? (
                                        <Skeleton variant="rounded" width={220} height={48} />
                                    ) : (
                                        <PanicButtonWeb
                                            tokenLimit={user.tokenLimit || 0}
                                            defaultCode={user.countryCode || ""}
                                            tokensUsed={user.monthlyTokensUsed || 0}
                                            defaultCountry={user.country || ""}
                                        />
                                    )}
                                </Stack>
                            </Stack>
                        </CardContent>
                    </Card>

                    {/* Quick actions + Info */}
                    <Card elevation={3} sx={{ borderRadius: 3 }}>
                        {subscriptionTier !== "free" && (
                            <>
                                <CardContent sx={{ pb: 1, pt: { xs: 2.5, md: 3 } }}>
                                    <Stack
                                        direction="row"
                                        spacing={1.5}
                                        flexWrap="wrap"
                                        useFlexGap
                                        alignItems="center"
                                    >
                                        <QuickAction to="/userChats" icon={<ChatBubbleOutlineRoundedIcon />} title={t("dashboard.quickActions.chats")} />
                                        <QuickAction to="/ai/chat" icon={<GavelRoundedIcon />} title={t("dashboard.quickActions.aiChat")} />
                                        <QuickAction to="/documents/generate" icon={<DescriptionRoundedIcon />} title={t("dashboard.quickActions.createDoc")} />
                                        {role === "lawyer" && (
                                            <QuickAction to="/dashboard/cases" icon={<WorkOutlineRoundedIcon />} title={t("dashboard.quickActions.cases")} />
                                        )}
                                        <QuickAction to="procedures/saved" icon={<LocalPoliceRoundedIcon />} title={t("dashboard.quickActions.stopProcedures")} />
                                        <QuickAction to="/dashboard/notes" icon={<AutoStoriesIcon />} title={t("dashboard.quickActions.notes")} />
                                    </Stack>
                                </CardContent>

                                <CardContent sx={{ pt: 1 }}>
                                    <Stack
                                        direction="row"
                                        spacing={2}
                                        flexWrap="wrap"
                                        useFlexGap
                                        alignItems="stretch"
                                    >
                                        <InfoCard
                                            to="/userChats"
                                            icon={<ForumRoundedIcon />}
                                            title={t("dashboard.info.chats.title")}
                                            text={unreadText}
                                            actionLabel={t("dashboard.common.open")}
                                        />
                                        <InfoCard
                                            to={lastCase ? `/cases/${lastCase.id}` : "/cases"}
                                            icon={<AssignmentTurnedInRoundedIcon />}
                                            title={t("dashboard.info.lastCase.title")}
                                            text={lastCaseSummary}
                                            disabled={!lastCase}
                                            actionLabel={t("dashboard.common.open")}
                                        />
                                    </Stack>
                                </CardContent>
                            </>
                        )}

                        <CardContent sx={{ pt: subscriptionTier !== "free" ? 1 : 3 }}>
                            <Stack
                                direction="row"
                                spacing={2}
                                flexWrap="wrap"
                                useFlexGap
                                alignItems="stretch"
                                justifyContent="space-between"
                            >
                                <MenuTile to="/manage" icon={<PersonOutlineRoundedIcon />} title={t("dashboard.menu.account")} />
                                {subscriptionTier !== "free" && (
                                    <>
                                        <MenuTile to="/documents" icon={<DescriptionRoundedIcon />} title={t("dashboard.menu.documents")} />
                                        <MenuTile to="/dashboard/cases" icon={<WorkOutlineRoundedIcon />} title={t("dashboard.menu.cases")} />
                                    </>
                                )}
                            </Stack>
                        </CardContent>
                    </Card>

                    {/* Upgrade */}
                    {subscriptionTier === "free" && (
                        <Card
                            elevation={0}
                            sx={{
                                borderRadius: 3,
                                backgroundColor: theme.palette.background.default,
                            }}
                        >
                            <CardContent>
                                <Stack
                                    direction={{ xs: "column", md: "row" }}
                                    spacing={2}
                                    alignItems={{ xs: "flex-start", md: "center" }}
                                    justifyContent="space-between"
                                >
                                    <Box>
                                        <Typography variant="h6" fontWeight={900}>
                                            {t("dashboard.upgrade.title")}
                                        </Typography>
                                        <Typography color="text.secondary">
                                            {t("dashboard.upgrade.description")}
                                        </Typography>
                                    </Box>
                                    <Stack direction="row" spacing={1.25} flexWrap="wrap">
                                        <Button component={RouterLink} to="/pricing" variant="outlined" sx={{ borderRadius: 2 }}>
                                            {t("dashboard.upgrade.seePricing")}
                                        </Button>
                                        <Button component={RouterLink} to="/subscribe" variant="contained" sx={{ borderRadius: 2, fontWeight: 800 }}>
                                            {t("dashboard.upgrade.cta")}
                                        </Button>
                                    </Stack>
                                </Stack>
                            </CardContent>
                        </Card>
                    )}
                </Stack>
            </Container>
        </>
    );
};

export default Dashboard;

/* ---------- Subcomponents (unchanged logic, refined styles) ---------- */

function QuickAction({
                         to,
                         icon,
                         title,
                     }: {
    to: string;
    icon: React.ReactNode;
    title: string;
}) {
    return (
        <Button
            component={RouterLink}
            to={to}
            variant="outlined"
            startIcon={icon}
            sx={{
                borderRadius: 2,
                px: 2.5,
                py: 1.25,
                fontWeight: 700,
                textTransform: "none",
                width: { xs: "100%", sm: "auto" },
                justifyContent: { xs: "space-between", sm: "center" },
            }}
        >
            {title}
        </Button>
    );
}

function InfoCard({
                      to,
                      icon,
                      title,
                      text,
                      disabled,
                      actionLabel,
                  }: {
    to: string;
    icon: React.ReactNode;
    title: string;
    text: string;
    disabled?: boolean;
    actionLabel?: string;
}) {
    return (
        <Card
            elevation={2}
            sx={{
                borderRadius: 3,
                flex: "1 1 320px",
                width: "100%",
                minWidth: { xs: "unset", sm: 280 },
                maxWidth: { xs: "100%", md: 520 },
            }}
        >
            <CardContent>
                <Stack direction="row" spacing={1.25} alignItems="center" mb={1}>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            display: "grid",
                            placeItems: "center",
                            borderRadius: 2,
                            bgcolor: (t) =>
                                t.palette.mode === "light"
                                    ? t.palette.primary.main + "20"
                                    : t.palette.primary.main + "30",
                        }}
                    >
                        {icon}
                    </Box>
                    <Typography fontWeight={800}>{title}</Typography>
                </Stack>
                <Stack justifyContent="space-between" direction="row" alignItems="flex-end">
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                        {text}
                    </Typography>
                    <Button component={RouterLink} to={to} variant="text" disabled={disabled} sx={{ borderRadius: 2 }}>
                        {actionLabel ?? "Open"}
                    </Button>
                </Stack>
            </CardContent>
        </Card>
    );
}

function MenuTile({
                      to,
                      icon,
                      title,
                  }: {
    to: string;
    icon: React.ReactNode;
    title: string;
}) {
    return (
        <Card
            elevation={2}
            sx={{
                borderRadius: 3,
                flex: "1 1 260px",
                width: "100%",
                minWidth: { xs: "unset", sm: 220 },
                maxWidth: { xs: "100%", sm: 320 },
            }}
            component="div"
        >
            <CardActionArea component={RouterLink} to={to} sx={{ borderRadius: 3 }}>
                <CardContent sx={{ display: "grid", placeItems: "center", py: 3 }}>
                    <Box
                        sx={{
                            width: 44,
                            height: 44,
                            display: "grid",
                            placeItems: "center",
                            borderRadius: 2,
                            bgcolor: (t) =>
                                t.palette.mode === "light"
                                    ? t.palette.primary.main + "20"
                                    : t.palette.primary.main + "30",
                            mb: 1,
                        }}
                    >
                        {icon}
                    </Box>
                    <Typography fontWeight={800}>{title}</Typography>
                </CardContent>
            </CardActionArea>
        </Card>
    );
}
