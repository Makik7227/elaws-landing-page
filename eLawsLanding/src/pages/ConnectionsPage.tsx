import React, {useEffect, useMemo, useState} from "react";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    Stack,
    TextField,
    Typography,
    useTheme,
} from "@mui/material";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import {useNavigate} from "react-router-dom";
import {onAuthStateChanged} from "firebase/auth";
import {collection, doc, getDoc, onSnapshot, query, where} from "firebase/firestore";
import {auth, db} from "../../firebase";
import {findUserByIdentifier, removeConnection, sendFriendRequest} from "../api/connections";
import {useTranslation} from "react-i18next";
import PageHero from "../components/PageHero";
import DashboardBackButton from "../components/DashboardBackButton.tsx";

type Role = "client" | "lawyer";

type MessageState = {
    severity: "error" | "success";
    text: string;
};

type ConnectionEntry = {
    id: string;
    userId: string;
    name: string;
    email?: string;
    phone?: string;
};

const CONTACT_PHONE_KEYS = ["phone", "phoneNumber", "contactPhone"] as const;

const resolveContactPhone = (data: Record<string, unknown>) => {
    for (const key of CONTACT_PHONE_KEYS) {
        const value = data[key];
        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }
    }
    return undefined;
};

const getConnectionErrorText = (t: ReturnType<typeof useTranslation>["t"], error: unknown, target: string) => {
    if (error instanceof Error) {
        switch (error.message) {
            case "self":
                return t("manageAccount.connect.errors.self");
            case "already-connected":
                return t("manageAccount.connect.errors.duplicate", {target});
            case "already-requested":
                return t("manageAccount.connect.errors.pending", {target});
            default:
                return t("manageAccount.connect.errors.generic", {target});
        }
    }
    return t("manageAccount.connect.errors.generic", {target});
};

