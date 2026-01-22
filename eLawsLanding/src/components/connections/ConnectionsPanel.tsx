import React, { useEffect, useState } from "react";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Chip,
    CircularProgress,
    Container,
    Divider,
    IconButton,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Snackbar,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
    alpha,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import PersonSearchRoundedIcon from "@mui/icons-material/PersonSearchRounded";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import MarkunreadMailboxRoundedIcon from "@mui/icons-material/MarkunreadMailboxRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import PersonRemoveRoundedIcon from "@mui/icons-material/PersonRemoveRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
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
} from "firebase/firestore";
import { auth, db } from "../../../firebase";
import {
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    sendFriendRequest,
    searchUsersByUsername,
} from "../../api/connections";
import type { FriendRequest, UserProfile } from "../../api/connections";
import { useTranslation } from "react-i18next";

type RequestWithEmail = FriendRequest & { id: string; email: string };
type SnackState = { open: boolean; message: string; severity: "success" | "error" | "info" };

type ConnectionsPanelProps = {
    variant?: "page" | "drawer";
};

const getInitials = (first?: string, last?: string, fallback?: string) => {
    const value = `${first ?? ""} ${last ?? ""}`.trim();
    if (value) {
        return value
            .split(" ")
            .map((chunk) => chunk.charAt(0))
            .join("")
            .slice(0, 2)
            .toUpperCase();
    }
    return (fallback ?? "?").slice(0, 2).toUpperCase();
};

const safeLower = (value?: string | null) => (typeof value === "string" ? value.toLowerCase() : "");

