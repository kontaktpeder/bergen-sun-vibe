import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type City = "Bergen" | "Oslo";

const STORAGE_KEY = "uteliv:currentCity";
const CHOSEN_STORAGE_KEY = "uteliv:hasChosenCity";
const DEFAULT_CITY: City = "Bergen";

type CityContextValue = {
  currentCity: City;
  setCurrentCity: (city: City) => void;
  hasChosenCity: boolean;
  chooseCityByLocation: () => Promise<City | null>;
  pickerOpen: boolean;
  openPicker: () => void;
  closePicker: () => void;
};

const CityContext = createContext<CityContextValue | undefined>(undefined);

function readStoredCity(): City | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "Bergen" || stored === "Oslo") return stored;
  } catch {
    // ignore
  }
  return null;
}

function readHasChosenCity(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(CHOSEN_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

// Approximate city centers for nearest-city detection
const CITY_CENTERS: Record<City, { lat: number; lng: number }> = {
  Bergen: { lat: 60.3913, lng: 5.3221 },
  Oslo: { lat: 59.9139, lng: 10.7522 },
};

function nearestCity(lat: number, lng: number): City {
  let best: { city: City; d: number } | null = null;
  for (const c of Object.keys(CITY_CENTERS) as City[]) {
    const dLat = lat - CITY_CENTERS[c].lat;
    const dLng = lng - CITY_CENTERS[c].lng;
    const d = dLat * dLat + dLng * dLng;
    if (!best || d < best.d) best = { city: c, d };
  }
  return best!.city;
}

export function CityProvider({ children }: { children: ReactNode }) {
  const initial = readStoredCity();
  const initiallyChosen = readHasChosenCity();
  const [currentCity, setCurrentCityState] = useState<City>(initial ?? DEFAULT_CITY);
  const [hasChosenCity, setHasChosenCity] = useState<boolean>(initiallyChosen);
  const [pickerOpen, setPickerOpen] = useState<boolean>(false);

  const setCurrentCity = (city: City) => {
    setCurrentCityState(city);
    setHasChosenCity(true);
    setPickerOpen(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, city);
      window.localStorage.setItem(CHOSEN_STORAGE_KEY, "true");
    } catch {
      // ignore
    }
  };

  const chooseCityByLocation = (): Promise<City | null> => {
    return new Promise((resolve) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const city = nearestCity(pos.coords.latitude, pos.coords.longitude);
          setCurrentCity(city);
          resolve(city);
        },
        () => resolve(null),
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
      );
    });
  };

  // Keep storage in sync if city changes via setCurrentCity (already handled),
  // but ensure SSR/hydration mismatch doesn't write a default.
  useEffect(() => {
    if (!hasChosenCity) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, currentCity);
      window.localStorage.setItem(CHOSEN_STORAGE_KEY, "true");
    } catch {
      // ignore
    }
  }, [currentCity, hasChosenCity]);

  return (
    <CityContext.Provider value={{ currentCity, setCurrentCity, hasChosenCity, chooseCityByLocation, pickerOpen, openPicker: () => setPickerOpen(true), closePicker: () => setPickerOpen(false) }}>
      {children}
    </CityContext.Provider>
  );
}

export function useCity() {
  const ctx = useContext(CityContext);
  if (!ctx) throw new Error("useCity must be used within a CityProvider");
  return ctx;
}
