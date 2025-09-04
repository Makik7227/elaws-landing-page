import {Container, Typography} from "@mui/material";

const HomePage = () => {

    return (
        <Container sx={{textAlign: "center", mt: 8}}>
        <Typography variant="h2" gutterBottom>
            Welcome to E-Laws
        </Typography>
        <Typography variant="h6" color="textSecondary">
            Your AI-powered legal assistant.
        </Typography>
    </Container>
    )
}
export default HomePage;