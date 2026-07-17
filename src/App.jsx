import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AuthBooting from '@/components/auth/AuthBooting';
import ScrollToTop from './components/ScrollToTop';
// Auth surfaces — rendered in-repo (never Base44's hosted login)
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
// Add page imports here
import Layout from './components/Layout';
import Home from './pages/Home';
import NewGame from './pages/NewGame';
import GamePage from './pages/GamePage';
import FactionBuilder from './pages/FactionBuilder';
import MapEditor from './pages/MapEditor';
import MapLibrary from './pages/MapLibrary';
import ArmyDesigner from './pages/ArmyDesigner';
import PatchNotes from './pages/PatchNotes';
import AssetRegistry from './pages/AssetRegistry';
import MacroLab from './pages/MacroLab';
import StarMap from './pages/StarMap';
import Walkthrough from './pages/Walkthrough';
import Roadmap from './pages/Roadmap';
import FieldManual from './pages/FieldManual';
import DevConsole from './components/debug/DevConsole';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, isAuthenticated, authError } = useAuth();

  // Boot screen while checking app public settings or auth — themed, in-world.
  if (isLoadingPublicSettings || isLoadingAuth) {
    return <AuthBooting />;
  }

  // Authenticated-but-not-on-the-roll gets its own diegetic screen.
  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  // Anything else (auth_required, expired token, unknown) means "not signed in":
  // we render our own login rather than bouncing to Base44's hosted page.
  const authed = isAuthenticated;

  // Public auth routes always render; protected routes require a session.
  return (
    <Routes>
      <Route path="/login" element={authed ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={authed ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Add your page Route elements here */}
      <Route element={authed ? <Layout /> : <Navigate to="/login" replace />}>
        <Route path="/" element={<Home />} />
        <Route path="/new-game" element={<NewGame />} />
        <Route path="/game/:gameId" element={<GamePage />} />
        <Route path="/faction-builder" element={<FactionBuilder />} />
        <Route path="/map-editor" element={<MapEditor />} />
        <Route path="/maps" element={<MapLibrary />} />
        <Route path="/army-designer" element={<ArmyDesigner />} />
        <Route path="/patch-notes" element={<PatchNotes />} />
        <Route path="/asset-registry" element={<AssetRegistry />} />
        <Route path="/macro-lab" element={<MacroLab />} />
        <Route path="/star-map" element={<StarMap />} />
        <Route path="/walkthrough" element={<Walkthrough />} />
        <Route path="/roadmap" element={<Roadmap />} />
        <Route path="/field-manual" element={<FieldManual />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
          <DevConsole />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App