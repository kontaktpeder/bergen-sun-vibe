import { Navigate, useParams } from "react-router-dom";

export default function LegacyVenueRedirect() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/" replace />;
  return <Navigate to={`/steder/${id}`} replace />;
}
