import React, { useEffect, useState } from "react";
import {
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
    Stack,
    Typography,
    alpha,
    useTheme,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { auth, db } from "../../firebase";
import {
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query, type Timestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import NoteOutlinedIcon from "@mui/icons-material/NoteOutlined";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { Link as RouterLink, useNavigate } from "react-router-dom";

type Note = {
    id: string;
    title?: string;
    content: string;
    topic?: string;
    country?: string;
    createdAt?: Timestamp;
};

const NotesPage: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [notes, setNotes] = useState<Note[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [uid, setUid] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);

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

    const handleDelete = async () => {
        if (!deleteId || !uid) return;
        await deleteDoc(doc(db, "users", uid, "notes", deleteId));
        setDeleteId(null);
    };

    const filteredNotes = notes.filter(
        (n) =>
            n.title?.toLowerCase().includes(search.toLowerCase()) ||
            n.content.toLowerCase().includes(search.toLowerCase())
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
                                    My Notes
                                </Typography>
                                <Typography color="text.secondary">
                                    Save, search, and organize every answer from the AI.
                                </Typography>
                            </Box>
                        </Stack>
                        <Chip label={`${filteredNotes.length} notes`} color="primary" variant="outlined" />
                    </Stack>
                </CardContent>
            </Card>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={4}>
                <OutlinedInput
                    fullWidth
                    placeholder="Search notes..."
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
                    variant="contained"
                    component={RouterLink}
                    to="/ai/chat"
                    sx={{ minWidth: { md: 200 }, width: { xs: "100%", md: "auto" } }}
                >
                    Create from chat
                </Button>
            </Stack>

            {loading ? (
                <Typography>Loading notes...</Typography>
            ) : filteredNotes.length === 0 ? (
                <Stack alignItems="center" justifyContent="center" mt={6} sx={{ opacity: 0.8 }}>
                    <NoteOutlinedIcon fontSize="large" sx={{ color: "text.disabled" }} />
                    <Typography variant="body1" color="text.secondary" mt={1}>
                        No notes found.
                    </Typography>
                </Stack>
            ) : (
                <Grid container spacing={3}>
                    {filteredNotes.map((note) => {
                        const expanded = expandedId === note.id;
                        const initials = note.title
                            ? note.title.charAt(0).toUpperCase()
                            : "N";
                        const subtitle = [
                            note.topic && `Topic: ${note.topic}`,
                            note.country && `Jurisdiction: ${note.country}`,
                            note.createdAt &&
                            new Date(note.createdAt.toDate()).toLocaleDateString(),
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
                                                {note.title ?? "Untitled Note"}
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
                <DialogTitle>Delete Note</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this note? This action cannot be
                        undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteId(null)}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default NotesPage;
