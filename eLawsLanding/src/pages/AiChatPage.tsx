import React, { useState, useEffect, useRef } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Snackbar,
    Stack,
    TextField,
    Typography,
    Alert, Divider,
} from "@mui/material";
import { Send as SendIcon, Save as SaveIcon } from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { doc, getDoc } from "firebase/firestore";
import {sendMessageToGPT} from "../api/chat.ts";
import {auth, db} from "../../firebase.ts";
import CustomCountryPickerWeb from "../components/CustomCountryPicker.tsx";

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
    const [isTyping, setIsTyping] = useState(false);
    const [dotCount, setDotCount] = useState(0);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [snackbar, setSnackbar] = useState<{ visible: boolean; text: string }>({
        visible: false,
        text: "",
    });
    const [country, setCountry] = useState<string>("");
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const [countryCode, setCountryCode] = useState<string>("");
    useEffect(() => {
        const fetchCountry = async () => {
            const currentUser = auth.currentUser;
            if (!currentUser) return;
            try {
                const userRef = doc(db, "users", currentUser.uid);
                const snap = await getDoc(userRef);
                if (snap.exists()) {
                    const data = snap.data();
                    if (data.country && data.countryCode) {
                        setCountry(data.country as string);
                        setCountryCode(data.countryCode as string);
                    }
                }
            } catch (err) {
                console.error("Error fetching country:", err);
            }
        };
        fetchCountry();
    }, []);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isTyping) {
            timer = setInterval(() => setDotCount((c) => (c + 1) % 4), 500);
        } else setDotCount(0);
        return () => clearInterval(timer);
    }, [isTyping]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    if (!selectedTopic) {
        return (
            <Container maxWidth="sm" sx={{ py: 6 }}>
                <Typography variant="h5" fontWeight="bold" mb={3} textAlign="center">
                    Select Topic & Country
                </Typography>
                <Card sx={{ borderRadius: 3, p: 2 }}>
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

                        <Typography variant="subtitle1" gutterBottom>
                            Choose a legal topic:
                        </Typography>
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

    const startConversation = (topic: string) => {
        setSelectedTopic(topic);
        const displayTopic = topic === "Other" ? "general law" : topic;
        setMessages([
            {
                id: "0",
                role: "bot",
                content: `You're now chatting about ${displayTopic} in ${country || "your country"}. 🤖 How can I help you?`,
            },
        ]);
    };

    const sendMessage = async () => {
        if (sendingMessage || !input.trim()) return;
        setSendingMessage(true);
        const userMsg: Message = { id: Date.now().toString(), role: "user", content: input };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);
        setMessages((prev) => [...prev, { id: "typing", role: "bot", content: "" }]);

        try {
            const systemPrompt: ChatMessage = {
                role: "system",
                content: `You are a legal assistant specializing in ${country || "general"} ${
                    selectedTopic || "law"
                }. Answer concisely and clearly.`,
            };
            const history: ChatMessage[] = [
                systemPrompt,
                ...messages
                    .slice(-6)
                    .filter((m) => m.id !== "typing")
                    .map<ChatMessage>((m) => ({
                        role: m.role === "user" ? "user" : "assistant",
                        content: m.content,
                    })),
                { role: "user", content: userMsg.content },
            ];
            const { content: reply } = await sendMessageToGPT(history);
            setMessages((prev) => [
                ...prev.filter((m) => m.id !== "typing"),
                { id: Date.now().toString() + "-bot", role: "bot", content: reply },
            ]);
        } catch (err) {
            console.error(err);
            setSnackbar({ visible: true, text: "Failed to send message." });
        } finally {
            setIsTyping(false);
            setSendingMessage(false);
        }
    };

    if (!selectedTopic) {
        return (
            <Container maxWidth="sm" sx={{ py: 6 }}>
                <Typography variant="h5" fontWeight="bold" mb={2} textAlign="center">
                    Select Topic & Country
                </Typography>
                <Stack spacing={2}>
                    {topics.map((t) => (
                        <Button key={t} variant="outlined" onClick={() => startConversation(t)}>
                            {t}
                        </Button>
                    ))}
                </Stack>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ py: 4, display: "flex", flexDirection: "column", height: "100dvh" }}>
            {/* Chat area */}
            <Box flex={1} overflow="auto" mb={2} px={1}>
                <AnimatePresence>
                    {messages.map((m) =>
                        m.id === "typing" ? (
                            <motion.div
                                key="typing"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Card sx={{ mb: 1, bgcolor: "grey.100" }}>
                                    <CardContent>
                                        <Typography>Typing{".".repeat(dotCount)}</Typography>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ) : (
                            <motion.div
                                key={m.id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Card
                                    sx={{
                                        mb: 1,
                                        alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                                        bgcolor: m.role === "user" ? "primary.main" : "grey.100",
                                        color: m.role === "user" ? "primary.contrastText" : "text.primary",
                                    }}
                                >
                                    <CardContent>
                                        <Typography>{m.content}</Typography>
                                        {m.role === "bot" && m.id !== "0" && (
                                            <Button
                                                startIcon={<SaveIcon />}
                                                onClick={() => setSnackbar({ visible: true, text: "Saved to Notes ✅" })}
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