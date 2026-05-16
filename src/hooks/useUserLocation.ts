import { useCallback, useState } from "react";

type UserLocation = { lat: number; lng: number };

export const LOCATION_DENIED_MESSAGE =
  "Posisjon er blokkert i nettleseren. Trykk på låsikonet i adressefeltet og tillat posisjon, og prøv igjen.";

async function getPermissionState(): Promise<PermissionState | null> {
  try {
    // @ts-ignore - permissions API not in all TS libs
    if (typeof navigator === "undefined" || !navigator.permissions?.query) return null;
    // @ts-ignore
    const status = await navigator.permissions.query({ name: "geolocation" as PermissionName });
    return status.state as PermissionState;
  } catch {
    return null;
  }
}

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<PermissionState | null>(null);

  const locate = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Geolocation er ikke støttet på denne enheten.");
      return;
    }

    setLoading(true);
    setError(null);

    const state = await getPermissionState();
    setPermission(state);
    if (state === "denied") {
      setError(LOCATION_DENIED_MESSAGE);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setPermission("granted");
        setLoading(false);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setPermission("denied");
          setError(LOCATION_DENIED_MESSAGE);
        } else {
          setError(err.message || "Kunne ikke hente posisjon.");
        }
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  }, []);

  return { location, loading, error, permission, locate };
}
