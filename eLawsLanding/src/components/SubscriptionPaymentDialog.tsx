import { useState } from "react";
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    Typography,
} from "@mui/material";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { stripePromise } from "../lib/stripe.ts";

export interface PaymentDialogState {
    clientSecret: string;
    planName: string;
    amountLabel?: string;
    helperText: string;
    completionMessage: string;
}

interface SubscriptionPaymentDialogProps extends PaymentDialogState {
    open: boolean;
    onClose: () => void;
    onSuccess: (message: string) => Promise<void> | void;
}

export const SubscriptionPaymentDialog: React.FC<SubscriptionPaymentDialogProps> = ({
    open,
    clientSecret,
    planName,
    amountLabel,
    helperText,
    completionMessage,
    onClose,
    onSuccess,
}) => {
    if (!clientSecret) return null;

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Confirm payment</DialogTitle>
            <DialogContent>
                <Elements key={clientSecret} stripe={stripePromise} options={{ clientSecret }}>
                    <PaymentDialogContent
                        planName={planName}
                        amountLabel={amountLabel}
                        onClose={onClose}
                        onSuccess={onSuccess}
                        helperText={helperText}
                        completionMessage={completionMessage}
                    />
                </Elements>
            </DialogContent>
        </Dialog>
    );
};

interface PaymentDialogContentProps {
    planName: string;
    amountLabel?: string;
    helperText: string;
    completionMessage: string;
    onSuccess: (message: string) => Promise<void> | void;
    onClose: () => void;
}

const PaymentDialogContent: React.FC<PaymentDialogContentProps> = ({
    planName,
    amountLabel,
    helperText,
    completionMessage,
    onSuccess,
    onClose,
}) => {
    const stripe = useStripe();
    const elements = useElements();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!stripe || !elements) return;
        setSubmitting(true);
        setError(null);

        const { error: stripeError } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/subscribe`,
            },
            redirect: "if_required",
        });

        if (stripeError) {
            setError(stripeError.message ?? "Payment failed. Try again.");
            setSubmitting(false);
            return;
        }

        await onSuccess(completionMessage);
        setSubmitting(false);
        onClose();
    };

    return (
        <Stack spacing={2} sx={{ pt: 1 }}>
            <Box>
                <Typography variant="subtitle2" color="text.secondary">
                    Plan
                </Typography>
                <Typography variant="h6">{planName}</Typography>
                {amountLabel && (
                    <Typography variant="body2" color="text.secondary">
                        {amountLabel}
                    </Typography>
                )}
            </Box>

            <PaymentElement />

            {error && <Alert severity="error">{error}</Alert>}

            <DialogActions sx={{ px: 0 }}>
                <Button onClick={onClose} disabled={submitting}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={!stripe || !elements || submitting}
                >
                    {submitting ? "Processing…" : "Pay & Continue"}
                </Button>
            </DialogActions>
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center" }}>
                {helperText}
            </Typography>
        </Stack>
    );
};
