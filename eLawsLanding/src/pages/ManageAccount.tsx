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
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import {Link as RouterLink, useNavigate} from "react-router-dom";
import {onAuthStateChanged, EmailAuthProvider, reauthenticateWithCredential, updatePassword} from "firebase/auth";
import {doc, getDoc, updateDoc} from "firebase/firestore";
import {auth, db} from "../../firebase.ts";
import {COUNTRIES, type CountryOption} from "../utils/CountryOption.ts";

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
                setError("Failed to load your profile.");
            } finally {
                setLoading(false);
            }
        });
        return () => unsub();
    }, [navigate]);

    const handleSaveProfile = async () => {
        if (!uid) return;
        setError("");
        setSuccess("");

        if (!firstName.trim() || !lastName.trim()) {
            setError("First and last name are required.");
            return;
        }
        if (!validateEmail(email)) {
            setError("Your account email looks invalid.");
            return;
        }
        const raw = username.replace(/^@/, "");
        if (raw.length < 2 || !/^[a-zA-Z0-9._-]+$/.test(raw)) {
            setError("Username must be at least 2 chars and use only a-z, 0-9, dot, underscore, dash.");
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
            setSnack({open: true, msg: "Profile saved."});
        } catch {
            setError("Could not save your profile. Try again.");
        }
    };

    const handleChangePassword = async () => {
        if (!auth.currentUser) return;
        setError("");
        setSuccess("");

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError("Fill all password fields.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            return;
        }
        if (!strongPassword(newPassword)) {
            setError("Password must be at least 8 chars and include a number or symbol.");
            return;
        }
        if (newPassword === currentPassword) {
            setError("New password must be different from current password.");
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
            setSuccess("Password changed successfully.");
        } catch {
            setError("Failed to change password. Check your current password.");
        } finally {
            setChangingPass(false);
        }
    };

    if (loading) {
        return (
            <Container maxWidth="sm" sx={{py: 10, textAlign: "center"}}>
                <Typography variant="h6" color="text.secondary">
                    Loading your account…
                </Typography>
            </Container>
        );
    }

    return (
        <>
            {/* HERO */}
            <Box
                sx={{
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
                                Manage Account
                            </Typography>
                            <Typography sx={{opacity: 0.9}}>
                                {email} • {subscriptionTier.toUpperCase()}
                            </Typography>
                        </Box>
                        <Box sx={{flex: 1}}/>
                        <Stack direction={{xs: "column", sm: "row"}} spacing={1.5}>
                            <Button
                                component={RouterLink}
                                to="/pricing"
                                variant="outlined"
                                sx={{
                                    borderRadius: 3,
                                    color: "inherit",
                                    borderColor: "currentColor",
                                    "&:hover": {borderColor: "currentColor"},
                                }}
                            >
                                Change Plan
                            </Button>
                            <Button
                                component={RouterLink}
                                to="/cases"
                                variant="contained"
                                sx={{borderRadius: 3, fontWeight: 800}}
                            >
                                Open App
                            </Button>
                        </Stack>
                    </Stack>
                </Container>
            </Box>

            <Container maxWidth="md" sx={{py: {xs: 6, md: 8}}}>
                <Stack spacing={4}>
                    {/* Profile */}
                    <Card elevation={3} sx={{borderRadius: 3}}>
                        <CardContent sx={{p: {xs: 3, md: 4}}}>
                            <Stack spacing={2.25}>
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Chip label="Profile" color="primary" variant="outlined"/>
                                    <Typography variant="h6" fontWeight={900}>
                                        Personal info
                                    </Typography>
                                </Stack>

                                {error && <Alert severity="error">{error}</Alert>}
                                {success && <Alert severity="success">{success}</Alert>}

                                <Stack direction={{xs: "column", sm: "row"}} spacing={2}>
                                    <TextField
                                        label="First name"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        fullWidth
                                    />
                                    <TextField
                                        label="Last name"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        fullWidth
                                    />
                                </Stack>

                                <TextField
                                    label="Email"
                                    value={email}
                                    fullWidth
                                    disabled
                                    helperText="Email is managed by your login. Contact support to change."
                                />

                                <TextField
                                    label="Username"
                                    value={username}
                                    onChange={(e) => setUsername(sanitizeUsername(e.target.value))}
                                    fullWidth
                                    helperText="Starts with @ · letters/numbers/._- only"
                                    slotProps={{input: {sx: {maxLength: 24}}}}
                                />

                                <Autocomplete
                                    options={COUNTRIES}
                                    value={country}
                                    onChange={(_, v) => setCountry(v)}
                                    getOptionLabel={(o) => o.label}
                                    renderInput={(params) => <TextField {...params} label="Country" fullWidth/>}
                                />

                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" sx={{mb: 0.5}}>
                                        Account Role
                                    </Typography>
                                    {subscriptionTier !== "premium" ? (
                                        <TextField
                                            value={role === "lawyer" ? "Lawyer" : "Client"}
                                            label="Role"
                                            fullWidth
                                            disabled
                                            helperText="Upgrade to Premium to change your role."
                                        />
                                    ) : (
                                        <ToggleButtonGroup
                                            exclusive
                                            value={role}
                                            onChange={(_, v) => v && setRole(v)}
                                            sx={{gap: 1, flexWrap: "wrap"}}
                                        >
                                            <ToggleButton value="client" sx={{borderRadius: 2}}>
                                                Client
                                            </ToggleButton>
                                            <ToggleButton value="lawyer" sx={{borderRadius: 2}}>
                                                Lawyer
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
                                        Save changes
                                    </Button>
                                    <Button
                                        component={RouterLink}
                                        to="/pricing"
                                        variant="outlined"
                                        sx={{borderRadius: 3}}
                                    >
                                        Manage subscription
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
                                    <Chip label="Security" color="primary" variant="outlined"/>
                                    <Typography variant="h6" fontWeight={900}>
                                        Change password
                                    </Typography>
                                </Stack>

                                <Stack direction={{xs: "column", sm: "row"}} spacing={2}>
                                    <TextField
                                        label="Current password"
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        fullWidth
                                    />
                                    <TextField
                                        label="New password"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        fullWidth
                                        helperText="Min 8 chars and include a number or symbol"
                                    />
                                    <TextField
                                        label="Confirm new password"
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
                                        {changingPass ? "Changing…" : "Change password"}
                                    </Button>
                                    <Button
                                        component={RouterLink}
                                        to="/contact"
                                        variant="text"
                                        sx={{borderRadius: 3}}
                                    >
                                        Need help?
                                    </Button>
                                </Stack>
                            </Stack>
                        </CardContent>
                    </Card>

                    {/* Extras */}
                    <Card elevation={2} sx={{borderRadius: 3}}>
                        <CardContent sx={{p: {xs: 3, md: 4}}}>
                            <Typography variant="subtitle1" fontWeight={800} gutterBottom>
                                Shortcuts
                            </Typography>
                            <Stack direction={{xs: "column", sm: "row"}} spacing={1.5} useFlexGap flexWrap="wrap">
                                <Button component={RouterLink} to="/cases" variant="outlined" sx={{borderRadius: 3}}>
                                    Go to My Cases
                                </Button>
                                <Button component={RouterLink} to="/notes" variant="outlined" sx={{borderRadius: 3}}>
                                    Saved Notes
                                </Button>
                                <Button component={RouterLink} to="/procedures/saved-procedures" variant="outlined"
                                        sx={{borderRadius: 3}}>
                                    Procedures
                                </Button>
                            </Stack>
                            <Divider sx={{my: 2}}/>
                            <Typography variant="body2" color="text.secondary">
                                Looking for connections? That feature is in the mobile app right now.
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