import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";

export type LegalDocumentType = "terms" | "privacy" | "ai" | null;

interface LegalDocumentsDialogProps {
    openDoc: LegalDocumentType;
    onClose: () => void;
}

const LegalDocumentsDialog = ({ openDoc, onClose }: LegalDocumentsDialogProps) => {
    return (
        <Dialog open={Boolean(openDoc)} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {openDoc === "terms"
                    ? "Terms & Conditions"
                    : openDoc === "privacy"
                        ? "Privacy Policy"
                        : "AI Disclaimer"}
            </DialogTitle>
            <DialogContent dividers>
                {openDoc === "terms" && (
                    <Stack spacing={2}>
                        <Typography variant="body2">
                            These Terms & Conditions govern your access to and use of E-Lawyer. By creating an
                            account, you agree to comply with these terms and all applicable laws.
                        </Typography>
                        <Box component="ul" sx={{ pl: 3, mb: 0 }}>
                            <li>
                                <Typography variant="body2">
                                    You are responsible for maintaining the confidentiality of your account
                                    credentials.
                                </Typography>
                            </li>
                            <li>
                                <Typography variant="body2">
                                    You must not misuse the service, attempt unauthorized access, or upload unlawful
                                    content.
                                </Typography>
                            </li>
                            <li>
                                <Typography variant="body2">
                                    We may update the service to improve performance, security, or legal compliance.
                                </Typography>
                            </li>
                        </Box>
                        <Typography variant="body2">
                            E-Lawyer may suspend or terminate access for violations of these terms or applicable law.
                        </Typography>
                    </Stack>
                )}
                {openDoc === "privacy" && (
                    <Stack spacing={2}>
                        <Typography variant="body2">
                            We collect only the data needed to create and secure your workspace, process requests,
                            and provide support. This includes account details, usage metadata, and device/browser
                            information.
                        </Typography>
                        <Typography variant="body2">
                            We use data for authentication, service delivery, security monitoring, and to improve
                            product quality. We do not sell your personal data.
                        </Typography>
                        <Typography variant="body2">
                            You can request access, correction, or deletion of your personal data, subject to legal
                            obligations and retention requirements.
                        </Typography>
                        <Typography variant="body2">
                            Essential cookies are required for core functionality. Analytics cookies are optional
                            and controlled through your cookie preferences.
                        </Typography>
                    </Stack>
                )}
                {openDoc === "ai" && (
                    <Stack spacing={2}>
                        <Typography variant="body2">
                            The E-Lawyer AI assistant is not a lawyer and does not provide legal advice.
                        </Typography>
                        <Typography variant="body2">
                            Any information provided is general and informational only and may not apply to your
                            specific circumstances or jurisdiction.
                        </Typography>
                        <Typography variant="body2">
                            You should consult a licensed attorney before making legal decisions or acting on any
                            AI-generated information.
                        </Typography>
                    </Stack>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default LegalDocumentsDialog;
