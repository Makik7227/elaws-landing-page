import { useEffect, useMemo, useState } from "react";
import {
    Button,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Tooltip,
} from "@mui/material";
import LocalPoliceRoundedIcon from "@mui/icons-material/LocalPoliceRounded";
import ShieldIcon from "@mui/icons-material/Shield";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { auth, db } from "../../firebase";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    query,
    setDoc,
    serverTimestamp,
    where,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import CustomCountryPicker from "./CustomCountryPicker";
import { sendMessageToGPT } from "../api/chat.ts"; // ✅ reuse your picker
import { useTranslation } from "react-i18next";
import { canTriggerPanic, type Tier } from "../utils/monetization.ts";

type ChatRole = "system" | "user" | "assistant";
type ChatMessage = { role: ChatRole; content: string };

export default function PanicButtonWeb({
                                           defaultCountry,
                                           defaultCode,
                                           tokensUsed,
                                           tokenLimit,
                                           subscriptionTier,
                                           userId,
                                           onLockedAttempt,
                                       }: {
    defaultCountry: string;
    defaultCode: string;
    tokensUsed?: number;
    tokenLimit?: number;
    subscriptionTier: Tier;
    userId: string;
    onLockedAttempt?: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [country, setCountry] = useState(defaultCountry);
    const [countryCode, setCountryCode] = useState(defaultCode);
    const [loading, setLoading] = useState(false);
    const [panicLocked, setPanicLocked] = useState(false);
    const [freePanicCount, setFreePanicCount] = useState(0);
    const navigate = useNavigate();
    const { t } = useTranslation();
    const usageLabel = useMemo(() => {
        if (subscriptionTier !== "free") return t("components.panicButton.unlimited");
        return panicLocked
            ? t("components.panicButton.lockedLabel")
            : t("components.panicButton.trialLabel");
    }, [panicLocked, subscriptionTier, t]);

    useEffect(() => {
        if (!userId || subscriptionTier !== "free") {
            setPanicLocked(false);
            setFreePanicCount(0);
            return;
        }
        let active = true;
        (async () => {
            try {
                const snap = await getDoc(doc(db, "users", userId));
                if (!active) return;
                const count = snap.exists() ? Number(snap.data().freePanicCount ?? 0) : 0;
                const safeCount = Number.isFinite(count) ? Math.max(0, count) : 0;
                setFreePanicCount(safeCount);
                setPanicLocked(safeCount >= 3);
            } catch (err) {
                console.error("PanicButtonWeb lock check error:", err);
            }
        })();
        return () => {
            active = false;
        };
    }, [userId, subscriptionTier]);

    const handleTriggerClick = () => {
        if (!canTriggerPanic(subscriptionTier, panicLocked)) {
            onLockedAttempt?.();
            return;
        }
        setOpen(true);
    };

    const handleStart = async () => {
        if (!canTriggerPanic(subscriptionTier, panicLocked)) {
            onLockedAttempt?.();
            setOpen(false);
            return;
        }
        setLoading(true);
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error("User not logged in");

            // 1️⃣ Subscription tier
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            const subscriptionTier = userDoc.exists()
                ? userDoc.data().subscriptionTier
                : "free";
            const freePanicCount = userDoc.exists() ? Number(userDoc.data().freePanicCount ?? 0) : 0;
            const freePanicExhausted = Number.isFinite(freePanicCount) && freePanicCount >= 3;
            if (subscriptionTier === "free" && freePanicExhausted) {
                setPanicLocked(true);
                onLockedAttempt?.();
                setOpen(false);
                setLoading(false);
                return;
            }

            const proceduresRef = collection(db, "users", currentUser.uid, "procedures");

            // 2️⃣ Paid tiers → check Firestore first
            if (subscriptionTier !== "free") {
                const q = query(
                    proceduresRef,
                    where("countryCode", "==", countryCode),
                    limit(1)
                );
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    const docData = snapshot.docs[0].data();
                    navigate("/procedures", {
                        state: {
                            procedures: docData.content,
                            country,
                            countryCode,
                            tokensUsed: tokensUsed?.toString() || "0",
                            tokenLimit: tokenLimit?.toString() || "0",
                        },
                    });
                    setOpen(false);
                    setLoading(false);
                    return;
                }
            }

            // 3️⃣ Free tier or no existing → call GPT
            const systemPrompt: ChatMessage = {
                role: "system",
                content: `You are a legal expert. Provide a clear and concise procedure for someone stopped by the police in ${country}. Use bullet points. No disclaimers.`,
            };
            const userMessage: ChatMessage = {
                role: "user",
                content: `What should I do when I am stopped by the police in ${country}?`,
            };

            const { content } = await sendMessageToGPT([systemPrompt, userMessage]);

            // 4️⃣ Save only if paid tier & no existing doc
            if (subscriptionTier !== "free") {
                const q = query(
                    proceduresRef,
                    where("countryCode", "==", countryCode),
                    limit(1)
                );
                const snapshot = await getDocs(q);
                if (snapshot.empty) {
                    await addDoc(proceduresRef, {
                        title: `${country} Stop Procedures`,
                        content,
                        countryCode,
                        createdAt: serverTimestamp(),
                    });
                }
            }

            // 5️⃣ Route to procedure view
            navigate("/procedures", {
                state: {
                    procedures: content,
                    country,
                    countryCode,
                    tokensUsed: tokensUsed?.toString() || "0",
                    tokenLimit: tokenLimit?.toString() || "0",
                },
            });
            if (subscriptionTier === "free" && !panicLocked) {
                const nextCount = Number.isFinite(freePanicCount) ? freePanicCount + 1 : 1;
                await setDoc(
                    doc(db, "users", currentUser.uid),
                    { freePanicCount: nextCount, lastPanicUsedAt: serverTimestamp() },
                    { merge: true }
                );
                setFreePanicCount(nextCount);
                setPanicLocked(nextCount >= 3);
            } else if (subscriptionTier !== "free") {
                await setDoc(
                    doc(db, "users", currentUser.uid),
                    { lastPanicUsedAt: serverTimestamp() },
                    { merge: true }
                );
            }
        } catch (err) {
            console.error("PanicButtonWeb error:", err);
        } finally {
            setLoading(false);
            setOpen(false);
        }
    };

    return (
        <>
            <Tooltip
                title={
                    panicLocked && subscriptionTier === "free"
                        ? t("components.panicButton.lockedHint")
                        : usageLabel
                }
                arrow
            >
                <Button
                    variant="contained"
                    color={panicLocked && subscriptionTier === "free" ? "inherit" : "error"}
                    startIcon={panicLocked && subscriptionTier === "free" ? <LockOutlinedIcon /> : <LocalPoliceRoundedIcon />}
                    sx={{
                        borderRadius: 2,
                        fontWeight: 800,
                        px: 3,
                        py: 1.5,
                        textTransform: "none",
                        opacity:
                            panicLocked && subscriptionTier === "free"
                                ? 0.7
                                    : 1,
                        borderStyle: panicLocked && subscriptionTier === "free" ? "dashed" : "solid",
                    }}
                    onClick={handleTriggerClick}
                >
                    {panicLocked && subscriptionTier === "free"
                        ? t("components.panicButton.lockedCta")
                        : subscriptionTier === "free"
                            ? `${t("components.panicButton.trigger")} (${freePanicCount}/3)`
                            : t("components.panicButton.trigger")}
                </Button>
            </Tooltip>

            <Dialog open={open} onClose={() => !loading && setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <LocalPoliceRoundedIcon color="primary" />
                    {t("components.panicButton.dialogTitle")}
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        {t("components.panicButton.dialogDescription")}
                    </Typography>
                    <CustomCountryPicker
                        country={country}
                        countryCode={countryCode}
                        onSelect={(selected) => {
                            if(selected) {
                                setCountry(selected.name);
                                setCountryCode(selected.code);
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={handleStart}
                        variant="contained"
                        startIcon={!loading ? <ShieldIcon /> : undefined}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={22} /> : t("components.panicButton.submit")}
                    </Button>
                    <Button onClick={() => setOpen(false)} disabled={loading}>
                        {t("components.panicButton.cancel")}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
