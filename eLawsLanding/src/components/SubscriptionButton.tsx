import React from "react";
import { Button, alpha, useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

type SubscriptionButtonProps = {
    subscriptionTier: "free" | "plus" | "premium";
};

const SubscriptionButton: React.FC<SubscriptionButtonProps> = ({ subscriptionTier }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const theme = useTheme();

    const handleClick = () => {
        navigate("/dashboard/subscribe");
    };

    const label =
        subscriptionTier === "free"
            ? t("components.subscriptionButton.upgrade")
            : t("components.subscriptionButton.manage");

    const variant =
        subscriptionTier === "free" ? "contained" : "outlined";

    const isFree = subscriptionTier === "free";

    return (
        <Button
            onClick={handleClick}
            variant={variant}
            sx={{
                borderRadius: 2,
                fontWeight: 800,
                px: 3,
                py: 1.25,
                textTransform: "none",
                bgcolor: isFree ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.08),
                color: isFree ? theme.palette.primary.contrastText : theme.palette.primary.main,
                border: isFree ? "none" : `1px solid ${alpha(theme.palette.primary.main, 0.45)}`,
                boxShadow: isFree ? "0 10px 22px rgba(43, 24, 84, 0.22)" : "none",
                "&:hover": {
                    bgcolor: isFree
                        ? theme.palette.primary.dark
                        : alpha(theme.palette.primary.main, 0.16),
                    borderColor: isFree ? "transparent" : alpha(theme.palette.primary.main, 0.65),
                },
            }}
        >
            {label}
        </Button>
    );
};

export default SubscriptionButton;
