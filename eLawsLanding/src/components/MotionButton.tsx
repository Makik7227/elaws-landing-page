import { forwardRef } from "react";
import { Button } from "@mui/material";
import type { ButtonProps } from "@mui/material";
import { motion } from "framer-motion";
import { Link as RouterLink } from "react-router-dom";

type MotionButtonProps = ButtonProps & {
    to?: string;
    component?: typeof RouterLink;
};

const MotionButton = motion(
    forwardRef<HTMLButtonElement, MotionButtonProps>(function MotionButton(
        props,
        ref
    ) {
        return <Button ref={ref} {...props} />;
    })
);

export default MotionButton;
