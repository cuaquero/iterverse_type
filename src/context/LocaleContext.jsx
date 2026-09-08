import React, { createContext, useContext, useCallback } from "react";
import { translations } from "../translations/translations";

const LocaleContext = createContext();

export const LocaleProvider = ({ children }) => {
  // The interface-language toggle has been removed — the UI is English-only.
  // `t()` is kept working as-is since it's called from dozens of components.
  const locale = "en";

  const t = useCallback((key, ...args) => {
    let str = translations["en"]?.[key] || key;
    args.forEach((arg, i) => {
      str = str.replace(`{${i}}`, arg);
    });
    return str;
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, t }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = () => useContext(LocaleContext);
