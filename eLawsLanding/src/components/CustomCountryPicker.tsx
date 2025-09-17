import React, { useState } from "react";
import {
    Avatar,
    Box,
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    InputAdornment,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    TextField,
    Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import { countries } from "../utils/contries.ts";

interface Props {
    country: string;
    countryCode: string;
    onSelect: (country: { name: string; code: string } | null) => void;
    enableXReset?: boolean;
}

const getFlagUrl = (code: string) =>
    `https://flagcdn.com/w40/${code.toLowerCase()}.png`;

const CustomCountryPickerWeb: React.FC<Props> = ({
                                                     country,
                                                     countryCode,
                                                     onSelect,
                                                     enableXReset,
                                                 }) => {
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);

    const filtered = countries.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        if (e.target.value.length > 0) {
            onSelect(null); // reset if typing
        }
    };

    return (
        <>
            {/* Picker trigger */}
            <Button
                onClick={() => setOpen(true)}
                variant="outlined"
                sx={{
                    borderRadius: 3,
                    textTransform: "none",
                    px: 2,
                    py: 1,
                }}
                endIcon={<ExpandMoreIcon />}
            >
                {country && countryCode ? (
                    <Box display="flex" alignItems="center" gap={1}>
                        <Avatar
                            src={getFlagUrl(countryCode)}
                            sx={{ width: 28, height: 20, borderRadius: "4px" }}
                            variant="square"
                        />
                        <Typography fontWeight={600}>
                            {country} ({countryCode})
                        </Typography>
                        {enableXReset && (
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelect(null);
                                }}
                            >
                                <ClearIcon fontSize="small" />
                            </IconButton>
                        )}
                    </Box>
                ) : (
                    "Select a Country"
                )}
            </Button>

            {/* Dialog */}
            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    Select Country
                    <IconButton onClick={() => setOpen(false)} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent>
                    <TextField
                        fullWidth
                        value={search}
                        onChange={handleSearch}
                        placeholder="Search country..."
                        size="small"
                        margin="normal"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <List sx={{ maxHeight: 300, overflow: "auto" }}>
                        {filtered.map((item) => (
                            <ListItem
                                component="button"
                                key={item.code}
                                onClick={() => {
                                    onSelect(item);
                                    setSearch("");
                                    setOpen(false);
                                }}
                            >
                                <ListItemAvatar>
                                    <Avatar
                                        src={getFlagUrl(item.code)}
                                        variant="square"
                                        sx={{ width: 32, height: 22, borderRadius: "4px" }}
                                    />
                                </ListItemAvatar>
                                <ListItemText
                                    primary={item.name}
                                    secondary={item.code}
                                    primaryTypographyProps={{ fontWeight: 500 }}
                                />
                            </ListItem>
                        ))}
                        {filtered.length === 0 && (
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ p: 2, textAlign: "center" }}
                            >
                                No countries found.
                            </Typography>
                        )}
                    </List>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default CustomCountryPickerWeb;