// src/pages/AiChatPageWeb.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Chip,
    CircularProgress,
    Snackbar,
    TextField,
    Typography,
    Alert,
    Stack,
    Divider,
} from "@mui/material";
import { Save as SaveIcon, Send as SendIcon } from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../firebase";
import { sendMessageToGPT } from "../api/chat";
import CustomCountryPickerWeb from "../components/CustomCountryPicker";
import { onAuthStateChanged } from "firebase/auth";

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

const AiChatPage: React.FC = () => {
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

    // Fetch user country on mount
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (!u) return;
            const snap = await getDoc(doc(db, "users", u.uid));
            if (snap.exists()) {
                const data = snap.data();
                if (data.country) setCountry(data.country);
                if (data.countryCode) setCountryCode(data.countryCode);
            }
        });
        return () => unsub();
    }, []);

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

    if (!selectedTopic) {
        return (
            <Container maxWidth="sm" sx={{ py: 6 }}>
                <Typography variant="h5" fontWeight={900} mb={3} textAlign="center">
                    Select Topic & Country
                </Typography>
                <Card sx={{ borderRadius: 3 }}>
                    <CardContent>
                        <Box display="flex" justifyContent="center" mb={2}>
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
                        <Divider sx={{ my: 2 }} />
                        <Stack spacing={1.5}>
                            {topics.map((t) => (
                                <Button
                                    key={t}
                                    variant="outlined"
                                    onClick={() => setSelectedTopic(t)}
                                    sx={{ borderRadius: 2 }}
                                >
                                    {t}
                                </Button>
                            ))}
                        </Stack>
                    </CardContent>
                </Card>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ py: 4, display: "flex", flexDirection: "column", height: "100dvh" }}>
            {/* Chat messages */}
            <Box flex={1} overflow="auto" mb={2}>
                <AnimatePresence>
                    {messages.map((m) =>
                        m.id === "typing" ? (
                            <motion.div
                                key="typing"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <Card sx={{ mb: 1, bgcolor: "grey.100" }}>
                                    <CardContent>
                                        <Typography>Typing…</Typography>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ) : (
                            <motion.div
                                key={m.id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                            >
                                <Card
                                    sx={{
                                        mb: 1.5,
                                        alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                                        bgcolor: m.role === "user" ? "primary.main" : "grey.100",
                                        color: m.role === "user" ? "primary.contrastText" : "text.primary",
                                        maxWidth: "80%",
                                    }}
                                >
                                    <CardContent>
                                        <Typography>{m.content}</Typography>
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
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )
                    )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </Box>

            {/* Input */}
            <Stack direction="row" spacing={1}>
                <TextField
                    fullWidth
                    placeholder="Type your legal question…"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    multiline
                    maxRows={4}
                />
                <Button
                    variant="contained"
                    endIcon={<SendIcon />}
                    onClick={sendMessage}
                    disabled={sendingMessage || !input.trim()}
                >
                    Send
                </Button>
            </Stack>

            {/* Note Save Dialog */}
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
        </Container>
    );
};

export default AiChatPage;