import React, { useEffect, useState } from "react";
import { Container, Stack, Typography, useTheme } from "@mui/material";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import LocalPoliceRoundedIcon from "@mui/icons-material/LocalPoliceRounded";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import { useNavigate } from "react-router-dom";
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
import { useTranslation } from "react-i18next";
import UpgradePromptDialog from "../components/UpgradePromptDialog.tsx";
import DashboardHero from "../components/dashboard/DashboardHero.tsx";
import DowngradeNotice from "../components/dashboard/DowngradeNotice.tsx";
import UsageAndPanicCard from "../components/dashboard/UsageAndPanicCard.tsx";
import QuickActionsSection, { type QuickActionItem } from "../components/dashboard/QuickActionsSection.tsx";
import UpgradeCallout from "../components/dashboard/UpgradeCallout.tsx";
import {
    shouldWarnAboutTokens,
    isTierAtLeast,
    type Tier,
} from "../utils/monetization.ts";
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

type UpgradePromptState = {
    title: string;
    description: string;
    requiredTier: "plus" | "premium";
    highlight?: string;
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
    const [upgradePrompt, setUpgradePrompt] = useState<UpgradePromptState | null>(null);
    const [tokenPromptShown, setTokenPromptShown] = useState(false);

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

    const {
        firstName = "",
        lastName = "",
        country,
        countryCode = "",
        tokenLimit = 100000,
        monthlyTokensUsed = 0,
        role = "client",
        subscriptionTier = "free",
        pendingDowngradeTier = null,
        pendingDowngradeDate = null,
        subscriptionCancelAtPeriodEnd = null,
        subscriptionCancelDate = null,
    } = user ?? {};

    const tokenWarning = shouldWarnAboutTokens(monthlyTokensUsed, tokenLimit);
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
    const heroCountryLabel = countryCode
        ? t(`countries.${countryCode}`, { defaultValue: country || countryCode })
        : country;
    const heroMeta = heroCountryLabel
        ? t("dashboard.hero.metaWithCountry", {
              tier: subscriptionTier?.toUpperCase(),
              role: heroRoleLabel,
              country: heroCountryLabel,
          })
        : t("dashboard.hero.meta", {
              tier: subscriptionTier?.toUpperCase(),
              role: heroRoleLabel,
          });
    const initials = ((firstName?.[0] || "") + (lastName?.[0] || "") || "U").toUpperCase();
    const tokenPct = clamp(tokenLimit ? monthlyTokensUsed / tokenLimit : 0);
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
    const lastCaseLink = lastCase ? `/cases/${lastCase.id}` : "/cases";
    const hasLastCase = Boolean(lastCase);
    const quickActionsConfig: QuickActionItem[] = [
        {
            key: "chats",
            to: "/userChats",
            icon: <ChatBubbleOutlineRoundedIcon />,
            title: t("dashboard.quickActions.chats"),
            minTier: "free",
        },
        {
            key: "aiChat",
            to: "/ai/chat",
            icon: <GavelRoundedIcon />,
            title: t("dashboard.quickActions.aiChat"),
            minTier: "free",
        },
        {
            key: "createDoc",
            to: "/documents/generate",
            icon: <DescriptionRoundedIcon />,
            title: t("dashboard.quickActions.createDoc"),
            minTier: "free",
        },
        {
            key: "cases",
            to: "/dashboard/cases",
            icon: <WorkOutlineRoundedIcon />,
            title: t("dashboard.quickActions.cases"),
            minTier: "premium",
            requiredTier: "premium",
            upgradeKey: "cases",
            lockCopyKey: "cases",
        },
        {
            key: "stopProcedures",
            to: "/dashboard/procedures/saved",
            icon: <LocalPoliceRoundedIcon />,
            title: t("dashboard.quickActions.stopProcedures"),
            minTier: "plus",
            requiredTier: "plus",
            upgradeKey: "documents",
            lockCopyKey: "procedures",
        },
        {
            key: "connections",
            to: "/connections",
            icon: <PeopleAltRoundedIcon />,
            title: t("dashboard.quickActions.connections"),
            minTier: "free",
        },
        {
            key: "notes",
            to: "/dashboard/notes",
            icon: <AutoStoriesIcon />,
            title: t("dashboard.quickActions.notes"),
            minTier: "free",
        },
    ];
    const quickActions = quickActionsConfig.map((action) => {
        const locked = !isTierAtLeast(subscriptionTier, action.minTier);
        const helper =
            locked && action.lockCopyKey
                ? t(`dashboard.quickActions.locked.${action.lockCopyKey}`)
                : undefined;
        return {
            ...action,
            locked,
            helper,
        };
    });
    const openUpgradePrompt = (key: "panic" | "cases" | "tokens" | "documents" | "notes", requiredTier: "plus" | "premium") => {
        const highlight = t(`upgradePrompt.${key}.highlight`, { defaultValue: "" });
        setUpgradePrompt({
            title: t(`upgradePrompt.${key}.title`),
            description: t(`upgradePrompt.${key}.description`),
            requiredTier,
            highlight: highlight || undefined,
        });
    };
    const closeUpgradePrompt = () => setUpgradePrompt(null);

    useEffect(() => {
        if (!tokenWarning || tokenPromptShown) return;
        const highlight = t("upgradePrompt.tokens.highlight", { defaultValue: "" });
        setUpgradePrompt({
            title: t("upgradePrompt.tokens.title"),
            description: t("upgradePrompt.tokens.description"),
            requiredTier: subscriptionTier === "free" ? "plus" : "premium",
            highlight: highlight || undefined,
        });
        setTokenPromptShown(true);
    }, [tokenWarning, tokenPromptShown, subscriptionTier, t]);

    const heroWelcome = t("dashboard.hero.welcome", { name: heroName });

    const handleQuickActionLocked = (action: QuickActionItem) => {
        if (action.locked && action.requiredTier && action.upgradeKey) {
            openUpgradePrompt(action.upgradeKey, action.requiredTier);
        }
    };

    if (!uid || !user) {
        return (
            <Container maxWidth="md" sx={{ py: 10, textAlign: "center" }}>
                <Typography variant="h6" color="text.secondary">
                    {t("dashboard.loading")}
                </Typography>
            </Container>
        );
    }

    return (
        <>
            <DashboardHero
                initials={initials}
                heroName={heroWelcome}
                heroMeta={heroMeta}
                subscriptionTier={subscriptionTier}
            />

            <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 } }}>
                <DowngradeNotice
                    show={Boolean(pendingDowngradeTarget)}
                    title={t("dashboard.subscription.downgrade.title")}
                    message={downgradeMessage}
                    help={downgradeHelp}
                    ctaLabel={t("dashboard.subscription.downgrade.cta")}
                    ctaTo="/subscribe"
                />

                <Stack spacing={3}>
                    <UsageAndPanicCard
                        loading={loading}
                        monthlyTokensUsed={monthlyTokensUsed}
                        tokenLimit={tokenLimit}
                        tokenPct={tokenPct}
                        tokenLabel={t("dashboard.usage.tokenLabel")}
                        tokenWarning={tokenWarning}
                        warningCopy={t("dashboard.usage.warningCopy")}
                        warningCtaLabel={t("dashboard.usage.warningCta")}
                        warningCtaTo="/dashboard/subscribe"
                        panicTitle={t("dashboard.panic.title")}
                        panicSubtitle={t("dashboard.panic.subtitle")}
                        country={country}
                        countryCode={countryCode}
                        subscriptionTier={subscriptionTier}
                        userId={uid}
                        onLockedAttempt={() => openUpgradePrompt("panic", "plus")}
                    />

                    <QuickActionsSection
                        quickActions={quickActions}
                        role={role}
                        unreadText={unreadText}
                        chatsTitle={t("dashboard.info.chats.title")}
                        chatsActionLabel={t("dashboard.common.open")}
                        lastCaseTitle={t("dashboard.info.lastCase.title")}
                        lastCaseSummary={lastCaseSummary}
                        lastCaseActionLabel={t("dashboard.common.open")}
                        lastCaseLink={lastCaseLink}
                        hasLastCase={hasLastCase}
                        subscriptionTier={subscriptionTier}
                        menuTitles={{
                            account: t("dashboard.menu.account"),
                            connections: t("dashboard.menu.connections"),
                            documents: t("dashboard.menu.documents"),
                            cases: t("dashboard.menu.cases"),
                        }}
                        onQuickActionLocked={handleQuickActionLocked}
                    />

                    {subscriptionTier === "free" && (
                        <UpgradeCallout
                            title={t("dashboard.upgrade.title")}
                            description={t("dashboard.upgrade.description")}
                            pricingLabel={t("dashboard.upgrade.seePricing")}
                            pricingLink="/dashboard/subscribe"
                        />
                    )}
                </Stack>
            </Container>

            {upgradePrompt && (
                <UpgradePromptDialog
                    open
                    onClose={closeUpgradePrompt}
                    title={upgradePrompt.title}
                    description={upgradePrompt.description}
                    requiredTier={upgradePrompt.requiredTier}
                    highlight={upgradePrompt.highlight}
                />
            )}
        </>
    );
};

export default Dashboard;
