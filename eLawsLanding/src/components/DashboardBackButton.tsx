import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { Button } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

type DashboardBackButtonProps = {
    label?: string;
    sx?: SxProps<Theme>;
};

const DashboardBackButton: React.FC<DashboardBackButtonProps> = ({ label, sx }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <Button
            onClick={() => navigate("/dashboard")}
            startIcon={<ArrowBackRoundedIcon />}
            variant="text"
            color="primary"
            sx={{
                borderRadius: 999,
                fontWeight: 700,
                textTransform: "none",
                alignSelf: "flex-start",
                px: 2.5,
                ...sx,
            }}
        >
            {label ?? t("common.backToDashboard")}
        </Button>
    );
};

export default DashboardBackButton;
