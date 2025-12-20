import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Chip,
    Collapse,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    IconButton,
    InputAdornment,
    ListItemIcon,
    ListItemText,
    ListSubheader,
    Menu,
    OutlinedInput,
    Snackbar,
    Stack,
    TextField,
    Typography,
    alpha,
    useTheme,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import { auth, db } from "../../firebase";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
    where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import NoteOutlinedIcon from "@mui/icons-material/NoteOutlined";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import DashboardBackButton from "../components/DashboardBackButton";

type Note = {
    id: string;
    title?: string;
    content: string;
    topic?: string;
    country?: string;
    createdAt?: Timestamp;
    linkedCaseId?: string;
    linkedCaseTitle?: string;
};

type CaseSummary = {
    id: string;
    title?: string;
};

type NoteFilters = {
    timeframe: "any" | "7d" | "30d";
    caseId: string;
};

const getNotesCutoff = (range: NoteFilters["timeframe"]) => {
    if (range === "any") return null;
    const days = range === "7d" ? 7 : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return Timestamp.fromDate(cutoff);
};

const NotesPage: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const [notes, setNotes] = useState<Note[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [uid, setUid] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [noteDialogOpen, setNoteDialogOpen] = useState(false);
    const [noteTitle, setNoteTitle] = useState("");
    const [noteContent, setNoteContent] = useState("");
    const [noteCaseId, setNoteCaseId] = useState("");
    const [noteSaving, setNoteSaving] = useState(false);
    const [noteError, setNoteError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<"lawyer" | "client" | null>(null);
    const [subscriptionTier, setSubscriptionTier] = useState<"free" | "plus" | "premium">("free");
    const [lawyerCases, setLawyerCases] = useState<CaseSummary[]>([]);
    const [noteFilters, setNoteFilters] = useState<NoteFilters>({ timeframe: "any", caseId: "" });
    const [noteFilterAnchorEl, setNoteFilterAnchorEl] = useState<null | HTMLElement>(null);
    const noteFilterMenuOpen = Boolean(noteFilterAnchorEl);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (!u) return navigate("/login");
            setUid(u.uid);
        });
        return () => unsub();
    }, [navigate]);

    useEffect(() => {
        if (!uid) return;
        setLoading(true);
        const constraints = [];
        if (noteFilters.caseId) {
            constraints.push(where("linkedCaseId", "==", noteFilters.caseId));
        }
        const cutoff = getNotesCutoff(noteFilters.timeframe);
        if (cutoff) {
            constraints.push(where("createdAt", ">=", cutoff));
        }
        constraints.push(orderBy("createdAt", "desc"));

        const q = query(collection(db, "users", uid, "notes"), ...constraints);
        const unsub = onSnapshot(
            q,
            (snap) => {
                const list: Note[] = snap.docs.map((d) => ({
                    ...(d.data() as Note),
                    id: d.id,
                }));
                setNotes(list);
                setLoading(false);
            },
            (err) => {
                console.error("Failed to load notes", err);
                setLoading(false);
            }
        );
        return () => unsub();
    }, [uid, noteFilters]);

    useEffect(() => {
        if (!uid) return;
        const unsub = onSnapshot(doc(db, "users", uid), (snap) => {
            if (!snap.exists()) {
                setUserRole(null);
                setSubscriptionTier("free");
                return;
            }
            const data = snap.data();
            const role = data.role as "lawyer" | "client" | undefined;
            setUserRole(role ?? null);
            const tier = data.subscriptionTier as "free" | "plus" | "premium" | undefined;
            setSubscriptionTier(tier ?? "free");
        });
        return () => unsub();
    }, [uid]);

    const canLinkCase = useMemo(
        () => userRole === "lawyer" && subscriptionTier === "premium",
        [userRole, subscriptionTier]
    );
    const openNoteFilterMenu = (event: React.MouseEvent<HTMLElement>) => {
        setNoteFilterAnchorEl(event.currentTarget);
    };
    const closeNoteFilterMenu = () => setNoteFilterAnchorEl(null);
    const handleNoteTimeChange = (timeframe: NoteFilters["timeframe"]) => {
        setNoteFilters((prev) => ({ ...prev, timeframe }));
        closeNoteFilterMenu();
    };
    const handleNoteCaseChange = (caseId: string) => {
        setNoteFilters((prev) => ({ ...prev, caseId }));
        closeNoteFilterMenu();
    };
    const resetNoteFilters = () => {
        setNoteFilters({ timeframe: "any", caseId: "" });
        closeNoteFilterMenu();
    };
    const clearNoteFilterChip = (key: "time" | "case") => {
        setNoteFilters((prev) =>
            key === "time" ? { ...prev, timeframe: "any" } : { ...prev, caseId: "" }
        );
    };

    useEffect(() => {
        if (!uid || !canLinkCase) {
            setLawyerCases([]);
            return;
        }
        const q = query(collection(db, "cases"), where("lawyerId", "==", uid));
        const unsub = onSnapshot(q, (snap) => {
            const next = snap.docs.map((d) => {
                const data = d.data() as CaseSummary;
                return { ...data, id: d.id };
            });
            setLawyerCases(next);
        });
        return () => unsub();
    }, [uid, canLinkCase]);

    useEffect(() => {
        if (!canLinkCase && noteFilters.caseId) {
            setNoteFilters((prev) => ({ ...prev, caseId: "" }));
        }
    }, [canLinkCase, noteFilters.caseId]);

    const handleDelete = async () => {
        if (!deleteId || !uid) return;
        await deleteDoc(doc(db, "users", uid, "notes", deleteId));
        setDeleteId(null);
    };

    const resetNoteDialog = () => {
        setNoteTitle("");
        setNoteContent("");
        setNoteCaseId("");
        setNoteError(null);
    };

    const handleSaveNote = async () => {
        if (!uid) return;
        if (!noteContent.trim()) {
            setNoteError(t("notesPage.manualDialog.errors.content"));
            return;
        }
        setNoteSaving(true);
        setNoteError(null);
        try {
            const payload: Record<string, unknown> = {
                title: noteTitle.trim() ? noteTitle.trim() : null,
                content: noteContent.trim(),
                createdAt: serverTimestamp(),
            };
            const linked = canLinkCase && noteCaseId ? lawyerCases.find((c) => c.id === noteCaseId) : null;
            payload.linkedCaseId = noteCaseId || null;
            payload.linkedCaseTitle = linked?.title ?? null;
            await addDoc(collection(db, "users", uid, "notes"), payload);
            setSuccessMsg(t("notesPage.manualDialog.success"));
            setNoteDialogOpen(false);
            resetNoteDialog();
        } catch (err) {
            console.error("Failed to save note", err);
            setNoteError(t("notesPage.manualDialog.errors.save"));
        } finally {
            setNoteSaving(false);
        }
    };

    const visibleNotes = useMemo(() => {
        const queryText = search.trim().toLowerCase();
        if (!queryText) return notes;
        return notes.filter(
            (n) =>
                n.title?.toLowerCase().includes(queryText) ||
                n.content.toLowerCase().includes(queryText) ||
                n.linkedCaseTitle?.toLowerCase().includes(queryText)
        );
    }, [notes, search]);
    const noteFilterChips = useMemo(() => {
        const chips: { key: "time" | "case"; label: string }[] = [];
        if (noteFilters.timeframe !== "any") {
            chips.push({ key: "time", label: t(`notesPage.filters.time.${noteFilters.timeframe}`) });
        }
        if (noteFilters.caseId) {
            const label =
                lawyerCases.find((c) => c.id === noteFilters.caseId)?.title ||
                t("notesPage.note.unknownCase");
            chips.push({ key: "case", label });
        }
        return chips;
    }, [noteFilters, lawyerCases, t]);
    const noteTimeOptions = useMemo(
        () => [
            { value: "any", label: t("notesPage.filters.time.any") },
            { value: "7d", label: t("notesPage.filters.time.7d") },
            { value: "30d", label: t("notesPage.filters.time.30d") },
        ],
        [t]
    );

    return (
        <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
            <Box sx={{ mb: 2 }}>
                <DashboardBackButton />
            </Box>
            <Card
                sx={{
                    mb: 4,
                    borderRadius: 4,
                    background: alpha(theme.palette.primary.main, 0.08),
                }}
            >
                <CardContent>
                    <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                            <NoteOutlinedIcon fontSize="large" sx={{ color: theme.palette.primary.main }} />
                            <Box>
                                <Typography variant="h5" fontWeight={900}>
                                    {t("notesPage.hero.title")}
                                </Typography>
                                <Typography color="text.secondary">
                                    {t("notesPage.hero.subtitle")}
                                </Typography>
                            </Box>
                        </Stack>
                        <Chip label={t("notesPage.hero.count", { count: visibleNotes.length })} color="primary" variant="outlined" />
                    </Stack>
                </CardContent>
            </Card>

            <Stack spacing={1.5} mb={3}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <OutlinedInput
                        fullWidth
                        placeholder={t("notesPage.search.placeholder")}
                        startAdornment={
                            <InputAdornment position="start">
                                <SearchRoundedIcon color="action" />
                            </InputAdornment>
                        }
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        sx={{ borderRadius: 3 }}
                    />
                    <Button
                        variant="outlined"
                        startIcon={<TuneRoundedIcon />}
                        onClick={openNoteFilterMenu}
                        sx={{ alignSelf: { xs: "stretch", md: "flex-start" } }}
                    >
                        {t("notesPage.filters.menu")}
                    </Button>
                </Stack>
                {noteFilterChips.length > 0 && (
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {noteFilterChips.map((chip) => (
                            <Chip
                                key={`${chip.key}-${chip.label}`}
                                label={chip.label}
                                onDelete={() => clearNoteFilterChip(chip.key)}
                                size="small"
                            />
                        ))}
                    </Stack>
                )}
            </Stack>
            <Menu anchorEl={noteFilterAnchorEl} open={noteFilterMenuOpen} onClose={closeNoteFilterMenu} keepMounted>
                <ListSubheader disableSticky>{t("notesPage.filters.created")}</ListSubheader>
                {noteTimeOptions.map((option) => {
                    const selected = noteFilters.timeframe === option.value;
                    return (
                        <MenuItem key={option.value} selected={selected} onClick={() => handleNoteTimeChange(option.value as NoteFilters["timeframe"])}>
                            <ListItemIcon>
                                {selected ? <CheckRoundedIcon fontSize="small" /> : <Box sx={{ width: 12 }} />}
                            </ListItemIcon>
                            <ListItemText primary={option.label} />
                        </MenuItem>
                    );
                })}
                {canLinkCase && (
                    <>
                        <Divider />
                        <ListSubheader disableSticky>{t("notesPage.filters.case")}</ListSubheader>
                        <MenuItem selected={!noteFilters.caseId} onClick={() => handleNoteCaseChange("")}>
                            <ListItemIcon>
                                {!noteFilters.caseId ? <CheckRoundedIcon fontSize="small" /> : <Box sx={{ width: 12 }} />}
                            </ListItemIcon>
                            <ListItemText primary={t("notesPage.filters.caseAll")} />
                        </MenuItem>
                        {lawyerCases.length === 0 && (
                            <MenuItem disabled>
                                <ListItemText primary={t("notesPage.filters.noCases")} />
                            </MenuItem>
                        )}
                        {lawyerCases.map((c) => {
                            const selected = noteFilters.caseId === c.id;
                            return (
                                <MenuItem key={c.id} selected={selected} onClick={() => handleNoteCaseChange(c.id)}>
                                    <ListItemIcon>
                                        {selected ? <CheckRoundedIcon fontSize="small" /> : <Box sx={{ width: 12 }} />}
                                    </ListItemIcon>
                                    <ListItemText primary={c.title || t("notesPage.note.unknownCase")} />
                                </MenuItem>
                            );
                        })}
                    </>
                )}
                <Divider />
                <MenuItem
                    onClick={resetNoteFilters}
                    disabled={noteFilters.timeframe === "any" && !noteFilters.caseId}
                >
                    <ListItemText primary={t("notesPage.filters.clear")} />
                </MenuItem>
            </Menu>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} width={{ xs: "100%", md: "auto" }} mb={4}>
                <Button
                    variant="contained"
                    sx={{ flex: 1 }}
                    onClick={() => {
                        setNoteDialogOpen(true);
                        resetNoteDialog();
                    }}
                >
                    {t("notesPage.actions.createManual")}
                </Button>
                <Button
                    variant="outlined"
                    component={RouterLink}
                    to="/ai/chat"
                    sx={{ flex: 1 }}
                >
                    {t("notesPage.actions.createFromChat")}
                </Button>
            </Stack>

            {loading ? (
                <Typography>{t("notesPage.loading")}</Typography>
            ) : visibleNotes.length === 0 ? (
                <Stack alignItems="center" justifyContent="center" mt={6} sx={{ opacity: 0.8 }}>
                    <NoteOutlinedIcon fontSize="large" sx={{ color: "text.disabled" }} />
                    <Typography variant="body1" color="text.secondary" mt={1}>
                        {t("notesPage.empty")}
                    </Typography>
                </Stack>
            ) : (
                <Grid container spacing={3}>
                    {visibleNotes.map((note) => {
                        const expanded = expandedId === note.id;
                        const initials = note.title
                            ? note.title.charAt(0).toUpperCase()
                            : t("notesPage.note.initialFallback");
                        const subtitle = [
                            note.topic && t("notesPage.note.topic", { topic: note.topic }),
                            note.country && t("notesPage.note.country", { country: note.country }),
                            note.createdAt &&
                            new Date(note.createdAt.toDate()).toLocaleDateString(i18n.language),
                        ]
                            .filter(Boolean)
                            .join(" • ");

                        return (
                            <Grid size={{ xs: 12, md: 6 }} key={note.id}>
                                <Card sx={{ borderRadius: 4 }}>
                                    <CardHeader
                                        avatar={
                                            <Avatar
                                                sx={{
                                                    bgcolor: theme.palette.primary.main,
                                                    color: theme.palette.getContrastText(
                                                        theme.palette.primary.main
                                                    ),
                                                }}
                                            >
                                                {initials}
                                            </Avatar>
                                        }
                                        action={
                                            <Stack direction="row">
                                                <IconButton
                                                    onClick={() =>
                                                        setExpandedId(expanded ? null : note.id)
                                                    }
                                                >
                                                    {expanded ? (
                                                        <ExpandLessRoundedIcon />
                                                    ) : (
                                                        <ExpandMoreRoundedIcon />
                                                    )}
                                                </IconButton>
                                                <IconButton
                                                    color="error"
                                                    onClick={() => setDeleteId(note.id)}
                                                >
                                                    <DeleteOutlineRoundedIcon />
                                                </IconButton>
                                            </Stack>
                                        }
                                        title={
                                            <Typography fontWeight={800} fontSize={17}>
                                                {note.title ?? t("notesPage.note.untitled")}
                                            </Typography>
                                        }
                                        subheader={subtitle}
                                    />
                                    <Collapse in={expanded} timeout="auto" unmountOnExit>
                                        <Divider />
                                        <CardContent>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}
                                            >
                                                {note.content}
                                            </Typography>
                                            {note.linkedCaseId && (
                                                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} mt={3} alignItems={{ sm: "center" }}>
                                                    <Chip
                                                        icon={<LinkRoundedIcon fontSize="small" />}
                                                        label={t("notesPage.note.linkedCase", {
                                                            case: note.linkedCaseTitle || t("notesPage.note.unknownCase"),
                                                        })}
                                                        variant="outlined"
                                                    />
                                                    <Button
                                                        component={RouterLink}
                                                        to={`/cases/${note.linkedCaseId}`}
                                                        size="small"
                                                        sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
                                                    >
                                                        {t("notesPage.note.viewCase")}
                                                    </Button>
                                                </Stack>
                                            )}
                                        </CardContent>
                                    </Collapse>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {/* Delete Dialog */}
            <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
                <DialogTitle>{t("notesPage.dialog.title")}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {t("notesPage.dialog.description")}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteId(null)}>{t("notesPage.dialog.cancel")}</Button>
                    <Button onClick={handleDelete} color="error" variant="contained">
                        {t("notesPage.dialog.confirm")}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={noteDialogOpen} onClose={() => setNoteDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>{t("notesPage.manualDialog.title")}</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        {t("notesPage.manualDialog.description")}
                    </DialogContentText>
                    {noteError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {noteError}
                        </Alert>
                    )}
                    <TextField
                        fullWidth
                        label={t("notesPage.manualDialog.titleLabel")}
                        value={noteTitle}
                        onChange={(e) => setNoteTitle(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label={t("notesPage.manualDialog.contentLabel")}
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        multiline
                        minRows={4}
                        sx={{ mb: canLinkCase ? 2 : 0 }}
                    />
                    {canLinkCase && (
                        <TextField
                            select
                            fullWidth
                            label={t("notesPage.manualDialog.caseLabel")}
                            value={noteCaseId}
                            onChange={(e) => setNoteCaseId(e.target.value)}
                            helperText={
                                lawyerCases.length
                                    ? t("notesPage.manualDialog.caseHelper")
                                    : t("notesPage.manualDialog.caseEmpty")
                            }
                            disabled={!lawyerCases.length}
                        >
                            <MenuItem value="">
                                {t("notesPage.manualDialog.caseNone")}
                            </MenuItem>
                            {lawyerCases.map((c) => (
                                <MenuItem key={c.id} value={c.id}>
                                    {c.title || t("notesPage.note.unknownCase")}
                                </MenuItem>
                            ))}
                        </TextField>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setNoteDialogOpen(false);
                        resetNoteDialog();
                    }}>
                        {t("notesPage.manualDialog.cancel")}
                    </Button>
                    <Button onClick={handleSaveNote} variant="contained" disabled={noteSaving}>
                        {noteSaving ? t("notesPage.manualDialog.saving") : t("notesPage.manualDialog.save")}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={!!successMsg}
                autoHideDuration={4000}
                onClose={() => setSuccessMsg(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert severity="success" onClose={() => setSuccessMsg(null)}>
                    {successMsg}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default NotesPage;
