// src/pages/AiChatPageWeb.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    Alert,
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
    DialogTitle,
    Divider,
    Snackbar,
    Stack,
    TextField,
    Typography,
    alpha,
    useTheme,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { Save as SaveIcon, Send as SendIcon, BoltRounded as BoltRoundedIcon } from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../firebase";
import { sendMessageToGPT } from "../api/chat";
import CustomCountryPickerWeb from "../components/CustomCountryPicker";
import { onAuthStateChanged } from "firebase/auth";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import DashboardBackButton from "../components/DashboardBackButton";
import { shouldWarnAboutTokens, type Tier } from "../utils/monetization";

interface Message {
    id: string;
    role: "user" | "bot";
    content: string;
}

interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

const TOPIC_KEYS = ["civil", "criminal", "business", "labor", "tax", "other"] as const;
type TopicKey = (typeof TOPIC_KEYS)[number];

const LEGACY_TOPIC_LABELS: Record<TopicKey, string> = {
    civil: "Civil Law",
    criminal: "Criminal Law",
    business: "Business Law",
    labor: "Labor Law",
    tax: "Tax Law",
    other: "Other",
};

const resolveTopicKey = (value?: string | null): TopicKey | null => {
    if (!value) return null;
    if (TOPIC_KEYS.includes(value as TopicKey)) {
        return value as TopicKey;
    }
    const entry = Object.entries(LEGACY_TOPIC_LABELS).find(([, label]) => label === value);
    return entry ? (entry[0] as TopicKey) : null;
};

interface PersistedChatState {
    topic: TopicKey | null;
    messages: Message[];
    country: string;
    countryCode: string;
}

const STORAGE_KEY = "elaws_ai_chat_v1";

