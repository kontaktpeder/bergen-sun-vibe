import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { CityProvider } from "@/context/CityContext";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import Favorites from "./pages/Favorites";
import Profile from "./pages/Profile";
import VenueDetail from "./pages/VenueDetail";
import Auth from "./pages/Auth";
import Leaderboard from "./pages/Leaderboard";
import AdminReports from "./pages/AdminReports";
import AdminVenues from "./pages/AdminVenues";
import NotFound from "./pages/NotFound";
import PlacePage from "./pages/seo/PlacePage";
import CityPage from "./pages/seo/CityPage";
import FacetPage from "./pages/seo/FacetPage";
import LegacyVenueRedirect from "./pages/seo/LegacyVenueRedirect";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CityProvider>
    <TooltipProvider>
      <Sonner position="top-center" />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/venue/:id" element={<LegacyVenueRedirect />} />
            <Route path="/steder/:slug" element={<PlacePage />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/venues" element={<AdminVenues />} />
            <Route path="/:citySlug" element={<CityPage />} />
            <Route path="/:citySlug/:facetSlug" element={<FacetPage />} />
          </Route>
          <Route path="/auth" element={<Auth />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </CityProvider>
  </QueryClientProvider>
);

export default App;
