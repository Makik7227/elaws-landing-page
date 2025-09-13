import React, { useEffect, useState } from "react";
import {
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    Divider,
    IconButton,
    Stack,
    Tab,
    Tabs,
    TextField,
    Typography,
} from "@mui/material";
import { Add, Search, Close as CloseIcon } from "@mui/icons-material";
import { auth, db } from "../../firebase";
import {
    collection,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    addDoc,
    updateDoc,
    deleteDoc,
    Timestamp, where,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import {onAuthStateChanged} from "firebase/auth";

type CaseDoc = {
    id: string;
    title?: string;
    description?: string;
    status?: "open" | "closed";
    created_at?: Timestamp;
    updatedAt?: Timestamp;
    lawyerId?: string;
    clientId?: string;
};

type NoteDoc = {
    id: string;
    text?: string;
    createdAt?: Timestamp;
    createdBy?: string;
    role?: "lawyer" | "client";
};

const CasesPage: React.FC = () => {
    const [cases, setCases] = useState<CaseDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "open" | "closed">("all");
    const [search, setSearch] = useState("");
    const [selectedCase, setSelectedCase] = useState<CaseDoc | null>(null);
    const [notes, setNotes] = useState<NoteDoc[]>([]);
    const [newNote, setNewNote] = useState("");
    const [userRole, setUserRole] = useState<"lawyer" | "client" | null>(null);

    const navigate = useNavigate();
    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, (u) => {
            if (!u) {
                setLoading(false);
                return;
            }

            const unsubRole = onSnapshot(doc(db, "users", u.uid), (snap) => {
                if (snap.exists()) setUserRole(snap.data().role);
            });

            const clientQ = query(collection(db, "cases"), where("clientId", "==", u.uid));
            const lawyerQ = query(collection(db, "cases"), where("lawyerId", "==", u.uid));

            const casesMap = new Map<string, CaseDoc>();

            const unsubClient = onSnapshot(clientQ, (ss) => {
                ss.forEach((d) => casesMap.set(d.id, { id: d.id, ...(d.data() as Partial<CaseDoc>) }));
                setCases(Array.from(casesMap.values()));
                setLoading(false);
            });

            const unsubLawyer = onSnapshot(lawyerQ, (ss) => {
                ss.forEach((d) => casesMap.set(d.id, { id: d.id, ...(d.data() as Partial<CaseDoc>) }));
                setCases(Array.from(casesMap.values()));
                setLoading(false);
            });

            return () => {
                unsubRole();
                unsubClient();
                unsubLawyer();
            };
        });

        return () => unsubAuth();
    }, []);

    // Load notes for selected case
    useEffect(() => {
        if (!selectedCase) return;
        const q = query(collection(db, "cases", selectedCase.id, "notes"), orderBy("createdAt", "asc"));
        const unsub = onSnapshot(q, (ss) => {
            setNotes(
                ss.docs.map((d) => ({ id: d.id, ...(d.data() as Partial<NoteDoc>) }))
            );
        });
        return () => unsub();
    }, [selectedCase]);

    const filteredCases = cases.filter((c) => {
        if (filter !== "all" && c.status !== filter) return false;
        if (search && !c.title?.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const handleAddNote = async () => {
        if (!selectedCase || !newNote.trim()) return;
        const u = auth.currentUser;
        if (!u || userRole !== "lawyer") return;
        await addDoc(collection(db, "cases", selectedCase.id, "notes"), {
            text: newNote.trim(),
            createdAt: serverTimestamp(),
            createdBy: u.uid,
            role: userRole,
        });
        setNewNote("");
    };

    const handleToggleStatus = async () => {
        if (!selectedCase || userRole !== "lawyer") return;
        const newStatus = selectedCase.status === "open" ? "closed" : "open";
        await updateDoc(doc(db, "cases", selectedCase.id), { status: newStatus });
        setSelectedCase({ ...selectedCase, status: newStatus });
    };

    const handleDeleteCase = async () => {
        if (!selectedCase || userRole !== "lawyer") return;
        await deleteDoc(doc(db, "cases", selectedCase.id));
        setSelectedCase(null);
    };

    return (
        <Container maxWidth="lg" sx={{ py: 5 }}>
            {/* Header */}
            <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                <Typography variant="h4" fontWeight={800}>
                    Cases
                </Typography>
                <Box flex={1} />
                {userRole === "lawyer" && (
                    <Button variant="contained" startIcon={<Add />} onClick={() => navigate("/cases/create")}>
                        New Case
                    </Button>
                )}
            </Stack>

            {/* Filters */}
            <Stack direction="row" spacing={2} mb={3}>
                <Tabs value={filter} onChange={(_, v) => setFilter(v)}>
                    <Tab value="all" label="All" />
                    <Tab value="open" label="Open" />
                    <Tab value="closed" label="Closed" />
                </Tabs>
                <TextField
                    size="small"
                    placeholder="Search…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{ startAdornment: <Search fontSize="small" /> }}
                />
            </Stack>

            <Stack direction="row" spacing={3} alignItems="flex-start">
                {/* Case list */}
                <Stack flex={1} spacing={2}>
                    {loading && <CircularProgress />}
                    {!loading && filteredCases.length === 0 && (
                        <Typography color="text.secondary">No cases found.</Typography>
                    )}
                    {filteredCases.map((c) => (
                        <Card
                            key={c.id}
                            onClick={() => setSelectedCase(c)}
                            sx={{
                                cursor: "pointer",
                                borderRadius: 3,
                                border: selectedCase?.id === c.id ? "2px solid" : "1px solid",
                                borderColor:
                                    selectedCase?.id === c.id ? "primary.main" : "divider",
                            }}
                        >
                            <CardContent>
                                <Stack direction="row" alignItems="center" spacing={2}>
                                    <Avatar>{c.title?.[0] ?? "C"}</Avatar>
                                    <Box>
                                        <Typography fontWeight={700}>{c.title}</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {c.description?.slice(0, 80) || "No description"}
                                        </Typography>
                                    </Box>
                                    <Box flex={1} />
                                    <Chip
                                        label={ c.status && c.status.toUpperCase()}
                                        color={c.status === "open" ? "success" : "default"}
                                        size="small"
                                    />
                                </Stack>
                            </CardContent>
                        </Card>
                    ))}
                </Stack>

                {/* Case detail */}
                {selectedCase && (
                    <Card sx={{ flex: 1.2, borderRadius: 3, position: "relative" }}>
                        <IconButton
                            size="small"
                            onClick={() => setSelectedCase(null)}
                            sx={{ position: "absolute", top: 8, right: 8 }}
                        >
                            <CloseIcon />
                        </IconButton>
                        <CardContent>
                            <Typography variant="h6" fontWeight={800} mb={1}>
                                {selectedCase.title}
                            </Typography>
                            <Chip
                                label={selectedCase.status && selectedCase.status.toUpperCase()}
                                color={selectedCase.status === "open" ? "success" : "default"}
                                size="small"
                                sx={{ mb: 2 }}
                            />
                            <Typography mb={2}>
                                {selectedCase.description || "No description"}
                            </Typography>

                            {userRole === "lawyer" && (
                                <Stack direction="row" spacing={1} mb={2}>
                                    <Button onClick={handleToggleStatus} variant="outlined">
                                        {selectedCase.status === "open" ? "Close Case" : "Reopen Case"}
                                    </Button>
                                    <Button
                                        onClick={handleDeleteCase}
                                        variant="outlined"
                                        color="error"
                                    >
                                        Delete
                                    </Button>
                                </Stack>
                            )}

                            <Divider sx={{ my: 2 }} />
                            <Typography fontWeight={700} mb={1}>
                                Notes
                            </Typography>
                            <Stack spacing={1} maxHeight={200} sx={{ overflowY: "auto" }}>
                                {notes.map((n) => (
                                    <Card
                                        key={n.id}
                                        sx={{ borderRadius: 2, bgcolor: "background.default" }}
                                    >
                                        <CardContent>
                                            <Typography variant="body2">{n.text}</Typography>
                                            {n.createdAt?.seconds && (
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    display="block"
                                                    mt={0.5}
                                                >
                                                    {n.role} –{" "}
                                                    {new Date(n.createdAt.seconds * 1000).toLocaleString()}
                                                </Typography>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </Stack>

                            {userRole === "lawyer" && selectedCase.status === "open" && (
                                <Stack direction="row" spacing={1} mt={2}>
                                    <TextField
                                        size="small"
                                        fullWidth
                                        placeholder="Add note…"
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                    />
                                    <Button
                                        variant="contained"
                                        onClick={handleAddNote}
                                        disabled={!newNote.trim()}
                                    >
                                        Add
                                    </Button>
                                </Stack>
                            )}
                        </CardContent>
                    </Card>
                )}
            </Stack>
        </Container>
    );
};

export default CasesPage;