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
    useMediaQuery,
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
import PageHero from "../components/PageHero";

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
    const isCompact = useMediaQuery(theme.breakpoints.down("md"));
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
    const [contextOpen, setContextOpen] = useState(false);
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
    const skipPersistRef = useRef(false);
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
        if (skipPersistRef.current) {
            skipPersistRef.current = false;
            return;
        }
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

    const handleClearConversation = () => {
        // Legal: clear must not write chat data to storage.
        skipPersistRef.current = true;
        setMessages([]);
        setInput("");
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
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: compact ? 2 : 2.5,
                p: compact ? 2.5 : { xs: 3, md: 4 },
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
        </Box>
    );

    const renderChatPanel = (compact: boolean) => {
        const panelHeight = compact
            ? "calc(100vh - var(--topbar-height-mobile))"
            : "calc(100vh - var(--topbar-height-desktop) - 96px)";
        const surfacePadding = compact ? { px: 2, py: 2 } : { px: { xs: 3, md: 4 }, py: { xs: 2.5, md: 3 } };
        return (
            <Box
                sx={{
                    borderRadius: 0,
                    height: { xs: panelHeight, md: panelHeight },
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    overflow: "hidden",
                    backgroundColor: "transparent",
                }}
            >
                    <Stack
                        direction="column"
                        spacing={1}
                        sx={{
                            px: compact ? 2 : 3,
                            py: compact ? 0.35 : 0.5,
                            position: "sticky",
                            top: 0,
                            zIndex: 2,
                            backgroundColor: alpha(theme.palette.background.paper, 0.92),
                            backdropFilter: "blur(10px)",
                        }}
                    >
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            justifyContent="space-between"
                            spacing={0.75}
                        >
                            <Box>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ textTransform: "uppercase", letterSpacing: 0.6, lineHeight: 1.1 }}
                                >
                                    {t("aiChat.labels.topic")}
                                </Typography>
                                <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                                    {selectedTopic
                                        ? t(`aiChat.topics.${selectedTopic}`)
                                        : t("aiChat.labels.topicPlaceholder")}
                                </Typography>
                            </Box>
                            <Stack spacing={0.75} alignItems={{ xs: "flex-start", sm: "flex-end" }}>
                                <Box textAlign={{ xs: "left", sm: "right" }}>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ textTransform: "uppercase", letterSpacing: 0.6, lineHeight: 1.1 }}
                                    >
                                        {t("aiChat.labels.country")}
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.2 }}>
                                        {localizedCountryName || t("aiChat.labels.anyCountry")}
                                    </Typography>
                                </Box>
                                <Stack direction="row" spacing={1} sx={{ mt: 0.2 }}>
                                    <Button
                                        variant="text"
                                        size="small"
                                        onClick={() => setContextOpen(true)}
                                        sx={{ px: 0, minHeight: 24, fontSize: "0.75rem" }}
                                    >
                                        {t("aiChat.context.title")}
                                    </Button>
                                    <Button
                                        variant="text"
                                        size="small"
                                        onClick={handleClearConversation}
                                        sx={{ px: 0, minHeight: 24, fontSize: "0.75rem" }}
                                    >
                                        {t("aiChat.buttons.clearConversation")}
                                    </Button>
                                </Stack>
                            </Stack>
                        </Stack>
                        <Box sx={{ height: 1, bgcolor: alpha(theme.palette.divider, 0.4) }} />
                    </Stack>

                    <Box
                        flex={1}
                        minHeight={0}
                        overflow="auto"
                        sx={{
                            px: compact ? 2 : 4,
                            py: compact ? 2 : 3,
                            background: "transparent",
                        }}
                    >
                        <AnimatePresence>
                            {messages.map((m) => {
                                const isTyping = m.id === "typing";
                                return (
                                    <motion.div
                                        key={m.id}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -12 }}
                                    >
                                        <Box
                                            sx={{
                                                display: "flex",
                                                flexDirection: "column",
                                                py: compact ? 1.75 : 2,
                                                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                                            }}
                                        >
                                            <Box sx={{ maxWidth: "100%" }}>
                                                {isTyping ? (
                                                    <Stack direction="row" spacing={0.75} alignItems="center">
                                                        <Box
                                                            sx={{
                                                                width: 6,
                                                                height: 6,
                                                                borderRadius: "50%",
                                                                backgroundColor: theme.palette.text.secondary,
                                                                animation: "pulseDot 1s ease-in-out infinite",
                                                                "@keyframes pulseDot": {
                                                                    "0%, 100%": { opacity: 0.3, transform: "translateY(0)" },
                                                                    "50%": { opacity: 1, transform: "translateY(-2px)" },
                                                                },
                                                            }}
                                                        />
                                                        <Box
                                                            sx={{
                                                                width: 6,
                                                                height: 6,
                                                                borderRadius: "50%",
                                                                backgroundColor: theme.palette.text.secondary,
                                                                animation: "pulseDot 1s ease-in-out 0.2s infinite",
                                                            }}
                                                        />
                                                        <Box
                                                            sx={{
                                                                width: 6,
                                                                height: 6,
                                                                borderRadius: "50%",
                                                                backgroundColor: theme.palette.text.secondary,
                                                                animation: "pulseDot 1s ease-in-out 0.4s infinite",
                                                            }}
                                                        />
                                                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                                            {t("aiChat.loading.thinking")}
                                                        </Typography>
                                                    </Stack>
                                                ) : (
                                                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                                                        {m.content}
                                                    </Typography>
                                                )}
                                                {m.role === "bot" && m.id !== "0" && !isTyping && (
                                                    <Button
                                                        startIcon={<SaveIcon />}
                                                        onClick={() => openNoteDialog(m)}
                                                        size="small"
                                                        sx={{ mt: 1, px: 0 }}
                                                    >
                                                        {t("aiChat.buttons.saveToNotes")}
                                                    </Button>
                                                )}
                                            </Box>
                                        </Box>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                        <div ref={messagesEndRef} />
                    </Box>

                    <Stack
                        direction="column"
                        spacing={1}
                        sx={{
                            px: compact ? 2 : 3,
                            py: compact ? 1 : 1.5,
                            position: "sticky",
                            bottom: 0,
                            zIndex: 2,
                            backgroundColor: alpha(theme.palette.background.paper, 0.98),
                        }}
                    >
                        <Stack
                            direction={compact ? "column" : { xs: "column", sm: "row" }}
                            spacing={compact ? 1 : 1.5}
                            alignItems={compact ? "stretch" : "center"}
                        >
                            <TextField
                                fullWidth
                                size={compact ? "small" : "medium"}
                                placeholder={t("aiChat.inputs.questionPlaceholder")}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                multiline
                                maxRows={compact ? 3 : 4}
                                variant="standard"
                                InputProps={{
                                    disableUnderline: true,
                                }}
                                sx={{ flex: 1 }}
                            />
                            <Button
                                variant="contained"
                                endIcon={
                                    sendingMessage ? <CircularProgress size={16} color="inherit" /> : <SendIcon />
                                }
                                onClick={sendMessage}
                                disabled={sendingMessage || !input.trim()}
                                sx={{
                                    minWidth: compact ? undefined : { sm: 140 },
                                    borderRadius: 999,
                                    px: 2.5,
                                }}
                                fullWidth={compact}
                            >
                                {t("aiChat.buttons.send")}
                            </Button>
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            {t("aiChat.disclaimer")}
                        </Typography>
                    </Stack>
            </Box>
        );
    };

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
            <Dialog
                open={contextOpen}
                onClose={() => setContextOpen(false)}
                fullScreen={isCompact}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>{t("aiChat.context.title")}</DialogTitle>
                <DialogContent>
                    {renderContextPanel(true)}
                </DialogContent>
                <DialogActions>
                    <Button variant="contained" onClick={() => setContextOpen(false)}>
                        {t("aiChat.dialog.cancel")}
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

    const hero = (
        <PageHero
            title={t("nav.aiChat")}
            subtitle={t("aiChat.context.description")}
            icon={<BoltRoundedIcon />}
            actions={<DashboardBackButton />}
            variant="soft"
            maxWidth="lg"
        />
    );

    if (!authChecked || profileLoading || !persistHydrated) {
        return (
            <>
                {hero}
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
                {hero}
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
        <Box
            sx={{
                minHeight: {
                    xs: "calc(100vh - var(--topbar-height-mobile))",
                    md: "calc(100vh - var(--topbar-height-desktop))",
                },
                display: "flex",
                flexDirection: "column",
            }}
        >
            <Container maxWidth="lg" sx={{ flex: 1, py: { xs: 0, md: 3 } }}>
                {renderUsageBanner()}
                <Box sx={{ maxWidth: 720, mx: "auto", width: "100%" }}>
                    {renderChatPanel(isCompact)}
                </Box>
            </Container>
        </Box>
    );

    return (
        <>
            {!selectedTopic && hero}
            {layout}
            {overlayElements}
        </>
    );
};

export default AiChatPage;
