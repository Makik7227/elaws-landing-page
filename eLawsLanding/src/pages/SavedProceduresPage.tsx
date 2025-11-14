import React, {useEffect, useState} from "react";
import {
    Avatar,
    Box,
    Card,
    CardContent,
    CardHeader,
    Collapse,
    Container,
    Divider,
    IconButton,
    TextField,
    Typography,
    useTheme,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import {collection, onSnapshot, orderBy, query} from "firebase/firestore";
import {auth, db} from "../../firebase.ts";
import {onAuthStateChanged} from "firebase/auth";

type Procedure = {
    id: string;
    title: string;
    content: string;
    countryCode: string;
    createdAt?: string;
};

const SavedProceduresPage: React.FC = () => {
    const theme = useTheme();
    const [procedures, setProcedures] = useState<Procedure[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [filter, setFilter] = useState("");


    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, (user) => {
            if (!user) return setProcedures([]);
            const q = query(collection(db, "users", user.uid, "procedures"), orderBy("createdAt", "desc"));
            return onSnapshot(q, (snap) => {
                const list: Procedure[] = snap.docs.map((d) => ({
                    id: d.id,
                    ...d.data(),
                })) as Procedure[];
                setProcedures(list);
            });
        });
        return () => unsubAuth();
    }, []);

    const filtered = procedures.filter((p) =>
        p.countryCode.toLowerCase().includes(filter.toLowerCase())
    );

    const getFlagEmoji = (countryCode: string) =>
        countryCode
            ? countryCode
                .toUpperCase()
                .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
            : "🏳️";

    return (
        <Container maxWidth="md" sx={{ py: 6 }}>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
                <FlagRoundedIcon color="primary" />
                <Typography variant="h5" fontWeight={800}>
                    Saved Procedures
                </Typography>
            </Box>

            <TextField
                label="Filter by country code"
                fullWidth
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                sx={{ mb: 3 }}
            />

            {filtered.length === 0 ? (
                <Typography color="text.secondary" align="center" mt={5}>
                    No saved procedures found.
                </Typography>
            ) : (
                filtered.map((proc) => {
                    const expanded = expandedId === proc.id;
                    const flag = getFlagEmoji(proc.countryCode);
                    return (
                        <Card
                            key={proc.id}
                            sx={{
                                mb: 2,
                                borderRadius: 3,
                                background: theme.palette.background.paper,
                            }}
                            elevation={3}
                        >
                            <CardHeader
                                avatar={
                                    <Avatar sx={{ bgcolor: theme.palette.primary.main, fontSize: 20 }}>
                                        {flag}
                                    </Avatar>
                                }
                                title={
                                    <Typography fontWeight={700} variant="h6">
                                        {proc.title}
                                    </Typography>
                                }
                                subheader={`Country: ${proc.countryCode}`}
                                action={
                                    <IconButton onClick={() => setExpandedId(expanded ? null : proc.id)}>
                                        {expanded ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
                                    </IconButton>
                                }
                            />
                            <Collapse in={expanded} timeout="auto" unmountOnExit>
                                <Divider />
                                <CardContent>
                                    <Typography
                                        variant="body1"
                                        color="text.secondary"
                                        sx={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}
                                    >
                                        {proc.content}
                                    </Typography>
                                </CardContent>
                            </Collapse>
                        </Card>
                    );
                })
            )}
        </Container>
    );
};

export default SavedProceduresPage;