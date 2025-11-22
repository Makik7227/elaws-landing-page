import { useEffect, useState, useRef } from "react";
import {
    Avatar,
    Button,
    CircularProgress,
    Container,
    IconButton,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Stack,
    TextField,
    Typography,
    useTheme,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { collection, addDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { getChatKey } from "../../utils/getChatKey";
import { encryptMessage, decryptMessage } from "../../utils/encryption";
import {auth, db} from "../../../firebase.ts";
import type { DocumentData, Timestamp } from "firebase/firestore";

type Message = {
    id: string;
    text: string;
    senderId: string;
    timestamp: number;
    wasRead?: boolean;
};

export default function UserChatWeb() {
    const { id } = useParams<{ id: string }>();
    const theme = useTheme();
    const user = auth.currentUser;
    const navigate = useNavigate();

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const listRef = useRef<HTMLUListElement>(null);

    useEffect(() => {
        if (!id) return;
        const q = query(collection(db, `userChats/${id}/messages`), orderBy("timestamp", "desc"));
        const unsub = onSnapshot(q, async (ss) => {
            const key = await getChatKey(id);
            const list = ss.docs.map((d) => {
                const data = d.data() as DocumentData;
                let text = data.text;
                try {
                    if (key) text = decryptMessage(data.text, key);
                } catch (err) {
                    console.warn("Failed to decrypt message:", err);
                }
                return {
                    id: d.id,
                    text,
                    senderId: data.senderId,
                    timestamp:
                        (data.timestamp as Timestamp)?.toDate?.()?.getTime?.() ??
                        (typeof data.timestamp === "number" ? data.timestamp : Date.now()),
                    wasRead: !!data.wasRead,
                };
            });
            setMessages(list);
        });
        return () => unsub();
    }, [id]);

    const sendMessage = async () => {
        if (!id || !user || !input.trim()) return;
        setSending(true);
        try {
            const key = await getChatKey(id);
            const encrypted = key ? encryptMessage(input.trim(), key) : input.trim();
            await addDoc(collection(db, `userChats/${id}/messages`), {
                text: encrypted,
                senderId: user.uid,
                timestamp: serverTimestamp(),
                wasRead: false,
            });
            await updateDoc(doc(db, "userChats", id), {
                lastMessage: encrypted,
                lastMessageTimestamp: serverTimestamp(),
                lastMessageSenderId: user.uid,
                lastMessageWasRead: false,
            });
            setInput("");
            setTimeout(() => {
                listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
            }, 100);
        } catch (e) {
            console.error("sendMessage", e);
        }
        setSending(false);
    };

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <IconButton onClick={() => navigate("/userChats")}>
                    <ArrowBackRoundedIcon />
                </IconButton>
                <Typography variant="h6" fontWeight={800}>
                    Chat
                </Typography>
            </Stack>

            <List
                ref={listRef}
                sx={{
                    maxHeight: { xs: "55vh", sm: "60vh" },
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column-reverse",
                }}
            >
                {messages.length === 0 ? (
                    <Typography align="center" color="text.secondary" sx={{ py: 4 }}>No messages yet…</Typography>
                ) : (
                    messages.map((m) => (
                        <ListItem
                            key={m.id}
                            sx={{
                                alignSelf: m.senderId === user?.uid ? "flex-end" : "flex-start",
                                maxWidth: { xs: "90%", sm: "75%" },
                            }}
                        >
                            {m.senderId !== user?.uid && (
                                <ListItemAvatar><Avatar>{m.senderId[0]}</Avatar></ListItemAvatar>
                            )}
                            <ListItemText
                                primary={m.text}
                                secondary={new Date(m.timestamp).toLocaleTimeString()}
                                sx={{
                                    bgcolor: m.senderId === user?.uid ? theme.palette.primary.main : theme.palette.grey[300],
                                    color: m.senderId === user?.uid ? theme.palette.primary.contrastText : "inherit",
                                    borderRadius: 2,
                                    px: 1.5,
                                    py: 1,
                                }}
                            />
                        </ListItem>
                    ))
                )}
            </List>

            <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.25}
                mt={2}
                component="form"
                onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                }}
            >
                <TextField
                    fullWidth
                    placeholder="Type your message…"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    multiline
                    maxRows={4}
                />
                <Button
                    variant="contained"
                    onClick={sendMessage}
                    disabled={sending || !input.trim()}
                    sx={{ borderRadius: 2, minWidth: { sm: 120 }, width: { xs: "100%", sm: "auto" } }}
                    type="submit"
                >
                    {sending ? <CircularProgress size={20} /> : "Send"}
                </Button>
            </Stack>
        </Container>
    );
}
