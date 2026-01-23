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
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
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
import { useTranslation } from "react-i18next";
import PageHero from "../components/PageHero";

type DocumentItem = {
    id: string;
    fileName: string;
    url: string;
    uploadedAt?: Timestamp | Date | string | null;
    type?: string;
    mimeType?: string;
};

type Filter = "all" | "pdf" | "images" | "docs";

const formatWhen = (value?: Timestamp | Date | string | null, formatter?: (key: string, params?: Record<string, unknown>) => string): string => {
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
        if (diffSec < 60) return formatter ? formatter("justNow") : "just now";
        const diffMin = Math.floor(diffSec / 60);
        if (diffMin < 60) return formatter ? formatter("minutesAgo", { count: diffMin }) : `${diffMin} min ago`;
        const diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24)
            return formatter
                ? formatter("hoursAgo", { count: diffHr })
                : `${diffHr} hr${diffHr > 1 ? "s" : ""} ago`;
        const diffDay = Math.floor(diffHr / 24);
        if (diffDay < 7)
            return formatter
                ? formatter("daysAgo", { count: diffDay })
                : `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
        return formatter ? formatter("date", { value: date.toLocaleString() }) : date.toLocaleString();
    } catch {
        return formatter ? formatter("unknown") : "unknown";
    }
};

const MyDocumentsPage: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
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
            setSnackbar({ open: true, text: t("myDocuments.errors.load") });
        } finally {
            setLoading(false);
        }
    }, [user, t]);

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
        if (!user || !window.confirm(t("myDocuments.delete.confirm", { name: item.fileName }))) return;
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
            setSnackbar({ open: true, text: t("myDocuments.success.deleted") });
        } catch (error) {
            console.error("Delete failed", error);
            setSnackbar({ open: true, text: t("myDocuments.errors.delete") });
        } finally {
            setDeletingId(null);
        }
    };

    const handleCopyLink = async (url: string) => {
        try {
            await navigator.clipboard.writeText(url);
            setSnackbar({ open: true, text: t("myDocuments.success.copied") });
        } catch {
            setSnackbar({ open: true, text: t("myDocuments.errors.clipboard") });
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
        setSnackbar({ open: true, text: t("myDocuments.success.download") });
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

    const formatRelativeWhen = useCallback(
        (value?: Timestamp | Date | string | null) =>
            formatWhen(value, (key, params) => t(`myDocuments.when.${key}`, params)),
        [t]
    );

    if (!user) {
        return (
            <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
                <CircularProgress />
                <Typography mt={3} color="text.secondary">
                    {t("myDocuments.loadingAuth")}
                </Typography>
            </Container>
        );
    }

    const latestUpload = docs[0]?.uploadedAt;
    const pdfCount = docs.filter((docItem) => docItem.fileName?.toLowerCase().endsWith(".pdf")).length;
    const imageCount = docs.filter((docItem) => /\.(png|jpe?g|gif|bmp|webp)$/i.test(docItem.fileName ?? "")).length;
    const docCount = docs.filter((docItem) => /\.(docx?|pptx?|xlsx?)$/i.test(docItem.fileName ?? "")).length;

    const heroStats = [
        {
            label: t("myDocuments.stats.total", { defaultValue: "Total files" }),
            value: docs.length.toString(),
        },
        {
            label: t("myDocuments.stats.lastUpload", { defaultValue: "Last upload" }),
            value: docs.length
                ? formatRelativeWhen(latestUpload)
                : t("myDocuments.stats.none", { defaultValue: "No files yet" }),
        },
        {
            label: t("myDocuments.stats.mix", { defaultValue: "File mix" }),
            value: `${pdfCount} PDF · ${imageCount} IMG · ${docCount} DOC`,
        },
    ];

    return (
        <>
            <PageHero
                title={t("myDocuments.hero.title")}
                subtitle={t("myDocuments.hero.subtitle")}
                overline={t("myDocuments.hero.overline", { defaultValue: "Documents workspace" })}
                icon={<FolderOpenIcon />}
                variant="soft"
                actions={
                    <>
                        <Button
                            component={RouterLink}
                            to="/documents"
                            variant="text"
                            startIcon={<ArrowBackIcon />}
                            sx={{ borderRadius: 3 }}
                        >
                            {t("myDocuments.hero.back", { defaultValue: "Back to overview" })}
                        </Button>
                        <Button
                            component={RouterLink}
                            to="/documents/generate"
                            variant="contained"
                            sx={{ borderRadius: 3, fontWeight: 800 }}
                        >
                            {t("myDocuments.hero.new")}
                        </Button>
                    </>
                }
            >
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={{ xs: 2, sm: 4 }}
                    flexWrap="wrap"
                >
                    {heroStats.map((stat) => (
                        <Stack key={stat.label} spacing={0.5}>
                            <Typography variant="h5" fontWeight={900}>
                                {stat.value}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                {stat.label}
                            </Typography>
                        </Stack>
                    ))}
                </Stack>
            </PageHero>

            <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 } }}>
                <Stack spacing={3}>
                    <Card sx={{ borderRadius: 4 }}>
                    <CardContent>
                        <Stack
                            spacing={2}
                            direction={{ xs: "column", md: "row" }}
                            alignItems={{ xs: "stretch", md: "center" }}
                        >
                            <TextField
                                label={t("myDocuments.filters.search")}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                sx={{ flex: 1 }}
                                fullWidth
                            />
                            <ToggleButtonGroup
                                value={filter}
                                exclusive
                                onChange={(_, val) => val && setFilter(val)}
                                size="small"
                                sx={{
                                    flexWrap: { xs: "wrap", sm: "nowrap" },
                                    width: { xs: "100%", sm: "auto" },
                                    justifyContent: { xs: "space-between", sm: "flex-start" },
                                }}
                            >
                                <ToggleButton value="all">{t("myDocuments.filters.all")}</ToggleButton>
                                <ToggleButton value="pdf">{t("myDocuments.filters.pdf")}</ToggleButton>
                                <ToggleButton value="images">{t("myDocuments.filters.images")}</ToggleButton>
                                <ToggleButton value="docs">{t("myDocuments.filters.docs")}</ToggleButton>
                            </ToggleButtonGroup>
                            <Button
                                variant="text"
                                startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
                                onClick={onRefresh}
                                disabled={refreshing}
                                sx={{ width: { xs: "100%", md: "auto" } }}
                            >
                                {refreshing ? t("myDocuments.filters.refreshing") : t("myDocuments.filters.refresh")}
                            </Button>
                        </Stack>
                    </CardContent>
                    </Card>

                    {loading ? (
                    <Box textAlign="center" py={6}>
                        <CircularProgress />
                        <Typography mt={2} color="text.secondary">
                            {t("myDocuments.loadingDocs")}
                        </Typography>
                    </Box>
                ) : filteredDocs.length === 0 ? (
                    <Card sx={{ borderRadius: 4 }}>
                        <CardContent sx={{ textAlign: "center" }}>
                            <Typography variant="h6" fontWeight={800}>
                                {t("myDocuments.empty.title")}
                            </Typography>
                            <Typography color="text.secondary" sx={{ mb: 2 }}>
                                {t("myDocuments.empty.subtitle")}
                            </Typography>
                            <Button component={RouterLink} to="/documents/generate" variant="contained">
                                {t("myDocuments.empty.cta")}
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Grid container spacing={{ xs: 3, md: 4 }}>
                        {filteredDocs.map((item) => (
                            <Grid size={{ xs: 12, md: 6 }} key={item.id}>
                                <Card sx={{ borderRadius: 4, height: "100%", display: "flex", flexDirection: "column" }}>
                                    <CardContent>
                                        <Stack spacing={1.5}>
                                            <Typography variant="h6" fontWeight={800}>
                                                {item.fileName || "Untitled document"}
                                            </Typography>
                                            <Stack direction="row" spacing={1} flexWrap="wrap">
                                                <Chip label={formatRelativeWhen(item.uploadedAt)} size="small" />
                                                {item.mimeType && <Chip label={item.mimeType} size="small" />}
                                            </Stack>
                                       </Stack>
                                   </CardContent>
                                   <CardActions sx={{ px: 3, pb: 3, mt: "auto" }}>
                                        <Tooltip title={t("myDocuments.actions.open")}>
                                            <IconButton onClick={() => window.open(item.url, "_blank")}>
                                                <OpenInNewIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title={t("myDocuments.actions.download")}>
                                            <span>
                                                <IconButton onClick={() => handleDownload(item)}>
                                                    <DownloadOutlinedIcon />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                        <Tooltip title={t("myDocuments.actions.copy")}>
                                            <IconButton onClick={() => handleCopyLink(item.url)}>
                                                <ContentCopyIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Box flex={1} />
                                        <Tooltip title={t("myDocuments.actions.delete")}>
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
            </Container>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ open: false, text: "" })}
                message={snackbar.text}
            />
        </>
    );
};

export default MyDocumentsPage;
