import { Box, Container, Stack, Typography, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";

interface FooterProps {
    onOpenCookieSettings: () => void;
    onOpenPrivacy: () => void;
    onOpenTerms: () => void;
}

const Footer = ({ onOpenCookieSettings, onOpenPrivacy, onOpenTerms }: FooterProps) => {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <Box
            component="footer"
            sx={{
                py: 4,
                borderTop: `1px solid ${theme.palette.divider}`,
                bgcolor: theme.palette.background.paper,
            }}
        >
            <Container>
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    alignItems="center"
                    justifyContent="space-between"
                    spacing={2}
                >
                    <Typography variant="body2" color="text.secondary">
                        © {new Date().getFullYear()} eLaws
                    </Typography>
                    <Stack direction="row" spacing={3}>
                        <Typography
                            component="button"
                            type="button"
                            onClick={onOpenPrivacy}
                            color="text.secondary"
                            variant="body2"
                            sx={{
                                "&:hover": { color: "text.primary" },
                                background: "none",
                                border: 0,
                                p: 0,
                                cursor: "pointer",
                                font: "inherit",
                            }}
                        >
                            {t("home.footer.privacy")}
                        </Typography>
                        <Typography
                            component="button"
                            type="button"
                            onClick={onOpenTerms}
                            color="text.secondary"
                            variant="body2"
                            sx={{
                                "&:hover": { color: "text.primary" },
                                background: "none",
                                border: 0,
                                p: 0,
                                cursor: "pointer",
                                font: "inherit",
                            }}
                        >
                            {t("home.footer.terms")}
                        </Typography>
                        <Typography
                            component={RouterLink}
                            to="/contact"
                            color="text.secondary"
                            variant="body2"
                            sx={{ "&:hover": { color: "text.primary" } }}
                        >
                            {t("home.footer.contact")}
                        </Typography>
                        <Typography
                            component="button"
                            onClick={onOpenCookieSettings}
                            color="text.secondary"
                            variant="body2"
                            sx={{
                                "&:hover": { color: "text.primary" },
                                background: "none",
                                border: 0,
                                p: 0,
                                cursor: "pointer",
                                font: "inherit",
                            }}
                        >
                            {t("home.footer.cookieSettings")}
                        </Typography>
                    </Stack>
                </Stack>
            </Container>
        </Box>
    );
};

export default Footer;
