import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

export type LegalDocumentType = "terms" | "privacy" | "ai" | null;

interface LegalDocumentsDialogProps {
    openDoc: LegalDocumentType;
    onClose: () => void;
}

const LegalDocumentsDialog = ({ openDoc, onClose }: LegalDocumentsDialogProps) => {
    const { t } = useTranslation();

    return (
        <Dialog open={Boolean(openDoc)} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {openDoc === "terms"
                    ? t("components.legalDocuments.titles.terms")
                    : openDoc === "privacy"
                        ? t("components.legalDocuments.titles.privacy")
                        : t("components.legalDocuments.titles.ai")}
            </DialogTitle>
            <DialogContent dividers>
                {openDoc === "terms" && (
                    <Stack spacing={2}>
                        <Typography variant="body2">
                            {t("components.legalDocuments.terms.intro")}
                        </Typography>
                        <Box component="ul" sx={{ pl: 3, mb: 0 }}>
                            <li>
                                <Typography variant="body2">
                                    {t("components.legalDocuments.terms.bullet1")}
                                </Typography>
                            </li>
                            <li>
                                <Typography variant="body2">
                                    {t("components.legalDocuments.terms.bullet2")}
                                </Typography>
                            </li>
                            <li>
                                <Typography variant="body2">
                                    {t("components.legalDocuments.terms.bullet3")}
                                </Typography>
                            </li>
                        </Box>
                        <Typography variant="body2">
                            {t("components.legalDocuments.terms.outro")}
                        </Typography>
                    </Stack>
                )}
                {openDoc === "privacy" && (
                    <Stack spacing={2}>
                        <Typography variant="body2">
                            {t("components.legalDocuments.privacy.paragraph1")}
                        </Typography>
                        <Typography variant="body2">
                            {t("components.legalDocuments.privacy.paragraph2")}
                        </Typography>
                        <Typography variant="body2">
                            {t("components.legalDocuments.privacy.paragraph3")}
                        </Typography>
                        <Typography variant="body2">
                            {t("components.legalDocuments.privacy.paragraph4")}
                        </Typography>
                    </Stack>
                )}
                {openDoc === "ai" && (
                    <Stack spacing={2}>
                        <Typography variant="body2">
                            {t("components.legalDocuments.ai.paragraph1")}
                        </Typography>
                        <Typography variant="body2">
                            {t("components.legalDocuments.ai.paragraph2")}
                        </Typography>
                        <Typography variant="body2">
                            {t("components.legalDocuments.ai.paragraph3")}
                        </Typography>
                    </Stack>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t("components.legalDocuments.close")}</Button>
            </DialogActions>
        </Dialog>
    );
};

export default LegalDocumentsDialog;