const ConnectionsPanel: React.FC<ConnectionsPanelProps> = ({ variant = "page" }) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const isDrawer = variant === "drawer";

    const [uid, setUid] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [incoming, setIncoming] = useState<RequestWithEmail[]>([]);
    const [outgoing, setOutgoing] = useState<RequestWithEmail[]>([]);
    const [friends, setFriends] = useState<UserProfile[]>([]);
    const [searchMode, setSearchMode] = useState<"username" | "email">("username");
    const [searchTerm, setSearchTerm] = useState("");
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState<UserProfile[]>([]);
    const [sending, setSending] = useState<string[]>([]);
    const [removing, setRemoving] = useState<string[]>([]);
    const [requestTab, setRequestTab] = useState<"incoming" | "outgoing">("incoming");
    const [drawerSection, setDrawerSection] = useState(0);
    const [snack, setSnack] = useState<SnackState>({ open: false, message: "", severity: "info" });

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            if (!user) {
                navigate("/login");
                return;
            }
            setUid(user.uid);
        });
        return () => unsub();
    }, [navigate]);

    useEffect(() => {
        if (!uid) return;
        setLoading(true);

        const incQuery = query(
            collection(db, "friendRequests"),
            where("to", "==", uid),
            where("status", "==", "pending")
        );
        const unsubIncoming = onSnapshot(incQuery, async (snapshot) => {
            const enriched = await Promise.all(
                snapshot.docs.map(async (docSnap) => {
                    const data = docSnap.data() as FriendRequest;
                    const userSnap = await getDoc(doc(db, "users", data.from));
                    return {
                        ...data,
                        id: docSnap.id,
                        email: (userSnap.data()?.email as string) ?? "unknown",
                    };
                })
            );
            setIncoming(enriched);
        });

        const outQuery = query(
            collection(db, "friendRequests"),
            where("from", "==", uid),
            where("status", "==", "pending")
        );
        const unsubOutgoing = onSnapshot(outQuery, async (snapshot) => {
            const enriched = await Promise.all(
                snapshot.docs.map(async (docSnap) => {
                    const data = docSnap.data() as FriendRequest;
                    const userSnap = await getDoc(doc(db, "users", data.to));
                    return {
                        ...data,
                        id: docSnap.id,
                        email: (userSnap.data()?.email as string) ?? "unknown",
                    };
                })
            );
            setOutgoing(enriched);
        });

        const friendsQuery = query(
            collection(db, "friendships"),
            where("participants", "array-contains", uid),
            orderBy("createdAt", "desc")
        );
        const unsubFriends = onSnapshot(friendsQuery, async (snapshot) => {
            const entries = await Promise.all(
                snapshot.docs.map(async (docSnap) => {
                    const data = docSnap.data() as { participants: string[] };
                    const otherUid = data.participants.find((participant) => participant !== uid);
                    if (!otherUid) return null;
                    const userSnap = await getDoc(doc(db, "users", otherUid));
                    if (!userSnap.exists()) return null;
                    const userData = userSnap.data() as Record<string, unknown>;
                    return {
                        uid: otherUid,
                        email: (userData.email as string) ?? "",
                        username: userData.username as string | undefined,
                        firstName: userData.firstName as string | undefined,
                        lastName: userData.lastName as string | undefined,
                    };
                })
            );
            setFriends(entries.filter(Boolean) as UserProfile[]);
            setLoading(false);
        });

        return () => {
            unsubIncoming();
            unsubOutgoing();
            unsubFriends();
        };
    }, [uid]);

    const isHidden = (otherUid: string) => {
        if (!uid) return false;
        if (otherUid === uid) return true;
        if (friends.some((friend) => friend.uid === otherUid)) return true;
        if (incoming.some((req) => req.from === otherUid)) return true;
        if (outgoing.some((req) => req.to === otherUid)) return true;
        return false;
    };

    useEffect(() => {
        setResults((prev) => prev.filter((profile) => !isHidden(profile.uid)));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [incoming, outgoing, friends]);

    const searchByEmail = async (raw: string): Promise<UserProfile[]> => {
        const email = raw.trim();
        if (!email) return [];
        const matches: Array<Partial<UserProfile> & { uid: string }> = [];

        const exact = await getDocs(query(collection(db, "users"), where("email", "==", email), limit(10)));
        exact.forEach((docSnap) => matches.push({ uid: docSnap.id, ...(docSnap.data() as Record<string, unknown>) }));

        const lower = await getDocs(
            query(collection(db, "users"), where("emailLower", "==", email.toLowerCase()), limit(10))
        );
        lower.forEach((docSnap) => {
            if (!matches.some((entry) => entry.uid === docSnap.id)) {
                matches.push({ uid: docSnap.id, ...(docSnap.data() as Record<string, unknown>) });
            }
        });

        const pool = await getDocs(query(collection(db, "users"), limit(50)));
        pool.forEach((docSnap) => {
            const data = docSnap.data() as Record<string, unknown>;
            const value = (data.email as string) ?? "";
            if (safeLower(value).startsWith(email.toLowerCase()) && !matches.some((entry) => entry.uid === docSnap.id)) {
                matches.push({ uid: docSnap.id, ...data });
            }
        });

        return matches.map((entry) => ({
            uid: entry.uid,
            email: (entry.email as string) ?? "",
            username: entry.username as string | undefined,
            firstName: entry.firstName as string | undefined,
            lastName: entry.lastName as string | undefined,
        }));
    };

    const handleSearch = async () => {
        const value = searchTerm.trim();
        if (!value) return;
        setSearching(true);
        try {
            let users: UserProfile[] = [];
            if (searchMode === "username") {
                const needle = value.startsWith("@") ? value : `@${value}`;
                users = await searchUsersByUsername(needle);
            } else {
                users = await searchByEmail(value);
            }
            setResults(users.filter((user) => !isHidden(user.uid)));
            if (users.length === 0) {
                setSnack({ open: true, message: t("connections.search.noResults"), severity: "info" });
            }
        } catch (err) {
            console.error("Search failed", err);
            setSnack({ open: true, message: t("connections.messages.searchFailed"), severity: "error" });
        } finally {
            setSearching(false);
        }
    };

    const handleSendRequest = async (to: string) => {
        setSending((curr) => [...curr, to]);
        try {
            await sendFriendRequest(to);
            setResults((curr) => curr.filter((profile) => profile.uid !== to));
            setSnack({ open: true, message: t("connections.messages.requestSent"), severity: "success" });
        } catch (err) {
            console.error("Failed to send request", err);
            setSnack({ open: true, message: t("connections.messages.sendFailed"), severity: "error" });
        } finally {
            setSending((curr) => curr.filter((id) => id !== to));
        }
    };

    const handleAccept = async (id: string) => {
        try {
            await acceptFriendRequest(id);
            setSnack({ open: true, message: t("connections.messages.requestAccepted"), severity: "success" });
        } catch (err) {
            console.error("Failed to accept request", err);
            setSnack({ open: true, message: t("connections.messages.acceptFailed"), severity: "error" });
        }
    };

    const handleReject = async (id: string) => {
        try {
            await rejectFriendRequest(id);
            setSnack({ open: true, message: t("connections.messages.requestRejected"), severity: "info" });
        } catch (err) {
            console.error("Failed to reject request", err);
            setSnack({ open: true, message: t("connections.messages.rejectFailed"), severity: "error" });
        }
    };

    const handleRemove = async (friendUid: string) => {
        setRemoving((curr) => [...curr, friendUid]);
        try {
            await removeFriend(friendUid);
            setSnack({ open: true, message: t("connections.messages.connectionRemoved"), severity: "success" });
        } catch (err) {
            console.error("Failed to remove connection", err);
            setSnack({ open: true, message: t("connections.messages.removeFailed"), severity: "error" });
        } finally {
            setRemoving((curr) => curr.filter((id) => id !== friendUid));
        }
    };

    const searchButton = (
        <Button
            onClick={handleSearch}
            variant="contained"
            startIcon={<SearchRoundedIcon />}
            disabled={searching}
            size={isDrawer ? "small" : "medium"}
            sx={{ borderRadius: 3, px: isDrawer ? 2 : undefined, whiteSpace: "nowrap" }}
        >
            {t("connections.search.cta")}
        </Button>
    );

    const contentPadding = isDrawer ? { px: { xs: 2, sm: 3 }, py: 3 } : { py: { xs: 4, md: 6 } };
    const stackSpacing = isDrawer ? 3 : 4;
    const listDense = isDrawer;
    const cardRadius = isDrawer ? 3 : 4;
    const headerAvatarSize = isDrawer ? 34 : 40;
    const sectionLabels = [
        t("connections.search.title"),
        t("connections.requests.title"),
        t("connections.list.title", { count: friends.length }),
    ];
    const sectionCount = sectionLabels.length;
    const activeSection = ((drawerSection % sectionCount) + sectionCount) % sectionCount;
    const goPrevSection = () => setDrawerSection((index) => (index - 1 + sectionCount) % sectionCount);
    const goNextSection = () => setDrawerSection((index) => (index + 1) % sectionCount);

    if (!uid || loading) {
        const loadingContent = (
            <>
                <CircularProgress size={24} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                    {t("connections.loading")}
                </Typography>
            </>
        );
        return (
            <>
                {isDrawer ? (
                    <Box sx={{ ...contentPadding, textAlign: "center" }}>{loadingContent}</Box>
                ) : (
                    <Container maxWidth="md" sx={{ ...contentPadding, textAlign: "center" }}>
                        {loadingContent}
                    </Container>
                )}
            </>
        );
    }

    const searchSection = (
        <Card elevation={3} sx={{ borderRadius: cardRadius }}>
                    <CardHeader
                        avatar={
                            <Avatar
                                sx={{
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    color: theme.palette.primary.main,
                                    width: headerAvatarSize,
                                    height: headerAvatarSize,
                                }}
                            >
                                <PersonSearchRoundedIcon fontSize={isDrawer ? "small" : "medium"} />
                            </Avatar>
                        }
                        title={t("connections.search.title")}
                        subheader={t("connections.search.subtitle")}
                        titleTypographyProps={{ fontWeight: 800, variant: isDrawer ? "subtitle1" : "h6" }}
                        subheaderTypographyProps={{ variant: isDrawer ? "body2" : "body1" }}
                    />
                    <CardContent>
                        <Stack spacing={2}>
                            <ToggleButtonGroup
                                exclusive
                                size="small"
                                value={searchMode}
                                onChange={(_, next) => next && setSearchMode(next)}
                            >
                                <ToggleButton value="username">{t("connections.search.username")}</ToggleButton>
                                <ToggleButton value="email">{t("connections.search.email")}</ToggleButton>
                            </ToggleButtonGroup>
                            <TextField
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                label={
                                    searchMode === "username"
                                        ? t("connections.search.usernameLabel")
                                        : t("connections.search.emailLabel")
                                }
                                placeholder={
                                    searchMode === "username"
                                        ? t("connections.search.usernamePlaceholder")
                                        : t("connections.search.emailPlaceholder")
                                }
                                fullWidth
                                InputProps={
                                    isDrawer && isMobile
                                        ? undefined
                                        : {
                                              endAdornment: searchButton,
                                          }
                                }
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        event.preventDefault();
                                        handleSearch();
                                    }
                                }}
                            />
                            {isDrawer && isMobile && searchButton}
                            {searching ? (
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <CircularProgress size={20} />
                                    <Typography variant="body2" color="text.secondary">
                                        {t("connections.search.searching")}
                                    </Typography>
                                </Stack>
                            ) : results.length === 0 ? (
                                <Typography variant="body2" color="text.secondary">
                                    {t("connections.search.helper")}
                                </Typography>
                            ) : (
                                <List sx={{ pt: 0 }} dense={listDense}>
                                    {results.map((user) => {
                                        const alreadyRequested = outgoing.some((req) => req.to === user.uid);
                                        const isSending = sending.includes(user.uid);
                                        return (
                                            <ListItem
                                                key={user.uid}
                                                secondaryAction={
                                                    <Button
                                                        variant="contained"
                                                        color="primary"
                                                        onClick={() => handleSendRequest(user.uid)}
                                                        disabled={alreadyRequested || isSending}
                                                        startIcon={<PersonAddAlt1RoundedIcon />}
                                                        size={isDrawer ? "small" : "medium"}
                                                        sx={{ borderRadius: 3 }}
                                                    >
                                                        {alreadyRequested
                                                            ? t("connections.results.requested")
                                                            : t("connections.results.request")}
                                                    </Button>
                                                }
                                            >
                                                <ListItemAvatar>
                                                    <Avatar>
                                                        {getInitials(
                                                            user.firstName,
                                                            user.lastName,
                                                            user.username ?? user.email
                                                        )}
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={
                                                        user.username ||
                                                        `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
                                                        user.email
                                                    }
                                                    secondary={user.email}
                                                />
                                            </ListItem>
                                        );
                                    })}
                                </List>
                            )}
                        </Stack>
                    </CardContent>
                </Card>
    );

    const requestsSection = (
        <Card elevation={2} sx={{ borderRadius: cardRadius }}>
                    <CardHeader
                        avatar={
                            <Avatar
                                sx={{
                                    bgcolor: alpha(theme.palette.info.main, 0.12),
                                    color: theme.palette.info.main,
                                    width: headerAvatarSize,
                                    height: headerAvatarSize,
                                }}
                            >
                                <MarkunreadMailboxRoundedIcon fontSize={isDrawer ? "small" : "medium"} />
                            </Avatar>
                        }
                        title={t("connections.requests.title")}
                        subheader={t("connections.requests.subtitle")}
                        titleTypographyProps={{ fontWeight: 800, variant: isDrawer ? "subtitle1" : "h6" }}
                        subheaderTypographyProps={{ variant: isDrawer ? "body2" : "body1" }}
                    />
                    <CardContent>
                        <ToggleButtonGroup
                            exclusive
                            size="small"
                            value={requestTab}
                            onChange={(_, next) => next && setRequestTab(next)}
                            sx={{ mb: 2 }}
                        >
                            <ToggleButton value="incoming">
                                {t("connections.requests.incoming", { count: incoming.length })}
                            </ToggleButton>
                            <ToggleButton value="outgoing">
                                {t("connections.requests.outgoing", { count: outgoing.length })}
                            </ToggleButton>
                        </ToggleButtonGroup>
                        {requestTab === "incoming" ? (
                            incoming.length === 0 ? (
                                <Typography variant="body2" color="text.secondary">
                                    {t("connections.requests.incomingEmpty")}
                                </Typography>
                            ) : (
                                <List dense={listDense}>
                                    {incoming.map((request) => (
                                        <ListItem
                                            key={request.id}
                                            secondaryAction={
                                                <Stack direction="row" spacing={1}>
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        onClick={() => handleAccept(request.id)}
                                                        sx={{ borderRadius: 3 }}
                                                    >
                                                        {t("connections.actions.accept")}
                                                    </Button>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        onClick={() => handleReject(request.id)}
                                                        sx={{ borderRadius: 3 }}
                                                    >
                                                        {t("connections.actions.reject")}
                                                    </Button>
                                                </Stack>
                                            }
                                        >
                                            <ListItemAvatar>
                                                <Avatar>
                                                    {getInitials(undefined, undefined, request.email)}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={request.email}
                                                secondary={t("connections.requests.incomingLabel")}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            )
                        ) : outgoing.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                                {t("connections.requests.outgoingEmpty")}
                            </Typography>
                        ) : (
                            <List dense={listDense}>
                                {outgoing.map((request) => (
                                    <ListItem key={request.id}>
                                        <ListItemAvatar>
                                            <Avatar>{getInitials(undefined, undefined, request.email)}</Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={request.email}
                                            secondary={t("connections.requests.outgoingLabel")}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </CardContent>
                </Card>
    );

    const listSection = (
        <Box>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                        <Avatar
                            sx={{
                                bgcolor: alpha(theme.palette.success.main, 0.15),
                                color: theme.palette.success.main,
                                width: headerAvatarSize,
                                height: headerAvatarSize,
                            }}
                        >
                            <GroupsRoundedIcon fontSize={isDrawer ? "small" : "medium"} />
                        </Avatar>
                        <Typography variant={isDrawer ? "subtitle1" : "h6"} fontWeight={700}>
                            {t("connections.list.title", { count: friends.length })}
                        </Typography>
                    </Stack>
                    <Divider sx={{ mb: 2 }} />
                    {friends.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                            {t("connections.list.empty")}
                        </Typography>
                    ) : (
                        <Stack spacing={2}>
                            {friends.map((friend) => (
                                <Card key={friend.uid} variant={isDrawer ? "outlined" : "outlined"} sx={{ borderRadius: 3 }}>
                                    <CardContent
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 2,
                                            py: isDrawer ? 1.5 : 2,
                                        }}
                                    >
                                        <Avatar sx={{ width: 46, height: 46 }}>
                                            {getInitials(
                                                friend.firstName,
                                                friend.lastName,
                                                friend.username ?? friend.email
                                            )}
                                        </Avatar>
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Typography fontWeight={700}>
                                                {`${friend.firstName ?? ""} ${friend.lastName ?? ""}`.trim() ||
                                                    friend.username ||
                                                    friend.email}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {friend.username ?? friend.email}
                                            </Typography>
                                        </Box>
                                        {!isDrawer && (
                                            <Chip
                                                size="small"
                                                label={friend.username ?? friend.email}
                                                sx={{ mr: 1, display: { xs: "none", sm: "inline-flex" } }}
                                            />
                                        )}
                                        <IconButton
                                            color="error"
                                            onClick={() => handleRemove(friend.uid)}
                                            disabled={removing.includes(friend.uid)}
                                        >
                                            <PersonRemoveRoundedIcon />
                                        </IconButton>
                                    </CardContent>
                                </Card>
                            ))}
                        </Stack>
                    )}
                </Box>
    );

    const drawerCarousel = (
        <Stack spacing={2.5}>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 2,
                    py: 1.5,
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                    backgroundColor: alpha(theme.palette.background.paper, 0.7),
                }}
            >
                <IconButton onClick={goPrevSection} size="small" aria-label={t("connections.carousel.prev")}>
                    <ChevronLeftRoundedIcon />
                </IconButton>
                <Stack spacing={0.5} alignItems="center" sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700}>
                        {sectionLabels[activeSection]}
                    </Typography>
                    <Stack direction="row" spacing={0.75}>
                        {sectionLabels.map((_, index) => (
                            <Box
                                key={index}
                                sx={{
                                    width: activeSection === index ? 20 : 8,
                                    height: 6,
                                    borderRadius: 999,
                                    backgroundColor:
                                        activeSection === index
                                            ? theme.palette.primary.main
                                            : alpha(theme.palette.text.primary, 0.2),
                                    transition: "all 0.2s ease",
                                }}
                            />
                        ))}
                    </Stack>
                </Stack>
                <IconButton onClick={goNextSection} size="small" aria-label={t("connections.carousel.next")}>
                    <ChevronRightRoundedIcon />
                </IconButton>
            </Box>
            <Box>
                {activeSection === 0 && searchSection}
                {activeSection === 1 && requestsSection}
                {activeSection === 2 && listSection}
            </Box>
        </Stack>
    );

    const panelContent = (
        <Stack spacing={stackSpacing}>
            {searchSection}
            {requestsSection}
            {listSection}
        </Stack>
    );

    return (
        <>
            {isDrawer ? (
                <Box sx={contentPadding}>{drawerCarousel}</Box>
            ) : (
                <Container maxWidth="md" sx={contentPadding}>
                    {panelContent}
                </Container>
            )}
            <Snackbar
                open={snack.open}
                autoHideDuration={2600}
                onClose={() => setSnack({ ...snack, open: false })}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })} sx={{ width: "100%" }}>
                    {snack.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default ConnectionsPanel;
