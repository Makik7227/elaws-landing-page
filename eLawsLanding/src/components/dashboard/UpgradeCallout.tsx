import React from "react";
import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

type UpgradeCalloutProps = {
    title: string;
    description: string;
    pricingLabel: string;
    pricingLink: string;
};

const UpgradeCallout: React.FC<UpgradeCalloutProps> = ({
    title,
    description,
    pricingLabel,
    pricingLink,
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
                        <Button
                            component={RouterLink}
                            to={pricingLink}
                            variant="contained"
                            sx={{
                                borderRadius: 2,
                                fontWeight: 700,
                                boxShadow: "0 12px 24px rgba(18, 10, 40, 0.18)",
                            }}
                        >
                            {pricingLabel}
                        </Button>
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
};

export default UpgradeCallout;
