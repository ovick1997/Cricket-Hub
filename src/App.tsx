import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import PublicHome from "./pages/PublicHome.tsx";
import Index from "./pages/Index.tsx";
import Matches from "./pages/Matches.tsx";
import Teams from "./pages/Teams.tsx";
import Players from "./pages/Players.tsx";
import LiveScoring from "./pages/LiveScoring.tsx";
import Tournaments from "./pages/Tournaments.tsx";
import Analytics from "./pages/Analytics.tsx";
import Scorecard from "./pages/Scorecard.tsx";
import PublicLiveMatch from "./pages/PublicLiveMatch.tsx";
import PublicLiveList from "./pages/PublicLiveList.tsx";
import PublicScorecard from "./pages/PublicScorecard.tsx";
import PublicResults from "./pages/PublicResults.tsx";
import PublicLeaderboard from "./pages/PublicLeaderboard.tsx";
import Auth from "./pages/Auth.tsx";
import OrgSetup from "./pages/OrgSetup.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import PlayerProfile from "./pages/PlayerProfile.tsx";
import Settings from "./pages/Settings.tsx";
import TeamDetails from "./pages/TeamDetails.tsx";
import MatchHistory from "./pages/MatchHistory.tsx";
import TournamentDetails from "./pages/TournamentDetails.tsx";
import Documentation from "./pages/Documentation.tsx";
import Account from "./pages/Account.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<PublicHome />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/live" element={<PublicLiveList />} />
            <Route path="/live/:matchId" element={<PublicLiveMatch />} />
            <Route path="/results" element={<PublicResults />} />
            <Route path="/leaderboard" element={<PublicLeaderboard />} />
            <Route path="/scorecard/:matchId" element={<PublicScorecard />} />
            {/* Protected routes */}
            <Route path="/org-setup" element={<ProtectedRoute><OrgSetup /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute requiredPermission="dashboard"><Index /></ProtectedRoute>} />
            <Route path="/matches" element={<ProtectedRoute requiredPermission="matches"><Matches /></ProtectedRoute>} />
            <Route path="/match-history" element={<ProtectedRoute requiredPermission="matches"><MatchHistory /></ProtectedRoute>} />
            <Route path="/teams" element={<ProtectedRoute requiredPermission="teams"><Teams /></ProtectedRoute>} />
            <Route path="/teams/:id" element={<ProtectedRoute requiredPermission="teams"><TeamDetails /></ProtectedRoute>} />
            <Route path="/players" element={<ProtectedRoute requiredPermission="players"><Players /></ProtectedRoute>} />
            <Route path="/scoring" element={<ProtectedRoute requiredPermission="scoring"><LiveScoring /></ProtectedRoute>} />
            <Route path="/tournaments" element={<ProtectedRoute requiredPermission="tournaments"><Tournaments /></ProtectedRoute>} />
            <Route path="/tournaments/:id" element={<ProtectedRoute requiredPermission="tournaments"><TournamentDetails /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute requiredPermission="analytics"><Analytics /></ProtectedRoute>} />
            <Route path="/scorecard/:id" element={<ProtectedRoute requiredPermission="matches"><Scorecard /></ProtectedRoute>} />
            <Route path="/player/:id" element={<ProtectedRoute requiredPermission="players"><PlayerProfile /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute requiredPermission="settings"><Settings /></ProtectedRoute>} />
            <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
            <Route path="/documentation" element={<ProtectedRoute requiredPermission="settings"><Documentation /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
