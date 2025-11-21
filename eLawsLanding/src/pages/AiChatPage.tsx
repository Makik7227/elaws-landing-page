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
import { Save as SaveIcon, Send as SendIcon } from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../firebase";
import { sendMessageToGPT } from "../api/chat";
import CustomCountryPickerWeb from "../components/CustomCountryPicker";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

interface Message {
    id: string;
    role: "user" | "bot";
    content: string;
}

interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

const topics = ["Civil Law", "Criminal Law", "Business Law", "Labor Law", "Tax Law", "Other"];

interface PersistedChatState {
    topic: string | null;
    messages: Message[];
    country: string;
    countryCode: string;
}

const STORAGE_KEY = "elaws_ai_chat_v1";

const AiChatPage: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
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

    useEffect(() => {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            try {
                const parsed = JSON.parse(raw) as PersistedChatState;
                if (parsed.topic) setSelectedTopic(parsed.topic);
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
                    const data = snap.data();
                    if (data.country) setCountry((prev) => prev || data.country);
                    if (data.countryCode) setCountryCode((prev) => prev || data.countryCode);
                }
            } catch (error) {
                console.error("Failed to load profile", error);
                setSnackbar({ visible: true, text: "Could not load your profile. Refresh and try again." });
            } finally {
                setProfileLoading(false);
            }
        });
        return () => unsub();
    }, [navigate]);

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
                    selectedTopic || "law"
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
            setSnackbar({ visible: true, text: "Failed to send message." });
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
Topic: ${selectedTopic ?? "General"}
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
                "Untitled Note";

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
    }, [country, selectedTopic]);

    const saveNote = async () => {
        const user = auth.currentUser;
        const msg = noteDialog.message;
        if (!user || !msg) return;

        try {
            await addDoc(collection(db, "users", user.uid, "notes"), {
                title: noteDialog.title || msg.content.slice(0, 80),
                content: msg.content,
                topic: selectedTopic ?? "Other",
                country: country ?? "",
                createdAt: serverTimestamp(),
                messageId: msg.id,
                source: "chat",
            });
            setSnackbar({ visible: true, text: "Saved to My Notes ✅" });
        } catch (err) {
            console.error("Error saving note:", err);
            setSnackbar({ visible: true, text: "Failed to save note." });
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
                    Context
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Country-aware AI with topic presets and quick prompt suggestions.
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
                    Topic
                </Typography>
                {compact ? (
                    <Stack direction="row" spacing={1.2} flexWrap="wrap">
                        {topics.map((topic) => {
                            const active = topic === selectedTopic;
                            return (
                                <Chip
                                    key={topic}
                                    label={topic}
                                    size="small"
                                    color={active ? "primary" : "default"}
                                    variant={active ? "filled" : "outlined"}
                                    onClick={() => setSelectedTopic(topic)}
                                />
                            );
                        })}
                    </Stack>
                ) : (
                    <Stack direction="row" spacing={1.5} flexWrap="wrap">
                        <Chip label={selectedTopic ?? "Choose"} color="primary" sx={{ fontWeight: 700 }} />
                        <Chip label="Change" variant="outlined" onClick={() => setSelectedTopic(null)} />
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
                            Topic
                        </Typography>
                        <Typography variant={compact ? "body1" : "h6"} fontWeight={800}>
                            {selectedTopic}
                        </Typography>
                    </Box>
                    <Box textAlign={{ xs: "left", sm: "right" }}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Country
                        </Typography>
                        <Typography variant="body2">{country || "Any country"}</Typography>
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
                                                Save to Notes
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
                        placeholder="Type your legal question…"
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
                        Send
                    </Button>
                </Stack>
            </CardContent>
        </Card>
    );

    const overlayElements = (
        <>
            <Dialog open={noteDialog.open} onClose={() => setNoteDialog({ ...noteDialog, open: false })} fullWidth maxWidth="sm">
                <DialogTitle>Title your note</DialogTitle>
                <DialogContent>
                    {noteDialog.loading ? (
                        <Box textAlign="center" py={3}>
                            <CircularProgress size={28} />
                            <Typography mt={2}>Generating suggestions…</Typography>
                        </Box>
                    ) : (
                        <>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Suggestions
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
                                Or write your own
                            </Typography>
                            <TextField
                                fullWidth
                                value={noteDialog.title}
                                onChange={(e) => setNoteDialog((d) => ({ ...d, title: e.target.value.slice(0, 90) }))}
                                placeholder="Enter a custom title"
                                inputProps={{ maxLength: 90 }}
                            />
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setNoteDialog({ ...noteDialog, open: false })}>Cancel</Button>
                    <Button
                        onClick={saveNote}
                        variant="contained"
                        disabled={noteDialog.loading || !noteDialog.title.trim()}
                    >
                        Save
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

    if (!authChecked || profileLoading || !persistHydrated) {
        return (
            <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
                <CircularProgress />
                <Typography mt={3} color="text.secondary">
                    Preparing your workspace…
                </Typography>
            </Container>
        );
    }

    if (!selectedTopic) {
        return (
            <>
                <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>
                    <Grid container spacing={{ xs: 4, md: 6 }} alignItems="stretch">
                        <Grid size={{ xs: 12, md: 5 }}>
                            <Card sx={{ height: "100%", borderRadius: 4 }}>
                                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                                    <Typography variant="h5" fontWeight={900} gutterBottom>
                                        Choose your jurisdiction
                                    </Typography>
                                    <Typography color="text.secondary" sx={{ mb: 3 }}>
                                        We preload relevant regulations and forms the moment you confirm the country.
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
                                        What do you need help with?
                                    </Typography>
                                    <Typography color="text.secondary" sx={{ mb: 3 }}>
                                        Pick a preset to tailor the AI prompt. You can always switch later.
                                    </Typography>
                                    <Grid container spacing={2}>
                                        {topics.map((t) => (
                                            <Grid size={{ xs: 12, sm: 6 }} key={t}>
                                                <Button
                                                    fullWidth
                                                    variant="outlined"
                                                    onClick={() => setSelectedTopic(t)}
                                                    sx={{ borderRadius: 3, py: 1.5, fontWeight: 700 }}
                                                >
                                                    {t}
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
            <Grid container spacing={{ xs: 4, md: 5 }} alignItems="stretch">
                <Grid size={{ xs: 12, md: 4 }}>{renderContextPanel(false)}</Grid>
                <Grid size={{ xs: 12, md: 8 }}>{renderChatPanel(false)}</Grid>
            </Grid>
        </Container>
    );

    return (
        <>
            {layout}
            {overlayElements}
        </>
    );
};

export default AiChatPage;
