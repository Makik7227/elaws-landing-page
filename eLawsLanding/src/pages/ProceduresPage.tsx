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
import { useTranslation } from "react-i18next";

const CARD_MAX_HEIGHT = 420;

export default function ProceduresView() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const location = useLocation();
    const state = location.state as
        | {
        procedures: string;
        country?: string;
        tokensUsed?: string;
        tokenLimit?: string;
    }
        | undefined;

    const procedures = state?.procedures || t("proceduresPage.empty");
    const country = state?.country || t("proceduresPage.unknown");

    return (
        <Container maxWidth="sm" sx={{ py: { xs: 4, md: 6 } }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                <LocalPoliceRoundedIcon
                    sx={{ fontSize: 42, color: theme.palette.primary.main }}
                />
                <Box>
                    <Typography variant="h5" fontWeight={800}>
                        {t("proceduresPage.title")}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        {t("proceduresPage.country", { country })}
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
                    {t("proceduresPage.back")}
                </Button>
            </Box>
        </Container>
    );
}
