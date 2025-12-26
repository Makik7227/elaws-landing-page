import React from "react";
import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

type UpgradeCalloutProps = {
    title: string;
    description: string;
    pricingLabel: string;
    ctaLabel: string;
    pricingLink: string;
    ctaLink: string;
};

const UpgradeCallout: React.FC<UpgradeCalloutProps> = ({
    title,
    description,
    pricingLabel,
    ctaLabel,
    pricingLink,
    ctaLink,
}) => {
    return (
        <Card
            elevation={0}
            sx={{
                borderRadius: 3,
                backgroundColor: (theme) => theme.palette.background.default,
            }}
        >
            <CardContent>
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={2}
                    alignItems={{ xs: "flex-start", md: "center" }}
                    justifyContent="space-between"
                >
                    <Box>
                        <Typography variant="h6" fontWeight={900}>
                            {title}
                        </Typography>
                        <Typography color="text.secondary">{description}</Typography>
                    </Box>
                    <Stack direction="row" spacing={1.25} flexWrap="wrap">
                        <Button component={RouterLink} to={pricingLink} variant="outlined" sx={{ borderRadius: 2 }}>
                            {pricingLabel}
                        </Button>
                        <Button
                            component={RouterLink}
                            to={ctaLink}
                            variant="contained"
                            sx={{ borderRadius: 2, fontWeight: 800 }}
                        >
                            {ctaLabel}
                        </Button>
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
};

export default UpgradeCallout;
