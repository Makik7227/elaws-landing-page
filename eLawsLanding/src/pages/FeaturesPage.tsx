import React from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Divider,
    Stack,
    Typography,
} from "@mui/material";
import {
    ChatRounded as ChatIcon,
    DescriptionOutlined as DocIcon,
    GavelRounded as GavelIcon,
    FolderSharedOutlined as CasesIcon,
    NoteAlt as NotesIcon,
    FlagOutlined as ProceduresIcon,
    LockOutlined as LockIcon,
    BoltOutlined as SpeedIcon,
} from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageHero from "../components/PageHero";

type Feature = {
    titleKey: string;
    descKey: string;
    icon: React.ReactNode;
};

const FeatureCard = ({ title, desc, icon }: { title: string; desc: string; icon: React.ReactNode }) => {
    return (
        <Card
            elevation={3}
            sx={{
                flex: "1 1 280px",
                maxWidth: 420,
                borderRadius: 3,
                transition: "transform 200ms ease, box-shadow 200ms ease",
                "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 14px 40px rgba(0,0,0,.12)",
                },
            }}
        >
            <CardContent>
                <Box
                    sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        display: "grid",
                        placeItems: "center",
                        mb: 1.5,
                        bgcolor: (t) =>
                            t.palette.mode === "light"
                                ? t.palette.primary.main + "20"
                                : t.palette.primary.main + "30",
                    }}
                >
                    {icon}
                </Box>
                <Typography variant="h6" fontWeight={800} gutterBottom>
                    {title}
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                    {desc}
                </Typography>
            </CardContent>
        </Card>
    );
};

const FeaturesPage: React.FC = () => {
    const { t } = useTranslation();

    const core: Feature[] = [
        {
            titleKey: "featuresPage.core.aiChat.title",
            descKey: "featuresPage.core.aiChat.desc",
            icon: <ChatIcon />,
        },
        {
            titleKey: "featuresPage.core.documents.title",
            descKey: "featuresPage.core.documents.desc",
            icon: <DocIcon />,
        },
        {
            titleKey: "featuresPage.core.cases.title",
            descKey: "featuresPage.core.cases.desc",
            icon: <CasesIcon />,
        },
        {
            titleKey: "featuresPage.core.notes.title",
            descKey: "featuresPage.core.notes.desc",
            icon: <NotesIcon />,
        },
    ];

    const more: Feature[] = [
        {
            titleKey: "featuresPage.more.procedures.title",
            descKey: "featuresPage.more.procedures.desc",
            icon: <ProceduresIcon />,
        },
        {
            titleKey: "featuresPage.more.presets.title",
            descKey: "featuresPage.more.presets.desc",
            icon: <GavelIcon />,
        },
        {
            titleKey: "featuresPage.more.privacy.title",
            descKey: "featuresPage.more.privacy.desc",
            icon: <LockIcon />,
        },
        {
            titleKey: "featuresPage.more.speed.title",
            descKey: "featuresPage.more.speed.desc",
            icon: <SpeedIcon />,
        },
    ];

    return (
        <>
            <PageHero
                title={t("featuresPage.hero.title")}
                subtitle={t("featuresPage.hero.subtitle")}
                badge={t("featuresPage.hero.badge")}
                icon={<ChatIcon />}
                align="center"
                actions={
                    <>
                        <Button
                            component={RouterLink}
                            to="/signup"
                            variant="contained"
                            sx={{ borderRadius: 3, fontWeight: 800 }}
                        >
                            {t("featuresPage.hero.primaryCta")}
                        </Button>
                        <Button
                            component={RouterLink}
                            to="/pricing"
                            variant="outlined"
                            sx={{ borderRadius: 3 }}
                        >
                            {t("featuresPage.hero.secondaryCta")}
                        </Button>
                    </>
                }
            />

            {/* CORE FEATURES */}
            <Box sx={{ py: { xs: 6, md: 8 } }}>
                <Container>
                    <Stack spacing={1} mb={3} textAlign="center">
                        <Typography variant="overline" color="text.secondary">
                            {t("featuresPage.coreSection.overline")}
                        </Typography>
                        <Typography variant="h4" fontWeight={900}>
                            {t("featuresPage.coreSection.title")}
                        </Typography>
                    </Stack>

                    <Stack
                        direction="row"
                        spacing={3}
                        useFlexGap
                        flexWrap="wrap"
                        justifyContent="center"
                    >
                        {core.map((f) => (
                            <FeatureCard
                                key={f.titleKey}
                                icon={f.icon}
                                title={t(f.titleKey)}
                                desc={t(f.descKey)}
                            />
                        ))}
                    </Stack>
                </Container>
            </Box>

            {/* DIVIDER */}
            <Container>
                <Divider sx={{ my: { xs: 2, md: 3 } }} />
            </Container>

            {/* MORE */}
            <Box sx={{ py: { xs: 6, md: 8 } }}>
                <Container>
                    <Stack spacing={1} mb={3} textAlign="center">
                        <Typography variant="overline" color="text.secondary">
                            {t("featuresPage.moreSection.overline")}
                        </Typography>
                        <Typography variant="h4" fontWeight={900}>
                            {t("featuresPage.moreSection.title")}
                        </Typography>
                    </Stack>

                    <Stack
                        direction="row"
                        spacing={3}
                        useFlexGap
                        flexWrap="wrap"
                        justifyContent="center"
                    >
                        {more.map((f) => (
                            <FeatureCard
                                key={f.titleKey}
                                icon={f.icon}
                                title={t(f.titleKey)}
                                desc={t(f.descKey)}
                            />
                        ))}
                    </Stack>
                </Container>
            </Box>
        </>
    );
};

export default FeaturesPage;
