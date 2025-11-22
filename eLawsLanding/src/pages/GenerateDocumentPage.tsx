import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    Divider,
    IconButton,
    Snackbar,
    Stack,
    TextField,
    Typography,
    alpha,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import Autocomplete from "@mui/material/Autocomplete";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import BoltIcon from "@mui/icons-material/Bolt";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
    QueryDocumentSnapshot,
    addDoc,
    collection,
    getDocs,
    serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../../firebase";
import generateDocumentHTML from "../utils/generateDocumentHTML";
import { sendMessageToGPT } from "../api/chat";
import CustomDatePicker from "../components/CustomDatePicker";

type SchemaParamType = "text" | "textarea" | "number" | "date" | "email" | "list" | "dropdown";

type SchemaParam = {
    label: string;
    key: string;
    type: SchemaParamType;
    required?: boolean;
    options?: string[];
};

type SchemaDoc = {
    title: string;
    category: string;
    description?: string;
    parameters: SchemaParam[];
};

const SCHEMAS_CACHE_KEY = "docSchemasCache";
const DOC_CACHE_PREFIX = "docOutputCache:";

const stableStringify = (value: unknown): string => {
    if (value === null || typeof value !== "object") return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
};

const sanitizeFileName = (name: string) => {
    const base = name.replace(/[^a-zA-Z0-9\\-_. ]/g, "").trim().replace(/ +/g, "_");
    if (!base) return `AI_Document_${Date.now()}.html`;
    return base.toLowerCase().endsWith(".html") ? base : `${base}.html`;
};

