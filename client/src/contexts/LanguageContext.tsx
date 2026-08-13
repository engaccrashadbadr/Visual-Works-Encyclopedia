import { createContext, useContext, useEffect, useState } from "react";

type Language = "ar" | "en";
const LanguageContext = createContext<{ lang: Language; setLang: (lang: Language) => void; toggleLang: () => void }>({ lang: "ar", setLang: () => {}, toggleLang: () => {} });
export function LanguageProvider({ children }: { children: React.ReactNode }) { const [lang, setLang] = useState<Language>(() => (localStorage.getItem("vw-lang") as Language) || "ar"); useEffect(() => { localStorage.setItem("vw-lang", lang); document.documentElement.lang = lang; document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"; }, [lang]); return <LanguageContext.Provider value={{ lang, setLang, toggleLang: () => setLang(x => x === "ar" ? "en" : "ar") }}>{children}</LanguageContext.Provider>; }
export const useLanguage = () => useContext(LanguageContext);
