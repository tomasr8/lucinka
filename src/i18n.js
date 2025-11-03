import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  "en-gb": {
    translation: {},
  },
  cs: {
    translation: {
      "Current Weight": "Aktuální váha",
      "Weight Change (since last measurement)":
        "Změna váhy (od posledního měření)",
      "Weight Change (since birth)": "Změna váhy (od narození)",
      "Weight Over Time": "Váha v čase",
      "Weight (kg)": "Váha (kg)",
      "All Entries": "Všechny záznamy",
      "Height Over Time": "Výška v čase",
      "Height (cm)": "Výška (cm)",
      "Breastfeeding Sessions": "Kojení",
      "Breastfeeding over days": "Kojení podle dnů",
      "session": "sezení",
      "sessions": "sezení",
      "Last session": "Poslední sezení",
      "Duration": "Doba trvání",
      "Start Time": "Čas začátku",
      "End Time": "Čas konce",
      "Total Duration": "Celková doba trvání",
      "No breastfeeding sessions recorded.":
        "Nejsou zaznamenány žádné kojení.",
        "Gallery": "Galerie",
        "Visits": "Návštěvy",
        "Breastfeeding": "Kojení",
        "Home": "Domů",
        "Sun": "Ne",
        "Mon": "Po",
        "Tue": "Út",
        "Wed": "St",
        "Thu": "Čt",
        "Fri": "Pá",
        "Sat": "So",
        "Upcoming appointments": "Nadcházející schůzky",
        "Upcoming": "Nadcházející",
        "Completed": "Dokončené",
        "Today": "Dnes",
        "Data": "Data",
        "Lucinka's vitals": "Lucinčiny parametry",
        "Add Visit": "Přidat návštěvu",
        "Breastfeeding Overview": "Přehled kojení",
        "Photo Gallery": "Fotky",
        "Upload Photo": "Nahrát fotku",
        "No photos yet": "Zatím žádné fotky",
        "photos": "fotky",
        "About": "Skoro",
        "Manual Entry": "Ruční zadání",
        "Total time": "Celkový čas",
        "Total left": "Celkem vlevo",
        "Total right": "Celkem vpravo",
        "Side": "Strana",
        "both": "obě",
        "left": "vlevo",
        "right": "vpravo",
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
      "All Entries": "Tutti i dati",
      "Height Over Time": "Altezza nel Tempo",
      "Height (cm)": "Altezza (cm)",
      "Breastfeeding Sessions": "Sessioni di Allattamento",
      "Breastfeeding over days": "Allattamento nei giorni",
      "session": "sessione",
      "sessions": "sessioni",
      "Last session": "Ultima sessione",
      "Duration": "Durata",
      "Start Time": "Ora di Inizio",
      "End Time": "Ora di Fine",
      "Total Duration": "Durata Totale",
      "No breastfeeding sessions recorded.":
        "Nessuna sessione di allattamento registrata.",
        "Gallery": "Galleria",
        "Visits": "Visite",
        "Breastfeeding": "Allattamento",
        "Home": "Home",
        "Sun": "Dom",
        "Mon": "Lun",
        "Tue": "Mar",
        "Wed": "Mer",
        "Thu": "Gio",
        "Fri": "Ven",
        "Sat": "Sab",
        "Upcoming": "Future",
        "Completed": "Completate",
        "Today": "Oggi",
        "Data": "Dati",
        "Lucinka's vitals": "Parametri di Lucinka",
        "Upcoming appointments": "Appuntamenti a venire",
        "Add Visit": "Aggiungi Visita",
        "Breastfeeding Overview": "Grafico Allattamento",
        "Photo Gallery": "Foto",
        "Upload Photo": "Carica Foto",
        "No photos yet": "Nessuna foto ancora",
        "photos": "foto",
        "About": "Circa",
        "Manual Entry": "Inserimento Manuale",
        "Total time": "Tempo totale",
        "Total left": "Totale sinistra",
        "Total right": "Totale destra",
        "Side": "Lato",
        "both": "entrambi",
        "left": "sinistra",
        "right": "destra",
    },
  },
};

export function setLocale(locale) {
  localStorage.setItem("userLanguage", locale);
  i18n.changeLanguage(locale);
}

function getInitialLanguage() {
  const savedLanguage = localStorage.getItem("userLanguage");
  if (!savedLanguage || !resources[savedLanguage]) {
    return "en-gb";
  }
  return savedLanguage || negotiateLocale();
}

function negotiateLocale() {
  const supportedLocales = Object.keys(resources);
  const requestedLocales = navigator.languages || [navigator.language];

  for (const locale of requestedLocales) {
    const segments = locale.split("-");

    while (segments.length > 0) {
      const candidate = segments.join("-");
      if (supportedLocales.includes(candidate)) {
        return candidate;
      }
      segments.pop();
    }
  }
  return "en-gb";
}

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: getInitialLanguage(),
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
