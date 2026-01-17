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
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
    QueryDocumentSnapshot,
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../../firebase";
import generateDocumentHTML from "../utils/generateDocumentHTML";
import { sendMessageToGPT } from "../api/chat";
import CustomDatePicker from "../components/CustomDatePicker";
import { useTranslation } from "react-i18next";
import PageHero from "../components/PageHero";
import UpgradePromptDialog from "../components/UpgradePromptDialog";
import {
    canGenerateDocument,
    getDocumentLimit,
    getDocumentRunsThisMonth,
    incrementDocumentRunsThisMonth,
    remainingDocumentRuns,
    type Tier,
} from "../utils/monetization";

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

const HERO_STEPS = [
    {
        key: "choose",
        labelKey: "generateDoc.hero.steps.choose",
        defaultLabel: "Select a legal template",
    },
    {
        key: "fill",
        labelKey: "generateDoc.hero.steps.fill",
        defaultLabel: "Answer guided questions",
    },
    {
        key: "export",
        labelKey: "generateDoc.hero.steps.export",
        defaultLabel: "Generate & save output",
    },
];

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
    const { t } = useTranslation();
    const [authReady, setAuthReady] = useState(false);
    const [user, setUser] = useState<User | null>(auth.currentUser);
    const [subscriptionTier, setSubscriptionTier] = useState<Tier>("free");
    const [docRuns, setDocRuns] = useState(0);

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
    const [upgradePrompt, setUpgradePrompt] = useState<{
        title: string;
        description: string;
        requiredTier: "plus" | "premium";
        highlight?: string;
    } | null>(null);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setAuthReady(true);
            if (!u) navigate("/login");
        });
        return () => unsub();
    }, [navigate]);

    useEffect(() => {
        if (!user) {
            setSubscriptionTier("free");
            setDocRuns(0);
            return;
        }
        const hydrateProfile = async () => {
            try {
                const snap = await getDoc(doc(db, "users", user.uid));
                if (snap.exists()) {
                    const data = snap.data() as { subscriptionTier?: Tier };
                    setSubscriptionTier((data.subscriptionTier as Tier) ?? "free");
                } else {
                    setSubscriptionTier("free");
                }
            } catch {
                setSubscriptionTier("free");
            } finally {
                setDocRuns(getDocumentRunsThisMonth(user.uid));
            }
        };
        hydrateProfile();
    }, [user]);

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
                const message =
                    err instanceof Error ? err.message : t("generateDoc.errors.schemasLoad");
                setSchemasError(message);
            } finally {
                setSchemasLoading(false);
            }
        };
        loadSchemas();
    }, [t]);

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
    const docLimit = getDocumentLimit(subscriptionTier);
    const docRemaining = remainingDocumentRuns(subscriptionTier, docRuns);
    const generationLocked = !canGenerateDocument(subscriptionTier, docRuns);
    const upgradeTier = subscriptionTier === "free" ? "plus" : "premium";
    const docUsageLabel =
        docLimit === null
            ? t("generateDoc.limits.unlimited")
            : t("generateDoc.limits.counter", { remaining: Math.max(0, docRemaining), limit: docLimit });

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
            if (!canGenerateDocument(subscriptionTier, docRuns)) {
                const key = subscriptionTier === "free" ? "free" : "plus";
                const highlight =
                    subscriptionTier === "plus" && docLimit !== null
                        ? t("generateDoc.limits.plusHighlight", { limit: docLimit })
                        : undefined;
                setUpgradePrompt({
                    title: t(`generateDoc.limits.${key}Title`),
                    description: t(`generateDoc.limits.${key}Description`),
                    requiredTier: upgradeTier,
                    highlight,
                });
                return;
            }
            if (!selectedSchemaId) throw new Error(t("generateDoc.errors.selectTemplate"));
            if (missingRequired.length) {
                throw new Error(
                    t("generateDoc.errors.missingFieldsInline", {
                        fields: missingRequired.join(", "),
                    })
                );
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
            if (subscriptionTier !== "free") {
                const used = incrementDocumentRunsThisMonth(user?.uid);
                setDocRuns(used);
            }
        } catch (err) {
            const message =
                err instanceof Error ? err.message : t("generateDoc.errors.generateFailed");
            setError(message);
        } finally {
            setGenerating(false);
        }
    }, [selectedSchemaId, formValues, missingRequired, buildUserPrompt, t, subscriptionTier, docRuns, docLimit, upgradeTier, user]);

    const handleSave = useCallback(async () => {
        try {
            if (!user) throw new Error(t("generateDoc.errors.authRequired"));
            if (!output) throw new Error(t("generateDoc.errors.noOutput"));
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
            setSnackbar({ open: true, text: t("generateDoc.save.success") });
            setFileName("");
        } catch (err) {
            const message = err instanceof Error ? err.message : t("generateDoc.errors.saveFailed");
            setSnackbar({ open: true, text: message });
        } finally {
            setSaving(false);
        }
    }, [user, output, fileName, selectedSchema, t]);

    if (!authReady || !user) {
        return (
            <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
                <CircularProgress />
                <Typography mt={3} color="text.secondary">
                    {t("generateDoc.loading")}
                </Typography>
            </Container>
        );
    }

    return (
        <>
            <PageHero
                title={t("generateDoc.hero.title")}
                subtitle={t("generateDoc.hero.subtitle")}
                overline={t("generateDoc.hero.overline", { defaultValue: "Document automation" })}
                icon={<LibraryBooksIcon />}
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
                            {t("generateDoc.hero.back", { defaultValue: "Documents hub" })}
                        </Button>
                        <Button
                            component={RouterLink}
                            to="/documents/my"
                            variant="contained"
                            sx={{ borderRadius: 3, fontWeight: 800 }}
                        >
                            {t("generateDoc.hero.savedCta")}
                        </Button>
                    </>
                }
            >
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={{ xs: 2, sm: 4 }}
                    flexWrap="wrap"
                >
                    {HERO_STEPS.map((step, idx) => (
                        <Stack key={step.key} spacing={0.5}>
                            <Typography variant="subtitle2" fontWeight={800}>
                                0{idx + 1}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                {t(step.labelKey, { defaultValue: step.defaultLabel })}
                            </Typography>
                        </Stack>
                    ))}
                </Stack>
            </PageHero>

            <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 } }}>
                <Stack spacing={1.5} mb={3}>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Chip label={docUsageLabel} icon={<DescriptionOutlinedIcon />} variant="outlined" />
                        {subscriptionTier === "plus" && docLimit !== null && (
                            <Chip
                                color={docRemaining <= 1 ? "warning" : "default"}
                                label={t("generateDoc.limits.remaining", { count: Math.max(0, docRemaining) })}
                            />
                        )}
                    </Stack>
                    {generationLocked && (
                        <Alert
                            severity={subscriptionTier === "free" ? "info" : "warning"}
                            action={
                                <Button
                                    size="small"
                                    variant="contained"
                                    component={RouterLink}
                                    to="/dashboard/subscribe"
                                >
                                    {t("generateDoc.limits.cta")}
                                </Button>
                            }
                        >
                            {subscriptionTier === "free"
                                ? t("generateDoc.limits.freeInline")
                                : t("generateDoc.limits.plusInline", { limit: docLimit ?? 0 })}
                        </Alert>
                    )}
                </Stack>
                <Grid container spacing={{ xs: 4, md: 5 }}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Card sx={{ borderRadius: 4, position: "sticky", top: 32 }}>
                            <CardContent>
                                <Stack spacing={2}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <LibraryBooksIcon color="primary" />
                                        <Typography variant="h6" fontWeight={800}>
                                            {t("generateDoc.templates.title")}
                                        </Typography>
                                    </Box>
                                    <Typography color="text.secondary">
                                        {t("generateDoc.templates.description")}
                                    </Typography>
                                    <Divider />
                                    {schemasLoading ? (
                                        <Stack spacing={1}>
                                            <CircularProgress size={20} />
                                            <Typography color="text.secondary">
                                                {t("generateDoc.templates.loading")}
                                            </Typography>
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
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label={t("generateDoc.templates.inputLabel")}
                                                />
                                            )}
                                        />
                                    )}
                                    {schemasError && <Alert severity="error">{schemasError}</Alert>}
                                    {missingRequired.length > 0 && (
                                        <Alert severity="warning">
                                            {t("generateDoc.templates.missingIntro")}
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
                                                                    {t("generateDoc.form.list.add")}
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
                                                            <option value="">{t("generateDoc.form.dropdownPlaceholder")}</option>
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
                                                startIcon={
                                                    generating ? (
                                                        <CircularProgress size={18} />
                                                    ) : generationLocked ? (
                                                        <LockOutlinedIcon />
                                                    ) : (
                                                        <BoltIcon />
                                                    )
                                                }
                                                onClick={handleGenerate}
                                                disabled={generating}
                                                sx={{
                                                    alignSelf: "flex-start",
                                                    borderRadius: 3,
                                                    fontWeight: 700,
                                                    borderStyle: generationLocked ? "dashed" : "solid",
                                                    opacity: generationLocked ? 0.85 : 1,
                                                }}
                                            >
                                                {generationLocked
                                                    ? t("generateDoc.actions.generateLocked", {
                                                          tier: upgradeTier.toUpperCase(),
                                                      })
                                                    : generating
                                                        ? t("generateDoc.actions.generating")
                                                        : t("generateDoc.actions.generate")}
                                            </Button>
                                            {error && <Alert severity="error">{error}</Alert>}
                                        </Stack>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card sx={{ borderRadius: 4 }}>
                                    <CardContent>
                                        <Typography color="text.secondary">
                                            {t("generateDoc.templates.emptyState")}
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
                                                    {t("generateDoc.preview.title")}
                                                </Typography>
                                                {tokensUsed !== null && (
                                                    <Chip
                                                        label={
                                                            usedCache
                                                                ? t("generateDoc.preview.cached")
                                                                : t("generateDoc.preview.tokens", {
                                                                      count: tokensUsed,
                                                                  })
                                                        }
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
                                                label={t("generateDoc.save.fileNameLabel")}
                                                placeholder={t("generateDoc.save.fileNamePlaceholder")}
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
                                                {saving
                                                    ? t("generateDoc.save.saving")
                                                    : t("generateDoc.save.cta")}
                                            </Button>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            )}
                        </Stack>
                    </Grid>
                </Grid>
            </Container>

            {upgradePrompt && (
                <UpgradePromptDialog
                    open
                    onClose={() => setUpgradePrompt(null)}
                    title={upgradePrompt.title}
                    description={upgradePrompt.description}
                    requiredTier={upgradePrompt.requiredTier}
                    highlight={upgradePrompt.highlight}
                />
            )}

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ open: false, text: "" })}
                message={snackbar.text}
            />
        </>
    );
};

export default GenerateDocumentPage;
