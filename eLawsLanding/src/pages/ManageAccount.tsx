import React, {useEffect, useMemo, useState} from "react";
import {
    Alert,
    Autocomplete,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    Divider,
    Stack,
    TextField,
    Typography,
    useTheme,
    Snackbar,
} from "@mui/material";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import LocalPoliceRoundedIcon from "@mui/icons-material/LocalPoliceRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import {Link as RouterLink, useNavigate} from "react-router-dom";
import {onAuthStateChanged, EmailAuthProvider, reauthenticateWithCredential, updatePassword} from "firebase/auth";
import {doc, getDoc, updateDoc} from "firebase/firestore";
import {auth, db} from "../../firebase.ts";
import {COUNTRIES, type CountryOption} from "../utils/CountryOption.ts";
import SubscriptionButton from "../components/SubscriptionButton.tsx";
import {useTranslation} from "react-i18next";
import DashboardBackButton from "../components/DashboardBackButton.tsx";

type Role = "client" | "lawyer";

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const sanitizeUsername = (input: string) => {
    let u = input.startsWith("@") ? input.slice(1) : input;
    u = u.replace(/[^a-zA-Z0-9._-]/g, "");
    return `@${u}`;
};
const strongPassword = (password: string) =>
    password.length >= 8 && /[0-9!@#$%^&*()_+{}[\]:;"'<>,.?/~\\-]/.test(password);

const ManageAccount: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const {t} = useTranslation();

    const [loading, setLoading] = useState(true);

    // profile state
    const [uid, setUid] = useState<string | null>(null);
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("@");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [country, setCountry] = useState<CountryOption | null>(null);
    const [role, setRole] = useState<Role>("client");
    const [subscriptionTier, setSubscriptionTier] = useState<"free" | "plus" | "premium">("free");

    // password state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [changingPass, setChangingPass] = useState(false);

    // ui feedback
    const [error, setError] = useState<string>("");
    const [success, setSuccess] = useState<string>("");
    const [snack, setSnack] = useState<{ open: boolean; msg: string }>({open: false, msg: ""});

    const gradient = useMemo(
        () =>
            `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 60%, ${theme.palette.primary.main} 100%)`,
        [theme]
    );

    // load user + profile
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                navigate("/login");
                return;
            }
            setUid(user.uid);
            setEmail(user.email ?? "");
            try {
                setLoading(true);
                const snap = await getDoc(doc(db, "users", user.uid));
                if (snap.exists()) {
                    const data = snap.data();
                    setUsername((data.username as string) ?? "@");
                    setFirstName((data.firstName as string) ?? "");
                    setLastName((data.lastName as string) ?? "");
                    const cc = (data.countryCode as string) || "US";
                    const opt = COUNTRIES.find((c) => c.code === cc) ?? null;
                    setCountry(opt);
                    setRole((data.role as Role) ?? "client");
                    setSubscriptionTier((data.subscriptionTier as "free" | "plus" | "premium") ?? "free");
                }
            } catch {
                setError(t("manageAccount.errors.profileLoad"));
            } finally {
                setLoading(false);
            }
        });
        return () => unsub();
    }, [navigate, t]);

    const handleSaveProfile = async () => {
        if (!uid) return;
        setError("");
        setSuccess("");

        if (!firstName.trim() || !lastName.trim()) {
            setError(t("manageAccount.errors.nameRequired"));
            return;
        }
        if (!validateEmail(email)) {
            setError(t("manageAccount.errors.invalidEmail"));
            return;
        }
        const raw = username.replace(/^@/, "");
        if (raw.length < 2 || !/^[a-zA-Z0-9._-]+$/.test(raw)) {
            setError(t("manageAccount.errors.usernameInvalid"));
            return;
        }
        try {
            await updateDoc(doc(db, "users", uid), {
                username: sanitizeUsername(username),
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                country: country?.label ?? null,
                countryCode: country?.code ?? null,
                role, // editable fully only if premium (UI enforces below)
            });
            setSnack({open: true, msg: t("manageAccount.success.profileSaved")});
        } catch {
            setError(t("manageAccount.errors.profileSave"));
        }
    };

    const handleChangePassword = async () => {
        if (!auth.currentUser) return;
        setError("");
        setSuccess("");

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError(t("manageAccount.errors.passwordFields"));
            return;
        }
        if (newPassword !== confirmPassword) {
            setError(t("manageAccount.errors.passwordMismatch"));
            return;
        }
        if (!strongPassword(newPassword)) {
            setError(t("manageAccount.errors.passwordWeak"));
            return;
        }
        if (newPassword === currentPassword) {
            setError(t("manageAccount.errors.passwordSame"));
            return;
        }

        setChangingPass(true);
        try {
            const cred = EmailAuthProvider.credential(email, currentPassword);
            await reauthenticateWithCredential(auth.currentUser, cred);
            await updatePassword(auth.currentUser, newPassword);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setSuccess(t("manageAccount.success.passwordChanged"));
        } catch {
            setError(t("manageAccount.errors.passwordChange"));
        } finally {
            setChangingPass(false);
        }
    };

    if (loading) {
        return (
            <Container maxWidth="sm" sx={{py: 10, textAlign: "center"}}>
                <Typography variant="h6" color="text.secondary">
                    {t("manageAccount.loading")}
                </Typography>
            </Container>
        );
    }

    return (
        <>
            <Box
                sx={{
                    height: { xs: "64px", md: "80px" },
                    background: gradient,
                }}
            />
            {/* HERO */}
            <Box
                sx={{
                    mt: { xs: -8, md: -10 },
                    background: gradient,
                    color: theme.palette.getContrastText(theme.palette.primary.main),
                    py: {xs: 6, md: 8},
                }}
            >
                <Container maxWidth="md">
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{bgcolor: theme.palette.secondary.main, width: 56, height: 56}}>
                            {firstName?.[0]?.toUpperCase() ?? "U"}
                        </Avatar>
                        <Box>
                            <Typography variant="h4" fontWeight={900} lineHeight={1.2}>
                                {t("manageAccount.hero.title")}
                            </Typography>
                            <Typography sx={{opacity: 0.9}}>
                                {t("manageAccount.hero.meta", {email, tier: subscriptionTier.toUpperCase()})}
                            </Typography>
                        </Box>
                        <Box sx={{flex: 1}}/>
                       <SubscriptionButton subscriptionTier={subscriptionTier}/>
                    </Stack>
                </Container>
            </Box>

            <Container maxWidth="md" sx={{py: {xs: 6, md: 8}}}>
                <Box sx={{mb: 2}}>
                    <DashboardBackButton />
                </Box>
                <Stack spacing={4}>
                    {/* Profile */}
                    <Card elevation={3} sx={{borderRadius: 3}}>
                        <CardContent sx={{p: {xs: 3, md: 4}}}>
                            <Stack spacing={2.25}>
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Chip label={t("manageAccount.profile.chip")} color="primary" variant="outlined"/>
                                    <Typography variant="h6" fontWeight={900}>
                                        {t("manageAccount.profile.title")}
                                    </Typography>
                                </Stack>

                                {error && <Alert severity="error">{error}</Alert>}
                                {success && <Alert severity="success">{success}</Alert>}

                                <Stack direction={{xs: "column", sm: "row"}} spacing={2}>
                                    <TextField
                                        label={t("manageAccount.profile.firstName")}
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        fullWidth
                                    />
                                    <TextField
                                        label={t("manageAccount.profile.lastName")}
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        fullWidth
                                    />
                                </Stack>

                                <TextField
                                    label={t("manageAccount.profile.email")}
                                    value={email}
                                    fullWidth
                                    disabled
                                    helperText={t("manageAccount.profile.emailHelper")}
                                />

                                <TextField
                                    label={t("manageAccount.profile.username")}
                                    value={username}
                                    onChange={(e) => setUsername(sanitizeUsername(e.target.value))}
                                    fullWidth
                                    helperText={t("manageAccount.profile.usernameHelper")}
                                    slotProps={{input: {sx: {maxLength: 24}}}}
                                />

                                <Autocomplete
                                    options={COUNTRIES}
                                    value={country}
                                    onChange={(_, v) => setCountry(v)}
                                    getOptionLabel={(o) => t(`countries.${o.code}`, { defaultValue: o.label })}
                                    isOptionEqualToValue={(option, value) => option.code === value.code}
                                    renderInput={(params) => <TextField {...params} label={t("manageAccount.profile.country")} fullWidth/>}
                                />

                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" sx={{mb: 0.5}}>
                                        {t("manageAccount.profile.roleLabel")}
                                    </Typography>
                                    {subscriptionTier !== "premium" ? (
                                        <TextField
                                            value={role === "lawyer" ? t("manageAccount.role.lawyer") : t("manageAccount.role.client")}
                                            label={t("manageAccount.profile.roleField")}
                                            fullWidth
                                            disabled
                                            helperText={t("manageAccount.profile.roleHelper")}
                                        />
                                    ) : (
                                        <ToggleButtonGroup
                                            exclusive
                                            value={role}
                                            onChange={(_, v) => v && setRole(v)}
                                            sx={{gap: 1, flexWrap: "wrap"}}
                                        >
                                            <ToggleButton value="client" sx={{borderRadius: 2}}>
                                                {t("manageAccount.role.client")}
                                            </ToggleButton>
                                            <ToggleButton value="lawyer" sx={{borderRadius: 2}}>
                                                {t("manageAccount.role.lawyer")}
                                            </ToggleButton>
                                        </ToggleButtonGroup>
                                    )}
                                </Box>

                                <Stack direction={{xs: "column", sm: "row"}} spacing={1.5}>
                                    <Button
                                        variant="contained"
                                        onClick={handleSaveProfile}
                                        sx={{borderRadius: 3, fontWeight: 800}}
                                    >
                                        {t("manageAccount.profile.save")}
                                    </Button>
                                    <Button
                                        component={RouterLink}
                                        to="/pricing"
                                        variant="outlined"
                                        sx={{borderRadius: 3}}
                                    >
                                        {t("manageAccount.profile.manageSubscription")}
                                    </Button>
                                </Stack>
                            </Stack>
                        </CardContent>
                    </Card>

                    {/* Security / Password */}
                    <Card elevation={3} sx={{borderRadius: 3}}>
                        <CardContent sx={{p: {xs: 3, md: 4}}}>
                            <Stack spacing={2.25}>
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Chip label={t("manageAccount.security.chip")} color="primary" variant="outlined"/>
                                    <Typography variant="h6" fontWeight={900}>
                                        {t("manageAccount.security.title")}
                                    </Typography>
                                </Stack>

                                <Stack direction={{xs: "column", sm: "row"}} spacing={2}>
                                    <TextField
                                        label={t("manageAccount.security.current")}
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        fullWidth
                                    />
                                    <TextField
                                        label={t("manageAccount.security.new")}
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        fullWidth
                                        helperText={t("manageAccount.security.newHelper")}
                                    />
                                    <TextField
                                        label={t("manageAccount.security.confirm")}
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        fullWidth
                                    />
                                </Stack>

                                <Stack direction={{xs: "column", sm: "row"}} spacing={1.5}>
                                    <Button
                                        variant="contained"
                                        onClick={handleChangePassword}
                                        disabled={changingPass}
                                        sx={{borderRadius: 3, fontWeight: 800}}
                                    >
                                        {changingPass ? t("manageAccount.security.changing") : t("manageAccount.security.change")}
                                    </Button>
                                    <Button
                                        component={RouterLink}
                                        to="/contact"
                                        variant="text"
                                        sx={{borderRadius: 3}}
                                    >
                                        {t("manageAccount.security.help")}
                                    </Button>
                                </Stack>
                            </Stack>
                        </CardContent>
                    </Card>

                    {/* Extras */}
                    <Card elevation={2} sx={{borderRadius: 3}}>
                        <CardContent sx={{p: {xs: 3, md: 4}}}>
                            <Typography variant="subtitle1" fontWeight={800} gutterBottom>
                                {t("manageAccount.shortcuts.title")}
                            </Typography>
                            <Stack direction={{xs: "column", sm: "row"}} spacing={1.5} useFlexGap flexWrap="wrap">
                                <Button
                                    component={RouterLink}
                                    to="/dashboard/cases"
                                    variant="outlined"
                                    sx={{borderRadius: 3}}
                                    startIcon={<WorkOutlineRoundedIcon />}
                                >
                                    {t("manageAccount.shortcuts.cases")}
                                </Button>
                                <Button
                                    component={RouterLink}
                                    to="/dashboard/notes"
                                    variant="outlined"
                                    sx={{borderRadius: 3}}
                                    startIcon={<AutoStoriesRoundedIcon />}
                                >
                                    {t("manageAccount.shortcuts.notes")}
                                </Button>
                                <Button
                                    component={RouterLink}
                                    to="/dashboard/procedures/saved"
                                    variant="outlined"
                                    sx={{borderRadius: 3}}
                                    startIcon={<LocalPoliceRoundedIcon />}
                                >
                                    {t("manageAccount.shortcuts.procedures")}
                                </Button>
                                <Button
                                    component={RouterLink}
                                    to="/connections"
                                    variant="outlined"
                                    sx={{borderRadius: 3}}
                                    startIcon={<PeopleAltRoundedIcon />}
                                >
                                    {t("manageAccount.shortcuts.connections")}
                                </Button>
                            </Stack>
                            <Divider sx={{my: 2}}/>
                            <Typography variant="body2" color="text.secondary">
                                {t("manageAccount.shortcuts.footer")}
                            </Typography>
                        </CardContent>
                    </Card>
                </Stack>
            </Container>

            <Snackbar
                open={snack.open}
                autoHideDuration={2200}
                onClose={() => setSnack({open: false, msg: ""})}
                message={snack.msg}
            />
        </>
    );
};

export default ManageAccount;
