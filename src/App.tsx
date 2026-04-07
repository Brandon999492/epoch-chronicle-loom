import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Timeline from "./pages/Timeline";
import TimelineEngine from "./pages/TimelineEngine";
import Archive from "./pages/Archive";
import EraDetail from "./pages/EraDetail";
import EventDetail from "./pages/EventDetail";
import SearchPage from "./pages/SearchPage";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProfilePage from "./pages/ProfilePage";
import JournalPage from "./pages/JournalPage";
import GoalsPage from "./pages/GoalsPage";
import SettingsPage from "./pages/SettingsPage";
import AddHistoryPage from "./pages/AddHistoryPage";
import BookmarksPage from "./pages/BookmarksPage";
import DashboardPage from "./pages/DashboardPage";
import RoyalArchive from "./pages/RoyalArchive";
import RoyalHouseDetail from "./pages/RoyalHouseDetail";
import RoyalProfilePage from "./pages/RoyalProfilePage";
import RoyalFamilyTree from "./pages/RoyalFamilyTree";
import HistoryAiPage from "./pages/HistoryAiPage";
import HistoryVideoStudioPage from "./pages/HistoryVideoStudioPage";
import KnowledgeGraphPage from "./pages/KnowledgeGraphPage";
import MediaLibraryPage from "./pages/MediaLibraryPage";
import SeedDataPage from "./pages/SeedDataPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
const HistoryMapPage = React.lazy(() => import("./pages/HistoryMapPage"));
import ExplorePage from "./pages/ExplorePage";
import CategoryPage from "./pages/CategoryPage";
import LearnPage from "./pages/LearnPage";
import KnowledgeStudioPage from "./pages/KnowledgeStudioPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/timeline/explore" element={<TimelineEngine />} />
            <Route path="/archive" element={<Archive />} />
            <Route path="/era/:eraId" element={<EraDetail />} />
            <Route path="/event/:eventId" element={<EventDetail />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/add-history" element={<AddHistoryPage />} />
            <Route path="/bookmarks" element={<BookmarksPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/history-ai" element={<HistoryAiPage />} />
            <Route path="/video-studio" element={<HistoryVideoStudioPage />} />
            <Route path="/royals" element={<RoyalArchive />} />
            <Route path="/royals/family-tree" element={<RoyalFamilyTree />} />
            <Route path="/royals/:houseId" element={<RoyalHouseDetail />} />
            <Route path="/royals/:houseId/:royalId" element={<RoyalProfilePage />} />
            <Route path="/knowledge-graph" element={<KnowledgeGraphPage />} />
            <Route path="/knowledge-graph/:entityType/:entityId" element={<KnowledgeGraphPage />} />
            <Route path="/media-library" element={<MediaLibraryPage />} />
            <Route path="/admin/seed-data" element={<SeedDataPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/category/:categoryId" element={<CategoryPage />} />
            <Route path="/map" element={<Suspense fallback={<div className="min-h-screen bg-background" />}><HistoryMapPage /></Suspense>} />
            <Route path="/learn" element={<LearnPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
