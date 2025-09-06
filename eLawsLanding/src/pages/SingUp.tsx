import { useMemo, useRef, useState } from "react";
import {
    Alert,
    Autocomplete,
    Box,
    Button,
    Container,
    TextField,
    Typography,
    Stack,
    Card,
    CardContent,
    CircularProgress,
    useTheme,
    Link,
} from "@mui/material";
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
            {/* subtle hero header */}
            <Box
                sx={{
                    background: gradient,
                    color: theme.palette.getContrastText(theme.palette.primary.main),
                    py: { xs: 6, md: 8 },
                    textAlign: "center",
                }}
            >
                <Container maxWidth="sm">
                    <Typography variant="h3" fontWeight={800} gutterBottom>
                        Create an Account
                    </Typography>
                    <Typography sx={{ opacity: 0.9 }}>
                        Join E-Laws and start your first case in minutes.
                    </Typography>
                </Container>
            </Box>

            <Container maxWidth="sm" sx={{ py: { xs: 6, md: 8 } }}>
                <Card elevation={3} sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                        <Stack spacing={2.5}>
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
                                slotProps={{
                                    input: {sx:{ maxLength: 24 }},
                                }}
                            />
                            <Autocomplete
                                options={COUNTRIES}
                                value={country}
                                onChange={(_, val) => val && setCountry(val)}
                                getOptionLabel={(o) => o.label}
                                renderInput={(params) => <TextField {...params} label="Country" />}
                            />

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
                                sx={{ borderRadius: 3, fontWeight: 800, py: 1.25 }}
                                startIcon={loading ? <CircularProgress size={18} /> : undefined}
                            >
                                {loading ? "Creating..." : "Sign Up"}
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

                <Box textAlign="center" mt={2}>
                    <Button component={RouterLink} to="/" variant="text">
                        ← Go Back
                    </Button>
                </Box>
            </Container>
        </>
    );
}
export default SignUp;