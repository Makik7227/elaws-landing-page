import React from "react";
import {
    Avatar,
    Box,
    Divider,
    Drawer,
    IconButton,
    Stack,
    Typography,
    alpha,
    useTheme,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import { useTranslation } from "react-i18next";
import ConnectionsPanel from "./ConnectionsPanel";

type ConnectionsDrawerProps = {
    open: boolean;
    onClose: () => void;
};

const ConnectionsDrawer: React.FC<ConnectionsDrawerProps> = ({ open, onClose }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <Drawer anchor="right" open={open} onClose={onClose}>
            <Box
                sx={{
                    width: { xs: "100vw", sm: 420, md: 520 },
                    maxWidth: "100vw",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: theme.palette.background.default,
                }}
            >
                <Box
                    sx={{
                        position: "sticky",
                        top: 0,
                        zIndex: 2,
                        backgroundColor: alpha(theme.palette.background.paper, 0.95),
                        backdropFilter: "blur(12px)",
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                        px: { xs: 2, sm: 3 },
                        py: 2,
                    }}
                >
                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                        <Stack direction="row" alignItems="center" spacing={1.25}>
                            <Avatar
                                sx={{
                                    bgcolor: alpha(theme.palette.primary.main, 0.15),
                                    color: theme.palette.primary.main,
                                    width: 40,
                                    height: 40,
                                }}
                            >
                                <GroupsRoundedIcon />
                            </Avatar>
                            <Box>
                                <Typography variant="h6" fontWeight={800}>
                                    {t("connections.title")}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {t("connections.subtitle")}
                                </Typography>
                            </Box>
                        </Stack>
                        <IconButton aria-label={t("topBar.closeMenu")} onClick={onClose}>
                            <CloseRoundedIcon />
                        </IconButton>
                    </Stack>
                </Box>
                <Divider />
                <Box sx={{ flex: 1, overflow: "auto" }}>
                    <ConnectionsPanel variant="drawer" />
                </Box>
            </Box>
        </Drawer>
    );
};

export default ConnectionsDrawer;
