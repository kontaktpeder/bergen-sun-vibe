import { useCallback, useState } from "react";

type UserLocation = { lat: number; lng: number };

export const LOCATION_DENIED_MESSAGE =
  "Du har sagt nei til posisjon tidligere. Skru på posisjon for nettsiden i nettleserinnstillingene og prøv igjen.";

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<PermissionState | null>(null);

  const locate = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Posisjon støttes ikke på denne enheten.");
      return;
    }

    setLoading(true);
    setError(null);

    // Always call getCurrentPosition — triggers the browser prompt when state
    // is "prompt". If permission is already denied, the browser will reject
    // silently (it cannot be re-prompted from JS) and we show a clear message.
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
          setError("Fant ikke posisjonen din. Prøv igjen.");
        }
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  }, []);

  return { location, loading, error, permission, locate };
}
