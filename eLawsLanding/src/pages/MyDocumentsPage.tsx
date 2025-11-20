import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    IconButton,
    Snackbar,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import RefreshIcon from "@mui/icons-material/Refresh";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
    Timestamp,
    collection,
    deleteDoc,
    doc,
    getDocs,
    orderBy,
    query,
} from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { auth, db, storage } from "../../firebase";

type DocumentItem = {
    id: string;
    fileName: string;
    url: string;
    uploadedAt?: Timestamp | Date | string | null;
    type?: string;
    mimeType?: string;
};

type Filter = "all" | "pdf" | "images" | "docs";

const formatWhen = (value?: Timestamp | Date | string | null): string => {
    try {
        const date =
            value instanceof Timestamp
                ? value.toDate()
                : value instanceof Date
                    ? value
                    : value
                        ? new Date(value)
                        : new Date();
        const diffMs = Date.now() - date.getTime();
        const diffSec = Math.max(1, Math.floor(diffMs / 1000));
        if (diffSec < 60) return "just now";
        const diffMin = Math.floor(diffSec / 60);
        if (diffMin < 60) return `${diffMin} min ago`;
        const diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24) return `${diffHr} hr${diffHr > 1 ? "s" : ""} ago`;
        const diffDay = Math.floor(diffHr / 24);
        if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
        return date.toLocaleString();
    } catch {
        return "unknown";
    }
};

