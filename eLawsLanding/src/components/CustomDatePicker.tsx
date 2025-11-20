import React, { useMemo, useState } from "react";
import {
    Box,
    IconButton,
    Popover,
    Stack,
    TextField,
    Typography,
    Button,
} from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

interface CustomDatePickerProps {
    label: string;
    value?: string;
    onChange: (value: string) => void;
    required?: boolean;
    disabled?: boolean;
}

const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

const weekdayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const toInputValue = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const parseValue = (value?: string): Date => {
    if (!value) return new Date();
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return new Date();
    return parsed;
};

const buildCalendar = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const weeks: Array<Array<Date | null>> = [];
    let currentWeek: Array<Date | null> = Array(startDay).fill(null);

    for (let day = 1; day <= daysInMonth; day += 1) {
        currentWeek.push(new Date(year, month, day));
        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    }

    if (currentWeek.length) {
        while (currentWeek.length < 7) currentWeek.push(null);
        weeks.push(currentWeek);
    }

    return weeks;
};

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ label, value, onChange, required, disabled }) => {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [viewDate, setViewDate] = useState<Date>(() => parseValue(value));

    const weeks = useMemo(() => buildCalendar(viewDate.getFullYear(), viewDate.getMonth()), [viewDate]);

    const handleSelect = (date: Date | null) => {
        if (!date) return;
        onChange(toInputValue(date));
        setAnchorEl(null);
    };

    const displayValue = value ? new Date(value).toLocaleDateString() : "";

    const open = Boolean(anchorEl);

    return (
        <>
            <TextField
                label={label}
                value={displayValue}
                onClick={(event) => !disabled && setAnchorEl(event.currentTarget)}
                InputProps={{
                    readOnly: true,
                    endAdornment: (
                        <IconButton size="small" onClick={(event) => !disabled && setAnchorEl(event.currentTarget)}>
                            <CalendarTodayIcon fontSize="small" />
                        </IconButton>
                    ),
                }}
                required={required}
                disabled={disabled}
                fullWidth
            />
            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                transformOrigin={{ vertical: "top", horizontal: "left" }}
            >
                <Box sx={{ p: 2, width: 280 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                        <IconButton
                            onClick={() =>
                                setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                            }
                        >
                            <ChevronLeftIcon />
                        </IconButton>
                        <Typography fontWeight={700}>
                            {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                        </Typography>
                        <IconButton
                            onClick={() =>
                                setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                            }
                        >
                            <ChevronRightIcon />
                        </IconButton>
                    </Stack>
                    <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" mb={1} gap={0.5}>
                        {weekdayNames.map((day) => (
                            <Typography
                                key={day}
                                variant="caption"
                                textAlign="center"
                                color="text.secondary"
                                sx={{ lineHeight: "32px" }}
                            >
                                {day}
                            </Typography>
                        ))}
                    </Box>
                    <Stack spacing={0.5}>
                        {weeks.map((week, wIdx) => (
                            <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={0.5} key={`week-${wIdx}`}>
                                {week.map((day, idx) => {
                                    const isSelected = day && value === toInputValue(day);
                                    return (
                                        <Button
                                            key={day ? day.toISOString() : `empty-${idx}`}
                                            onClick={() => handleSelect(day)}
                                            size="small"
                                            variant={isSelected ? "contained" : "text"}
                                            sx={{
                                                minWidth: 0,
                                                borderRadius: 1,
                                                color: isSelected ? undefined : "text.primary",
                                                height: 36,
                                            }}
                                            disabled={!day}
                                        >
                                            {day ? day.getDate() : ""}
                                        </Button>
                                    );
                                })}
                            </Box>
                        ))}
                    </Stack>
                    <Stack direction="row" spacing={1} mt={2}>
                        <Button
                            variant="outlined"
                            onClick={() => {
                                const today = new Date();
                                setViewDate(today);
                                handleSelect(today);
                            }}
                        >
                            Today
                        </Button>
                        <Button variant="text" onClick={() => setAnchorEl(null)} sx={{ ml: "auto" }}>
                            Close
                        </Button>
                    </Stack>
                </Box>
            </Popover>
        </>
    );
};

export default CustomDatePicker;
