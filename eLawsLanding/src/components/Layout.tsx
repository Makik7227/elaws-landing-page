import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import TopBar from "./TopBar";
import ScrollToTop from "./ScrollToTop";
import Footer from "./Footer";
import CookieConsentBanner from "./CookieConsentBanner";
import LegalDocumentsDialog, { type LegalDocumentType } from "./LegalDocumentsDialog";

const CONSENT_STORAGE_KEY = "elaws_cookie_consent_v1";

const Layout = () => {
    const { t } = useTranslation();
    const [cookieConsent, setCookieConsent] = useState<"all" | "essential" | null>(null);
    const [bannerOpen, setBannerOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [openDoc, setOpenDoc] = useState<LegalDocumentType>(null);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
            if (stored === "all" || stored === "essential") {
                setCookieConsent(stored);
                setBannerOpen(false);
            } else {
                setBannerOpen(true);
            }
        } catch {
            setBannerOpen(true);
        }
    }, []);

    const saveConsent = (value: "all" | "essential") => {
        // Legal: persist consent choice locally only (no backend storage).
        try {
            localStorage.setItem(CONSENT_STORAGE_KEY, value);
        } catch {
            // If storage fails, still respect the user's choice for this session.
        }
        setCookieConsent(value);
        setBannerOpen(false);
        setSettingsOpen(false);
    };

    const openCookieSettings = () => setSettingsOpen(true);
    // Legal: analytics/tracking must remain disabled until explicit consent.
    const analyticsEnabled = cookieConsent === "all";

    return (
        <>
            <ScrollToTop />
            <TopBar />
            <Box
                component="main"
                sx={{
                    flex: 1,
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 0,
                    overflowX: "hidden",
                    pt: { xs: "var(--topbar-height-mobile)", md: "var(--topbar-height-desktop)" },
                }}
            >
                <Outlet />
            </Box>
            <Footer
                onOpenCookieSettings={openCookieSettings}
                onOpenPrivacy={() => setOpenDoc("privacy")}
                onOpenTerms={() => setOpenDoc("terms")}
            />
            <CookieConsentBanner
                open={bannerOpen}
                onAcceptAll={() => saveConsent("all")}
                onRejectNonEssential={() => saveConsent("essential")}
            />
            <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>{t("cookieConsent.dialogTitle")}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2}>
                        <Typography variant="body2" color="text.secondary">
                            {t("cookieConsent.dialogDescription")}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {t("cookieConsent.analyticsStatus", {
                                status: analyticsEnabled ? t("cookieConsent.analyticsOn") : t("cookieConsent.analyticsOff"),
                            })}
                        </Typography>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button variant="outlined" onClick={() => saveConsent("essential")}>
                        {t("cookieConsent.rejectNonEssential")}
                    </Button>
                    <Button variant="contained" onClick={() => saveConsent("all")}>
                        {t("cookieConsent.acceptAll")}
                    </Button>
                </DialogActions>
            </Dialog>
            <LegalDocumentsDialog openDoc={openDoc} onClose={() => setOpenDoc(null)} />
        </>
    );
};

export default Layout;
