import { useMemo, useRef, useState } from "react";
import {
    Alert,
    Autocomplete,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    Divider,
    Link,
    Stack,
    TextField,
    Typography,
    alpha,
    useTheme,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import {auth, db} from "../../firebase";
import {COUNTRIES, type CountryOption} from "../utils/CountryOption.ts";

const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validatePassword = (password: string) =>
    password.length >= 8 && /[0-9!@#$%^&*()_+{}[\]:;"'<>,.?/~\\-]/.test(password);

const sanitizeUsername = (input: string) => {
    let username = input.startsWith("@") ? input.slice(1) : input;
    username = username.replace(/[^a-zA-Z0-9._-]/g, "");
    return `@${username}`;
};

const getCountryFromBrowser = (): CountryOption => {
    try {
        const locale = navigator.language || "en-US";
        const code = (locale.split("-")[1] || "US").toUpperCase();
        const found = COUNTRIES.find((c) => c.code === code);
        return found ?? { code: "US", label: "United States" };
    } catch {
        return { code: "US", label: "United States" };
    }
};

const SIGNUP_BENEFITS = [
    "Unlimited saved notes on every plan",
    "Country-specific procedures included",
    "Downgrade anytime right inside the app",
];

const SignUp = () =>  {
    const theme = useTheme();
    const navigate = useNavigate();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName]   = useState("");
    const [email, setEmail]         = useState("");
    const [username, setUsername]   = useState("@");
    const [password, setPassword]   = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [country, setCountry]     = useState<CountryOption>(() => getCountryFromBrowser());
    const [error, setError]         = useState<string>("");
    const [loading, setLoading]     = useState(false);

    const emailRef    = useRef<HTMLInputElement>(null);
    const usernameRef = useRef<HTMLInputElement>(null);
    const passRef     = useRef<HTMLInputElement>(null);

    const gradient = useMemo(
        () =>
            `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 60%, ${theme.palette.primary.main} 100%)`,
        [theme]
    );

    const onChangeUsername = (val: string) => setUsername(sanitizeUsername(val));

    const handleSignUp = async () => {
        setError("");
        if (!firstName.trim() || !lastName.trim()) {
            setError("First and last name are required.");
            return;
        }
        if (!validateEmail(email.trim())) {
            setError("Invalid email format.");
            emailRef.current?.focus();
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            passRef.current?.focus();
            return;
        }
        if (!validatePassword(password)) {
            setError("Password must be at least 8 chars, with a number or special char.");
            passRef.current?.focus();
            return;
        }

        const usernameRaw = username.replace(/^@/, "");
        if (usernameRaw.length < 2) {
            setError("Username must be at least 2 characters after @.");
            usernameRef.current?.focus();
            return;
        }
        if (!/^[a-zA-Z0-9._-]+$/.test(usernameRaw)) {
            setError("Username can only use a-z, 0-9, dots, underscores, and dashes.");
            usernameRef.current?.focus();
            return;
        }

        setLoading(true);
        const usernameDocId = usernameRaw.toLowerCase();
        const usernameRefDoc = doc(db, "usernames", usernameDocId);

        try {
            const existing = await getDoc(usernameRefDoc);
            if (existing.exists()) {
                setError("Username is already taken. Pick another.");
                setLoading(false);
                usernameRef.current?.focus();
                return;
            }

            // create user
            const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);

            // reserve username (if this fails, roll back user)
            try {
                await setDoc(usernameRefDoc, {
                    uid: cred.user.uid,
                    createdAt: serverTimestamp(),
                });
            } catch {
                try {
                    await cred.user.delete();
                } catch {
                    // ignore rollback failure
                }
                setError("Username just got taken — try another.");
                setLoading(false);
                usernameRef.current?.focus();
                return;
            }

            // create user profile
            await setDoc(doc(db, "users", cred.user.uid), {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: cred.user.email,
                username: "@" + usernameDocId,
                role: "client",
                country: country.label,
                countryCode: country.code,
                createdAt: serverTimestamp(),
                tokenLimit: 10000,
                monthlyTokensUsed: 0,
                subscriptionTier: "free",
                currentPeriodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)).getTime(),
            });

            setLoading(false);
            navigate("/subscribe"); // mirror app flow
        } catch (err: unknown) {
            setLoading(false);
            let msg = String(err);
            if (msg.includes("auth/email-already-in-use")) msg = "That email is already registered. Try logging in.";
            else if (msg.includes("auth/weak-password")) msg = "Password too weak. Use a longer or stronger one.";
            else if (msg.includes("auth/invalid-email")) msg = "Invalid email.";
            setError(msg);
        }
    };

    // -------------------- UI --------------------

    return (
        <>
            <Box
                sx={{
                    background: gradient,
                    color: theme.palette.getContrastText(theme.palette.primary.main),
                    py: { xs: 7, md: 10 },
                    textAlign: "center",
                }}
            >
                <Container maxWidth="md">
                    <Stack spacing={2} alignItems="center">
                        <Chip
                            label="Create an account"
                            variant="outlined"
                            sx={{
                                color: "inherit",
                                borderColor: alpha(theme.palette.common.white, 0.4),
                                bgcolor: alpha(theme.palette.common.white, 0.08),
                            }}
                        />
                        <Typography variant="h3" fontWeight={900}>
                            Onboard in minutes, not weeks.
                        </Typography>
                        <Typography sx={{ opacity: 0.9, maxWidth: 600 }}>
                            Your AI legal workspace with SaaS-level polish. Start on the free tier and invite teammates when you’re ready.
                        </Typography>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                            {SIGNUP_BENEFITS.map((text) => (
                                <Chip
                                    key={text}
                                    label={text}
                                    variant="outlined"
                                    sx={{
                                        color: "inherit",
                                        borderColor: alpha(theme.palette.common.white, 0.35),
                                        bgcolor: alpha(theme.palette.common.white, 0.05),
                                    }}
                                />
                            ))}
                        </Stack>
                    </Stack>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ py: { xs: 6, md: 9 } }}>
                <Grid container spacing={{ xs: 4, md: 6 }} alignItems="stretch">
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Card
                            sx={{
                                height: "100%",
                                borderRadius: 4,
                                background: alpha(theme.palette.primary.main, 0.12),
                            }}
                        >
                            <CardContent sx={{ p: { xs: 4, md: 5 } }}>
                                <Typography variant="h5" fontWeight={800} gutterBottom>
                                    What to expect
                                </Typography>
                                <Typography color="text.secondary" sx={{ mb: 3 }}>
                                    Answer a few basics, pick your jurisdiction, and you’re inside the dashboard with a guided tour.
                                </Typography>
                                <Divider sx={{ my: 3 }} />
                                <Stack spacing={3}>
                                    {["Tell us who you are", "Add your jurisdiction", "Secure your credentials"].map((title, idx) => (
                                        <Stack key={title} direction="row" spacing={2} alignItems="flex-start">
                                            <Box
                                                sx={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: 999,
                                                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                                                    display: "grid",
                                                    placeItems: "center",
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {idx + 1}
                                            </Box>
                                            <Box>
                                                <Typography fontWeight={700}>{title}</Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {idx === 0 && "We use your name and username for workspace personalization."}
                                                    {idx === 1 && "Country selection unlocks localized procedures and regulations."}
                                                    {idx === 2 && "Strong passwords + optional 2FA keep everything safe."}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    ))}
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, md: 7 }}>
                        <Card sx={{ borderRadius: 4 }}>
                            <CardContent sx={{ p: { xs: 4, md: 5 } }}>
                                <Stack spacing={3}>
                                    <Box>
                                        <Chip label="Your details" color="primary" variant="outlined" sx={{ mb: 1 }} />
                                        <Typography variant="h5" fontWeight={800}>
                                            Create your workspace
                                        </Typography>
                                        <Typography color="text.secondary">
                                            All fields are required so we can generate the right legal context.
                                        </Typography>
                                    </Box>

                                    {error && <Alert severity="error">{error}</Alert>}

                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                        <TextField
                                            label="First name"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            fullWidth
                                            autoComplete="given-name"
                                        />
                                        <TextField
                                            label="Last name"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            fullWidth
                                            autoComplete="family-name"
                                        />
                                    </Stack>

                                    <TextField
                                        inputRef={emailRef}
                                        label="Email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        fullWidth
                                        autoComplete="email"
                                    />

                                    <TextField
                                        label="Username"
                                        value={username}
                                        onChange={(e) => onChangeUsername(e.target.value)}
                                        fullWidth
                                        helperText="Starts with @, letters/numbers/._- only"
                                        slotProps={{ input: { sx: { maxLength: 24 } } }}
                                    />

                                    <Autocomplete
                                        options={COUNTRIES}
                                        value={country}
                                        onChange={(_, val) => val && setCountry(val)}
                                        getOptionLabel={(o) => o.label}
                                        renderInput={(params) => <TextField {...params} label="Country" />}
                                    />

                                    <Divider />

                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                        <TextField
                                            inputRef={passRef}
                                            label="Password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            fullWidth
                                            helperText="Min 8 chars, include a number or special character"
                                        />
                                        <TextField
                                            label="Confirm password"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            fullWidth
                                        />
                                    </Stack>

                                    <Button
                                        variant="contained"
                                        size="large"
                                        onClick={handleSignUp}
                                        disabled={loading}
                                        startIcon={loading ? <CircularProgress size={18} /> : undefined}
                                    >
                                        {loading ? "Creating..." : "Create account"}
                                    </Button>

                                    <Typography variant="body2" textAlign="center">
                                        Already have an account?{" "}
                                        <Link component={RouterLink} to="/login" underline="hover" fontWeight={700}>
                                            Log in
                                        </Link>
                                    </Typography>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                <Box textAlign="center" mt={3}>
                    <Button component={RouterLink} to="/" variant="text">
                        ← Back to site
                    </Button>
                </Box>
            </Container>
        </>
    );
}
export default SignUp;
