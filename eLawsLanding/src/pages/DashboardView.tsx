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
import AiChatWidget from "../components/AiChatWidget.tsx";

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
                    Loading your dashboard…
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
    } = user;

    const initials = ((firstName?.[0] || "") + (lastName?.[0] || "") || "U").toUpperCase();
    const tokenPct = clamp(tokenLimit ? monthlyTokensUsed / tokenLimit : 0);
    const gradient = `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 60%, ${theme.palette.primary.main} 100%)`;

    return (
        <>
            <Box
                sx={{
                    background: gradient,
                    color: theme.palette.getContrastText(theme.palette.primary.main),
                    py: { xs: 5, md: 7 },
                }}
            >
                <Container maxWidth="lg">
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: theme.palette.secondary.main, width: 56, height: 56 }}>
                            {initials}
                        </Avatar>
                        <Box>
                            <Typography variant="h5" fontWeight={900} lineHeight={1.2}>
                                Welcome, {firstName || "there"}
                            </Typography>
                            <Typography sx={{ opacity: 0.9 }}>
                                {subscriptionTier?.toUpperCase()} • {role === "lawyer" ? "Lawyer" : "Client"}
                                {country ? ` • ${country}` : ""}
                            </Typography>
                        </Box>
                    </Stack>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 } }}>
                <Stack spacing={3}>
                    <Card elevation={3} sx={{ borderRadius: 3 }}>
                        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                            <Stack
                                direction={{ xs: "column", md: "row" }}
                                gap={2.5}
                                alignItems={{ xs: "stretch", md: "center" }}
                            >
                                <Box sx={{ flex: 1, minWidth: 240 }}>
                                    <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                                        <Chip icon={<GavelRoundedIcon />} label="Monthly Tokens" size="small" />
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
                                </Box>

                                <Divider flexItem orientation="vertical" sx={{ display: { xs: "none", md: "block" } }} />

                                <Stack direction="row" spacing={1.25} alignItems="center">
                                    <LocalPoliceRoundedIcon />
                                    <Box>
                                        <Typography fontWeight={800}>Stopped by the Police</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Quick access to local guidance
                                        </Typography>
                                    </Box>
                                </Stack>
                                <PanicButtonWeb
                                tokenLimit={user.tokenLimit || 0}
                                defaultCode={user.countryCode || ""}
                                tokensUsed={user.monthlyTokensUsed || 0}
                                defaultCountry={user.country || ""}
                                />
                            </Stack>
                        </CardContent>
                    </Card>
                    <Card elevation={2} sx={{ borderRadius: 3 }}>
                        {subscriptionTier !== "free" && (
                            <>
                                <Stack direction="row" gap={2} flexWrap="wrap" useFlexGap>
                                    <QuickAction to="/userChats" icon={<ChatBubbleOutlineRoundedIcon />} title="Chats" />
                                    <QuickAction to="/documents/generate" icon={<DescriptionRoundedIcon />} title="Create Doc" />
                                    {role === "lawyer" && (
                                        <QuickAction to="/dashboard/cases" icon={<WorkOutlineRoundedIcon />} title="Cases" />
                                    )}
                                    <QuickAction to="procedures/saved" icon={<LocalPoliceRoundedIcon />} title="Stop Procedures" />
                                </Stack>
                                <Stack direction="row" gap={2} flexWrap="wrap" useFlexGap>
                                    <InfoCard
                                        to="/userChats"
                                        icon={<ForumRoundedIcon />}
                                        title="Unread chats"
                                        text={
                                            loading
                                                ? "Checking chats…"
                                                : unreadCount > 0
                                                    ? `You have ${unreadCount} unread chat${unreadCount > 1 ? "s" : ""}.`
                                                    : "No unread chats."
                                        }
                                    />
                                    <InfoCard
                                        to={lastCase ? `/cases/${lastCase.id}` : "/cases"}
                                        icon={<AssignmentTurnedInRoundedIcon />}
                                        title="Last case"
                                        text={
                                            loading
                                                ? "Loading your last case…"
                                                : lastCase
                                                    ? `${lastCase.title ?? "Untitled"} (${lastCase.status ?? "open"})`
                                                    : "No cases found."
                                        }
                                        disabled={!lastCase}
                                    />
                                </Stack>
                            </>
                        )}
                        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                            <Stack direction="row" justifyContent="space-between">
                                <MenuTile to="/manage" icon={<PersonOutlineRoundedIcon />} title="Account" />
                                {subscriptionTier !== "free" && (
                                    <>
                                        <MenuTile to="/documents" icon={<DescriptionRoundedIcon />} title="Documents" />
                                        <MenuTile to="/dashboard/cases" icon={<WorkOutlineRoundedIcon />} title="My Cases" />
                                    </>
                                )}
                            </Stack>
                        </CardContent>
                    </Card>
                    {subscriptionTier === "free" && (
                        <Card elevation={0} sx={{ borderRadius: 3, backgroundColor: theme.palette.background.default }}>
                            <CardContent>
                                <Stack
                                    direction={{ xs: "column", md: "row" }}
                                    gap={2}
                                    alignItems={{ xs: "flex-start", md: "center" }}
                                    justifyContent="space-between"
                                >
                                    <Box>
                                        <Typography variant="h6" fontWeight={900}>
                                            Unlock documents, cases and more
                                        </Typography>
                                        <Typography color="text.secondary">
                                            Upgrade to Plus or Premium for end-to-end features.
                                        </Typography>
                                    </Box>
                                    <Stack direction="row" gap={1.25}>
                                        <Button component={RouterLink} to="/pricing" variant="outlined" sx={{ borderRadius: 2 }}>
                                            See Pricing
                                        </Button>
                                        <Button component={RouterLink} to="/subscribe" variant="contained" sx={{ borderRadius: 2, fontWeight: 800 }}>
                                            Upgrade
                                        </Button>
                                    </Stack>
                                </Stack>
                            </CardContent>
                        </Card>
                    )}
                </Stack>
            </Container>
            <AiChatWidget/>
        </>
    );
};

export default Dashboard;

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
                margin: 1,
                fontWeight: 700,
                textTransform: "none",
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
                  }: {
    to: string;
    icon: React.ReactNode;
    title: string;
    text: string;
    disabled?: boolean;
}) {
    return (
        <Card elevation={2} sx={{ borderRadius: 3, flex: "1 1 280px", minWidth: 280, maxWidth: 520, marginLeft: 2 }}>
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
                                t.palette.mode === "light" ? t.palette.primary.main + "20" : t.palette.primary.main + "30",
                        }}
                    >
                        {icon}
                    </Box>
                    <Typography fontWeight={800}>{title}</Typography>
                </Stack>
                <Stack justifyContent="space-between" direction="row">
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {text}
                    </Typography>
                    <Button component={RouterLink} to={to} variant="text" disabled={disabled} sx={{ borderRadius: 2 }}>
                        Open
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
                width: "100%",
                maxWidth: 320,
                flex: "1 1 260px",
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
                                t.palette.mode === "light" ? t.palette.primary.main + "20" : t.palette.primary.main + "30",
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