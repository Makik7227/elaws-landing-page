import { useEffect, useState } from "react";
import {
    Avatar,
    Badge,
    Box,
    Button,
    Card,
    CardActionArea,
    CardContent,
    CircularProgress,
    Container,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    InputAdornment,
    List,
    ListItem,
    ListItemAvatar, ListItemButton,
    ListItemText,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import ClearAllRoundedIcon from "@mui/icons-material/ClearAllRounded";
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    where,
    writeBatch,
    addDoc,
    type DocumentData
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { decryptMessage, generateSecureKey } from "../../utils/encryption";
import { getChatKey } from "../../utils/getChatKey";
import { db } from "../../../firebase";
import { useTranslation } from "react-i18next";
import PageHero from "../../components/PageHero";
import DashboardBackButton from "../../components/DashboardBackButton";

type Chat = {
    id: string;
    users: string[];
    lastMessage?: string;
    lastMessageWasRead?: boolean;
    lastMessageSenderId?: string;
};

type UserProfile = {
    uid: string;
    firstName: string;
    lastName: string;
    username: string;
};

const getInitials = (f = "", l = "") => (f.charAt(0) + l.charAt(0)).toUpperCase();

export default function UserChatsWeb() {
    const auth = getAuth();
    const user = auth.currentUser;
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [chats, setChats] = useState<Chat[]>([]);
    const [decrypted, setDecrypted] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);

    const [friends, setFriends] = useState<UserProfile[]>([]);
    const [filtered, setFiltered] = useState<UserProfile[]>([]);
    const [search, setSearch] = useState("");
    const [openModal, setOpenModal] = useState(false);

    // Load chats + friends
    useEffect(() => {
        if (!user) return;
        const qChats = query(collection(db, "userChats"), where("users", "array-contains", user.uid));
        const unsub = onSnapshot(qChats, (ss) => {
            const list = ss.docs.map((d) => {
                const data = d.data() as DocumentData;
                return {
                    id: d.id,
                    users: Array.isArray(data.users) ? data.users : [],
                    lastMessage: data.lastMessage || "",
                    lastMessageWasRead: !!data.lastMessageWasRead,
                    lastMessageSenderId: data.lastMessageSenderId || "",
                };
            });
            setChats(list);
            setLoading(false);
        });

        // Load friends
        const qFriends = query(collection(db, "friendships"), where("participants", "array-contains", user.uid));
        const unsubFriends = onSnapshot(qFriends, async (ss) => {
            const arr: UserProfile[] = [];
            for (const d of ss.docs) {
                const { participants } = d.data();
                const other = participants.find((x: string) => x !== user.uid);
                if (other) {
                    const snap = await getDoc(doc(db, "users", other));
                    if (snap.exists()) {
                        const data = snap.data() as Partial<UserProfile>;
                        arr.push({ uid: other, firstName: data.firstName || "", lastName: data.lastName || "", username: data.username || "" });
                    }
                }
            }
            setFriends(arr);
            setFiltered(arr);
        });

        return () => {
            unsub();
            unsubFriends();
        };
    }, [user]);

    // Decrypt last messages
    useEffect(() => {
        (async () => {
            const out: Record<string, string> = {};
            for (const c of chats) {
                const key = await getChatKey(c.id);
                if (c.lastMessage && key) {
                    try {
                        out[c.id] = decryptMessage(c.lastMessage, key);
                    } catch {
                        out[c.id] = t("userChats.messages.decryptError");
                    }
                } else {
                    out[c.id] = t("userChats.messages.empty");
                }
            }
            setDecrypted(out);
        })();
    }, [chats, t]);

    const handleDeleteChat = async (id: string) => {
        if (!window.confirm(t("userChats.confirm.deleteChat"))) return;
        await deleteDoc(doc(db, "userChats", id));
    };

    const handleClearChat = async (id: string) => {
        if (!window.confirm(t("userChats.confirm.clearChat"))) return;
        const msgs = await getDocs(collection(db, `userChats/${id}/messages`));
        const batch = writeBatch(db);
        msgs.forEach((m) => batch.delete(m.ref));
        batch.update(doc(db, "userChats", id), { lastMessage: "", lastMessageSenderId: "", lastMessageWasRead: false });
        await batch.commit();
    };

    const startNewChat = async (friendId: string) => {
        if (!user) return;
        const existing = chats.find((c) => c.users.includes(friendId) && c.users.includes(user.uid));
        if (existing) {
            navigate(`/userChats/${existing.id}`);
            setOpenModal(false);
            return;
        }
        const key = generateSecureKey();
        const chatRef = await addDoc(collection(db, "userChats"), {
            users: [user.uid, friendId],
            createdAt: new Date().toISOString(),
            secureKey: Buffer.from(key).toString("base64"),
            lastMessage: "",
        });
        navigate(`/userChats/${chatRef.id}`);
        setOpenModal(false);
    };

    const filterFriends = (txt: string) => {
        setSearch(txt);
        setFiltered(friends.filter((f) => [f.firstName, f.lastName, f.username].join(" ").toLowerCase().includes(txt.toLowerCase())));
    };

    return (
        <>
            <PageHero
                title={t("userChats.list.title")}
                subtitle={t("userChats.list.subtitle", { defaultValue: "Manage secure conversations and message history." })}
                actions={
                    <>
                        <Button
                            startIcon={<AddRoundedIcon />}
                            variant="contained"
                            onClick={() => setOpenModal(true)}
                            sx={{ width: { xs: "100%", sm: "auto" } }}
                        >
                            {t("userChats.actions.newChat")}
                        </Button>
                        <DashboardBackButton />
                    </>
                }
                variant="soft"
                maxWidth="md"
            />
            <Container maxWidth="md" sx={{ py: 5 }}>
                {loading ? (
                    <Box textAlign="center"><CircularProgress /></Box>
                ) : chats.length === 0 ? (
                    <Typography color="text.secondary" align="center">{t("userChats.list.empty")}</Typography>
                ) : (
                    <List>
                        {chats.map((c) => {
                            const friendId = c.users.find((x) => x !== user?.uid);
                            const friend = friends.find((f) => f.uid === friendId);
                            const isUnread = c.lastMessageSenderId !== user?.uid && !c.lastMessageWasRead;
                            return (
                                <Card key={c.id} sx={{ mb: 2, borderRadius: 3 }}>
                                    <CardActionArea onClick={() => navigate(`/userChats/${c.id}`)}>
                                        <CardContent
                                            sx={{
                                                display: "flex",
                                                alignItems: { xs: "flex-start", sm: "center" },
                                                gap: { xs: 1.25, sm: 2 },
                                                flexWrap: { xs: "wrap", sm: "nowrap" },
                                            }}
                                        >
                                            <ListItemAvatar sx={{ minWidth: "auto" }}>
                                                <Avatar>{friend ? getInitials(friend.firstName, friend.lastName) : "?"}</Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Typography fontWeight={700}>
                                                        {friend ? `${friend.firstName} ${friend.lastName}` : t("userChats.list.unknownUser")}
                                                    </Typography>
                                                }
                                                secondary={decrypted[c.id]?.slice(0, 60) ?? t("userChats.messages.empty")}
                                                sx={{ flex: 1, minWidth: 0 }}
                                            />
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                {isUnread && <Badge color="primary" variant="dot" />}
                                                <ChevronRightRoundedIcon color="action" />
                                            </Stack>
                                        </CardContent>
                                    </CardActionArea>
                                    <Box display="flex" justifyContent="flex-end" px={1} pb={1}>
                                        <IconButton onClick={() => handleClearChat(c.id)}><ClearAllRoundedIcon /></IconButton>
                                        <IconButton onClick={() => handleDeleteChat(c.id)}><DeleteRoundedIcon /></IconButton>
                                    </Box>
                                </Card>
                            );
                        })}
                    </List>
                )}

                <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm">
                    <DialogTitle>{t("userChats.list.dialogTitle")}</DialogTitle>
                    <DialogContent>
                        <TextField
                            value={search}
                            onChange={(e) => filterFriends(e.target.value)}
                            fullWidth
                            placeholder={t("userChats.list.searchPlaceholder")}
                            margin="normal"
                            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment> }}}
                        />
                        <List>
                            {filtered.map((f) => (
                                <ListItem key={f.uid} disablePadding>
                                    <ListItemButton onClick={() => startNewChat(f.uid)}>
                                        <ListItemAvatar>
                                            <Avatar>{getInitials(f.firstName, f.lastName)}</Avatar>
                                        </ListItemAvatar>
                                        <ListItemText primary={`${f.firstName} ${f.lastName}`} secondary={f.username} />
                                    </ListItemButton>
                                </ListItem>
                            ))}
                            {filtered.length === 0 && (
                                <Typography color="text.secondary" align="center">
                                    {t("userChats.list.noFriends")}
                                </Typography>
                            )}
                        </List>
                    </DialogContent>
                </Dialog>
            </Container>
        </>
    );
}