const ConnectionsPage: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const {t} = useTranslation();

    const [uid, setUid] = useState<string | null>(null);
    const [role, setRole] = useState<Role>("client");
    const [connectionIdentifier, setConnectionIdentifier] = useState("");
    const [connectionLoading, setConnectionLoading] = useState(false);
    const [connectionMessage, setConnectionMessage] = useState<MessageState | null>(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [connections, setConnections] = useState<ConnectionEntry[]>([]);
    const [connectionsLoading, setConnectionsLoading] = useState(true);
    const [connectionsError, setConnectionsError] = useState<string | null>(null);
    const [selectedConnection, setSelectedConnection] = useState<ConnectionEntry | null>(null);
    const [confirmDeleteConnection, setConfirmDeleteConnection] = useState<ConnectionEntry | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const connectionCountLabel = useMemo(
        () => t("connectionsPage.list.cta", {count: connections.length}),
        [connections.length, t]
    );

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                navigate("/login");
                return;
            }
            setUid(user.uid);
            try {
                setLoadingUser(true);
                const snap = await getDoc(doc(db, "users", user.uid));
                if (snap.exists()) {
                    const data = snap.data();
                    const fetchedRole = data.role;
                    if (fetchedRole === "lawyer" || fetchedRole === "client") {
                        setRole(fetchedRole);
                    } else {
                        setRole("client");
                    }
                }
            } catch (err) {
                console.error("Connections load error:", err);
            } finally {
                setLoadingUser(false);
            }
        });

        return () => unsub();
    }, [navigate]);

    useEffect(() => {
        if (!uid) {
            setConnections([]);
            setConnectionsLoading(false);
            return;
        }

        setConnectionsLoading(true);
        setConnectionsError(null);
        const connectionsQuery = query(
            collection(db, "friendships"),
            where("participants", "array-contains", uid)
        );
        const unsub = onSnapshot(
            connectionsQuery,
            async (snapshot) => {
                const entries: ConnectionEntry[] = [];
                for (const docSnap of snapshot.docs) {
                    const data = docSnap.data() as { participants?: string[] };
                    const participants = data.participants ?? [];
                    const otherId = participants.find((participant) => participant !== uid);
                    if (!otherId) continue;
                    const userSnap = await getDoc(doc(db, "users", otherId));
                    if (!userSnap.exists()) continue;
                    const userData = userSnap.data() as Record<string, unknown>;
                    const firstName = typeof userData.firstName === "string" ? userData.firstName : "";
                    const lastName = typeof userData.lastName === "string" ? userData.lastName : "";
                    const username = typeof userData.username === "string" ? userData.username : "";
                    const fallback = t("connectionsPage.details.unknown");
                    const displayName =
                        [firstName, lastName].filter(Boolean).join(" ").trim() || username || fallback;
                    const email =
                        typeof userData.email === "string" && userData.email.trim()
                            ? userData.email.trim()
                            : undefined;
                    const phone = resolveContactPhone(userData);
                    entries.push({
                        id: docSnap.id,
                        userId: otherId,
                        name: displayName,
                        email,
                        phone,
                    });
                }
                setConnections(entries);
                setConnectionsLoading(false);
            },
            (err) => {
                console.error("Connections load error:", err);
                setConnectionsError(t("connectionsPage.errors.loadConnections"));
                setConnectionsLoading(false);
            }
        );

        return () => unsub();
    }, [uid, t]);

    const targetRole: Role = role === "lawyer" ? "client" : "lawyer";
    const targetLabel = t(`manageAccount.role.${targetRole}`);
    const targetLabelLower = targetLabel.toLowerCase();

    const handleSendConnectionRequest = async () => {
        const trimmed = connectionIdentifier.trim();
        if (!trimmed) {
            setConnectionMessage({
                severity: "error",
                text: t("manageAccount.connect.errors.required", {target: targetLabelLower}),
            });
            return;
        }
        if (!uid) return;
        setConnectionLoading(true);
        setConnectionMessage(null);
        try {
            const target = await findUserByIdentifier(trimmed, targetRole);
            if (!target) {
                setConnectionMessage({
                    severity: "error",
                    text: t("manageAccount.connect.errors.notFound", {target: targetLabelLower}),
                });
                return;
            }
            await sendFriendRequest(target.uid);
            setConnectionMessage({
                severity: "success",
                text: t("manageAccount.connect.success", {target: targetLabel}),
            });
            setConnectionIdentifier("");
        } catch (err) {
            setConnectionMessage({
                severity: "error",
                text: getConnectionErrorText(t, err, targetLabelLower),
            });
        } finally {
            setConnectionLoading(false);
        }
    };

    const handleConfirmDelete = async () => {
        const target = confirmDeleteConnection;
        if (!target) return;
        setDeleteLoading(true);
        try {
            await removeConnection(target.id);
            setConnectionMessage({
                severity: "success",
                text: t("connectionsPage.success.removed", {name: target.name}),
            });
        } catch (err) {
            console.error("Failed to remove connection:", err);
            setConnectionMessage({
                severity: "error",
                text: t("connectionsPage.errors.removeFailed"),
            });
        } finally {
            setDeleteLoading(false);
            setConfirmDeleteConnection(null);
        }
    };

    const deleteTarget = confirmDeleteConnection;

    return (
        <>
            <PageHero
                title={t("connectionsPage.hero.title")}
                subtitle={t("connectionsPage.hero.subtitle")}
                icon={
                    <Avatar sx={{bgcolor: theme.palette.secondary.main, width: 36, height: 36}}>
                        <LinkRoundedIcon />
                    </Avatar>
                }
                actions={<DashboardBackButton />}
                variant="soft"
                maxWidth="md"
            />
            <Container maxWidth="md" sx={{py: {xs: 5, md: 6}}}>
                <Stack spacing={3}>
                    <Typography variant="body2" color="text.secondary">
                        {t("connectionsPage.hero.description")}
                    </Typography>
                    <Card elevation={3} sx={{borderRadius: 3}}>
                        <CardContent sx={{p: {xs: 3, md: 4}}}>
                            <Stack spacing={2}>
                                <Stack direction="row" spacing={1.25} alignItems="center">
                                    <Avatar sx={{bgcolor: theme.palette.secondary.main, width: 32, height: 32}}>
                                        <LinkRoundedIcon />
                                    </Avatar>
                                    <Typography variant="h6" fontWeight={800}>
                                        {t("manageAccount.connect.title", {target: targetLabel})}
                                    </Typography>
                                </Stack>
                                <Typography variant="body2" color="text.secondary">
                                    {t("manageAccount.connect.description", {target: targetLabel})}
                                </Typography>
                                {loadingUser ? (
                                    <Stack alignItems="center" justifyContent="center" sx={{py: 4}}>
                                        <CircularProgress />
                                    </Stack>
                                ) : (
                                    <>
                                        <TextField
                                            label={t("manageAccount.connect.inputLabel", {target: targetLabel})}
                                            placeholder={t("manageAccount.connect.inputPlaceholder", {
                                                target: targetLabelLower,
                                            })}
                                            value={connectionIdentifier}
                                            onChange={(event) => setConnectionIdentifier(event.target.value)}
                                            fullWidth
                                        />
                                        {connectionMessage && (
                                            <Alert severity={connectionMessage.severity} sx={{pt: 0}}>
                                                {connectionMessage.text}
                                            </Alert>
                                        )}
                                        <Button
                                            variant="contained"
                                            onClick={handleSendConnectionRequest}
                                            disabled={connectionLoading}
                                            sx={{alignSelf: "flex-start", borderRadius: 3, fontWeight: 700}}
                                        >
                                            {connectionLoading
                                                ? t("manageAccount.connect.sending")
                                                : t("manageAccount.connect.cta")}
                                        </Button>
                                    </>
                                )}
                            </Stack>
                        </CardContent>
                    </Card>

                    <Card elevation={3} sx={{borderRadius: 3}}>
                        <CardContent sx={{p: {xs: 3, md: 4}}}>
                            <Stack spacing={2}>
                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    justifyContent="space-between"
                                    spacing={2}
                                >
                                    <Typography variant="h6" fontWeight={800}>
                                        {t("connectionsPage.list.title")}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {connectionCountLabel}
                                    </Typography>
                                </Stack>
                                <Divider />
                                {connectionsLoading && (
                                    <Stack alignItems="center" sx={{py: 4}}>
                                        <CircularProgress />
                                    </Stack>
                                )}
                                {connectionsError && (
                                    <Alert severity="error">{connectionsError}</Alert>
                                )}
                                {!connectionsLoading && !connectionsError && connections.length === 0 && (
                                    <Typography color="text.secondary">
                                        {t("connectionsPage.list.empty")}
                                    </Typography>
                                )}
                                <Stack spacing={2}>
                                    {connections.map((connection) => (
                                        <Card
                                            key={connection.id}
                                            variant="outlined"
                                            sx={{borderRadius: 3}}
                                        >
                                            <CardContent sx={{p: 2}}>
                                                <Stack
                                                    direction={{xs: "column", sm: "row"}}
                                                    justifyContent="space-between"
                                                    alignItems="flex-start"
                                                    spacing={2}
                                                >
                                                    <Box>
                                                        <Typography fontWeight={700}>
                                                            {connection.name}
                                                        </Typography>
                                                        {connection.email && (
                                                            <Typography
                                                                component="a"
                                                                href={`mailto:${connection.email}`}
                                                                variant="body2"
                                                                color="primary"
                                                                sx={{display: "block"}}
                                                            >
                                                                {connection.email}
                                                            </Typography>
                                                        )}
                                                        {connection.phone && (
                                                            <Typography
                                                                component="a"
                                                                href={`tel:${connection.phone.replace(/[^0-9+]/g, "")}`}
                                                                variant="body2"
                                                                color="primary"
                                                            >
                                                                {connection.phone}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                    <Stack direction="row" spacing={1}>
                                                        <Button
                                                            size="small"
                                                            onClick={() => setSelectedConnection(connection)}
                                                        >
                                                            {t("connectionsPage.actions.details")}
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            color="error"
                                                            variant="outlined"
                                                            onClick={() => setConfirmDeleteConnection(connection)}
                                                        >
                                                            {t("connectionsPage.actions.remove")}
                                                        </Button>
                                                    </Stack>
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </Stack>
                            </Stack>
                        </CardContent>
                    </Card>

                    <Dialog
                        open={Boolean(selectedConnection)}
                        onClose={() => setSelectedConnection(null)}
                        fullWidth
                        maxWidth="sm"
                    >
                        <DialogTitle>{t("connectionsPage.modal.title")}</DialogTitle>
                        <DialogContent>
                            <Typography fontWeight={700} gutterBottom>
                                {selectedConnection?.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                {t("connectionsPage.modal.contactInfo")}
                            </Typography>
                            <Stack spacing={1}>
                                {selectedConnection?.email ? (
                                    <Typography
                                        component="a"
                                        href={`mailto:${selectedConnection.email}`}
                                        variant="body2"
                                        color="primary"
                                    >
                                        {t("connectionsPage.modal.email")}: {selectedConnection.email}
                                    </Typography>
                                ) : null}
                                {selectedConnection?.phone ? (
                                    <Typography
                                        component="a"
                                        href={`tel:${selectedConnection.phone.replace(/[^0-9+]/g, "")}`}
                                        variant="body2"
                                        color="primary"
                                    >
                                        {t("connectionsPage.modal.phone")}: {selectedConnection.phone}
                                    </Typography>
                                ) : null}
                                {!selectedConnection?.email && !selectedConnection?.phone && (
                                    <Typography variant="body2" color="text.secondary">
                                        {t("connectionsPage.modal.noContact")}
                                    </Typography>
                                )}
                            </Stack>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setSelectedConnection(null)}>
                                {t("connectionsPage.actions.close")}
                            </Button>
                            <Button
                                color="error"
                                variant="outlined"
                                onClick={() => {
                                    if (selectedConnection) {
                                        setConfirmDeleteConnection(selectedConnection);
                                    }
                                    setSelectedConnection(null);
                                }}
                            >
                                {t("connectionsPage.actions.remove")}
                            </Button>
                        </DialogActions>
                    </Dialog>

                    <Dialog
                        open={Boolean(deleteTarget)}
                        onClose={() => setConfirmDeleteConnection(null)}
                    >
                        <DialogTitle>{t("connectionsPage.confirm.title")}</DialogTitle>
                        <DialogContent>
                            <DialogContentText>
                                {t("connectionsPage.confirm.description", {
                                    name: deleteTarget?.name ?? "",
                                })}
                            </DialogContentText>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setConfirmDeleteConnection(null)}>
                                {t("connectionsPage.confirm.cancel")}
                            </Button>
                            <Button
                                color="error"
                                variant="contained"
                                onClick={handleConfirmDelete}
                                disabled={deleteLoading}
                            >
                                {t("connectionsPage.confirm.delete")}
                            </Button>
                        </DialogActions>
                    </Dialog>
                </Stack>
            </Container>
        </>
    );
};

export default ConnectionsPage;
