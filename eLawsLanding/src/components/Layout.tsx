import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import TopBar from "./TopBar";

const Layout = () => {
    return (
        <>
            <TopBar />
            <Box
                component="main"
                sx={{
                    flex: 1,
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 0,
                    overflowX: "hidden",
                    pt: { xs: "64px", md: "80px" },
                }}
            >
                <Outlet />
            </Box>
        </>
    );
};

export default Layout;
