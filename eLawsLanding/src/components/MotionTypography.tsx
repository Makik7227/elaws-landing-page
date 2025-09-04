import { forwardRef } from "react";
import { Typography } from "@mui/material";
import type { TypographyProps } from "@mui/material";
import { motion } from "framer-motion";
import { Link as RouterLink } from "react-router-dom";

type MotionTypographyProps = TypographyProps & {
    to?: string;
    component?: typeof RouterLink;
    variant?: string;
};

const MotionTypography = motion(
    forwardRef<HTMLSpanElement, MotionTypographyProps>(function MotionTypography(
        props,
        ref,
    ) {
        return <Typography ref={ref} {...props} />;
    })
);

export default MotionTypography;