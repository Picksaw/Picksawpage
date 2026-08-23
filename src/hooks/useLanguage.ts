import { useState, useCallback } from "react";
import type { Lang } from "../config/siteTexts";

export function useLanguage() {
  const [lang, setLang] = useState<Lang>("en");

  const toggle = useCallback(() => {
    setLang((prev) => (prev === "en" ? "fa" : "en"));
  }, []);

  return { lang, toggle, setLang };
}
