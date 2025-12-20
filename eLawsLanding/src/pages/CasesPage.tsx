import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    ListItemIcon,
    ListItemText,
    ListSubheader,
    Menu,
    MenuItem,
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
    KeyboardArrowLeft,
    KeyboardArrowRight,
    TuneRounded as TuneRoundedIcon,
    CheckRounded as CheckRoundedIcon,
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
    type QueryConstraint,
} from "firebase/firestore";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import caseProperties from "../utils/caseProperties.json";
import { useTranslation } from "react-i18next";
import DashboardBackButton from "../components/DashboardBackButton";

const popularProperties = caseProperties as { key: string; label: string }[];

const PROPS_PAGE_SIZE = 5;
const NOTES_PAGE_SIZE = 5;

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

type CaseFilters = {
    status: "all" | "open" | "closed";
    timeframe: "any" | "7d" | "30d";
};

const getTimestampForRange = (range: CaseFilters["timeframe"]) => {
    if (range === "any") return null;
    const days = range === "7d" ? 7 : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return Timestamp.fromDate(cutoff);
};

const CasesPage: React.FC = () => {
    const [cases, setCases] = useState<CaseDoc[]>([]);
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    const [caseFilters, setCaseFilters] = useState<CaseFilters>({ status: "all", timeframe: "any" });
    const [caseFilterAnchorEl, setCaseFilterAnchorEl] = useState<null | HTMLElement>(null);
    const caseFilterMenuOpen = Boolean(caseFilterAnchorEl);
    const [search, setSearch] = useState("");
    const [selectedCase, setSelectedCase] = useState<CaseDoc | null>(null);
    const [notes, setNotes] = useState<NoteDoc[]>([]);
    const [notesLoading, setNotesLoading] = useState(false);
    const [newNote, setNewNote] = useState("");
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState<string>("");
    const [deleteDialogNoteId, setDeleteDialogNoteId] = useState<string | null>(null);
    const [properties, setProperties] = useState<CasePropertyDoc[]>([]);
    const [propertiesLoading, setPropertiesLoading] = useState(false);
    const [newPropName, setNewPropName] = useState("");
    const [propInputValue, setPropInputValue] = useState("");
    const [newPropValue, setNewPropValue] = useState("");
    const [showAddProperty, setShowAddProperty] = useState(false);
    const [selectedProp, setSelectedProp] = useState<{ key: string; label: string } | null>(null);
    const [editingPropId, setEditingPropId] = useState<string | null>(null);
    const [editPropName, setEditPropName] = useState<string>("");
    const [editPropValue, setEditPropValue] = useState<string>("");
    const [deleteDialogPropId, setDeleteDialogPropId] = useState<string | null>(null);
    const [slide, setSlide] = useState<number>(0);
    const [propsPage, setPropsPage] = useState<number>(0);
    const [notesPage, setNotesPage] = useState<number>(0);
    const [userRole, setUserRole] = useState<"lawyer" | "client" | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const { t, i18n } = useTranslation();

    const propertyKeyMap = useMemo(() => {
        const map = new Map<string, string>();
        popularProperties.forEach((prop) => {
            map.set(prop.label.toLowerCase(), prop.key);
        });
        return map;
    }, []);

    const getPropertyDisplayName = (name?: string) => {
        if (!name) return "";
        const key = propertyKeyMap.get(name.toLowerCase());
        return key ? t(`caseProperties.labels.${key}`, { defaultValue: name }) : name;
    };

    const formatDateTime = (timestamp?: { seconds?: number } | string | number) => {
        if (!timestamp) return "";
        let date: Date;
        if (typeof timestamp === "object") {
            const seconds = typeof timestamp.seconds === "number" ? timestamp.seconds : 0;
            date = new Date(seconds * 1000);
        } else {
            date = new Date(timestamp);
        }
        return Number.isNaN(date.getTime()) ? "" : date.toLocaleString(i18n.language);
    };

    useEffect(() => {
        if (id && cases.length > 0) {
            const target = cases.find((c) => c.id === id);
            if (target) {
                setSelectedCase(target);
                setSlide(0);
                navigate("/dashboard/cases", { replace: true });
            }
        }
    }, [location.search, cases, navigate, id]);

    useEffect(() => {
        let unsubRole: (() => void) | null = null;
        const unsubAuth = onAuthStateChanged(auth, (u) => {
            setUser(u ?? null);
            if (unsubRole) {
                unsubRole();
                unsubRole = null;
            }
            if (!u) {
                setCases([]);
                setUserRole(null);
                setLoading(false);
                return;
            }

            unsubRole = onSnapshot(doc(db, "users", u.uid), (snap) => {
                if (snap.exists()) {
                    const role = snap.data().role as "lawyer" | "client" | undefined;
                    if (role === "lawyer" || role === "client") setUserRole(role);
                    else setUserRole(null);
                } else {
                    setUserRole(null);
                }
            });
        });

        return () => {
            unsubAuth();
            if (unsubRole) unsubRole();
        };
    }, []);

    useEffect(() => {
        if (!user) return;
        setLoading(true);
        const roleField = userRole === "lawyer" ? "lawyerId" : "clientId";
        const constraints: QueryConstraint[] = [
            where(roleField, "==", user.uid),
        ];
        if (caseFilters.status !== "all") {
            constraints.push(where("status", "==", caseFilters.status));
        }
        const cutoff = getTimestampForRange(caseFilters.timeframe);
        if (cutoff) {
            constraints.push(where("updatedAt", ">=", cutoff));
        }
        constraints.push(orderBy("updatedAt", "desc"));

        const casesQuery = query(collection(db, "cases"), ...constraints);
        const unsub = onSnapshot(
            casesQuery,
            (ss) => {
                setCases(ss.docs.map((d) => ({ id: d.id, ...(d.data() as Partial<CaseDoc>) })));
                setLoading(false);
            },
            (err) => {
                console.error(err);
                setErrorMsg(t("casesPage.errors.loadCases"));
                setLoading(false);
            }
        );
        return () => unsub();
    }, [user, userRole, caseFilters, t]);

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
                setNotesPage(0);
            },
            (err) => {
                console.error(err);
                setErrorMsg(t("casesPage.errors.loadNotes"));
                setNotesLoading(false);
            }
        );

        return () => unsub();
    }, [selectedCase, t]);

    useEffect(() => {
        if (selectedCase && !cases.find((c) => c.id === selectedCase.id)) {
            setSelectedCase(null);
        }
    }, [cases, selectedCase]);

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
                setPropsPage(0);
            },
            (err) => {
                console.error(err);
                setErrorMsg(t("casesPage.errors.loadProperties"));
                setPropertiesLoading(false);
            }
        );

        return () => unsub();
    }, [selectedCase, t]);

    const visibleCases = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return cases;
        return cases.filter((c) => c.title?.toLowerCase().includes(q));
    }, [cases, search]);

    const canWriteNotes = userRole === "lawyer" && selectedCase?.status === "open";
    const canEditOrDeleteNote = (n: NoteDoc) =>
        userRole === "lawyer" && user && n.createdBy === user.uid;

    const isLawyer = userRole === "lawyer";
    const clearCaseFilter = (key: "status" | "time") => {
        setCaseFilters((prev) =>
            key === "status" ? { ...prev, status: "all" } : { ...prev, timeframe: "any" }
        );
    };
    const openCaseFilterMenu = (event: React.MouseEvent<HTMLElement>) => {
        setCaseFilterAnchorEl(event.currentTarget);
    };
    const closeCaseFilterMenu = () => setCaseFilterAnchorEl(null);
    const handleCaseStatusChange = (status: CaseFilters["status"]) => {
        setCaseFilters((prev) => ({ ...prev, status }));
        closeCaseFilterMenu();
    };
    const handleCaseTimeChange = (timeframe: CaseFilters["timeframe"]) => {
        setCaseFilters((prev) => ({ ...prev, timeframe }));
        closeCaseFilterMenu();
    };
    const resetCaseFilters = () => {
        setCaseFilters({ status: "all", timeframe: "any" });
        closeCaseFilterMenu();
    };

    const propsTotalPages = Math.max(1, Math.ceil(properties.length / PROPS_PAGE_SIZE));
    const notesTotalPages = Math.max(1, Math.ceil(notes.length / NOTES_PAGE_SIZE));
    const pagedProperties = properties.slice(
        propsPage * PROPS_PAGE_SIZE,
        propsPage * PROPS_PAGE_SIZE + PROPS_PAGE_SIZE
    );
    const pagedNotes = notes.slice(
        notesPage * NOTES_PAGE_SIZE,
        notesPage * NOTES_PAGE_SIZE + NOTES_PAGE_SIZE
    );
    const caseFilterChips = useMemo(() => {
        const chips: { key: "status" | "time"; label: string }[] = [];
        if (caseFilters.status !== "all") {
            chips.push({ key: "status", label: t(`casesPage.filters.${caseFilters.status}`) });
        }
        if (caseFilters.timeframe !== "any") {
            chips.push({ key: "time", label: t(`casesPage.filtersMenu.time.${caseFilters.timeframe}`) });
        }
        return chips;
    }, [caseFilters, t]);
    const caseStatusOptions = useMemo(
        () => [
            { value: "all", label: t("casesPage.filters.all") },
            { value: "open", label: t("casesPage.filters.open") },
            { value: "closed", label: t("casesPage.filters.closed") },
        ],
        [t]
    );
    const caseTimeOptions = useMemo(
        () => [
            { value: "any", label: t("casesPage.filtersMenu.time.any") },
            { value: "7d", label: t("casesPage.filtersMenu.time.7d") },
            { value: "30d", label: t("casesPage.filtersMenu.time.30d") },
        ],
        [t]
    );

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
            setSuccessMsg(t("casesPage.success.noteAdded"));
            const nextCount = notes.length + 1;
            setNotesPage(Math.floor((nextCount - 1) / NOTES_PAGE_SIZE));
            setSlide(1);
        } catch (err) {
            console.error(err);
            setErrorMsg(t("casesPage.errors.addNote"));
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
            setSuccessMsg(t("casesPage.success.noteUpdated"));
            cancelEditNote();
        } catch (err) {
            console.error(err);
            setErrorMsg(t("casesPage.errors.updateNote"));
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
            setSuccessMsg(t("casesPage.success.noteDeleted"));
        } catch (err) {
            console.error(err);
            setErrorMsg(t("casesPage.errors.deleteNote"));
        } finally {
            setDeleteDialogNoteId(null);
        }
    };

    const handleAddProperty = async () => {
        if (!selectedCase || !user || !isLawyer || !newPropName.trim()) return;
        try {
            await addDoc(collection(db, "cases", selectedCase.id, "properties"), {
                name: newPropName.trim(),
                value: newPropValue.trim(),
                createdAt: serverTimestamp(),
                createdBy: user.uid,
            });
            setNewPropName("");
            setNewPropValue("");
            setPropInputValue("");
            setSuccessMsg(t("casesPage.success.propertyAdded"));
            const nextCount = properties.length + 1;
            setPropsPage(Math.floor((nextCount - 1) / PROPS_PAGE_SIZE));
            setSlide(0);
        } catch (err) {
            console.error(err);
            setErrorMsg(t("casesPage.errors.addProperty"));
        }
    };

    const startEditProperty = (p: CasePropertyDoc) => {
        if (!isLawyer) return;
        setEditingPropId(p.id);
        setEditPropName(p.name ?? "");
        setEditPropValue(p.value ?? "");
    };
    const cancelEditProperty = () => {
        setEditingPropId(null);
        setEditPropName("");
        setEditPropValue("");
    };
    const saveEditProperty = async () => {
        if (!selectedCase || !editingPropId || !isLawyer) return;
        try {
            await updateDoc(doc(db, "cases", selectedCase.id, "properties", editingPropId), {
                name: editPropName.trim(),
                value: editPropValue.trim(),
            });
            setSuccessMsg(t("casesPage.success.propertyUpdated"));
            cancelEditProperty();
        } catch (err) {
            console.error(err);
            setErrorMsg(t("casesPage.errors.updateProperty"));
        }
    };
    const requestDeleteProperty = (propId: string) => {
        if (!isLawyer) return;
        setDeleteDialogPropId(propId);
    };
    const confirmDeleteProperty = async () => {
        if (!selectedCase || !deleteDialogPropId || !isLawyer) return;
        try {
            await deleteDoc(doc(db, "cases", selectedCase.id, "properties", deleteDialogPropId));
            setSuccessMsg(t("casesPage.success.propertyDeleted"));
        } catch (err) {
            console.error(err);
            setErrorMsg(t("casesPage.errors.deleteProperty"));
        } finally {
            setDeleteDialogPropId(null);
        }
    };

    const handleToggleStatus = async () => {
        if (!selectedCase || !isLawyer) return;
        const newStatus = selectedCase.status === "open" ? "closed" : "open";
        try {
            await updateDoc(doc(db, "cases", selectedCase.id), { status: newStatus });
            setSelectedCase({ ...selectedCase, status: newStatus });
            setSuccessMsg(
                newStatus === "open" ? t("casesPage.success.caseReopened") : t("casesPage.success.caseClosed")
            );
        } catch (err) {
            console.error(err);
            setErrorMsg(t("casesPage.errors.updateStatus"));
        }
    };
    const handleDeleteCase = async () => {
        if (!selectedCase || !isLawyer) return;
        try {
            await deleteDoc(doc(db, "cases", selectedCase.id));
            setSelectedCase(null);
            setSuccessMsg(t("casesPage.success.caseDeleted"));
        } catch (err) {
            console.error(err);
            setErrorMsg(t("casesPage.errors.deleteCase"));
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: 5, display: "flex", flexDirection: "column", minHeight: "50dvh" }}>
            <Box sx={{ mb: 2 }}>
                <DashboardBackButton />
            </Box>
            <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={{ xs: 1.5, sm: 2 }}
                alignItems={{ xs: "flex-start", sm: "center" }}
                justifyContent="space-between"
                mb={3}
            >
                <Typography variant="h4" fontWeight={800}>{t("casesPage.title")}</Typography>
                {isLawyer && (
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => navigate("/cases/create")}
                        sx={{ width: { xs: "100%", sm: "auto" } }}
                    >
                        {t("casesPage.actions.newCase")}
                    </Button>
                )}
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={1.5}>
                <TextField
                    size="small"
                    placeholder={t("casesPage.filters.search")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search fontSize="small" />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ width: { xs: "100%", md: 320 } }}
                />
                <Button
                    startIcon={<TuneRoundedIcon />}
                    variant="outlined"
                    onClick={openCaseFilterMenu}
                    sx={{ alignSelf: { xs: "stretch", md: "flex-start" } }}
                >
                    {t("casesPage.filtersMenu.button")}
                </Button>
            </Stack>

            {caseFilterChips.length > 0 && (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mb={3}>
                    {caseFilterChips.map((chip) => (
                        <Chip
                            key={chip.key}
                            label={chip.label}
                            onDelete={() => clearCaseFilter(chip.key)}
                            size="small"
                        />
                    ))}
                </Stack>
            )}
            <Menu anchorEl={caseFilterAnchorEl} open={caseFilterMenuOpen} onClose={closeCaseFilterMenu} keepMounted>
                <ListSubheader disableSticky>{t("casesPage.filtersMenu.status")}</ListSubheader>
                {caseStatusOptions.map((option) => {
                    const selected = caseFilters.status === option.value;
                    return (
                        <MenuItem key={option.value} selected={selected} onClick={() => handleCaseStatusChange(option.value as CaseFilters["status"])}>
                            <ListItemIcon>
                                {selected ? <CheckRoundedIcon fontSize="small" /> : <Box sx={{ width: 12 }} />}
                            </ListItemIcon>
                            <ListItemText primary={option.label} />
                        </MenuItem>
                    );
                })}
                <Divider />
                <ListSubheader disableSticky>{t("casesPage.filtersMenu.updated")}</ListSubheader>
                {caseTimeOptions.map((option) => {
                    const selected = caseFilters.timeframe === option.value;
                    return (
                        <MenuItem key={option.value} selected={selected} onClick={() => handleCaseTimeChange(option.value as CaseFilters["timeframe"])}>
                            <ListItemIcon>
                                {selected ? <CheckRoundedIcon fontSize="small" /> : <Box sx={{ width: 12 }} />}
                            </ListItemIcon>
                            <ListItemText primary={option.label} />
                        </MenuItem>
                    );
                })}
                <Divider />
                <MenuItem
                    onClick={resetCaseFilters}
                    disabled={caseFilters.status === "all" && caseFilters.timeframe === "any"}
                >
                    <ListItemText primary={t("casesPage.filtersMenu.clear")} />
                </MenuItem>
            </Menu>

            <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems="stretch" sx={{ flex: 1, minHeight: 0 }}>
                <Stack flex={1} spacing={2} sx={{ minWidth: 0 }}>
                    {loading && <CircularProgress />}
                    {!loading && visibleCases.length === 0 && (
                        <Typography color="text.secondary">{t("casesPage.list.empty")}</Typography>
                    )}
                    <Box sx={{ overflowY: "auto", pr: 1, maxHeight: { xs: 400, md: "calc(100dvh - 260px)" } }}>
                        <AnimatePresence>
                            {visibleCases.map((c) => (
                                <motion.div key={c.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }}>
                                    <Card
                                        onClick={() => {
                                            setSelectedCase(c);
                                            setSlide(0);
                                        }}
                                        sx={{
                                            cursor: "pointer",
                                            mb: 2,
                                            borderRadius: 3,
                                            border: selectedCase?.id === c.id ? "2px solid" : "1px solid",
                                            borderColor: selectedCase?.id === c.id ? "primary.main" : "divider",
                                        }}
                                    >
                                        <CardContent>
                                            <Stack
                                                direction={{ xs: "column", sm: "row" }}
                                                alignItems={{ xs: "flex-start", sm: "center" }}
                                                spacing={2}
                                                minWidth={0}
                                            >
                                                <Avatar>{c.title?.[0] ?? "C"}</Avatar>
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography fontWeight={700} noWrap>{c.title}</Typography>
                                                    <Typography variant="body2" color="text.secondary" noWrap>
                                                        {c.description || t("casesPage.details.noDescription")}
                                                    </Typography>
                                                </Box>
                                                    <Chip
                                                    label={c.status ? t(`casesPage.status.${c.status}`) : ""}
                                                    color={c.status === "open" ? "success" : "default"}
                                                    size="small"
                                                    sx={{
                                                        ml: { sm: "auto" },
                                                        mt: { xs: 1, sm: 0 },
                                                        alignSelf: { xs: "flex-start", sm: "center" },
                                                    }}
                                                />
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </Box>
                </Stack>
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
                                <IconButton
                                    size="small"
                                    onClick={() => setSelectedCase(null)}
                                    sx={{ position: "absolute", top: 8, right: 8 }}
                                    aria-label={t("casesPage.aria.closeDetails")}
                                >
                                    <CloseIcon />
                                </IconButton>

                                <CardContent sx={{ pb: 1 }}>
                                    <Typography variant="h6" fontWeight={800} mb={1}>{selectedCase.title}</Typography>
                                    <Chip
                                        label={selectedCase.status ? t(`casesPage.status.${selectedCase.status}`) : ""}
                                        color={selectedCase.status === "open" ? "success" : "default"}
                                        size="small"
                                        sx={{ mb: 2 }}
                                    />
                                    <Typography mb={2}>{selectedCase.description || t("casesPage.details.noDescription")}</Typography>

                                    {isLawyer && (
                                        <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" useFlexGap>
                                            <Button onClick={handleToggleStatus} variant="outlined">
                                                {selectedCase.status === "open"
                                                    ? t("casesPage.actions.closeCase")
                                                    : t("casesPage.actions.reopenCase")}
                                            </Button>
                                            <Button onClick={handleDeleteCase} variant="outlined" color="error">
                                                {t("casesPage.actions.deleteCase")}
                                            </Button>
                                        </Stack>
                                    )}
                                    <Divider sx={{ my: 2 }} />
                                    <Stack
                                        direction={{ xs: "column", sm: "row" }}
                                        alignItems={{ xs: "flex-start", sm: "center" }}
                                        justifyContent="space-between"
                                        spacing={1}
                                    >
                                        <IconButton
                                            size="small"
                                            onClick={() => setSlide(Math.max(0, slide - 1))}
                                            disabled={slide === 0}
                                            aria-label={t("casesPage.aria.slideBack")}
                                        >
                                            <KeyboardArrowLeft />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => setSlide(Math.min(1, slide + 1))}
                                            disabled={slide === 1}
                                            aria-label={t("casesPage.aria.slideNext")}
                                        >
                                            <KeyboardArrowRight />
                                        </IconButton>
                                    </Stack>
                                    {slide === 0 && (
                                        <Box>
                                            <Typography fontWeight={700} mb={1}>{t("casesPage.details.properties.title")}</Typography>

                                            {propertiesLoading && <CircularProgress size={20} />}

                                            {!propertiesLoading && properties.length === 0 && (
                                                <Typography color="text.secondary">{t("casesPage.details.properties.empty")}</Typography>
                                            )}

                                            {/* Paginated list */}
                                            <Stack spacing={1}>
                                                {pagedProperties.map((p) => {
                                                    const isEditing = editingPropId === p.id;
                                                    return (
                                                        <Card key={p.id} sx={{ borderRadius: 2, p: 1, border: "1px solid", borderColor: "divider" }}>
                                                            {!isEditing ? (
                                                                <Stack
                                                                    direction={{ xs: "column", sm: "row" }}
                                                                    spacing={1}
                                                                    alignItems={{ xs: "flex-start", sm: "center" }}
                                                                >
                                                                    <Box flex={1} minWidth={0}>
                                                                        <Typography variant="body2" fontWeight={600} noWrap>{getPropertyDisplayName(p.name)}</Typography>
                                                                        <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-word" }}>
                                                                            {p.value || "—"}
                                                                        </Typography>
                                                                    </Box>
                                                                    {isLawyer && (
                                                                        <Stack direction="row" spacing={0.5}>
                                                                            <Tooltip title={t("casesPage.details.properties.edit")}>
                                                                                <IconButton size="small" onClick={() => startEditProperty(p)}>
                                                                                    <EditIcon fontSize="small" />
                                                                                </IconButton>
                                                                            </Tooltip>
                                                                            <Tooltip title={t("casesPage.details.properties.delete")}>
                                                                                <IconButton size="small" onClick={() => requestDeleteProperty(p.id!)}>
                                                                                    <DeleteIcon fontSize="small" />
                                                                                </IconButton>
                                                                            </Tooltip>
                                                                        </Stack>
                                                                    )}
                                                                </Stack>
                                                            ) : (
                                                                <Stack spacing={1}>
                                                                    <TextField
                                                                        size="small"
                                                                        label={t("casesPage.details.properties.nameLabel")}
                                                                        value={editPropName}
                                                                        onChange={(e) => setEditPropName(e.target.value)}
                                                                    />
                                                                    <TextField
                                                                        size="small"
                                                                        label={t("casesPage.details.properties.valueLabel")}
                                                                        value={editPropValue}
                                                                        onChange={(e) => setEditPropValue(e.target.value)}
                                                                    />
                                                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                                        <Button startIcon={<ClearIcon />} onClick={cancelEditProperty} variant="outlined" color="inherit">
                                                                            {t("casesPage.common.cancel")}
                                                                        </Button>
                                                                        <Button startIcon={<SaveIcon />} onClick={saveEditProperty} variant="contained" disabled={!editPropName.trim()}>
                                                                            {t("casesPage.common.save")}
                                                                        </Button>
                                                                    </Stack>
                                                                </Stack>
                                                            )}
                                                        </Card>
                                                    );
                                                })}
                                            </Stack>
                                            {properties.length > PROPS_PAGE_SIZE && (
                                                <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end" mt={1.5}>
                                                    <Typography variant="caption">
                                                        {t("casesPage.pagination.label", { page: propsPage + 1, total: propsTotalPages })}
                                                    </Typography>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => setPropsPage((p) => Math.max(0, p - 1))}
                                                        disabled={propsPage === 0}
                                                        aria-label={t("casesPage.pagination.prevProperties")}
                                                    >
                                                        <KeyboardArrowLeft />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => setPropsPage((p) => Math.min(propsTotalPages - 1, p + 1))}
                                                        disabled={propsPage >= propsTotalPages - 1}
                                                        aria-label={t("casesPage.pagination.nextProperties")}
                                                    >
                                                        <KeyboardArrowRight />
                                                    </IconButton>
                                                </Stack>
                                            )}
                                            {isLawyer && selectedCase.status !== "closed" && (
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
                                                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} mt={2} alignItems={{ xs: "stretch", sm: "center" }}>
                                                            <Autocomplete
                                                                sx={{ minWidth: 200, flex: 1 }}
                                                                options={popularProperties}
                                                                getOptionLabel={(option) =>
                                                                    typeof option === "string"
                                                                        ? option
                                                                        : t(`caseProperties.labels.${option.key}`, { defaultValue: option.label })
                                                                }
                                                                value={selectedProp}
                                                                inputValue={propInputValue}
                                                                onInputChange={(_, value, reason) => {
                                                                    setPropInputValue(value);
                                                                    if (reason === "input" || reason === "clear") {
                                                                        setNewPropName(value);
                                                                        setSelectedProp(null);
                                                                    }
                                                                }}
                                                                onChange={(_, newValue) => {
                                                                    if (typeof newValue === "string") {
                                                                        setSelectedProp({ key: newValue, label: newValue });
                                                                        setNewPropName(newValue);
                                                                        setPropInputValue(newValue);
                                                                    } else if (newValue) {
                                                                        setSelectedProp(newValue);
                                                                        setNewPropName(newValue.label);
                                                                        setPropInputValue(
                                                                            t(`caseProperties.labels.${newValue.key}`, { defaultValue: newValue.label })
                                                                        );
                                                                    } else {
                                                                        setSelectedProp(null);
                                                                        setNewPropName("");
                                                                        setPropInputValue("");
                                                                    }
                                                                }}
                                                                freeSolo
                                                                renderInput={(params) => (
                                                                    <TextField
                                                                        {...params}
                                                                        label={t("casesPage.details.properties.nameLabel")}
                                                                        size="small"
                                                                    />
                                                                )}
                                                            />
                                                            <TextField
                                                                size="small"
                                                                label={t("casesPage.details.properties.valueLabel")}
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
                                                                {t("casesPage.details.properties.add")}
                                                            </Button>
                                                            <Button
                                                                variant="outlined"
                                                                color="inherit"
                                                                onClick={() => {
                                                                    setShowAddProperty(false);
                                                                    setNewPropName("");
                                                                    setNewPropValue("");
                                                                    setSelectedProp(null);
                                                                    setPropInputValue("");
                                                                }}
                                                            >
                                                                {t("casesPage.common.cancel")}
                                                            </Button>
                                                        </Stack>
                                                    )}
                                                </>
                                            )}
                                        </Box>
                                    )}
                                    {slide === 1 && (
                                        <Box>
                                            <Typography fontWeight={700} mb={1}>{t("casesPage.details.notes.title")}</Typography>

                                            <Box sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", p: 1, height: '100%', overflowY: "auto", pr: 1.5, backgroundColor: "background.paper" }}>
                                                {notesLoading && (
                                                    <Stack alignItems="center" justifyContent="center" sx={{ py: 4 }}>
                                                        <CircularProgress size={24} />
                                                    </Stack>
                                                )}

                                                {!notesLoading && notes.length === 0 && (
                                                    <Typography color="text.secondary" sx={{ px: 1, py: 0.5 }}>
                                                        {t("casesPage.details.notes.empty")}
                                                    </Typography>
                                                )}

                                                <Stack spacing={1}>
                                                    <AnimatePresence>
                                                        {pagedNotes.map((n) => {
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
                                                                                                <Tooltip title={t("casesPage.details.notes.edit")}>
                                                                                                    <IconButton
                                                                                                        size="small"
                                                                                                        onClick={() => startEditNote(n)}
                                                                                                        aria-label={t("casesPage.details.notes.edit")}
                                                                                                    >
                                                                                                        <EditIcon fontSize="small" />
                                                                                                    </IconButton>
                                                                                                </Tooltip>
                                                                                                <Tooltip title={t("casesPage.details.notes.delete")}>
                                                                                                    <IconButton
                                                                                                        size="small"
                                                                                                        onClick={() => requestDeleteNote(n)}
                                                                                                        aria-label={t("casesPage.details.notes.delete")}
                                                                                                    >
                                                                                                        <DeleteIcon fontSize="small" />
                                                                                                    </IconButton>
                                                                                                </Tooltip>
                                                                                            </Stack>
                                                                                        )}
                                                                                    </Stack>
                                                                                    <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                                                                                        {t(`casesPage.details.notes.roles.${n.role ?? "unknown"}`)}{" "}
                                                                                        {n.createdAt?.seconds
                                                                                            ? "– " + formatDateTime({ seconds: n.createdAt.seconds })
                                                                                            : ""}
                                                                                    </Typography>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <TextField fullWidth multiline minRows={2} value={editingText} onChange={(e) => setEditingText(e.target.value)} size="small" />
                                                                                    <Stack direction="row" spacing={1} mt={1} justifyContent="flex-end">
                                                                                        <Button startIcon={<ClearIcon />} onClick={cancelEditNote} variant="outlined" color="inherit">
                                                                                            {t("casesPage.common.cancel")}
                                                                                        </Button>
                                                                                        <Button startIcon={<SaveIcon />} onClick={saveEditNote} variant="contained" disabled={!editingText.trim()}>
                                                                                            {t("casesPage.common.save")}
                                                                                        </Button>
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
                                            {notes.length > NOTES_PAGE_SIZE && (
                                                <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end" mt={1.5}>
                                                    <Typography variant="caption">
                                                        {t("casesPage.pagination.label", { page: notesPage + 1, total: notesTotalPages })}
                                                    </Typography>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => setNotesPage((p) => Math.max(0, p - 1))}
                                                        disabled={notesPage === 0}
                                                        aria-label={t("casesPage.pagination.prevNotes")}
                                                    >
                                                        <KeyboardArrowLeft />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => setNotesPage((p) => Math.min(notesTotalPages - 1, p + 1))}
                                                        disabled={notesPage >= notesTotalPages - 1}
                                                        aria-label={t("casesPage.pagination.nextNotes")}
                                                    >
                                                        <KeyboardArrowRight />
                                                    </IconButton>
                                                </Stack>
                                            )}

                                            {canWriteNotes && (
                                                <Stack direction="row" spacing={1} mt={2}>
                                                    <TextField
                                                        size="small"
                                                        fullWidth
                                                        placeholder={t("casesPage.details.notes.placeholder")}
                                                        value={newNote}
                                                        onChange={(e) => setNewNote(e.target.value)}
                                                        multiline
                                                        minRows={1}
                                                        maxRows={6}
                                                    />
                                                    <Button variant="contained" onClick={handleAddNote} disabled={!newNote.trim()}>
                                                        {t("casesPage.details.notes.addAction")}
                                                    </Button>
                                                </Stack>
                                            )}
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Stack>
            <Dialog open={Boolean(deleteDialogNoteId)} onClose={() => setDeleteDialogNoteId(null)}>
                <DialogTitle>{t("casesPage.dialog.deleteNote.title")}</DialogTitle>
                <DialogContent>
                    <DialogContentText>{t("casesPage.dialog.deleteNote.description")}</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogNoteId(null)}>{t("casesPage.common.cancel")}</Button>
                    <Button color="error" variant="contained" onClick={confirmDeleteNote}>
                        {t("casesPage.common.delete")}
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog open={Boolean(deleteDialogPropId)} onClose={() => setDeleteDialogPropId(null)}>
                <DialogTitle>{t("casesPage.dialog.deleteProperty.title")}</DialogTitle>
                <DialogContent>
                    <DialogContentText>{t("casesPage.dialog.deleteProperty.description")}</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogPropId(null)}>{t("casesPage.common.cancel")}</Button>
                    <Button color="error" variant="contained" onClick={confirmDeleteProperty}>
                        {t("casesPage.common.delete")}
                    </Button>
                </DialogActions>
            </Dialog>
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
