import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
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

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      {/* Add your page Route elements here */}
      <Route element={<Layout />}>
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
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App