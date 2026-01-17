import React from "react";
import { Box, Button, Stack, Typography, useTheme } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

type DowngradeNoticeProps = {
    show: boolean;
    title: string;
    message: string | null;
    help: string;
    ctaLabel: string;
    ctaTo: string;
};

const DowngradeNotice: React.FC<DowngradeNoticeProps> = ({
    show,
    title,
    message,
    help,
    ctaLabel,
    ctaTo,
}) => {
    const theme = useTheme();

    if (!show) {
        return null;
    }

    return (
        <Box
            sx={{
                mb: 3,
                p: 2.5,
                borderRadius: 2,
                border: `1px solid ${theme.palette.warning.main}`,
                backgroundColor: theme.palette.warning.main + "15",
            }}
        >
            <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "flex-start", sm: "center" }}
                justifyContent="space-between"
            >
                <Box>
                    <Typography variant="subtitle2" sx={{ textTransform: "uppercase", fontWeight: 700 }}>
                        {title}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {message}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {help}
                    </Typography>
                </Box>
                <Button
                    component={RouterLink}
                    to={ctaTo}
                    variant="outlined"
                    color="warning"
                    sx={{ fontWeight: 700, borderRadius: 2 }}
                >
                    {ctaLabel}
                </Button>
            </Stack>
        </Box>
    );
};

export default DowngradeNotice;
