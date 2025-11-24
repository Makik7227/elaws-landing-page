import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import pl from "./locales/pl.json";

const fallbackLng = "en";

const getInitialLanguage = () => {
    if (typeof window === "undefined") {
        return fallbackLng;
    }

    const stored = window.localStorage.getItem("language");
    if (stored) {
        return stored;
    }

    if (navigator?.language?.startsWith("pl")) {
        return "pl";
    }

    return fallbackLng;
};

if (!i18n.isInitialized) {
    i18n.use(initReactI18next).init({
        resources: {
            en: { translation: en },
            pl: { translation: pl },
        },
        lng: getInitialLanguage(),
        fallbackLng,
        interpolation: {
            escapeValue: false,
        },
        supportedLngs: ["en", "pl"],
        detection: {
            order: ["localStorage", "navigator"],
        },
    });
}

export default i18n;
