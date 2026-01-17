import React from "react";
import { Box, Chip, Container, Stack, Typography, alpha, useTheme } from "@mui/material";
import type { ContainerProps } from "@mui/material/Container";

type PageHeroProps = {
    title: string;
    subtitle?: string;
    overline?: string;
    badge?: string;
    icon?: React.ReactNode;
    actions?: React.ReactNode;
    children?: React.ReactNode;
    breadcrumbs?: React.ReactNode;
    align?: "left" | "center";
    variant?: "gradient" | "soft";
    maxWidth?: ContainerProps["maxWidth"];
};

const PageHero: React.FC<PageHeroProps> = ({
    title,
    subtitle,
    overline,
    badge,
    icon,
    actions,
    children,
    breadcrumbs,
    align = "left",
    variant = "gradient",
    maxWidth = "lg",
}) => {
    const theme = useTheme();
    const gradient = `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 60%, ${theme.palette.primary.main} 100%)`;
    const isGradient = variant === "gradient";
    const bg =
        variant === "soft"
            ? alpha(theme.palette.primary.main, theme.palette.mode === "light" ? 0.08 : 0.18)
            : gradient;
    const color = isGradient ? theme.palette.getContrastText(theme.palette.primary.main) : theme.palette.text.primary;
    const topOffsetMobile = "var(--topbar-height-mobile)";
    const topOffsetDesktop = "var(--topbar-height-desktop)";
    const paddedTopMobile = `calc(${topOffsetMobile} + ${theme.spacing(4)})`;
    const paddedTopDesktop = `calc(${topOffsetDesktop} + ${theme.spacing(6)})`;

    return (
        <Box
            component="section"
            sx={{
                position: "relative",
                overflow: "hidden",
                background: bg,
                color,
                mt: { xs: `calc(-1 * ${topOffsetMobile})`, md: `calc(-1 * ${topOffsetDesktop})` },
                pt: { xs: paddedTopMobile, md: paddedTopDesktop },
                pb: { xs: 6, md: 8 },
            }}
        >
            {isGradient && (
                <>
                    <Box
                        sx={{
                            position: "absolute",
                            inset: 0,
                            opacity: 0.2,
                            background: `radial-gradient(55% 65% at 75% 25%, ${alpha(
                                theme.palette.common.white,
                                0.8
                            )}, transparent)`,
                        }}
                    />
                    <Box
                        sx={{
                            position: "absolute",
                            inset: 0,
                            opacity: 0.3,
                            background: `radial-gradient(55% 85% at 10% 80%, ${alpha(
                                theme.palette.common.white,
                                0.5
                            )}, transparent)`,
                        }}
                    />
                </>
            )}
            <Container maxWidth={maxWidth} sx={{ position: "relative" }}>
                <Stack spacing={3}>
                    {breadcrumbs && <Box>{breadcrumbs}</Box>}
                    <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={{ xs: 2.5, md: 4 }}
                        alignItems={{ xs: "flex-start", md: "center" }}
                        justifyContent="space-between"
                    >
                        <Stack
                            spacing={1.5}
                            alignItems={align === "center" ? "center" : "flex-start"}
                            textAlign={align}
                            flex={1}
                            minWidth={0}
                        >
                            <Stack direction="row" spacing={1.5} alignItems="center" justifyContent={align === "center" ? "center" : "flex-start"}>
                                {icon && (
                                    <Box
                                        sx={{
                                            width: 56,
                                            height: 56,
                                            borderRadius: 3,
                                            display: "grid",
                                            placeItems: "center",
                                            bgcolor: isGradient
                                                ? alpha(theme.palette.common.white, 0.15)
                                                : alpha(theme.palette.primary.main, 0.12),
                                            color: isGradient ? "inherit" : theme.palette.primary.main,
                                        }}
                                    >
                                        {icon}
                                    </Box>
                                )}
                                {(badge || overline) && (
                                    <Stack spacing={0.5}>
                                        {badge && (
                                            <Chip
                                                size="small"
                                                label={badge}
                                                sx={{
                                                    borderRadius: 999,
                                                    bgcolor: isGradient ? alpha(theme.palette.common.white, 0.2) : "transparent",
                                                    color: "inherit",
                                                    borderColor: isGradient ? alpha(theme.palette.common.white, 0.5) : alpha(theme.palette.text.primary, 0.2),
                                                    fontWeight: 600,
                                                }}
                                            />
                                        )}
                                        {overline && (
                                            <Typography variant="overline" sx={{ opacity: 0.8 }}>
                                                {overline}
                                            </Typography>
                                        )}
                                    </Stack>
                                )}
                            </Stack>
                            <Box>
                                <Typography
                                    variant="h3"
                                    component="h1"
                                    sx={{
                                        fontWeight: 900,
                                        letterSpacing: -0.3,
                                        mb: 1.25,
                                        fontSize: { xs: 32, sm: 40 },
                                    }}
                                >
                                    {title}
                                </Typography>
                                {subtitle && (
                                    <Typography
                                        sx={{
                                            opacity: isGradient ? 0.9 : 0.8,
                                            maxWidth: 720,
                                            mx: align === "center" ? "auto" : undefined,
                                            fontSize: { xs: "1rem", sm: "1.05rem" },
                                        }}
                                    >
                                        {subtitle}
                                    </Typography>
                                )}
                            </Box>
                        </Stack>
                        {actions && (
                            <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={1}
                                sx={{
                                    width: { xs: "100%", md: "auto" },
                                    alignSelf: align === "center" ? "center" : { xs: "stretch", md: "flex-end" },
                                }}
                            >
                                {actions}
                            </Stack>
                        )}
                    </Stack>
                    {children}
                </Stack>
            </Container>
        </Box>
    );
};

export default PageHero;
