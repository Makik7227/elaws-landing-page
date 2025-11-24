import { useCallback, useEffect, useMemo, useState } from "react";
import { ButtonBase, Stack, Tooltip, Typography, alpha, useTheme } from "@mui/material";
import TranslateRoundedIcon from "@mui/icons-material/TranslateRounded";
import { useTranslation } from "react-i18next";

const SUPPORTED_LANGUAGES: Array<"en" | "pl"> = ["en", "pl"];

const LanguageToggleButton = () => {
    const theme = useTheme();
    const { i18n, t } = useTranslation();
    const [activeLanguage, setActiveLanguage] = useState<"en" | "pl">(
        (SUPPORTED_LANGUAGES.find((lng) => i18n.language.startsWith(lng)) ?? "en") as "en" | "pl"
    );

    useEffect(() => {
        const stored = typeof window !== "undefined" ? window.localStorage.getItem("language") : null;
        const normalized = stored && SUPPORTED_LANGUAGES.find((lng) => stored.startsWith(lng));
        if (normalized && normalized !== activeLanguage) {
            i18n.changeLanguage(normalized).then();
        }
        // run once on mount to load persisted preference
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const handleLanguageChanged = (lng: string) => {
            const normalized = SUPPORTED_LANGUAGES.find((lang) => lng.startsWith(lang)) ?? "en";
            setActiveLanguage(normalized);
        };

        i18n.on("languageChanged", handleLanguageChanged);
        return () => {
            i18n.off("languageChanged", handleLanguageChanged);
        };
    }, [i18n]);

    const toggleLanguage = useCallback(() => {
        const next = activeLanguage === "en" ? "pl" : "en";
        setActiveLanguage(next);
        i18n.changeLanguage(next).then(() => {
            if (typeof window !== "undefined") {
                window.localStorage.setItem("language", next);
            }
        });
    }, [activeLanguage, i18n]);

    const nextLanguage = activeLanguage === "en" ? "pl" : "en";

    const segments = useMemo(
        () =>
            SUPPORTED_LANGUAGES.map((lang) => {
                const selected = lang === activeLanguage;
                return (
                    <Stack
                        key={lang}
                        direction="row"
                        alignItems="center"
                        justifyContent="center"
                        sx={{
                            px: 1.1,
                            py: 0.35,
                            minWidth: 34,
                            borderRadius: 999,
                            fontWeight: 700,
                            fontSize: "0.7rem",
                            textTransform: "uppercase",
                            color: selected ? theme.palette.primary.contrastText : theme.palette.text.secondary,
                            backgroundColor: selected
                                ? theme.palette.mode === "light"
                                    ? theme.palette.primary.main
                                    : alpha(theme.palette.primary.light, 0.9)
                                : "transparent",
                            transition: "all 0.25s ease",
                        }}
                    >
                        {t(`common.language.short.${lang}`)}
                    </Stack>
                );
            }),
        [activeLanguage, t, theme]
    );

    return (
        <Tooltip title={t("common.language.tooltip", { language: t(`common.language.names.${nextLanguage}`) })}>
            <ButtonBase
                disableRipple
                onClick={toggleLanguage}
                aria-label={t("common.language.aria")}
                sx={{
                    borderRadius: 999,
                    border: `1px solid ${alpha(theme.palette.text.primary, 0.15)}`,
                    px: 1.25,
                    py: 0.35,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.65,
                    minHeight: 36,
                    backgroundColor: alpha(theme.palette.background.paper, theme.palette.mode === "light" ? 0.8 : 0.25),
                    backdropFilter: "blur(6px)",
                    transition: "border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease",
                    boxShadow: theme.shadows[2],
                    "&:hover": {
                        borderColor: theme.palette.primary.main,
                        boxShadow: theme.shadows[6],
                    },
                }}
            >
                <TranslateRoundedIcon fontSize="small" color="primary" />
                <Stack direction="row" spacing={0.35} alignItems="center">
                    {segments}
                </Stack>
            </ButtonBase>
        </Tooltip>
    );
};

export default LanguageToggleButton;