const MyDocumentsPage: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(auth.currentUser);
    const [docs, setDocs] = useState<DocumentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<Filter>("all");
    const [refreshing, setRefreshing] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; text: string }>({ open: false, text: "" });
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (!u) {
                setUser(null);
                navigate("/login");
                return;
            }
            setUser(u);
        });
        return () => unsub();
    }, [navigate]);

    const fetchDocs = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const q = query(collection(db, "documents", user.uid, "files"), orderBy("uploadedAt", "desc"));
            const snapshot = await getDocs(q);
            const list = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<DocumentItem, "id">) }));
            setDocs(list);
        } catch (error) {
            console.error("Failed to load documents", error);
            setSnackbar({ open: true, text: "Failed to load documents." });
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (!user) return;
        fetchDocs();
    }, [user, fetchDocs]);

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await fetchDocs();
        } finally {
            setRefreshing(false);
        }
    };

    const handleDelete = async (item: DocumentItem) => {
        if (!user || !window.confirm(`Delete "${item.fileName}"?`)) return;
        setDeletingId(item.id);
        try {
            const path = decodeURIComponent(item.url.split("/o/")[1]?.split("?")[0] ?? "");
            if (path) {
                await deleteObject(ref(storage, path)).catch((err) => {
                    console.warn("Storage delete skipped", err);
                });
            }
            await deleteDoc(doc(db, "documents", user.uid, "files", item.id));
            setDocs((prev) => prev.filter((docItem) => docItem.id !== item.id));
            setSnackbar({ open: true, text: "Document deleted." });
        } catch (error) {
            console.error("Delete failed", error);
            setSnackbar({ open: true, text: "Unable to delete document." });
        } finally {
            setDeletingId(null);
        }
    };

    const handleCopyLink = async (url: string) => {
        try {
            await navigator.clipboard.writeText(url);
            setSnackbar({ open: true, text: "Link copied to clipboard." });
        } catch {
            setSnackbar({ open: true, text: "Clipboard unavailable." });
        }
    };

    const getSafeFileName = (name: string) => name.replace(/[\\/\\?%*:|"<>]/g, "_").trim() || `file_${Date.now()}`;

    const handleDownload = (item: DocumentItem) => {
        const a = document.createElement("a");
        a.href = item.url;
        a.target = "_blank";
        a.download = getSafeFileName(item.fileName || "document");
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setSnackbar({ open: true, text: "Download started." });
    };

    const filteredDocs = useMemo(() => {
        const term = search.trim().toLowerCase();
        return docs.filter((docItem) => {
            const matchesSearch =
                !term ||
                docItem.fileName?.toLowerCase().includes(term) ||
                docItem.type?.toLowerCase().includes(term) ||
                docItem.mimeType?.toLowerCase().includes(term);
            if (!matchesSearch) return false;
            if (filter === "all") return true;
            const file = docItem.fileName?.toLowerCase() ?? "";
            if (filter === "pdf") return file.endsWith(".pdf");
            if (filter === "images") return /\.(png|jpe?g|gif|bmp|webp)$/i.test(file);
            if (filter === "docs") return /\.(docx?|pptx?|xlsx?)$/i.test(file);
            return true;
        });
    }, [docs, search, filter]);

    if (!user) {
        return (
            <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
                <CircularProgress />
                <Typography mt={3} color="text.secondary">
                    Checking your account…
                </Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 } }}>
            <Stack spacing={3}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <IconButton component={RouterLink} to="/documents">
                        <ArrowBackIcon />
                    </IconButton>
                    <Box>
                        <Typography variant="h4" fontWeight={900}>
                            My Documents
                        </Typography>
                        <Typography color="text.secondary">Download, copy, or delete any generated files.</Typography>
                    </Box>
                    <Box flex={1} />
                    <Button component={RouterLink} to="/documents/generate" variant="contained" sx={{ borderRadius: 3 }}>
                        New document
                    </Button>
                </Stack>

                <Card sx={{ borderRadius: 4 }}>
                    <CardContent>
                        <Stack spacing={2} direction={{ xs: "column", md: "row" }} alignItems={{ md: "center" }}>
                            <TextField
                                label="Search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                sx={{ flex: 1 }}
                            />
                            <ToggleButtonGroup
                                value={filter}
                                exclusive
                                onChange={(_, val) => val && setFilter(val)}
                                size="small"
                            >
                                <ToggleButton value="all">All</ToggleButton>
                                <ToggleButton value="pdf">PDF</ToggleButton>
                                <ToggleButton value="images">Images</ToggleButton>
                                <ToggleButton value="docs">Docs</ToggleButton>
                            </ToggleButtonGroup>
                            <Button
                                variant="text"
                                startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
                                onClick={onRefresh}
                                disabled={refreshing}
                            >
                                Refresh
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>

                {loading ? (
                    <Box textAlign="center" py={6}>
                        <CircularProgress />
                        <Typography mt={2} color="text.secondary">
                            Loading your documents…
                        </Typography>
                    </Box>
                ) : filteredDocs.length === 0 ? (
                    <Card sx={{ borderRadius: 4 }}>
                        <CardContent sx={{ textAlign: "center" }}>
                            <Typography variant="h6" fontWeight={800}>
                                No documents yet
                            </Typography>
                            <Typography color="text.secondary" sx={{ mb: 2 }}>
                                Generate a document or adjust your filters.
                            </Typography>
                            <Button component={RouterLink} to="/documents/generate" variant="contained">
                                Generate document
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Grid container spacing={{ xs: 3, md: 4 }}>
                        {filteredDocs.map((item) => (
                            <Grid item xs={12} md={6} key={item.id}>
                                <Card sx={{ borderRadius: 4, height: "100%", display: "flex", flexDirection: "column" }}>
                                    <CardContent>
                                        <Stack spacing={1.5}>
                                            <Typography variant="h6" fontWeight={800}>
                                                {item.fileName || "Untitled document"}
                                            </Typography>
                                            <Stack direction="row" spacing={1} flexWrap="wrap">
                                                <Chip label={formatWhen(item.uploadedAt)} size="small" />
                                                {item.mimeType && <Chip label={item.mimeType} size="small" />}
                                            </Stack>
                                        </Stack>
                                    </CardContent>
                                    <CardActions sx={{ px: 3, pb: 3, mt: "auto" }}>
                                        <Tooltip title="Open in new tab">
                                            <IconButton onClick={() => window.open(item.url, "_blank")}>
                                                <OpenInNewIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Download">
                                            <span>
                                                <IconButton onClick={() => handleDownload(item)}>
                                                    <DownloadOutlinedIcon />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                        <Tooltip title="Copy link">
                                            <IconButton onClick={() => handleCopyLink(item.url)}>
                                                <ContentCopyIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Box flex={1} />
                                        <Tooltip title="Delete document">
                                            <span>
                                                <IconButton
                                                    color="error"
                                                    onClick={() => handleDelete(item)}
                                                    disabled={deletingId === item.id}
                                                >
                                                    {deletingId === item.id ? <CircularProgress size={18} /> : <DeleteOutlineIcon />}
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Stack>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ open: false, text: "" })}
                message={snackbar.text}
            />
        </Container>
    );
};

export default MyDocumentsPage;
