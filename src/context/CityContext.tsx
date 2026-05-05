import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type City = "Bergen" | "Oslo";

const STORAGE_KEY = "uteliv:currentCity";
const DEFAULT_CITY: City = "Bergen";

type CityContextValue = {
  currentCity: City;
  setCurrentCity: (city: City) => void;
};

const CityContext = createContext<CityContextValue | undefined>(undefined);

function readInitialCity(): City {
  if (typeof window === "undefined") return DEFAULT_CITY;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "Bergen" || stored === "Oslo") return stored;
  } catch {
    // ignore
  }
  return DEFAULT_CITY;
}

export function CityProvider({ children }: { children: ReactNode }) {
  const [currentCity, setCurrentCityState] = useState<City>(readInitialCity);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, currentCity);
    } catch {
      // ignore
    }
  }, [currentCity]);

  const setCurrentCity = (city: City) => setCurrentCityState(city);

  return (
    <CityContext.Provider value={{ currentCity, setCurrentCity }}>
      {children}
    </CityContext.Provider>
  );
}

export function useCity() {
  const ctx = useContext(CityContext);
  if (!ctx) throw new Error("useCity must be used within a CityProvider");
  return ctx;
}
