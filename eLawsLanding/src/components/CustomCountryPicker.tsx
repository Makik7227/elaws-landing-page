import React, { useMemo } from "react";
import {
    Box,
    Avatar,
    Autocomplete,
    InputAdornment,
    TextField,
    Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { countries } from "../utils/contries.ts";
import { useTranslation } from "react-i18next";

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
    const { t } = useTranslation();

    const getLocalizedName = (code: string, fallback: string) =>
        t(`countries.${code}`, { defaultValue: fallback || code });

    const selectedOption = useMemo(() => {
        if (countryCode) {
            return countries.find((item) => item.code === countryCode) ?? null;
        }
        if (country) {
            return countries.find((item) => item.name === country) ?? null;
        }
        return null;
    }, [country, countryCode]);

    return (
        <Autocomplete
            fullWidth
            autoHighlight
            openOnFocus
            clearOnEscape={Boolean(enableXReset)}
            options={countries}
            value={selectedOption}
            disableClearable={!enableXReset}
            getOptionLabel={(option) => getLocalizedName(option.code, option.name)}
            isOptionEqualToValue={(option, value) => option.code === value.code}
            filterOptions={(options, { inputValue }) => {
                const normalizedSearch = inputValue.trim().toLowerCase();
                if (!normalizedSearch) {
                    return options;
                }
                return options.filter((item) => {
                    const localized = getLocalizedName(item.code, item.name).toLowerCase();
                    return (
                        localized.includes(normalizedSearch) ||
                        item.name.toLowerCase().includes(normalizedSearch) ||
                        item.code.toLowerCase().includes(normalizedSearch)
                    );
                });
            }}
            onChange={(_, value) => {
                onSelect(value ?? null);
            }}
            noOptionsText={t("components.countryPicker.empty")}
            renderOption={(props, option) => (
                <Box
                    component="li"
                    {...props}
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        py: 1,
                    }}
                >
                    <Avatar
                        src={getFlagUrl(option.code)}
                        variant="square"
                        sx={(theme) => ({
                            width: 32,
                            height: 22,
                            borderRadius: "4px",
                            border: `1px solid ${theme.palette.divider}`,
                        })}
                    />
                    <Box>
                        <Typography fontWeight={600}>
                            {getLocalizedName(option.code, option.name)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {option.code}
                        </Typography>
                    </Box>
                </Box>
            )}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={t("components.countryPicker.trigger")}
                    placeholder={t("components.countryPicker.searchPlaceholder")}
                    InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                            <InputAdornment position="start">
                                {selectedOption ? (
                                    <Avatar
                                        src={getFlagUrl(selectedOption.code)}
                                        variant="square"
                                        sx={(theme) => ({
                                            width: 26,
                                            height: 18,
                                            borderRadius: "4px",
                                            border: `1px solid ${theme.palette.divider}`,
                                        })}
                                    />
                                ) : (
                                    <SearchIcon fontSize="small" />
                                )}
                            </InputAdornment>
                        ),
                    }}
                />
            )}
            ListboxProps={{
                sx: {
                    maxHeight: 320,
                    py: 0.5,
                },
            }}
        />
    );
};

export default CustomCountryPickerWeb;
