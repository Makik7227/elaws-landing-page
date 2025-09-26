import React, { useState } from "react";
import {
    Fab,
    Drawer,
    Box,
    IconButton,
    Typography,
    Divider,
} from "@mui/material";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import AiChatPage from "../pages/AiChatPage";

const AiChatWidget: React.FC = () => {
    const [open, setOpen] = useState(false);

    return (
        <>
            {/* Floating button */}
            {!open &&
                <Fab
                color="primary"
                onClick={() => setOpen(true)}
                sx={{
                    position: "fixed",
                    bottom: 24,
                    right: 24,
                    zIndex: 1300,
                }}
            >
                <ChatBubbleOutlineRoundedIcon/>
            </Fab>}
            <Drawer
                anchor="right"
                open={open}
                onClose={() => setOpen(false)}
                PaperProps={{
                    sx: {
                        width: { xs: "100%", sm: 420 },
                        borderRadius: "16px 0 0 16px",
                        display: "flex",
                        flexDirection: "column",
                    },
                }}
            >
                <Box
                    sx={{
                        px: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        bgcolor: "background.paper",
                    }}
                >
                    <IconButton onClick={() => setOpen(false)}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h6" fontWeight={700}>
                        Legal Chat
                    </Typography>
                    <GavelRoundedIcon color="primary" />
                </Box>
                <Divider />

                {/* CHAT CONTENT */}
                <Box sx={{ flex: 1, overflow: "scroll" }}>
                    <AiChatPage />
                </Box>
            </Drawer>
        </>
    );
};

export default AiChatWidget;