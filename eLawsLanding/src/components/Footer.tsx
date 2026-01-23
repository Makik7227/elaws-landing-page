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
    const productItems = t("home.footer.seo.columns.product.items", { returnObjects: true }) as {
        label: string;
        slug: string;
    }[];
    const useCaseItems = t("home.footer.seo.columns.useCases.items", { returnObjects: true }) as {
        label: string;
        slug: string;
    }[];
    const topicItems = t("home.footer.seo.columns.topics.items", { returnObjects: true }) as {
        label: string;
        slug: string;
    }[];

    return (
        <Box
            component="footer"
            sx={{
                py: { xs: 4, md: 5 },
                borderTop: `1px solid ${theme.palette.divider}`,
                bgcolor: theme.palette.background.paper,
            }}
        >
            <Container>
                <Stack spacing={{ xs: 3, md: 4 }}>
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
                    <Box
                        sx={{
                            borderTop: `1px solid ${theme.palette.divider}`,
                            pt: { xs: 3, md: 4 },
                        }}
                    >
                        <Stack spacing={{ xs: 2, md: 3 }}>
                            <Stack spacing={1}>
                                <Typography variant="subtitle2" fontWeight={700}>
                                    {t("home.footer.seo.title")}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {t("home.footer.seo.description")}
                                </Typography>
                            </Stack>
                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: {
                                        xs: "1fr",
                                        sm: "repeat(2, minmax(0, 1fr))",
                                        md: "repeat(3, minmax(0, 1fr))",
                                    },
                                    gap: { xs: 2, md: 3 },
                                }}
                            >
                                <Stack spacing={1}>
                                    <Typography variant="subtitle2" fontWeight={700}>
                                        {t("home.footer.seo.columns.product.title")}
                                    </Typography>
                                    {productItems.map((item) => (
                                        <Typography
                                            key={item.slug}
                                            component={RouterLink}
                                            to={`/learn/${item.slug}`}
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ "&:hover": { color: "text.primary" } }}
                                        >
                                            {item.label}
                                        </Typography>
                                    ))}
                                </Stack>
                                <Stack spacing={1}>
                                    <Typography variant="subtitle2" fontWeight={700}>
                                        {t("home.footer.seo.columns.useCases.title")}
                                    </Typography>
                                    {useCaseItems.map((item) => (
                                        <Typography
                                            key={item.slug}
                                            component={RouterLink}
                                            to={`/learn/${item.slug}`}
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ "&:hover": { color: "text.primary" } }}
                                        >
                                            {item.label}
                                        </Typography>
                                    ))}
                                </Stack>
                                <Stack spacing={1}>
                                    <Typography variant="subtitle2" fontWeight={700}>
                                        {t("home.footer.seo.columns.topics.title")}
                                    </Typography>
                                    {topicItems.map((item) => (
                                        <Typography
                                            key={item.slug}
                                            component={RouterLink}
                                            to={`/learn/${item.slug}`}
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ "&:hover": { color: "text.primary" } }}
                                        >
                                            {item.label}
                                        </Typography>
                                    ))}
                                </Stack>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                                {t("home.footer.seo.keywords")}
                            </Typography>
                        </Stack>
                    </Box>
                </Stack>
            </Container>
        </Box>
    );
};

export default Footer;
