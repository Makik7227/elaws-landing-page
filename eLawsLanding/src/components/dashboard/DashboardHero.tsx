import React from "react";
import { Avatar, useTheme } from "@mui/material";
import SubscriptionButton from "../SubscriptionButton";
import { type Tier } from "../../utils/monetization";
import PageHero from "../PageHero";

type DashboardHeroProps = {
    initials: string;
    heroName: string;
    heroMeta: string;
    subscriptionTier: Tier | "free";
};

const DashboardHero: React.FC<DashboardHeroProps> = ({
    initials,
    heroName,
    heroMeta,
    subscriptionTier,
}) => {
    const theme = useTheme();

    return (
        <PageHero
            title={heroName}
            subtitle={heroMeta}
            icon={
                <Avatar sx={{ bgcolor: theme.palette.secondary.main, width: 36, height: 36 }}>
                    {initials}
                </Avatar>
            }
            actions={<SubscriptionButton subscriptionTier={subscriptionTier} />}
            variant="soft"
            maxWidth="lg"
        />
    );
};

export default DashboardHero;