const AiChatPage: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [selectedTopic, setSelectedTopic] = useState<TopicKey | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [country, setCountry] = useState<string>("");
    const [countryCode, setCountryCode] = useState<string>("");
    const [sendingMessage, setSendingMessage] = useState(false);
    const [snackbar, setSnackbar] = useState<{ visible: boolean; text: string }>({
        visible: false,
        text: "",
    });
    const [authChecked, setAuthChecked] = useState(false);
    const [profileLoading, setProfileLoading] = useState(true);
    const [persistHydrated, setPersistHydrated] = useState(false);
    const [tokenLimit, setTokenLimit] = useState(0);
    const [monthlyTokensUsed, setMonthlyTokensUsed] = useState(0);
    const [subscriptionTier, setSubscriptionTier] = useState<Tier>("free");
    const tokenWarning = shouldWarnAboutTokens(monthlyTokensUsed, tokenLimit);
    const tokenUsageLabel =
        tokenLimit > 0
            ? t("aiChat.tokens.usage", {
                  used: monthlyTokensUsed.toLocaleString(),
                  limit: tokenLimit.toLocaleString(),
              })
            : null;
    const renderUsageBanner = () => {
        if (!tokenUsageLabel && !tokenWarning) return null;
        return (
            <Stack spacing={1} mb={3}>
                {tokenUsageLabel && (
                    <Chip
                        label={tokenUsageLabel}
                        icon={<BoltRoundedIcon />}
                        variant="outlined"
                        color={tokenWarning ? "warning" : "default"}
                    />
                )}
                {tokenWarning && (
                    <Alert
                        severity="warning"
                        action={
                            <Button
                                component={RouterLink}
                                to="/dashboard/subscribe"
                                size="small"
                                variant="contained"
                            >
                                {t("aiChat.tokens.cta")}
                            </Button>
                        }
                    >
                        {subscriptionTier === "free"
                            ? t("aiChat.tokens.freeWarning")
                            : t("aiChat.tokens.plusWarning")}
                    </Alert>
                )}
            </Stack>
        );
    };

    const [noteDialog, setNoteDialog] = useState<{
        open: boolean;
        loading: boolean;
        message: Message | null;
        title: string;
        suggestions: string[];
    }>({
        open: false,
        loading: false,
        message: null,
        title: "",
        suggestions: [],
    });

    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const localizedCountryName = countryCode
        ? t(`countries.${countryCode}`, { defaultValue: country || countryCode })
        : country;

    useEffect(() => {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            try {
                const parsed = JSON.parse(raw) as PersistedChatState;
                if (parsed.topic) setSelectedTopic(resolveTopicKey(parsed.topic));
                if (Array.isArray(parsed.messages)) setMessages(parsed.messages);
                if (parsed.country) setCountry(parsed.country);
                if (parsed.countryCode) setCountryCode(parsed.countryCode);
            } catch (error) {
                console.error("Failed to hydrate AI chat state", error);
            }
        }
        setPersistHydrated(true);
    }, []);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (!u) {
                setAuthChecked(true);
                setProfileLoading(false);
                navigate("/login");
                return;
            }
            setAuthChecked(true);
            setProfileLoading(true);
            try {
                const snap = await getDoc(doc(db, "users", u.uid));
                if (snap.exists()) {
                    const data = snap.data() as {
                        country?: string;
                        countryCode?: string;
                        monthlyTokensUsed?: number;
                        tokenLimit?: number;
                        subscriptionTier?: Tier;
                    };
                    if (data.country) setCountry(data.country);
                    if (data.countryCode) setCountryCode(data.countryCode);
                    if (typeof data.monthlyTokensUsed === "number") {
                        setMonthlyTokensUsed(data.monthlyTokensUsed);
                    }
                    if (typeof data.tokenLimit === "number") {
                        setTokenLimit(data.tokenLimit);
                    }
                    setSubscriptionTier((data.subscriptionTier as Tier) ?? "free");
                }
            } catch (error) {
                console.error("Failed to load profile", error);
                setSnackbar({ visible: true, text: t("aiChat.snackbar.profileError") });
            } finally {
                setProfileLoading(false);
            }
        });
        return () => unsub();
    }, [navigate, t]);

    useEffect(() => {
        if (!persistHydrated) return;
        const sanitized: PersistedChatState = {
            topic: selectedTopic,
            messages: messages.filter((m) => m.id !== "typing").slice(-20),
            country,
            countryCode,
        };
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
        } catch (error) {
            console.error("Failed to persist AI chat state", error);
        }
    }, [persistHydrated, selectedTopic, messages, country, countryCode]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim()) return;
        setSendingMessage(true);
        const userMsg: Message = { id: Date.now().toString(), role: "user", content: input };
        setMessages((prev) => [...prev, userMsg, { id: "typing", role: "bot", content: "" }]);
        setInput("");

        try {
            const sys: ChatMessage = {
                role: "system",
                content: `You are a legal assistant specializing in ${country || "general"} ${
                    selectedTopic ? LEGACY_TOPIC_LABELS[selectedTopic] : "law"
                }. Answer concisely and clearly.`,
            };

            const history: ChatMessage[] = [
                sys,
                ...messages
                    .filter((m) => m.id !== "typing")
                    .slice(-6)
                    .map<ChatMessage>((m) => ({
                        role: m.role === "user" ? "user" : "assistant",
                        content: m.content,
                    })),
                { role: "user", content: userMsg.content },
            ];

            const { content } = await sendMessageToGPT(history);

            const botMsg: Message = {
                id: Date.now().toString() + "-bot",
                role: "bot",
                content,
            };

            setMessages((prev) => [...prev.filter((m) => m.id !== "typing"), botMsg]);
        } catch (err) {
            console.error(err);
            setSnackbar({ visible: true, text: t("aiChat.snackbar.sendError") });
        } finally {
            setSendingMessage(false);
        }
    };

    const openNoteDialog = useCallback(async (msg: Message) => {
        setNoteDialog({
            open: true,
            loading: true,
            message: msg,
            title: "",
            suggestions: [],
        });

        try {
            const sys: ChatMessage = {
                role: "system",
                content:
                    "You generate concise note titles. Always respond ONLY with a JSON array of EXACTLY 5 short strings. No prose.",
            };

            const prompt = `Context:
Topic: ${selectedTopic ? LEGACY_TOPIC_LABELS[selectedTopic] : "General"}
Country: ${country || "Unknown"}

Message:
"""${msg.content}"""

Instructions:
- Create 5 distinct, concise titles (max 90 chars each).
- Prefer actionable and specific phrasing.
- Output: JSON array of 5 strings.`;

            const { content: raw } = await sendMessageToGPT([sys, { role: "user", content: prompt }]);

            let suggestions: string[] = [];
            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    suggestions = parsed.filter((v) => typeof v === "string").slice(0, 5);
                }
            } catch {
                suggestions = raw.split(/\r?\n|•|-/).map((s) => s.trim()).filter(Boolean).slice(0, 5);
            }

            const defaultTitle =
                suggestions[0] ||
                msg.content.replace(/\n+/g, " ").slice(0, 80) ||
                t("aiChat.dialog.untitled");

            setNoteDialog({
                open: true,
                loading: false,
                message: msg,
                suggestions,
                title: defaultTitle,
            });
        } catch (e) {
            console.error(e);
            setNoteDialog({
                open: true,
                loading: false,
                message: msg,
                suggestions: [],
                title: msg.content.slice(0, 80),
            });
        }
    }, [country, selectedTopic, t]);

    const saveNote = async () => {
        const user = auth.currentUser;
        const msg = noteDialog.message;
        if (!user || !msg) return;

        try {
            await addDoc(collection(db, "users", user.uid, "notes"), {
                title: noteDialog.title || msg.content.slice(0, 80),
                content: msg.content,
                topic: selectedTopic ? LEGACY_TOPIC_LABELS[selectedTopic] : LEGACY_TOPIC_LABELS.other,
                country: country ?? "",
                createdAt: serverTimestamp(),
                messageId: msg.id,
                source: "chat",
            });
            setSnackbar({ visible: true, text: t("aiChat.snackbar.saveSuccess") });
        } catch (err) {
            console.error("Error saving note:", err);
            setSnackbar({ visible: true, text: t("aiChat.snackbar.saveError") });
        } finally {
            setNoteDialog({
                open: false,
                loading: false,
                message: null,
                title: "",
                suggestions: [],
            });
        }
    };

    const renderContextPanel = (compact: boolean) => (
        <Card
            sx={{
                height: compact ? "auto" : "100%",
                borderRadius: compact ? 3 : 4,
                border: compact ? `1px solid ${alpha(theme.palette.divider, 0.6)}` : undefined,
                boxShadow: compact ? "none" : undefined,
                bgcolor: compact
                    ? alpha(theme.palette.background.paper, theme.palette.mode === "light" ? 0.95 : 0.35)
                    : undefined,
                backdropFilter: compact ? "blur(12px)" : undefined,
            }}
        >
            <CardContent
                sx={{
                    p: compact ? 2.5 : { xs: 3, md: 4 },
                    display: "flex",
                    flexDirection: "column",
                    gap: compact ? 2 : 2.5,
                }}
            >
                <Typography variant={compact ? "subtitle1" : "h6"} fontWeight={800}>
                    {t("aiChat.context.title")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {t("aiChat.context.description")}
                </Typography>
                <Box display="flex" justifyContent={compact ? "flex-start" : "center"}>
                    <CustomCountryPickerWeb
                        country={country}
                        countryCode={countryCode}
                        onSelect={(c) => {
                            if (c) {
                                setCountry(c.name);
                                setCountryCode(c.code);
                            }
                        }}
                    />
                </Box>
                <Divider sx={{ my: compact ? 1 : 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                    {t("aiChat.labels.topic")}
                </Typography>
                {compact ? (
                    <Stack direction="row" spacing={1.2} flexWrap="wrap">
                        {TOPIC_KEYS.map((topicKey) => {
                            const active = topicKey === selectedTopic;
                            return (
                                <Chip
                                    key={topicKey}
                                    label={t(`aiChat.topics.${topicKey}`)}
                                    size="small"
                                    color={active ? "primary" : "default"}
                                    variant={active ? "filled" : "outlined"}
                                    onClick={() => setSelectedTopic(topicKey)}
                                />
                            );
                        })}
                    </Stack>
                ) : (
                    <Stack direction="row" spacing={1.5} flexWrap="wrap">
                        <Chip
                            label={
                                selectedTopic ? t(`aiChat.topics.${selectedTopic}`) : t("aiChat.labels.topicPlaceholder")
                            }
                            color="primary"
                            sx={{ fontWeight: 700 }}
                        />
                        <Chip
                            label={t("aiChat.buttons.changeTopic")}
                            variant="outlined"
                            onClick={() => setSelectedTopic(null)}
                        />
                    </Stack>
                )}
            </CardContent>
        </Card>
    );

    const renderChatPanel = (compact: boolean) => (
        <Card
            sx={{
                borderRadius: compact ? 3 : 4,
                height: compact ? "100%" : { md: "80vh" },
                display: "flex",
                flexDirection: "column",
                boxShadow: compact ? "none" : undefined,
                border: compact ? `1px solid ${alpha(theme.palette.divider, 0.5)}` : undefined,
                bgcolor: compact
                    ? alpha(theme.palette.background.paper, theme.palette.mode === "light" ? 0.98 : 0.25)
                    : undefined,
                flex: compact ? 1 : undefined,
            }}
        >
            <CardContent
                sx={{
                    p: compact ? 2.5 : { xs: 3, md: 4 },
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: compact ? 2.5 : 3.5,
                    minHeight: 0,
                }}
            >
                <Stack
                    direction={{ xs: "column", sm: compact ? "column" : "row" }}
                    justifyContent="space-between"
                    spacing={compact ? 1.5 : 2}
                    sx={{ pb: 1, borderBottom: compact ? `1px solid ${alpha(theme.palette.divider, 0.5)}` : "none" }}
                >
                    <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                            {t("aiChat.labels.topic")}
                        </Typography>
                        <Typography variant={compact ? "body1" : "h6"} fontWeight={800}>
                            {selectedTopic ? t(`aiChat.topics.${selectedTopic}`) : t("aiChat.labels.topicPlaceholder")}
                        </Typography>
                    </Box>
                    <Box textAlign={{ xs: "left", sm: "right" }}>
                        <Typography variant="subtitle2" color="text.secondary">
                            {t("aiChat.labels.country")}
                        </Typography>
                        <Typography variant="body2">{localizedCountryName || t("aiChat.labels.anyCountry")}</Typography>
                    </Box>
                </Stack>

                <Box
                    flex={1}
                    minHeight={0}
                    overflow="auto"
                    pr={compact ? 0 : 1}
                    sx={{ py: compact ? 1 : 2, px: compact ? 0.5 : 0 }}
                >
                    <AnimatePresence>
                        {messages.map((m) => (
                            <motion.div
                                key={m.id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                                        mb: compact ? 2.5 : 2,
                                    }}
                                >
                                        <Box
                                            sx={{
                                                maxWidth: compact ? "92%" : "80%",
                                                borderRadius: 3,
                                                p: 2,
                                                bgcolor:
                                                    m.role === "user"
                                                        ? theme.palette.primary.main
                                                        : alpha(
                                                          theme.palette.mode === "light"
                                                              ? theme.palette.primary.main
                                                              : theme.palette.common.white,
                                                          theme.palette.mode === "light" ? 0.08 : 0.15
                                                      ),
                                                color:
                                                    m.role === "user"
                                                        ? theme.palette.primary.contrastText
                                                        : theme.palette.text.primary,
                                                boxShadow: m.role === "user"
                                                    ? "0 18px 40px rgba(126,87,194,0.35)"
                                                    : "0 12px 32px rgba(15,10,40,0.12)",
                                                px: compact ? 2 : 3,
                                            }}
                                        >
                                        <Typography sx={{ whiteSpace: "pre-wrap" }}>{m.content}</Typography>
                                        {m.role === "bot" && m.id !== "0" && (
                                            <Button
                                                startIcon={<SaveIcon />}
                                                onClick={() => openNoteDialog(m)}
                                                size="small"
                                                sx={{ mt: 1 }}
                                            >
                                                {t("aiChat.buttons.saveToNotes")}
                                            </Button>
                                        )}
                                    </Box>
                                </Box>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </Box>

                <Stack
                    direction={compact ? "column" : { xs: "column", sm: "row" }}
                    spacing={compact ? 1 : 1.5}
                    sx={{ flexShrink: 0 }}
                >
                    <TextField
                        fullWidth
                        size={compact ? "small" : "medium"}
                        placeholder={t("aiChat.inputs.questionPlaceholder")}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        multiline
                        maxRows={compact ? 3 : 4}
                    />
                    <Button
                        variant="contained"
                        endIcon={<SendIcon />}
                        onClick={sendMessage}
                        disabled={sendingMessage || !input.trim()}
                        sx={{ minWidth: compact ? undefined : { sm: 140 } }}
                        fullWidth={compact}
                    >
                        {t("aiChat.buttons.send")}
                    </Button>
                </Stack>
            </CardContent>
        </Card>
    );

    const overlayElements = (
        <>
            <Dialog open={noteDialog.open} onClose={() => setNoteDialog({ ...noteDialog, open: false })} fullWidth maxWidth="sm">
                <DialogTitle>{t("aiChat.dialog.title")}</DialogTitle>
                <DialogContent>
                    {noteDialog.loading ? (
                        <Box textAlign="center" py={3}>
                            <CircularProgress size={28} />
                            <Typography mt={2}>{t("aiChat.dialog.generating")}</Typography>
                        </Box>
                    ) : (
                        <>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                {t("aiChat.dialog.suggestions")}
                            </Typography>
                            <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ mb: 2 }}>
                                {noteDialog.suggestions.map((sug, i) => (
                                    <Chip
                                        key={i}
                                        label={sug}
                                        onClick={() => setNoteDialog((d) => ({ ...d, title: sug }))}
                                        color={noteDialog.title === sug ? "primary" : "default"}
                                        variant={noteDialog.title === sug ? "filled" : "outlined"}
                                    />
                                ))}
                            </Stack>

                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                {t("aiChat.dialog.customTitle")}
                            </Typography>
                            <TextField
                                fullWidth
                                value={noteDialog.title}
                                onChange={(e) => setNoteDialog((d) => ({ ...d, title: e.target.value.slice(0, 90) }))}
                                placeholder={t("aiChat.dialog.placeholder")}
                                inputProps={{ maxLength: 90 }}
                            />
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setNoteDialog({ ...noteDialog, open: false })}>{t("aiChat.dialog.cancel")}</Button>
                    <Button
                        onClick={saveNote}
                        variant="contained"
                        disabled={noteDialog.loading || !noteDialog.title.trim()}
                    >
                        {t("aiChat.dialog.save")}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.visible}
                autoHideDuration={2500}
                onClose={() => setSnackbar({ visible: false, text: "" })}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert severity="info">{snackbar.text}</Alert>
            </Snackbar>
        </>
    );

    const backButton = (
        <Container maxWidth="lg" sx={{ pt: { xs: 3, md: 4 }, pb: 0 }}>
            <DashboardBackButton />
        </Container>
    );

    if (!authChecked || profileLoading || !persistHydrated) {
        return (
            <>
                {backButton}
                <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
                    <CircularProgress />
                    <Typography mt={3} color="text.secondary">
                        {t("aiChat.loading.preparing")}
                    </Typography>
                </Container>
            </>
        );
    }

    if (!selectedTopic) {
        return (
            <>
                {backButton}
                <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>
                    {renderUsageBanner()}
                    <Grid container spacing={{ xs: 4, md: 6 }} alignItems="stretch">
                        <Grid size={{ xs: 12, md: 5 }}>
                            <Card sx={{ height: "100%", borderRadius: 4 }}>
                                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                                    <Typography variant="h5" fontWeight={900} gutterBottom>
                                        {t("aiChat.empty.countryTitle")}
                                    </Typography>
                                    <Typography color="text.secondary" sx={{ mb: 3 }}>
                                        {t("aiChat.empty.countryDescription")}
                                    </Typography>
                                    <Box display="flex" justifyContent="center">
                                        <CustomCountryPickerWeb
                                            country={country}
                                            countryCode={countryCode}
                                            onSelect={(c) => {
                                                if (c) {
                                                    setCountry(c.name);
                                                    setCountryCode(c.code);
                                                }
                                            }}
                                        />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 12, md: 7 }}>
                            <Card sx={{ borderRadius: 4 }}>
                                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                                    <Typography variant="h5" fontWeight={900} gutterBottom>
                                        {t("aiChat.empty.topicTitle")}
                                    </Typography>
                                    <Typography color="text.secondary" sx={{ mb: 3 }}>
                                        {t("aiChat.empty.topicDescription")}
                                    </Typography>
                                    <Grid container spacing={2}>
                                        {TOPIC_KEYS.map((topicKey) => (
                                            <Grid size={{ xs: 12, sm: 6 }} key={topicKey}>
                                                <Button
                                                    fullWidth
                                                    variant="outlined"
                                                    onClick={() => setSelectedTopic(topicKey)}
                                                    sx={{ borderRadius: 3, py: 1.5, fontWeight: 700 }}
                                                >
                                                    {t(`aiChat.topics.${topicKey}`)}
                                                </Button>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Container>
                {overlayElements}
            </>
        );
    }

    const layout = (
        <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
            {renderUsageBanner()}
            <Grid container spacing={{ xs: 4, md: 5 }} alignItems="stretch">
                <Grid size={{ xs: 12, md: 4 }}>{renderContextPanel(false)}</Grid>
                <Grid size={{ xs: 12, md: 8 }}>{renderChatPanel(false)}</Grid>
            </Grid>
        </Container>
    );

    return (
        <>
            {backButton}
            {layout}
            {overlayElements}
        </>
    );
};

export default AiChatPage;
