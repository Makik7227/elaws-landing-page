import React from "react";
import {
    Box,
    Button,
    Card,
    CardActionArea,
    CardContent,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import { type Tier } from "../../utils/monetization";

export type QuickActionItem = {
    key: "chats" | "aiChat" | "createDoc" | "cases" | "stopProcedures" | "connections" | "notes";
    to: string;
    icon: React.ReactNode;
    title: string;
    minTier: Tier | "free";
    requiredTier?: "plus" | "premium";
    upgradeKey?: "panic" | "cases" | "tokens" | "documents" | "notes";
    lockCopyKey?: "cases" | "procedures";
    locked?: boolean;
    helper?: string;
};

type QuickActionsSectionProps = {
    quickActions: QuickActionItem[];
    role: "client" | "lawyer";
    unreadText: string;
    chatsTitle: string;
    chatsActionLabel: string;
    lastCaseTitle: string;
    lastCaseSummary: string;
    lastCaseActionLabel: string;
    lastCaseLink: string;
    hasLastCase: boolean;
    subscriptionTier: Tier | "free";
    menuTitles: {
        account: string;
        connections: string;
        documents: string;
        cases: string;
    };
    onQuickActionLocked: (action: QuickActionItem) => void;
};

const QuickActionsSection: React.FC<QuickActionsSectionProps> = ({
    quickActions,
    role,
    unreadText,
    chatsTitle,
    chatsActionLabel,
    lastCaseTitle,
    lastCaseSummary,
    lastCaseActionLabel,
    lastCaseLink,
    hasLastCase,
    subscriptionTier,
    menuTitles,
    onQuickActionLocked,
}) => {
    const filteredActions = quickActions.filter((action) => action.key !== "cases" || role === "lawyer");

    return (
        <Card elevation={3} sx={{ borderRadius: 3 }}>
            <CardContent sx={{ pb: 1, pt: { xs: 2.5, md: 3 } }}>
                <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap alignItems="center">
                    {filteredActions.map((action) => (
                        <QuickAction
                            key={action.key}
                            action={action}
                            onLocked={() => onQuickActionLocked(action)}
                        />
                    ))}
                </Stack>
            </CardContent>

            <CardContent sx={{ pt: 1 }}>
                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap alignItems="stretch">
                    <InfoCard
                        to="/userChats"
                        icon={<ForumRoundedIcon />}
                        title={chatsTitle}
                        text={unreadText}
                        actionLabel={chatsActionLabel}
                    />
                    <InfoCard
                        to={lastCaseLink}
                        icon={<AssignmentTurnedInRoundedIcon />}
                        title={lastCaseTitle}
                        text={lastCaseSummary}
                        disabled={!hasLastCase}
                        actionLabel={lastCaseActionLabel}
                    />
                </Stack>
            </CardContent>

            <CardContent sx={{ pt: subscriptionTier !== "free" ? 1 : 3 }}>
                <Stack
                    direction="row"
                    spacing={2}
                    flexWrap="wrap"
                    useFlexGap
                    alignItems="stretch"
                    justifyContent="space-between"
                >
                    <MenuTile to="/manage" icon={<PersonOutlineRoundedIcon />} title={menuTitles.account} />
                    <MenuTile to="/connections" icon={<PeopleAltRoundedIcon />} title={menuTitles.connections} />
                    {subscriptionTier !== "free" && (
                        <>
                            <MenuTile to="/documents" icon={<DescriptionRoundedIcon />} title={menuTitles.documents} />
                            <MenuTile to="/dashboard/cases" icon={<WorkOutlineRoundedIcon />} title={menuTitles.cases} />
                        </>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
};

export default QuickActionsSection;

const QuickAction: React.FC<{
    action: QuickActionItem;
    onLocked: () => void;
}> = ({ action, onLocked }) => {
    const { to, icon, title, locked, helper } = action;

    const handleClick = (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
        if (locked) {
            event.preventDefault();
            onLocked();
        }
    };

    const button = (
        <Button
            component={RouterLink}
            to={to}
            variant="outlined"
            startIcon={locked ? <LockOutlinedIcon /> : icon}
            onClick={handleClick}
            sx={{
                borderRadius: 2,
                px: 2.5,
                py: 1.25,
                fontWeight: 700,
                textTransform: "none",
                width: { xs: "100%", sm: "auto" },
                justifyContent: { xs: "space-between", sm: "center" },
                opacity: locked ? 0.7 : 1,
                borderStyle: locked ? "dashed" : "solid",
            }}
        >
            {title}
        </Button>
    );

    return helper && locked ? <Tooltip title={helper}>{button}</Tooltip> : button;
};

const InfoCard: React.FC<{
    to: string;
    icon: React.ReactNode;
    title: string;
    text: string;
    disabled?: boolean;
    actionLabel?: string;
}> = ({ to, icon, title, text, disabled, actionLabel }) => (
    <Card
        elevation={2}
        sx={{
            borderRadius: 3,
            flex: "1 1 320px",
            width: "100%",
            minWidth: { xs: "unset", sm: 280 },
            maxWidth: { xs: "100%", md: 520 },
        }}
    >
        <CardContent>
            <Stack direction="row" spacing={1.25} alignItems="center" mb={1}>
                <Box
                    sx={{
                        width: 40,
                        height: 40,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: 2,
                        bgcolor: (t) =>
                            t.palette.mode === "light" ? t.palette.primary.main + "20" : t.palette.primary.main + "30",
                    }}
                >
                    {icon}
                </Box>
                <Typography fontWeight={800}>{title}</Typography>
            </Stack>
            <Stack justifyContent="space-between" direction="row" alignItems="flex-end">
                <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                    {text}
                </Typography>
                <Button component={RouterLink} to={to} variant="text" disabled={disabled} sx={{ borderRadius: 2 }}>
                    {actionLabel ?? "Open"}
                </Button>
            </Stack>
        </CardContent>
    </Card>
);

const MenuTile: React.FC<{
    to: string;
    icon: React.ReactNode;
    title: string;
}> = ({ to, icon, title }) => (
    <Card
        elevation={2}
        sx={{
            borderRadius: 3,
            flex: "1 1 260px",
            width: "100%",
            minWidth: { xs: "unset", sm: 220 },
            maxWidth: { xs: "100%", sm: 320 },
        }}
        component="div"
    >
        <CardActionArea component={RouterLink} to={to} sx={{ borderRadius: 3 }}>
            <CardContent sx={{ display: "grid", placeItems: "center", py: 3 }}>
                <Box
                    sx={{
                        width: 44,
                        height: 44,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: 2,
                        backgroundColor: (t) =>
                            t.palette.mode === "light" ? t.palette.primary.main + "20" : t.palette.primary.main + "30",
                        mb: 1,
                    }}
                >
                    {icon}
                </Box>
                <Typography fontWeight={800}>{title}</Typography>
            </CardContent>
        </CardActionArea>
    </Card>
);
