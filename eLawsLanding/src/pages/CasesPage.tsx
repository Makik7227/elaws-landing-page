import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    IconButton,
    InputAdornment,
    Snackbar,
    Stack,
    Tab,
    Tabs,
    TextField,
    Typography,
    Tooltip,
} from "@mui/material";
import {
    Add,
    Search,
    Close as CloseIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Save as SaveIcon,
    Clear as ClearIcon,
} from "@mui/icons-material";
import Autocomplete from "@mui/material/Autocomplete";
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
    Timestamp,
    where,
    type QuerySnapshot,
    type QueryDocumentSnapshot,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import caseProperties from "../utils/caseProperties.json";

const popularProperties = caseProperties as { key: string; label: string }[];
// ---- Types ----
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

type CasePropertyDoc = {
    id: string;
    name?: string;
    value?: string;
    type?: "text" | "number" | "date" | "boolean";
    createdAt?: Timestamp;
    createdBy?: string;
};

// ---- Component ----
const CasesPage: React.FC = () => {
    const [cases, setCases] = useState<CaseDoc[]>([]);
    const [loading, setLoading] = useState(true);

    const [filter, setFilter] = useState<"all" | "open" | "closed">("all");
    const [search, setSearch] = useState("");

    const [selectedCase, setSelectedCase] = useState<CaseDoc | null>(null);

    // Notes
    const [notes, setNotes] = useState<NoteDoc[]>([]);
    const [notesLoading, setNotesLoading] = useState(false);
    const [newNote, setNewNote] = useState("");
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState<string>("");
    const [deleteDialogNoteId, setDeleteDialogNoteId] = useState<string | null>(null);

    // Properties
    const [properties, setProperties] = useState<CasePropertyDoc[]>([]);
    const [propertiesLoading, setPropertiesLoading] = useState(false);
    const [newPropName, setNewPropName] = useState("");
    const [newPropValue, setNewPropValue] = useState("");
    const [showAddProperty, setShowAddProperty] = useState(false);

    // Auth / Role
    const [userRole, setUserRole] = useState<"lawyer" | "client" | null>(null);
    const [user, setUser] = useState<User | null>(null);

    // UX
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [selectedProp, setSelectedProp] = useState<{ key: string; label: string } | null>(null);

    const navigate = useNavigate();

    // ----- Auth + Role + Cases -----
    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, (u) => {
            setUser(u ?? null);
            if (!u) {
                setCases([]);
                setUserRole(null);
                setLoading(false);
                return;
            }

            const unsubRole = onSnapshot(doc(db, "users", u.uid), (snap) => {
                if (snap.exists()) {
                    const role = snap.data().role as "lawyer" | "client" | undefined;
                    if (role === "lawyer" || role === "client") setUserRole(role);
                    else setUserRole(null);
                } else {
                    setUserRole(null);
                }
            });

            const clientQ = query(collection(db, "cases"), where("clientId", "==", u.uid));
            const lawyerQ = query(collection(db, "cases"), where("lawyerId", "==", u.uid));

            const casesMap = new Map<string, CaseDoc>();

            const pushSnapshot = (ss: QuerySnapshot) => {
                ss.forEach((d: QueryDocumentSnapshot) => {
                    const data = d.data() as Partial<CaseDoc>;
                    casesMap.set(d.id, { id: d.id, ...data });
                });
                setCases(Array.from(casesMap.values()));
                setLoading(false);
            };

            const unsubClient = onSnapshot(clientQ, (ss) => pushSnapshot(ss));
            const unsubLawyer = onSnapshot(lawyerQ, (ss) => pushSnapshot(ss));

            return () => {
                unsubRole();
                unsubClient();
                unsubLawyer();
            };
        });

        return () => unsubAuth();
    }, []);

    // ----- Load notes -----
    useEffect(() => {
        if (!selectedCase) {
            setNotes([]);
            return;
        }
        setNotesLoading(true);
        const qNotes = query(
            collection(db, "cases", selectedCase.id, "notes"),
            orderBy("createdAt", "asc")
        );

        const unsub = onSnapshot(
            qNotes,
            (ss) => {
                setNotes(ss.docs.map((d) => ({ id: d.id, ...(d.data() as Partial<NoteDoc>) })));
                setNotesLoading(false);
            },
            (err) => {
                console.error(err);
                setErrorMsg("Failed to load notes.");
                setNotesLoading(false);
            }
        );

        return () => unsub();
    }, [selectedCase]);

    // ----- Load properties -----
    useEffect(() => {
        if (!selectedCase) {
            setProperties([]);
            return;
        }
        setPropertiesLoading(true);

        const qProps = query(
            collection(db, "cases", selectedCase.id, "properties"),
            orderBy("createdAt", "asc")
        );

        const unsub = onSnapshot(
            qProps,
            (ss) => {
                setProperties(
                    ss.docs.map((d) => ({ id: d.id, ...(d.data() as Partial<CasePropertyDoc>) }))
                );
                setPropertiesLoading(false);
            },
            (err) => {
                console.error(err);
                setErrorMsg("Failed to load properties.");
                setPropertiesLoading(false);
            }
        );

        return () => unsub();
    }, [selectedCase]);

    const filteredCases = useMemo(() => {
        const q = search.trim().toLowerCase();
        return cases.filter((c) => {
            if (filter !== "all" && c.status !== filter) return false;
            return !(q && !c.title?.toLowerCase().includes(q));
        });
    }, [cases, filter, search]);

    const canWriteNotes = userRole === "lawyer" && selectedCase?.status === "open";
    const canEditOrDeleteNote = (n: NoteDoc) =>
        userRole === "lawyer" && user && n.createdBy === user.uid;

    // ----- Note handlers -----
    const handleAddNote = async () => {
        if (!selectedCase || !newNote.trim() || !user || userRole !== "lawyer") return;
        try {
            await addDoc(collection(db, "cases", selectedCase.id, "notes"), {
                text: newNote.trim(),
                createdAt: serverTimestamp(),
                createdBy: user.uid,
                role: userRole,
            });
            setNewNote("");
            setSuccessMsg("Note added.");
        } catch (err) {
            console.error(err);
            setErrorMsg("Failed to add note.");
        }
    };

    const startEditNote = (n: NoteDoc) => {
        setEditingNoteId(n.id);
        setEditingText(n.text ?? "");
    };
    const cancelEditNote = () => {
        setEditingNoteId(null);
        setEditingText("");
    };
    const saveEditNote = async () => {
        if (!selectedCase || !editingNoteId) return;
        const target = notes.find((n) => n.id === editingNoteId);
        if (!target || !canEditOrDeleteNote(target)) return;

        try {
            await updateDoc(doc(db, "cases", selectedCase.id, "notes", editingNoteId), {
                text: editingText.trim(),
            });
            setSuccessMsg("Note updated.");
            cancelEditNote();
        } catch (err) {
            console.error(err);
            setErrorMsg("Failed to update note.");
        }
    };
    const requestDeleteNote = (n: NoteDoc) => {
        if (!canEditOrDeleteNote(n)) return;
        setDeleteDialogNoteId(n.id);
    };
    const confirmDeleteNote = async () => {
        if (!selectedCase || !deleteDialogNoteId) return;
        try {
            await deleteDoc(doc(db, "cases", selectedCase.id, "notes", deleteDialogNoteId));
            setSuccessMsg("Note deleted.");
        } catch (err) {
            console.error(err);
            setErrorMsg("Failed to delete note.");
        } finally {
            setDeleteDialogNoteId(null);
        }
    };

    // ----- Property handlers -----
    const handleAddProperty = async () => {
        if (!selectedCase || !user || userRole !== "lawyer" || !newPropName.trim()) return;
        try {
            await addDoc(collection(db, "cases", selectedCase.id, "properties"), {
                name: newPropName.trim(),
                value: newPropValue.trim(),
                createdAt: serverTimestamp(),
                createdBy: user.uid,
            });
            setNewPropName("");
            setNewPropValue("");
            setSuccessMsg("Property added.");
        } catch (err) {
            console.error(err);
            setErrorMsg("Failed to add property.");
        }
    };

    const handleToggleStatus = async () => {
        if (!selectedCase || userRole !== "lawyer") return;
        const newStatus = selectedCase.status === "open" ? "closed" : "open";
        try {
            await updateDoc(doc(db, "cases", selectedCase.id), { status: newStatus });
            setSelectedCase({ ...selectedCase, status: newStatus });
            setSuccessMsg(newStatus === "open" ? "Case reopened." : "Case closed.");
        } catch (err) {
            console.error(err);
            setErrorMsg("Failed to update case status.");
        }
    };
    const handleDeleteCase = async () => {
        if (!selectedCase || userRole !== "lawyer") return;
        try {
            await deleteDoc(doc(db, "cases", selectedCase.id));
            setSelectedCase(null);
            setSuccessMsg("Case deleted.");
        } catch (err) {
            console.error(err);
            setErrorMsg("Failed to delete case.");
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: 5, display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
            <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                <Typography variant="h4" fontWeight={800}>Cases</Typography>
                <Box flex={1} />
                {userRole === "lawyer" && (
                    <Button variant="contained" startIcon={<Add />} onClick={() => navigate("/cases/create")}>
                        New Case
                    </Button>
                )}
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={3}>
                <Tabs value={filter} onChange={(_, v) => setFilter(v)} variant="scrollable" allowScrollButtonsMobile>
                    <Tab value="all" label="All" />
                    <Tab value="open" label="Open" />
                    <Tab value="closed" label="Closed" />
                </Tabs>
                <TextField
                    size="small"
                    placeholder="Search…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search fontSize="small" />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ width: { xs: "100%", sm: 320 } }}
                />
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems="stretch" sx={{ flex: 1, minHeight: 0 }}>
                {/* Case list */}
                <Stack flex={1} spacing={2} sx={{ minWidth: 0 }}>
                    {loading && <CircularProgress />}
                    {!loading && filteredCases.length === 0 && (
                        <Typography color="text.secondary">No cases found.</Typography>
                    )}
                    <Box sx={{ overflowY: "auto", pr: 1, maxHeight: { xs: 400, md: "calc(100dvh - 260px)" } }}>
                        <AnimatePresence>
                            {filteredCases.map((c) => (
                                <motion.div key={c.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }}>
                                    <Card
                                        onClick={() => setSelectedCase(c)}
                                        sx={{
                                            cursor: "pointer",
                                            mb: 2,
                                            borderRadius: 3,
                                            border: selectedCase?.id === c.id ? "2px solid" : "1px solid",
                                            borderColor: selectedCase?.id === c.id ? "primary.main" : "divider",
                                        }}
                                    >
                                        <CardContent>
                                            <Stack direction="row" alignItems="center" spacing={2} minWidth={0}>
                                                <Avatar>{c.title?.[0] ?? "C"}</Avatar>
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography fontWeight={700} noWrap>{c.title}</Typography>
                                                    <Typography variant="body2" color="text.secondary" noWrap>
                                                        {c.description || "No description"}
                                                    </Typography>
                                                </Box>
                                                <Box flex={1} />
                                                <Chip
                                                    label={c.status && c.status.toUpperCase()}
                                                    color={c.status === "open" ? "success" : "default"}
                                                    size="small"
                                                />
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </Box>
                </Stack>

                {/* Case detail */}
                <AnimatePresence>
                    {selectedCase && (
                        <motion.div
                            key={selectedCase.id}
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 40 }}
                            transition={{ duration: 0.35 }}
                            style={{ flex: 1.2, display: "flex" }}
                        >
                            <Card sx={{ flex: 1, borderRadius: 3, position: "relative", minHeight: 300, display: "flex", flexDirection: "column" }}>
                                <IconButton size="small" onClick={() => setSelectedCase(null)} sx={{ position: "absolute", top: 8, right: 8 }} aria-label="Close case detail">
                                    <CloseIcon />
                                </IconButton>
                                <CardContent sx={{ pb: 1 }}>
                                    <Typography variant="h6" fontWeight={800} mb={1}>{selectedCase.title}</Typography>
                                    <Chip label={selectedCase.status && selectedCase.status.toUpperCase()} color={selectedCase.status === "open" ? "success" : "default"} size="small" sx={{ mb: 2 }} />
                                    <Typography mb={2}>{selectedCase.description || "No description"}</Typography>

                                    {userRole === "lawyer" && (
                                        <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" useFlexGap>
                                            <Button onClick={handleToggleStatus} variant="outlined">
                                                {selectedCase.status === "open" ? "Close Case" : "Reopen Case"}
                                            </Button>
                                            <Button onClick={handleDeleteCase} variant="outlined" color="error">
                                                Delete
                                            </Button>
                                        </Stack>
                                    )}

                                    {/* ---- Properties ---- */}
                                    <Divider sx={{ my: 2 }} />
                                    <Typography fontWeight={700} mb={1}>Case Properties</Typography>
                                    {propertiesLoading && <CircularProgress size={20} />}
                                    {!propertiesLoading && properties.length === 0 && (
                                        <Typography color="text.secondary">No properties yet.</Typography>
                                    )}
                                    <Stack spacing={1}>
                                        {properties.map((p) => (
                                            <Card key={p.id} sx={{ borderRadius: 2, p: 1 }}>
                                                <Typography variant="body2" fontWeight={600}>{p.name}</Typography>
                                                <Typography variant="body2" color="text.secondary">{p.value || "—"}</Typography>
                                            </Card>
                                        ))}
                                    </Stack>

                                    {userRole === "lawyer" && (
                                        <>
                                            {!showAddProperty ? (
                                                <Box width="100%" display="flex" justifyContent="center">
                                                    <IconButton
                                                        onClick={() => setShowAddProperty(true)}
                                                        sx={{
                                                            mt: 2,
                                                            bgcolor: "primary.main",
                                                            color: "white",
                                                            "&:hover": { bgcolor: "primary.dark" },
                                                        }}
                                                    >
                                                        <Add />
                                                    </IconButton>
                                                </Box>
                                            ) : (
                                                <Stack direction="row" spacing={1} mt={2} alignItems="center" flexWrap="wrap">
                                                    <Autocomplete
                                                        sx={{ minWidth: 200, flex: 1 }}
                                                        options={popularProperties}
                                                        getOptionLabel={(option) =>
                                                            typeof option === "string" ? option : option.label
                                                        }
                                                        value={selectedProp}
                                                        onChange={(_, newValue) => {
                                                            if (typeof newValue === "string") {
                                                                setSelectedProp({ key: newValue, label: newValue });
                                                                setNewPropName(newValue);
                                                            } else if (newValue) {
                                                                setSelectedProp(newValue);
                                                                setNewPropName(newValue.label);
                                                            } else {
                                                                setSelectedProp(null);
                                                                setNewPropName("");
                                                            }
                                                        }}
                                                        freeSolo
                                                        renderInput={(params) => (
                                                            <TextField
                                                                {...params}
                                                                label="Property name"
                                                                size="small"
                                                                value={newPropName}
                                                                onChange={(e) => setNewPropName(e.target.value)}
                                                            />
                                                        )}
                                                    />
                                                    <TextField
                                                        size="small"
                                                        label="Value"
                                                        value={newPropValue}
                                                        onChange={(e) => setNewPropValue(e.target.value)}
                                                    />
                                                    <Button
                                                        variant="contained"
                                                        onClick={() => {
                                                            handleAddProperty();
                                                            setShowAddProperty(false);
                                                            setSelectedProp(null);
                                                        }}
                                                    >
                                                        Add
                                                    </Button>
                                                    <Button
                                                        variant="outlined"
                                                        color="inherit"
                                                        onClick={() => {
                                                            setShowAddProperty(false);
                                                            setNewPropName("");
                                                            setNewPropValue("");
                                                            setSelectedProp(null);
                                                        }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </Stack>
                                            )}
                                        </>
                                    )}
                                    {/* ---- Notes ---- */}
                                    <Divider sx={{ my: 2 }} />
                                    <Typography fontWeight={700} mb={1}>Notes</Typography>
                                </CardContent>

                                {/* Notes list */}
                                <Box sx={{ px: 2, pb: 2, flex: 1, minHeight: 0 }}>
                                    <Box sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", p: 1, height: { xs: 240, md: 320 }, overflowY: "auto", pr: 1.5, backgroundColor: "background.paper" }}>
                                        {notesLoading && (
                                            <Stack alignItems="center" justifyContent="center" sx={{ py: 4 }}>
                                                <CircularProgress size={24} />
                                            </Stack>
                                        )}

                                        {!notesLoading && notes.length === 0 && (
                                            <Typography color="text.secondary" sx={{ px: 1, py: 0.5 }}>No notes yet.</Typography>
                                        )}

                                        <Stack spacing={1}>
                                            <AnimatePresence>
                                                {notes.map((n) => {
                                                    const isEditing = editingNoteId === n.id;
                                                    return (
                                                        <motion.div key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
                                                            <Card sx={{ borderRadius: 2, bgcolor: "background.default", border: "1px solid", borderColor: "divider" }}>
                                                                <CardContent sx={{ pb: 1.5 }}>
                                                                    {!isEditing ? (
                                                                        <>
                                                                            <Stack direction="row" alignItems="flex-start" spacing={1}>
                                                                                <Box flex={1} minWidth={0}>
                                                                                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{n.text}</Typography>
                                                                                </Box>
                                                                                {canEditOrDeleteNote(n) && (
                                                                                    <Stack direction="row" spacing={0.5}>
                                                                                        <Tooltip title="Edit">
                                                                                            <IconButton size="small" onClick={() => startEditNote(n)} aria-label="Edit note">
                                                                                                <EditIcon fontSize="small" />
                                                                                            </IconButton>
                                                                                        </Tooltip>
                                                                                        <Tooltip title="Delete">
                                                                                            <IconButton size="small" onClick={() => requestDeleteNote(n)} aria-label="Delete note">
                                                                                                <DeleteIcon fontSize="small" />
                                                                                            </IconButton>
                                                                                        </Tooltip>
                                                                                    </Stack>
                                                                                )}
                                                                            </Stack>
                                                                            <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                                                                                {n.role ?? "unknown"}{" "}
                                                                                {n.createdAt?.seconds
                                                                                    ? "– " + new Date(n.createdAt.seconds * 1000).toLocaleString()
                                                                                    : ""}
                                                                            </Typography>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <TextField fullWidth multiline minRows={2} value={editingText} onChange={(e) => setEditingText(e.target.value)} size="small" />
                                                                            <Stack direction="row" spacing={1} mt={1} justifyContent="flex-end">
                                                                                <Button startIcon={<ClearIcon />} onClick={cancelEditNote} variant="outlined" color="inherit">Cancel</Button>
                                                                                <Button startIcon={<SaveIcon />} onClick={saveEditNote} variant="contained" disabled={!editingText.trim()}>Save</Button>
                                                                            </Stack>
                                                                        </>
                                                                    )}
                                                                </CardContent>
                                                            </Card>
                                                        </motion.div>
                                                    );
                                                })}
                                            </AnimatePresence>
                                        </Stack>
                                    </Box>

                                    {canWriteNotes && (
                                        <Stack direction="row" spacing={1} mt={2}>
                                            <TextField size="small" fullWidth placeholder="Add note…" value={newNote} onChange={(e) => setNewNote(e.target.value)} multiline minRows={1} maxRows={6} />
                                            <Button variant="contained" onClick={handleAddNote} disabled={!newNote.trim()}>Add</Button>
                                        </Stack>
                                    )}
                                </Box>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Stack>

            {/* Delete dialog */}
            <Dialog open={Boolean(deleteDialogNoteId)} onClose={() => setDeleteDialogNoteId(null)}>
                <DialogTitle>Delete note?</DialogTitle>
                <DialogContent>
                    <DialogContentText>This action can’t be undone. Do you really want to delete this note?</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogNoteId(null)}>Cancel</Button>
                    <Button color="error" variant="contained" onClick={confirmDeleteNote}>Delete</Button>
                </DialogActions>
            </Dialog>

            {/* Snackbars */}
            <Snackbar open={Boolean(errorMsg)} autoHideDuration={4000} onClose={() => setErrorMsg(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
                <Alert severity="error" onClose={() => setErrorMsg(null)} variant="filled">{errorMsg}</Alert>
            </Snackbar>
            <Snackbar open={Boolean(successMsg)} autoHideDuration={2500} onClose={() => setSuccessMsg(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
                <Alert severity="success" onClose={() => setSuccessMsg(null)} variant="filled">{successMsg}</Alert>
            </Snackbar>
        </Container>
    );
};

export default CasesPage;