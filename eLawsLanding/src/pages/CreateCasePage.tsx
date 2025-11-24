import { useEffect, useState } from "react";
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

type ClientProfile = {
    uid: string;
    displayName: string;
    email?: string;
};

const CreateCasePage = () => {
    const navigate = useNavigate();
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
                    throw new Error("Complete your profile before creating cases.");
                }
                const role = profileSnap.data().role;
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
                setError(err instanceof Error ? err.message : "Failed to load your profile.");
            } finally {
                setLoading(false);
            }
        });
        return () => unsub();
    }, []);

    const loadClients = async (uid: string) => {
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
                        displayName: displayName || userData.username || userData.email || "Unnamed client",
                        email: userData.email || "",
                    };
                })
            );
            setClients(resolvedClients.filter(Boolean) as ClientProfile[]);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Failed to load clients.");
        } finally {
            setClientsLoading(false);
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        if (!currentUser || !isLawyer) {
            setError("You must be logged in as a lawyer to create cases.");
            return;
        }
        if (!title.trim()) {
            setError("Please enter a case title.");
            return;
        }
        if (!selectedClient) {
            setError("Please assign the case to a client.");
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
            setError(err instanceof Error ? err.message : "Failed to create case.");
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
                        Sign in required
                    </Typography>
                    <Typography color="text.secondary" textAlign="center">
                        Please sign in to create a case.
                    </Typography>
                    <Button variant="contained" onClick={() => navigate("/login")}>
                        Go to Login
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
                            Dashboard / Cases
                        </Typography>
                        <Typography variant="h4" fontWeight={800}>
                            Create Case
                        </Typography>
                    </Box>
                    <Button variant="text" onClick={() => navigate("/dashboard/cases")}>
                        Back to Cases
                    </Button>
                </Stack>

                <Card sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                        <Stack component="form" spacing={3} onSubmit={handleSubmit}>
                            {!isLawyer && (
                                <Alert severity="warning">
                                    Only lawyers can create new cases.
                                </Alert>
                            )}
                            <TextField
                                label="Case title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                fullWidth
                                disabled={!isLawyer}
                            />
                            <TextField
                                label="Description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                fullWidth
                                multiline
                                minRows={4}
                                placeholder="Add additional context for this case..."
                                disabled={!isLawyer}
                            />
                            <Autocomplete<ClientProfile, false, false, false>
                                options={clients}
                                loading={clientsLoading}
                                value={selectedClient}
                                onChange={(_, value) => setSelectedClient(value)}
                                getOptionLabel={(option) => option.displayName}
                                isOptionEqualToValue={(option, value) => option.uid === value.uid}
                                disabled={!isLawyer}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Assign to client"
                                        placeholder="Start typing a client's name..."
                                        helperText={!clients.length && !clientsLoading ? "You need to add clients before creating a case." : undefined}
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
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={submitting || clientsLoading || !isLawyer}
                                >
                                    {submitting ? "Creating..." : "Create Case"}
                                </Button>
                            </Stack>
                        </Stack>
                    </CardContent>
                </Card>
            </Stack>
        </Container>
    );
};

export default CreateCasePage;
