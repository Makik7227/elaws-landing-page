import React from "react";
import { Box, Button, Card, CardContent, Container, Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import { Link as RouterLink } from "react-router-dom";

const DocumentsLandingPage: React.FC = () => {
    return (
        <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
            <Stack spacing={4}>
                <Box textAlign="center">
                    <Typography variant="h3" fontWeight={900}>
                        Legal documents, organized
                    </Typography>
                    <Typography color="text.secondary" sx={{ mt: 1.5 }}>
                        Generate AI-powered contracts and store every PDF in one secure workspace.
                    </Typography>
                </Box>
                <Grid container spacing={{ xs: 3, md: 4 }}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Card sx={{ borderRadius: 4, height: "100%" }}>
                            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                                <Stack spacing={2}>
                                    <Box display="flex" alignItems="center" gap={1.5}>
                                        <AddCircleOutlineIcon color="primary" fontSize="large" />
                                        <Typography variant="h5" fontWeight={800}>
                                            Generate a document
                                        </Typography>
                                    </Box>
                                    <Typography color="text.secondary">
                                        Pick a template, fill the fields, and produce a production-ready contract in seconds.
                                    </Typography>
                                    <Stack direction="row" spacing={1} flexWrap="wrap">
                                        <Button
                                            component={RouterLink}
                                            to="/documents/generate"
                                            variant="contained"
                                            startIcon={<DescriptionOutlinedIcon />}
                                            sx={{ borderRadius: 3, fontWeight: 700 }}
                                        >
                                            Start generating
                                        </Button>
                                        <Button component={RouterLink} to="/documents/my" variant="text">
                                            View saved documents
                                        </Button>
                                    </Stack>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Card sx={{ borderRadius: 4, height: "100%" }}>
                            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                                <Stack spacing={2}>
                                    <Box display="flex" alignItems="center" gap={1.5}>
                                        <FolderOpenIcon color="primary" fontSize="large" />
                                        <Typography variant="h5" fontWeight={800}>
                                            Browse your files
                                        </Typography>
                                    </Box>
                                    <Typography color="text.secondary">
                                        Everything you create or upload syncs here. Download, copy, or delete with one click.
                                    </Typography>
                                    <Stack direction="row" spacing={1} flexWrap="wrap">
                                        <Button component={RouterLink} to="/documents/my" variant="contained" sx={{ borderRadius: 3 }}>
                                            My documents
                                        </Button>
                                        <Button component={RouterLink} to="/documents/generate" variant="outlined" sx={{ borderRadius: 3 }}>
                                            Generate new
                                        </Button>
                                    </Stack>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Stack>
        </Container>
    );
};

export default DocumentsLandingPage;
