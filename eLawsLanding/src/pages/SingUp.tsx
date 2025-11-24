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
import { auth, db } from "../../firebase";
import { COUNTRIES, type CountryOption } from "../utils/CountryOption.ts";
import { useTranslation } from "react-i18next";

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

const SIGNUP_BENEFITS = ["benefitOne", "benefitTwo", "benefitThree"] as const;
const SIGNUP_STEPS = ["stepOne", "stepTwo", "stepThree"] as const;

const SignUp = () =>  {
    const theme = useTheme();
    const navigate = useNavigate();
    const { t } = useTranslation();

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
            setError(t("signupPage.errors.missingName"));
            return;
        }
        if (!validateEmail(email.trim())) {
            setError(t("signupPage.errors.invalidEmailFormat"));
            emailRef.current?.focus();
            return;
        }
        if (password !== confirmPassword) {
            setError(t("signupPage.errors.passwordMismatch"));
            passRef.current?.focus();
            return;
        }
        if (!validatePassword(password)) {
            setError(t("signupPage.errors.passwordWeak"));
            passRef.current?.focus();
            return;
        }

        const usernameRaw = username.replace(/^@/, "");
        if (usernameRaw.length < 2) {
            setError(t("signupPage.errors.usernameLength"));
            usernameRef.current?.focus();
            return;
        }
        if (!/^[a-zA-Z0-9._-]+$/.test(usernameRaw)) {
            setError(t("signupPage.errors.usernameChars"));
            usernameRef.current?.focus();
            return;
        }

        setLoading(true);
        const usernameDocId = usernameRaw.toLowerCase();
        const usernameRefDoc = doc(db, "usernames", usernameDocId);

        try {
            const existing = await getDoc(usernameRefDoc);
            if (existing.exists()) {
                setError(t("signupPage.errors.usernameTaken"));
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
                setError(t("signupPage.errors.usernameJustTaken"));
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
            navigate("/dashboard/subscribe");
        } catch (err: unknown) {
            setLoading(false);
            const msg = String(err);
            if (msg.includes("auth/email-already-in-use")) setError(t("signupPage.errors.emailInUse"));
            else if (msg.includes("auth/weak-password")) setError(t("signupPage.errors.passwordTooWeak"));
            else if (msg.includes("auth/invalid-email")) setError(t("signupPage.errors.invalidEmail"));
            else setError(t("signupPage.errors.generic"));
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
                            label={t("signupPage.hero.badge")}
                            variant="outlined"
                            sx={{
                                color: "inherit",
                                borderColor: alpha(theme.palette.common.white, 0.4),
                                bgcolor: alpha(theme.palette.common.white, 0.08),
                            }}
                        />
                        <Typography variant="h3" fontWeight={900}>
                            {t("signupPage.hero.title")}
                        </Typography>
                        <Typography sx={{ opacity: 0.9, maxWidth: 600 }}>
                            {t("signupPage.hero.subtitle")}
                        </Typography>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                            {SIGNUP_BENEFITS.map((key) => (
                                <Chip
                                    key={key}
                                    label={t(`signupPage.hero.benefits.${key}`)}
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
                                    {t("signupPage.expect.title")}
                                </Typography>
                                <Typography color="text.secondary" sx={{ mb: 3 }}>
                                    {t("signupPage.expect.subtitle")}
                                </Typography>
                                <Divider sx={{ my: 3 }} />
                                <Stack spacing={3}>
                                    {SIGNUP_STEPS.map((stepKey, idx) => (
                                        <Stack key={stepKey} direction="row" spacing={2} alignItems="flex-start">
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
                                                <Typography fontWeight={700}>
                                                    {t(`signupPage.expect.steps.${stepKey}.title`)}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {t(`signupPage.expect.steps.${stepKey}.description`)}
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
                                        <Typography variant="h5" fontWeight={800}>
                                            {t("signupPage.form.title")}
                                        </Typography>
                                        <Typography color="text.secondary">
                                            {t("signupPage.form.subtitle")}
                                        </Typography>
                                    </Box>

                                    {error && <Alert severity="error">{error}</Alert>}

                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                        <TextField
                                            label={t("signupPage.form.firstName")}
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            fullWidth
                                            autoComplete="given-name"
                                        />
                                        <TextField
                                            label={t("signupPage.form.lastName")}
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            fullWidth
                                            autoComplete="family-name"
                                        />
                                    </Stack>

                                    <TextField
                                        inputRef={emailRef}
                                        label={t("signupPage.form.email")}
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        fullWidth
                                        autoComplete="email"
                                    />

                                    <TextField
                                        label={t("signupPage.form.username")}
                                        value={username}
                                        onChange={(e) => onChangeUsername(e.target.value)}
                                        fullWidth
                                        helperText={t("signupPage.form.usernameHelper")}
                                        slotProps={{ input: { sx: { maxLength: 24 } } }}
                                    />

                                    <Autocomplete
                                        options={COUNTRIES}
                                        value={country}
                                        onChange={(_, val) => val && setCountry(val)}
                                        getOptionLabel={(o) => t(`countries.${o.code}`, { defaultValue: o.label })}
                                        isOptionEqualToValue={(option, value) => option.code === value.code}
                                        renderInput={(params) => <TextField {...params} label={t("signupPage.form.country")} />}
                                    />

                                    <Divider />

                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                        <TextField
                                            inputRef={passRef}
                                            label={t("signupPage.form.password")}
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            fullWidth
                                            helperText={t("signupPage.form.passwordHelper")}
                                        />
                                        <TextField
                                            label={t("signupPage.form.confirmPassword")}
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
                                        {loading ? t("signupPage.cta.loading") : t("signupPage.cta.submit")}
                                    </Button>

                                    <Typography variant="body2" textAlign="center">
                                        {t("signupPage.links.existing")}{" "}
                                        <Link component={RouterLink} to="/login" underline="hover" fontWeight={700}>
                                            {t("signupPage.links.login")}
                                        </Link>
                                    </Typography>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                <Box textAlign="center" mt={3}>
                    <Button component={RouterLink} to="/" variant="text">
                        {t("signupPage.links.backToSite")}
                    </Button>
                </Box>
            </Container>
        </>
    );
}
export default SignUp;
