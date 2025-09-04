import { forwardRef } from "react";
import { Button } from "@mui/material";
import type { ButtonProps } from "@mui/material";
import { motion } from "framer-motion";

const MotionButton = motion(
    forwardRef<HTMLButtonElement, ButtonProps>(function MotionButton(props, ref) {
        return <Button ref={ref} {...props} />;
    })
);

export default MotionButton;
