import React, {useEffect, useMemo, useState} from "react";
import {
    Avatar,
    Card,
    CardContent,
    CardHeader,
    Collapse,
    Container,
    Divider,
    IconButton,
    Stack,
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
import {useTranslation} from "react-i18next";
import DashboardBackButton from "../components/DashboardBackButton.tsx";
import PageHero from "../components/PageHero";

type Procedure = {
    id: string;
    title: string;
    content: string;
    countryCode: string;
    createdAt?: string;
};

const SavedProceduresPage: React.FC = () => {
    const theme = useTheme();
    const {t} = useTranslation();
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

    const filtered = useMemo(
        () =>
            procedures.filter((p) =>
                p.countryCode.toLowerCase().includes(filter.toLowerCase())
            ),
        [procedures, filter]
    );

    const getFlagEmoji = (countryCode: string) =>
        countryCode
            ? countryCode
                .toUpperCase()
                .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
            : "🏳️";

    const formatCountry = (code: string) => t(`countries.${code}`, { defaultValue: code });

    const heroStats = [
        { label: t("savedProcedures.stats.total", { defaultValue: "Total saved" }), value: procedures.length.toString() },
        { label: t("savedProcedures.stats.visible", { defaultValue: "Visible now" }), value: filtered.length.toString() },
    ];

    return (
        <>
            <PageHero
                title={t("savedProcedures.title")}
                subtitle={t("savedProcedures.subtitle", {
                    defaultValue: "Reuse your AI-guided procedures and keep country context handy.",
                })}
                icon={<FlagRoundedIcon />}
                variant="soft"
                actions={<DashboardBackButton />}
                maxWidth="md"
            >
                <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 2, sm: 4 }}>
                    {heroStats.map((stat) => (
                        <Stack key={stat.label} spacing={0.5}>
                            <Typography variant="h6" fontWeight={800}>
                                {stat.value}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                {stat.label}
                            </Typography>
                        </Stack>
                    ))}
                </Stack>
            </PageHero>
            <Container maxWidth="md" sx={{ py: 6 }}>
                <Stack spacing={3}>
                    <Card sx={{ borderRadius: 3 }}>
                        <CardContent>
                            <TextField
                                label={t("savedProcedures.filter")}
                                fullWidth
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            />
                        </CardContent>
                    </Card>

                    {filtered.length === 0 ? (
                        <Card sx={{ borderRadius: 3 }}>
                            <CardContent sx={{ textAlign: "center" }}>
                                <Typography color="text.secondary">
                                    {t("savedProcedures.empty")}
                                </Typography>
                            </CardContent>
                        </Card>
                    ) : (
                        filtered.map((proc) => {
                            const expanded = expandedId === proc.id;
                            const flag = getFlagEmoji(proc.countryCode);
                            return (
                                <Card
                                    key={proc.id}
                                    sx={{
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
                                        subheader={t("savedProcedures.country", { country: formatCountry(proc.countryCode), code: proc.countryCode })}
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
                </Stack>
            </Container>
        </>
    );
};

export default SavedProceduresPage;
