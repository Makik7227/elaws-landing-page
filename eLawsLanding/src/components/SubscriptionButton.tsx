import React from "react";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

type SubscriptionButtonProps = {
    subscriptionTier: "free" | "plus" | "premium";
};

const SubscriptionButton: React.FC<SubscriptionButtonProps> = ({ subscriptionTier }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleClick = () => {
        navigate("/dashboard/subscribe");
    };

    const label =
        subscriptionTier === "free"
            ? t("components.subscriptionButton.upgrade")
            : t("components.subscriptionButton.manage");

    const variant =
        subscriptionTier === "free" ? "contained" : "outlined";

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
                bgcolor: "rgba(255,255,255,0.15)",
                color: "#fff",
                backdropFilter: "blur(4px)",
                border: "1px solid rgba(255,255,255,0.3)",
                "&:hover": {
                    bgcolor: "rgba(255,255,255,0.25)",
                },
            }}
        >
            {label}
        </Button>
    );
};

export default SubscriptionButton;
