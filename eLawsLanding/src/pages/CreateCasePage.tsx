import React, { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Container,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    where,
} from "firebase/firestore";
import { auth, db } from "../../firebase";
import { useTranslation } from "react-i18next";
import UpgradePromptDialog from "../components/UpgradePromptDialog";
import { canCreateCase, type Tier } from "../utils/monetization";

type ClientProfile = {
    uid: string;
    displayName: string;
    email?: string;
};

const CreateCasePage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [clients, setClients] = useState<ClientProfile[]>([]);
    const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [clientsLoading, setClientsLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLawyer, setIsLawyer] = useState(false);
    const [subscriptionTier, setSubscriptionTier] = useState<Tier>("free");
    const [upgradePromptOpen, setUpgradePromptOpen] = useState(false);
    const planLocked = !canCreateCase(subscriptionTier);

    const loadClients = useCallback(async (uid: string) => {
        setClientsLoading(true);
        setError(null);
        try {
            const friendQuery = query(collection(db, "friendships"), where("participants", "array-contains", uid));
            const friendSnap = await getDocs(friendQuery);
            const candidateIds = new Set<string>();
            friendSnap.forEach((docSnap) => {
                const data = docSnap.data() as { participants?: string[] };
                const other = data.participants?.find((p) => p !== uid);
                if (other) candidateIds.add(other);
            });
            const resolvedClients = await Promise.all(
                Array.from(candidateIds).map(async (clientId) => {
                    const userSnap = await getDoc(doc(db, "users", clientId));
                    if (!userSnap.exists()) return null;
                    const userData = userSnap.data() as Record<string, any>;
                    if (userData.role !== "client") return null;
                    const displayName = [userData.firstName, userData.lastName].filter(Boolean).join(" ").trim();
                    return {
                        uid: clientId,
                        displayName:
                            displayName ||
                            userData.username ||
                            userData.email ||
                            t("createCasePage.clients.unnamed"),
                        email: userData.email || "",
                    };
                })
            );
            setClients(resolvedClients.filter(Boolean) as ClientProfile[]);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : t("createCasePage.errors.clientsLoad"));
        } finally {
            setClientsLoading(false);
        }
    }, [t]);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (!user) {
                setIsLawyer(false);
                setLoading(false);
                setClients([]);
                setSelectedClient(null);
                return;
            }

            try {
                setLoading(true);
                const profileSnap = await getDoc(doc(db, "users", user.uid));
                if (!profileSnap.exists()) {
                    throw new Error(t("createCasePage.errors.profileIncomplete"));
                }
                const data = profileSnap.data() as Record<string, unknown>;
                const role = data.role;
                const tier = (data.subscriptionTier as Tier) ?? "free";
                setSubscriptionTier(tier);
                const isUserLawyer = role === "lawyer";
                setIsLawyer(isUserLawyer);
                if (!isUserLawyer) {
                    setClients([]);
                    setSelectedClient(null);
                    return;
                }
                await loadClients(user.uid);
            } catch (err) {
                console.error(err);
                setError(err instanceof Error ? err.message : t("createCasePage.errors.profileLoad"));
            } finally {
                setLoading(false);
            }
        });
        return () => unsub();
    }, [loadClients, t]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        if (planLocked) {
            setUpgradePromptOpen(true);
            setError(t("createCasePage.plan.locked"));
            return;
        }
        if (!currentUser || !isLawyer) {
            setError(t("createCasePage.errors.lawyerOnly"));
            return;
        }
        if (!title.trim()) {
            setError(t("createCasePage.errors.titleRequired"));
            return;
        }
        if (!selectedClient) {
            setError(t("createCasePage.errors.clientRequired"));
            return;
        }

        try {
            setSubmitting(true);
            await addDoc(collection(db, "cases"), {
                title: title.trim(),
                description: description.trim(),
                status: "open",
                lawyerId: currentUser.uid,
                clientId: selectedClient.uid,
                created_at: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            navigate("/dashboard/cases");
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : t("createCasePage.errors.createFailed"));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Container maxWidth="md" sx={{ py: 6, display: "flex", justifyContent: "center", minHeight: "50vh" }}>
                <CircularProgress />
            </Container>
        );
    }

    if (!currentUser) {
        return (
            <Container maxWidth="sm" sx={{ py: 6 }}>
                <Stack spacing={2} alignItems="center">
                    <Typography variant="h5" fontWeight={800}>
                        {t("createCasePage.auth.title")}
                    </Typography>
                    <Typography color="text.secondary" textAlign="center">
                        {t("createCasePage.auth.description")}
                    </Typography>
                    <Button variant="contained" onClick={() => navigate("/login")}>
                        {t("createCasePage.auth.cta")}
                    </Button>
                </Stack>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ py: 5 }}>
            <Stack spacing={3}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }}>
                    <Box>
                        <Typography variant="overline" color="text.secondary">
                            {t("createCasePage.breadcrumbs")}
                        </Typography>
                        <Typography variant="h4" fontWeight={800}>
                            {t("createCasePage.title")}
                        </Typography>
                    </Box>
                    <Button variant="text" onClick={() => navigate("/dashboard/cases")}>
                        {t("createCasePage.actions.back")}
                    </Button>
                </Stack>

                <Card sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                        <Stack component="form" spacing={3} onSubmit={handleSubmit}>
                            {!isLawyer && (
                                <Alert severity="warning">
                                    {t("createCasePage.errors.lawyerOnly")}
                                </Alert>
                            )}
                            {isLawyer && planLocked && (
                                <Alert
                                    severity="warning"
                                    action={
                                        <Button
                                            size="small"
                                            variant="contained"
                                            onClick={() => navigate("/dashboard/subscribe")}
                                        >
                                            {t("createCasePage.plan.cta")}
                                        </Button>
                                    }
                                >
                                    {t("createCasePage.plan.banner")}
                                </Alert>
                            )}
                            <TextField
                                label={t("createCasePage.form.titleLabel")}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                fullWidth
                                disabled={!isLawyer || planLocked}
                            />
                            <TextField
                                label={t("createCasePage.form.descriptionLabel")}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                fullWidth
                                multiline
                                minRows={4}
                                placeholder={t("createCasePage.form.descriptionPlaceholder")}
                                disabled={!isLawyer || planLocked}
                            />
                            <Autocomplete<ClientProfile, false, false, false>
                                options={clients}
                                loading={clientsLoading}
                                value={selectedClient}
                                onChange={(_, value) => setSelectedClient(value)}
                                getOptionLabel={(option) => option.displayName}
                                isOptionEqualToValue={(option, value) => option.uid === value.uid}
                                disabled={!isLawyer || planLocked}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label={t("createCasePage.form.clientLabel")}
                                        placeholder={t("createCasePage.form.clientPlaceholder")}
                                        helperText={
                                            !clients.length && !clientsLoading
                                                ? t("createCasePage.form.clientHelper")
                                                : undefined
                                        }
                                    />
                                )}
                            />
                            {error && (
                                <Alert severity="error" onClose={() => setError(null)}>
                                    {error}
                                </Alert>
                            )}
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="flex-end">
                                <Button
                                    variant="outlined"
                                    color="inherit"
                                    onClick={() => navigate("/dashboard/cases")}
                                    disabled={submitting}
                                >
                                    {t("createCasePage.actions.cancel")}
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={submitting || clientsLoading || !isLawyer}
                                    onClick={(event) => {
                                        if (planLocked) {
                                            event.preventDefault();
                                            setUpgradePromptOpen(true);
                                        }
                                    }}
                                >
                                    {planLocked
                                        ? t("createCasePage.plan.cta")
                                        : submitting
                                            ? t("createCasePage.actions.submitting")
                                            : t("createCasePage.actions.submit")}
                                </Button>
                            </Stack>
                        </Stack>
                    </CardContent>
                </Card>
            </Stack>

            {upgradePromptOpen && (
                <UpgradePromptDialog
                    open
                    onClose={() => setUpgradePromptOpen(false)}
                    title={t("createCasePage.plan.dialogTitle")}
                    description={t("createCasePage.plan.dialogDescription")}
                    requiredTier="premium"
                />
            )}
        </Container>
    );
};

export default CreateCasePage;
