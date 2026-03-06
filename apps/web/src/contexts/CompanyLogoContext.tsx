import { createContext, useCallback, useContext, useMemo, useState } from "react";

const STORAGE_KEY = "sigeo.companyLogoUrl";

function getStoredLogoUrl(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

type CompanyLogoContextValue = {
  companyLogoUrl: string;
  setCompanyLogoUrl: (url: string) => void;
};

const CompanyLogoContext = createContext<CompanyLogoContextValue | null>(null);

export function CompanyLogoProvider({ children }: { children: React.ReactNode }) {
  const [companyLogoUrl, setState] = useState<string>(getStoredLogoUrl);

  const setCompanyLogoUrl = useCallback((url: string) => {
    setState(url);
    try {
      if (url) {
        localStorage.setItem(STORAGE_KEY, url);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo(
    () => ({ companyLogoUrl, setCompanyLogoUrl }),
    [companyLogoUrl, setCompanyLogoUrl],
  );

  return <CompanyLogoContext.Provider value={value}>{children}</CompanyLogoContext.Provider>;
}

export function useCompanyLogo() {
  const ctx = useContext(CompanyLogoContext);
  if (!ctx) throw new Error("useCompanyLogo must be used within CompanyLogoProvider");
  return ctx;
}
