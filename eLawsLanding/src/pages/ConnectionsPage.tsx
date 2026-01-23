import React from "react";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import { useTranslation } from "react-i18next";
import DashboardBackButton from "../components/DashboardBackButton";
import PageHero from "../components/PageHero";
import ConnectionsPanel from "../components/connections/ConnectionsPanel";

const ConnectionsPage: React.FC = () => {
    const { t } = useTranslation();
    return (
        <>
            <PageHero
                title={t("connections.title")}
                subtitle={t("connections.subtitle")}
                icon={<GroupsRoundedIcon />}
                actions={<DashboardBackButton />}
                maxWidth="md"
                variant="soft"
            />
            <ConnectionsPanel variant="page" />
        </>
    );
};

export default ConnectionsPage;
