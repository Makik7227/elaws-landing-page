import React from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    LinearProgress,
    Skeleton,
    Stack,
    Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import LocalPoliceRoundedIcon from "@mui/icons-material/LocalPoliceRounded";
import PanicButtonWeb from "../PanicButton";
import { type Tier } from "../../utils/monetization";

type UsageAndPanicCardProps = {
    loading: boolean;
    monthlyTokensUsed: number;
    tokenLimit: number;
    tokenPct: number;
    tokenLabel: string;
    tokenWarning: boolean;
    warningCopy: string;
    warningCtaLabel: string;
    warningCtaTo: string;
    panicTitle: string;
    panicSubtitle: string;
    country?: string;
    countryCode: string;
    subscriptionTier: Tier | "free";
    userId: string;
    onLockedAttempt: () => void;
};

const UsageAndPanicCard: React.FC<UsageAndPanicCardProps> = ({
    loading,
    monthlyTokensUsed,
    tokenLimit,
    tokenPct,
    tokenLabel,
    tokenWarning,
    warningCopy,
    warningCtaLabel,
    warningCtaTo,
    panicTitle,
    panicSubtitle,
    country,
    countryCode,
    subscriptionTier,
    userId,
    onLockedAttempt,
}) => {
    return (
        <Card elevation={4} sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    alignItems={{ xs: "stretch", md: "center" }}
                    justifyContent="space-between"
                    spacing={3}
                >
                    <Box sx={{ flex: 1, minWidth: 260 }}>
                        {loading ? (
                            <Stack spacing={1.5}>
                                <Skeleton variant="text" width="70%" />
                                <Skeleton variant="rounded" height={14} />
                            </Stack>
                        ) : (
                            <Stack spacing={1.25}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Chip icon={<GavelRoundedIcon />} label={tokenLabel} size="small" />
                                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                        {monthlyTokensUsed.toLocaleString()} / {tokenLimit.toLocaleString()}
                                    </Typography>
                                </Stack>
                                <LinearProgress
                                    variant="determinate"
                                    value={Math.round(tokenPct * 100)}
                                    sx={{
                                        height: 10,
                                        borderRadius: 10,
                                        "& .MuiLinearProgress-bar": { borderRadius: 10 },
                                    }}
                                />
                                {tokenWarning && (
                                    <Alert
                                        severity="warning"
                                        action={
                                            <Button
                                                size="small"
                                                color="warning"
                                                variant="contained"
                                                component={RouterLink}
                                                to={warningCtaTo}
                                            >
                                                {warningCtaLabel}
                                            </Button>
                                        }
                                    >
                                        {warningCopy}
                                    </Alert>
                                )}
                            </Stack>
                        )}
                    </Box>

                    <Divider flexItem orientation="vertical" sx={{ display: { xs: "none", md: "block" }, mx: 1 }} />

                    <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
                        <Box>
                            <Typography fontWeight={800} display="flex" alignItems="center" gap={1}>
                                <LocalPoliceRoundedIcon /> {panicTitle}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {panicSubtitle}
                            </Typography>
                        </Box>
                        {loading ? (
                            <Skeleton variant="rounded" width={220} height={48} />
                        ) : (
                            <PanicButtonWeb
                                tokenLimit={tokenLimit}
                                defaultCode={countryCode}
                                tokensUsed={monthlyTokensUsed}
                                defaultCountry={country || ""}
                                subscriptionTier={subscriptionTier}
                                userId={userId}
                                onLockedAttempt={onLockedAttempt}
                            />
                        )}
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
};

export default UsageAndPanicCard;