const GenerateDocumentPage: React.FC = () => {
    const navigate = useNavigate();
    const [authReady, setAuthReady] = useState(false);
    const [user, setUser] = useState<User | null>(auth.currentUser);

    // schema state
    const [schemas, setSchemas] = useState<Record<string, SchemaDoc>>({});
    const [schemaOrder, setSchemaOrder] = useState<string[]>([]);
    const [schemasLoading, setSchemasLoading] = useState(true);
    const [schemasError, setSchemasError] = useState<string | null>(null);
    const [selectedSchemaId, setSelectedSchemaId] = useState<string>("");

    // form state
    const [formValues, setFormValues] = useState<Record<string, unknown>>({});
    const [formCache, setFormCache] = useState<Record<string, Record<string, unknown>>>({});
    const [listEditorDrafts, setListEditorDrafts] = useState<Record<string, string>>({});

    // generation state
    const [generating, setGenerating] = useState(false);
    const [output, setOutput] = useState("");
    const [tokensUsed, setTokensUsed] = useState<number | null>(null);
    const [usedCache, setUsedCache] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // save state
    const [saving, setSaving] = useState(false);
    const [fileName, setFileName] = useState("");
    const [snackbar, setSnackbar] = useState<{ open: boolean; text: string }>({ open: false, text: "" });

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setAuthReady(true);
            if (!u) navigate("/login");
        });
        return () => unsub();
    }, [navigate]);

    useEffect(() => {
        const loadSchemas = async () => {
            setSchemasLoading(true);
            setSchemasError(null);
            try {
                const raw = localStorage.getItem(SCHEMAS_CACHE_KEY);
                if (raw) {
                    try {
                        const parsed = JSON.parse(raw) as { ts: number; data: Record<string, SchemaDoc> };
                        const fresh = Date.now() - parsed.ts < 24 * 60 * 60 * 1000;
                        if (fresh) {
                            setSchemas(parsed.data);
                            setSchemaOrder(
                                Object.keys(parsed.data).sort((a, b) =>
                                    parsed.data[a].title.localeCompare(parsed.data[b].title)
                                )
                            );
                            setSchemasLoading(false);
                            return;
                        }
                    } catch {
                        // ignore invalid cache
                    }
                }
                const snapshot = await getDocs(collection(db, "schemas"));
                const data: Record<string, SchemaDoc> = {};
                snapshot.forEach((docSnap: QueryDocumentSnapshot) => {
                    data[docSnap.id] = docSnap.data() as SchemaDoc;
                });
                setSchemas(data);
                const order = Object.keys(data).sort((a, b) => data[a].title.localeCompare(data[b].title));
                setSchemaOrder(order);
                localStorage.setItem(SCHEMAS_CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
            } catch (err) {
                const message = err instanceof Error ? err.message : "Failed to load templates.";
                setSchemasError(message);
            } finally {
                setSchemasLoading(false);
            }
        };
        loadSchemas();
    }, []);

    useEffect(() => {
        if (!selectedSchemaId) return;
        const cached = formCache[selectedSchemaId];
        if (cached) {
            setFormValues(cached);
            return;
        }
        const schema = schemas[selectedSchemaId];
        if (schema) {
            const defaults: Record<string, unknown> = {};
            schema.parameters.forEach((param) => {
                defaults[param.key] = param.type === "list" ? [] : "";
            });
            setFormValues(defaults);
            setFormCache((prev) => ({ ...prev, [selectedSchemaId]: defaults }));
        }
    }, [selectedSchemaId, schemas, formCache]);

    const selectedSchema = selectedSchemaId ? schemas[selectedSchemaId] : null;

    const missingRequired = useMemo(() => {
        if (!selectedSchema) return [];
        const missing: string[] = [];
        selectedSchema.parameters.forEach((param) => {
            if (!param.required) return;
            const value = formValues[param.key];
            const isEmpty =
                value === undefined ||
                value === null ||
                (typeof value === "string" && value.trim() === "") ||
                (Array.isArray(value) && value.length === 0);
            if (isEmpty) missing.push(param.label);
        });
        return missing;
    }, [selectedSchema, formValues]);

    const schemaOptions = useMemo(
        () =>
            schemaOrder.map((id) => ({
                id,
                label: `${schemas[id].title} · ${schemas[id].category}`,
            })),
        [schemaOrder, schemas]
    );

    const setValue = useCallback(
        (key: string, value: unknown) => {
            setFormValues((prev) => {
                const next = { ...prev, [key]: value };
                if (selectedSchemaId) {
                    setFormCache((cache) => ({ ...cache, [selectedSchemaId]: next }));
                }
                return next;
            });
        },
        [selectedSchemaId]
    );

    const buildUserPrompt = useCallback(() => {
        if (!selectedSchema) return "";
        const segments: string[] = [];
        segments.push(`Document Type: ${selectedSchema.title}`);
        segments.push(`Category: ${selectedSchema.category}`);
        segments.push(`Creation Date: ${new Date().toISOString().slice(0, 10)}`);
        segments.push("");
        segments.push("Provided Fields:");
        selectedSchema.parameters.forEach((param) => {
            const value = formValues[param.key];
            const formatted = Array.isArray(value) ? value.join(", ") : value ?? "";
            segments.push(`- ${param.label}: ${formatted}`);
        });
        segments.push("");
        segments.push("Use only supplied values. Omit optional sections when blank.");
        return segments.join("\n");
    }, [selectedSchema, formValues]);

    const handleGenerate = useCallback(async () => {
        try {
            setError(null);
            setOutput("");
            setTokensUsed(null);
            setUsedCache(false);
            if (!selectedSchemaId) throw new Error("Select a template to continue.");
            if (missingRequired.length) {
                throw new Error(`Missing required fields: ${missingRequired.join(", ")}`);
            }
            setGenerating(true);

            const cacheKey = `${DOC_CACHE_PREFIX}${selectedSchemaId}:${stableStringify(formValues)}`;
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                setOutput(cached);
                setUsedCache(true);
                return;
            }

            const messages = [
                {
                    role: "system" as const,
                    content:
                        "You are a professional legal document generator. Reply with structured HTML ready for PDF conversion. " +
                        "Include title page, numbered sections, clauses, and signature placeholders. Do not include commentary.",
                },
                {
                    role: "user" as const,
                    content: buildUserPrompt(),
                },
            ];

            const { content, tokensUsed: totalTokens } = await sendMessageToGPT(messages);
            setOutput(content);
            setTokensUsed(totalTokens);
            localStorage.setItem(cacheKey, content);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to generate document.";
            setError(message);
        } finally {
            setGenerating(false);
        }
    }, [selectedSchemaId, formValues, missingRequired, buildUserPrompt]);

    const handleSave = useCallback(async () => {
        try {
            if (!user) throw new Error("You must be signed in.");
            if (!output) throw new Error("Generate a document first.");
            setSaving(true);
            const html = generateDocumentHTML(output);
            const blob = new Blob([html], { type: "text/html" });
            const safeName = sanitizeFileName(fileName || `${selectedSchema?.title ?? "AI_Document"}`);
            const storageRef = ref(storage, `documents/${user.uid}/${safeName}`);
            await uploadBytes(storageRef, blob);
            const url = await getDownloadURL(storageRef);
            await addDoc(collection(db, "documents", user.uid, "files"), {
                fileName: safeName,
                url,
                uploadedAt: serverTimestamp(),
                type: "html",
                mimeType: "text/html",
            });
            setSnackbar({ open: true, text: "Saved to My Documents." });
            setFileName("");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to save document.";
            setSnackbar({ open: true, text: message });
        } finally {
            setSaving(false);
        }
    }, [user, output, fileName, selectedSchema]);

    if (!authReady || !user) {
        return (
            <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
                <CircularProgress />
                <Typography mt={3} color="text.secondary">
                    Preparing your workspace…
                </Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 } }}>
            <Stack spacing={4}>
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    alignItems={{ xs: "flex-start", md: "center" }}
                    spacing={{ xs: 1.5, md: 1 }}
                    justifyContent="space-between"
                >
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <IconButton component={RouterLink} to="/documents">
                            <ArrowBackIcon />
                        </IconButton>
                        <Box>
                            <Typography variant="h4" fontWeight={900}>
                                Generate a document
                            </Typography>
                            <Typography color="text.secondary">
                                Choose a schema, fill in the required data, and let AI craft the legal draft.
                            </Typography>
                        </Box>
                    </Stack>
                    <Button
                        component={RouterLink}
                        to="/documents/my"
                        variant="text"
                        sx={{ width: { xs: "100%", md: "auto" }, justifyContent: "flex-end" }}
                    >
                        View saved docs →
                    </Button>
                </Stack>

                <Grid container spacing={{ xs: 4, md: 5 }}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Card sx={{ borderRadius: 4, position: "sticky", top: 32 }}>
                            <CardContent>
                                <Stack spacing={2}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <LibraryBooksIcon color="primary" />
                                        <Typography variant="h6" fontWeight={800}>
                                            Templates
                                        </Typography>
                                    </Box>
                                    <Typography color="text.secondary">
                                        Templates are synced from your mobile workspace. Cached locally for faster loads.
                                    </Typography>
                                    <Divider />
                                    {schemasLoading ? (
                                        <Stack spacing={1}>
                                            <CircularProgress size={20} />
                                            <Typography color="text.secondary">Fetching templates…</Typography>
                                        </Stack>
                                    ) : (
                                        <Autocomplete
                                            options={schemaOptions}
                                            value={
                                                selectedSchemaId
                                                    ? schemaOptions.find((opt) => opt.id === selectedSchemaId) ?? null
                                                    : null
                                            }
                                            onChange={(_, value) => setSelectedSchemaId(value?.id ?? "")}
                                            getOptionLabel={(option) => option.label}
                                            renderInput={(params) => <TextField {...params} label="Choose a template" />}
                                        />
                                    )}
                                    {schemasError && <Alert severity="error">{schemasError}</Alert>}
                                    {missingRequired.length > 0 && (
                                        <Alert severity="warning">
                                            Missing required fields:
                                            <ul style={{ margin: "8px 0 0 16px" }}>
                                                {missingRequired.map((label) => (
                                                    <li key={label}>{label}</li>
                                                ))}
                                            </ul>
                                        </Alert>
                                    )}
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, md: 8 }}>
                        <Stack spacing={3}>
                            {selectedSchema ? (
                                <Card sx={{ borderRadius: 4 }}>
                                    <CardContent>
                                        <Stack spacing={2}>
                                            <Box>
                                                <Typography variant="h5" fontWeight={800}>
                                                    {selectedSchema.title}
                                                </Typography>
                                                <Typography color="text.secondary">{selectedSchema.description}</Typography>
                                            </Box>
                                            <Divider />
                                            {selectedSchema.parameters.map((param) => {
                                                if (param.type === "list") {
                                                    const current = (formValues[param.key] as string[]) || [];
                                                    const draft = listEditorDrafts[param.key] ?? "";
                                                    return (
                                                        <Box key={param.key}>
                                                            <Stack
                                                                direction={{ xs: "column", sm: "row" }}
                                                                spacing={1}
                                                            >
                                                                <TextField
                                                                    label={`${param.label}${param.required ? " *" : ""}`}
                                                                    value={draft}
                                                                    onChange={(e) =>
                                                                        setListEditorDrafts((prev) => ({
                                                                            ...prev,
                                                                            [param.key]: e.target.value,
                                                                        }))
                                                                    }
                                                                    fullWidth
                                                                />
                                                                <Button
                                                                    variant="outlined"
                                                                    onClick={() => {
                                                                        const trimmed = draft.trim();
                                                                        if (!trimmed) return;
                                                                        const next = [...current, trimmed];
                                                                        setValue(param.key, next);
                                                                        setListEditorDrafts((prev) => ({ ...prev, [param.key]: "" }));
                                                                    }}
                                                                >
                                                                    Add
                                                                </Button>
                                                            </Stack>
                                                            <Stack direction="row" spacing={1} flexWrap="wrap" mt={1}>
                                                                {current.map((item, idx) => (
                                                                    <Chip
                                                                        key={`${param.key}-${idx}`}
                                                                        label={item}
                                                                        onDelete={() => {
                                                                            const next = [...current];
                                                                            next.splice(idx, 1);
                                                                            setValue(param.key, next);
                                                                        }}
                                                                    />
                                                                ))}
                                                            </Stack>
                                                        </Box>
                                                    );
                                                }
                                                if (param.type === "dropdown" && param.options?.length) {
                                                    return (
                                                        <TextField
                                                            key={param.key}
                                                            select
                                                            SelectProps={{ native: true }}
                                                            label={`${param.label}${param.required ? " *" : ""}`}
                                                            value={(formValues[param.key] as string) ?? ""}
                                                            onChange={(e) => setValue(param.key, e.target.value)}
                                                            fullWidth
                                                        >
                                                            <option value="">Select…</option>
                                                            {param.options.map((opt) => (
                                                                <option key={opt} value={opt}>
                                                                    {opt}
                                                                </option>
                                                            ))}
                                                        </TextField>
                                                    );
                                                }
                                                const commonProps = {
                                                    label: `${param.label}${param.required ? " *" : ""}`,
                                                    fullWidth: true,
                                                    value: (formValues[param.key] as string) ?? "",
                                                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setValue(param.key, e.target.value),
                                                };
                                                if (param.type === "textarea") {
                                                    return (
                                                        <TextField key={param.key} {...commonProps} multiline minRows={4} />
                                                    );
                                                }
                                                if (param.type === "date") {
                                                    return (
                                                        <CustomDatePicker
                                                            key={param.key}
                                                            label={`${param.label}${param.required ? " *" : ""}`}
                                                            value={(formValues[param.key] as string) ?? ""}
                                                            onChange={(val) => setValue(param.key, val)}
                                                            required={param.required}
                                                        />
                                                    );
                                                }
                                                const inputType =
                                                    param.type === "number"
                                                        ? "number"
                                                        : param.type === "email"
                                                            ? "email"
                                                            : "text";
                                                return (
                                                    <TextField
                                                        key={param.key}
                                                        {...commonProps}
                                                        type={inputType}
                                                    />
                                                );
                                            })}
                                            <Button
                                                variant="contained"
                                                startIcon={generating ? <CircularProgress size={18} /> : <BoltIcon />}
                                                onClick={handleGenerate}
                                                disabled={generating}
                                                sx={{ alignSelf: "flex-start" }}
                                            >
                                                {generating ? "Generating…" : "Generate document"}
                                            </Button>
                                            {error && <Alert severity="error">{error}</Alert>}
                                        </Stack>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card sx={{ borderRadius: 4 }}>
                                    <CardContent>
                                        <Typography color="text.secondary">
                                            Select a template from the left panel to start filling the form.
                                        </Typography>
                                    </CardContent>
                                </Card>
                            )}

                            {!!output && (
                                <Card sx={{ borderRadius: 4 }}>
                                    <CardContent>
                                            <Stack spacing={2}>
                                            <Stack
                                                direction={{ xs: "column", sm: "row" }}
                                                spacing={1}
                                                alignItems={{ xs: "flex-start", sm: "center" }}
                                            >
                                                <Typography variant="h6" fontWeight={800}>
                                                    Preview
                                                </Typography>
                                                {tokensUsed !== null && (
                                                    <Chip
                                                        label={usedCache ? "Cached result" : `${tokensUsed} tokens`}
                                                        size="small"
                                                        color={usedCache ? "default" : "primary"}
                                                    />
                                                )}
                                            </Stack>
                                            <Box
                                                sx={{
                                                    borderRadius: 2,
                                                    border: `1px solid ${alpha("#000", 0.08)}`,
                                                    bgcolor: alpha("#000", 0.02),
                                                    maxHeight: 400,
                                                    overflow: "auto",
                                                    p: 2,
                                                }}
                                            >
                                                <div dangerouslySetInnerHTML={{ __html: output }} />
                                            </Box>
                                            <TextField
                                                label="Document name"
                                                placeholder="e.g. Consulting_Agreement"
                                                value={fileName}
                                                onChange={(e) => setFileName(e.target.value)}
                                            />
                                            <Button
                                                variant="contained"
                                                startIcon={saving ? <CircularProgress size={18} /> : <SaveAltIcon />}
                                                onClick={handleSave}
                                                disabled={saving}
                                                sx={{ alignSelf: "flex-start" }}
                                            >
                                                {saving ? "Saving…" : "Save to My Documents"}
                                            </Button>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            )}
                        </Stack>
                    </Grid>
                </Grid>
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

export default GenerateDocumentPage;
