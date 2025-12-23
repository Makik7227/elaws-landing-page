import React from "react";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    Typography,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

type UpgradePromptDialogProps = {
    open: boolean;
    onClose: () => void;
    title: string;
    description: string;
    requiredTier: "plus" | "premium";
    highlight?: string;
};

const UpgradePromptDialog: React.FC<UpgradePromptDialogProps> = ({
    open,
    onClose,
    title,
    description,
    requiredTier,
    highlight,
}) => {
    const { t } = useTranslation();
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LockOutlinedIcon color="warning" />
                {title}
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={1.5}>
                    <Typography color="text.secondary">{description}</Typography>
                    {highlight && (
                        <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            sx={(theme) => ({
                                p: 1.25,
                                borderRadius: 2,
                                bgcolor: theme.palette.warning.main + "0F",
                                border: `1px solid ${theme.palette.warning.light}`,
                            })}
                        >
                            <WarningRoundedIcon color="warning" fontSize="small" />
                            <Typography variant="body2">{highlight}</Typography>
                        </Stack>
                    )}
                    <Typography fontWeight={600}>
                        {t("upgradePrompt.requiredTier", { tier: requiredTier.toUpperCase() })}
                    </Typography>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose}>{t("upgradePrompt.secondary")}</Button>
                <Button
                    component={RouterLink}
                    to="/dashboard/subscribe"
                    variant="contained"
                    onClick={onClose}
                    sx={{ borderRadius: 2, fontWeight: 800 }}
                >
                    {t("upgradePrompt.primary")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default UpgradePromptDialog;
