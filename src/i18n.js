import i18n from "i18next"
import { initReactI18next } from "react-i18next"

const resources = {
    "en-gb": {
        translation: {},
    },
    cs: {
        translation: {
            "Current Weight": "Aktuální váha",
            "Weight Change (since last measurement)":
                "Změna hmotnosti (od posledního měření)",
            "Weight Change (since birth)": "Změna hmotnosti (od narození)",
            "Weight Over Time": "Váha v čase",
            "Weight (kg)": "Váha (kg)",
            weight: "Váha",
            "All Entries": "Všechny záznamy",
        },
    },
    it: {
        translation: {
            "Current Weight": "Peso Attuale",
            "Weight Change (since last measurement)":
                "Variazione di Peso (dall'ultima misurazione)",
            "Weight Change (since birth)": "Variazione di Peso (dalla nascita)",
            "Weight Over Time": "Peso nel Tempo",
            "Weight (kg)": "Peso (kg)",
            weight: "Peso",
            "All Entries": "Tutti i dati",
        },
    },
}

export function setLocale(locale) {
    localStorage.setItem("userLanguage", locale)
    i18n.changeLanguage(locale)
}

function getInitialLanguage() {
    const savedLanguage = localStorage.getItem("userLanguage")
    if (!savedLanguage || !resources[savedLanguage]) {
        return "en-gb"
    }
    return savedLanguage || negotiateLocale()
}

function negotiateLocale() {
    const supportedLocales = Object.keys(resources)
    const requestedLocales = navigator.languages || [navigator.language]

    for (const locale of requestedLocales) {
        const segments = locale.split("-")

        while (segments.length > 0) {
            const candidate = segments.join("-")
            if (supportedLocales.includes(candidate)) {
                return candidate
            }
            segments.pop()
        }
    }
    return "en-gb"
}

i18n.use(initReactI18next) // passes i18n down to react-i18next
    .init({
        resources,
        lng: getInitialLanguage(),
        interpolation: {
            escapeValue: false, // react already safes from xss
        },
    })

export default i18n
