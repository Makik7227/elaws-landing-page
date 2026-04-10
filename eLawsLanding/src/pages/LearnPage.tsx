import React, { useEffect } from "react";
import { Box, Button, Card, CardContent, Container, Stack, Typography } from "@mui/material";
import { Link as RouterLink, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageHero from "../components/PageHero";

type LearnSection = {
    title: string;
    body: string;
};

type LearnPageContent = {
    title: string;
    metaTitle: string;
    metaDescription: string;
    intro: string;
    sections: LearnSection[];
};

const LearnPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const { t } = useTranslation();
    const pages = t("learn.pages", { returnObjects: true }) as Record<string, LearnPageContent>;
    const page = slug ? pages[slug] : undefined;

    useEffect(() => {
        const setMetaTag = (attr: "name" | "property", key: string, value: string) => {
            const selector = `meta[${attr}="${key}"]`;
            let tag = document.head.querySelector(selector);
            if (!tag) {
                tag = document.createElement("meta");
                tag.setAttribute(attr, key);
                document.head.appendChild(tag);
            }
            tag.setAttribute("content", value);
        };

        const metaTitle = page ? page.metaTitle : t("learn.notFound.metaTitle");
        const metaDescription = page ? page.metaDescription : t("learn.notFound.metaDescription");
        const fullTitle = `${metaTitle} | eLaws`;

        document.title = fullTitle;
        setMetaTag("name", "description", metaDescription);
        setMetaTag("property", "og:title", fullTitle);
        setMetaTag("property", "og:description", metaDescription);
        setMetaTag("property", "og:url", window.location.href);
        setMetaTag("name", "twitter:title", fullTitle);
        setMetaTag("name", "twitter:description", metaDescription);
    }, [page, t]);

    if (!page) {
        return (
            <Container sx={{ py: { xs: 6, md: 10 } }}>
                <Stack spacing={2} alignItems="flex-start">
                    <Typography variant="h4" fontWeight={800}>
                        {t("learn.notFound.title")}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        {t("learn.notFound.body")}
                    </Typography>
                    <Button component={RouterLink} to="/" variant="contained" sx={{ borderRadius: 3 }}>
                        {t("learn.notFound.cta")}
                    </Button>
                </Stack>
            </Container>
        );
    }

    return (
        <>
            <PageHero
                title={page.title}
                subtitle={page.intro}
                overline={t("learn.overline")}
                variant="soft"
                align="left"
                actions={
                    <Button component={RouterLink} to="/contact" variant="outlined" sx={{ borderRadius: 3 }}>
                        {t("learn.contactCta")}
                    </Button>
                }
            />
            <Container sx={{ py: { xs: 5, md: 8 } }}>
                <Stack spacing={{ xs: 3, md: 4 }}>
                    {page.sections.map((section) => (
                        <Card key={section.title} variant="outlined" sx={{ borderRadius: 3 }}>
                            <CardContent>
                                <Stack spacing={1}>
                                    <Typography variant="h6" fontWeight={800}>
                                        {section.title}
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary">
                                        {section.body}
                                    </Typography>
                                </Stack>
                            </CardContent>
                        </Card>
                    ))}
                    <Box sx={{ pt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            {t("learn.disclaimer")}
                        </Typography>
                    </Box>
                </Stack>
            </Container>
        </>
    );
};

export default LearnPage;
