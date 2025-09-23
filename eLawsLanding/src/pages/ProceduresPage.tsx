import {
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Divider,
    Typography,
    useTheme,
} from "@mui/material";
import LocalPoliceRoundedIcon from "@mui/icons-material/LocalPoliceRounded";
import { useLocation, useNavigate } from "react-router-dom";

const CARD_MAX_HEIGHT = 420;

export default function ProceduresView() {
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as
        | {
        procedures: string;
        country?: string;
        tokensUsed?: string;
        tokenLimit?: string;
    }
        | undefined;

    const procedures = state?.procedures || "No procedures found.";
    const country = state?.country || "Unknown";

    return (
        <Container maxWidth="sm" sx={{ py: { xs: 4, md: 6 } }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                <LocalPoliceRoundedIcon
                    sx={{ fontSize: 42, color: theme.palette.primary.main }}
                />
                <Box>
                    <Typography variant="h5" fontWeight={800}>
                        Police Stop Procedures
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        for <strong>{country}</strong>
                    </Typography>
                </Box>
            </Box>
            <Divider sx={{ mb: 3 }} />
            <Card
                elevation={4}
                sx={{
                    borderRadius: 3,
                    maxHeight: CARD_MAX_HEIGHT,
                    overflow: "auto",
                    mb: 3,
                }}
            >
                <CardContent>
                    <Typography
                        variant="body1"
                        sx={{
                            whiteSpace: "pre-line",
                            lineHeight: 1.6,
                            fontSize: "1rem",
                            fontWeight: 500,
                        }}
                    >
                        {procedures}
                    </Typography>
                </CardContent>
            </Card>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Button
                    variant="contained"
                    color="secondary"
                    sx={{ borderRadius: 2, fontWeight: 700 }}
                    onClick={() => navigate("/dashboard")}
                >
                    Ok, got it!
                </Button>
            </Box>
        </Container>
    );
}