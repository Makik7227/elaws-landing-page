import React from "react";
import { Avatar, Box, Container, Stack, Typography, useTheme } from "@mui/material";
import SubscriptionButton from "../SubscriptionButton";
import { type Tier } from "../../utils/monetization";

type DashboardHeroProps = {
    gradient: string;
    initials: string;
    heroName: string;
    heroMeta: string;
    subscriptionTier: Tier | "free";
};

const DashboardHero: React.FC<DashboardHeroProps> = ({
    gradient,
    initials,
    heroName,
    heroMeta,
    subscriptionTier,
}) => {
    const theme = useTheme();
    const contrastText = theme.palette.getContrastText(theme.palette.primary.main);

    return (
        <>
            <Box
                sx={{
                    height: { xs: "64px", md: "80px" },
                    background: gradient,
                }}
            />
            <Box
                sx={{
                    mt: { xs: -8, md: -10 },
                    background: gradient,
                    color: contrastText,
                    py: { xs: 5, md: 7 },
                }}
            >
                <Container maxWidth="lg">
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={2}
                        alignItems={{ xs: "flex-start", sm: "center" }}
                        justifyContent="space-between"
                    >
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar sx={{ bgcolor: theme.palette.secondary.main, width: 56, height: 56 }}>
                                {initials}
                            </Avatar>
                            <Box>
                                <Typography variant="h5" fontWeight={900} lineHeight={1.2}>
                                    {heroName}
                                </Typography>
                                <Typography sx={{ opacity: 0.9 }}>{heroMeta}</Typography>
                            </Box>
                        </Stack>
                        <SubscriptionButton subscriptionTier={subscriptionTier} />
                    </Stack>
                </Container>
            </Box>
        </>
    );
};

export default DashboardHero;
