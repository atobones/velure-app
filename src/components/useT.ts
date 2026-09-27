"use client";
import { useEffect, useState } from "react";
import { DICT, type Lang } from "@/lib/i18n";

export function currentLang(): Lang {
  if (typeof document === "undefined") return "pl";
  const m = document.cookie.match(/(?:^|; )lang=(pl|en)/);
  if (m) return m[1] as Lang;
  const guess: Lang = navigator.language?.toLowerCase().startsWith("en") ? "en" : "pl";
  document.cookie = `lang=${guess}; path=/; max-age=31536000; samesite=lax`;
  return guess;
}

export function useT() {
  const [lang, setLang] = useState<Lang>("pl");
  useEffect(() => {
    setLang(currentLang());
    const on = () => setLang(currentLang());
    window.addEventListener("velure-lang", on);
    return () => window.removeEventListener("velure-lang", on);
  }, []);
  return { t: DICT[lang], lang };
}

export function setLangEverywhere(lang: Lang) {
  document.cookie = `lang=${lang}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.lang = lang;
  window.dispatchEvent(new Event("velure-lang"));
}
