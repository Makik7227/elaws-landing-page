import { useState } from "react";
import {
    Button,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
} from "@mui/material";
import LocalPoliceRoundedIcon from "@mui/icons-material/LocalPoliceRounded";
import ShieldIcon from "@mui/icons-material/Shield";
import { auth, db } from "../../firebase";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    query,
    serverTimestamp,
    where,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import CustomCountryPicker from "./CustomCountryPicker";
import {sendMessageToGPT} from "../api/chat.ts"; // ✅ reuse your picker

type ChatRole = "system" | "user" | "assistant";
type ChatMessage = { role: ChatRole; content: string };

export default function PanicButtonWeb({
                                           defaultCountry,
                                           defaultCode,
                                           tokensUsed,
                                           tokenLimit,
                                       }: {
    defaultCountry: string;
    defaultCode: string;
    tokensUsed?: number;
    tokenLimit?: number;
}) {
    const [open, setOpen] = useState(false);
    const [country, setCountry] = useState(defaultCountry);
    const [countryCode, setCountryCode] = useState(defaultCode);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleStart = async () => {
        setLoading(true);
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error("User not logged in");

            // 1️⃣ Subscription tier
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            const subscriptionTier = userDoc.exists()
                ? userDoc.data().subscriptionTier
                : "free";

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
                    tokensUsed: tokensUsed?.toString() || "0",
                    tokenLimit: tokenLimit?.toString() || "0",
                },
            });
        } catch (err) {
            console.error("PanicButtonWeb error:", err);
        } finally {
            setLoading(false);
            setOpen(false);
        }
    };

    return (
        <>
            <Button
                variant="contained"
                color="error"
                startIcon={<LocalPoliceRoundedIcon />}
                sx={{
                    borderRadius: 2,
                    fontWeight: 800,
                    px: 3,
                    py: 1.5,
                }}
                onClick={() => setOpen(true)}
            >
                STOPPED BY THE POLICE
            </Button>

            <Dialog open={open} onClose={() => !loading && setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <LocalPoliceRoundedIcon color="primary" />
                    Police Stop Emergency
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Pick your country to get the most accurate procedures.
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
                        {loading ? <CircularProgress size={22} /> : "Get Procedures"}
                    </Button>
                    <Button onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}