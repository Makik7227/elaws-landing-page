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
    type Timestamp,
    where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import NoteOutlinedIcon from "@mui/icons-material/NoteOutlined";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

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

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (!u) return navigate("/login");
            setUid(u.uid);
        });
        return () => unsub();
    }, [navigate]);

    useEffect(() => {
        if (!uid) return;
        const q = query(
            collection(db, "users", uid, "notes"),
            orderBy("createdAt", "desc")
        );
        const unsub = onSnapshot(q, (snap) => {
            const list: Note[] = snap.docs.map((d) => ({
                ...(d.data() as Note),
                id: d.id,
            }));
            setNotes(list);
            setLoading(false);
        });
        return () => unsub();
    }, [uid]);

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
            if (canLinkCase && noteCaseId) {
                const linked = lawyerCases.find((c) => c.id === noteCaseId);
                payload.linkedCaseId = noteCaseId;
                payload.linkedCaseTitle = linked?.title ?? "";
            }
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

    const filteredNotes = useMemo(
        () =>
            notes.filter(
                (n) =>
                    n.title?.toLowerCase().includes(search.toLowerCase()) ||
                    n.content.toLowerCase().includes(search.toLowerCase()) ||
                    n.linkedCaseTitle?.toLowerCase().includes(search.toLowerCase())
            ),
        [notes, search]
    );

    return (
        <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
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
                            <IconButton onClick={() => navigate('/dashboard')}>
                                <ArrowBackRoundedIcon />
                            </IconButton>
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
                        <Chip label={t("notesPage.hero.count", { count: filteredNotes.length })} color="primary" variant="outlined" />
                    </Stack>
                </CardContent>
            </Card>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={4}>
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
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} width={{ xs: "100%", md: "auto" }}>
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
            </Stack>

            {loading ? (
                <Typography>{t("notesPage.loading")}</Typography>
            ) : filteredNotes.length === 0 ? (
                <Stack alignItems="center" justifyContent="center" mt={6} sx={{ opacity: 0.8 }}>
                    <NoteOutlinedIcon fontSize="large" sx={{ color: "text.disabled" }} />
                    <Typography variant="body1" color="text.secondary" mt={1}>
                        {t("notesPage.empty")}
                    </Typography>
                </Stack>
            ) : (
                <Grid container spacing={3}>
                    {filteredNotes.map((note) => {
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
