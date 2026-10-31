import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
// Add page imports here
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Layout from '@/components/q/Layout';
import Pulse from '@/pages/Pulse';
import AskMaya from '@/pages/AskMaya';
import DemoTour from '@/pages/DemoTour';
import AITeam from '@/pages/AITeam';
import Workboard from '@/pages/Workboard';
import Decisions from '@/pages/Decisions';
import Clients from '@/pages/Clients';
import ClientDetail from '@/pages/ClientDetail';
import WorkspaceLayout from '@/components/w/WorkspaceLayout';
import WOverview from '@/pages/w/WOverview';
import WConversations from '@/pages/w/WConversations';
import WClients from '@/pages/w/WClients';
import WTeam from '@/pages/w/WTeam';
import WTasks from '@/pages/w/WTasks';
import WOperations from '@/pages/w/WOperations';
import WAgents from '@/pages/w/WAgents';
import WIntegrations from '@/pages/w/WIntegrations';
import WReview from '@/pages/w/WReview';
import WSettings from '@/pages/w/WSettings';
import WWorkCenter from '@/pages/w/WWorkCenter';
import WWorkOrder from '@/pages/w/WWorkOrder';
import WDeliverables from '@/pages/w/WDeliverables';
import WCatalog from '@/pages/w/WCatalog';
import WPlans from '@/pages/w/WPlans';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/" element={<Navigate to="/w" replace />} />
        <Route element={<Layout />}>
          <Route path="/pulse" element={<Pulse />} />
          <Route path="/tour" element={<DemoTour />} />
          <Route path="/maya" element={<AskMaya />} />
          <Route path="/team" element={<AITeam />} />
          <Route path="/workboard" element={<Workboard />} />
          <Route path="/decisions" element={<Decisions />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/:code" element={<ClientDetail />} />
        </Route>
        <Route path="/w" element={<WorkspaceLayout />}>
          <Route index element={<WWorkCenter />} />
          <Route path="overview" element={<WOverview />} />
          <Route path="work/:id" element={<WWorkOrder />} />
          <Route path="deliverables" element={<WDeliverables />} />
          <Route path="catalog" element={<WCatalog />} />
          <Route path="plans" element={<WPlans />} />
          <Route path="conversations" element={<WConversations />} />
          <Route path="clients" element={<WClients />} />
          <Route path="team" element={<WTeam />} />
          <Route path="tasks" element={<WTasks />} />
          <Route path="operations" element={<WOperations />} />
          <Route path="agents" element={<WAgents />} />
          <Route path="integrations" element={<WIntegrations />} />
          <Route path="review" element={<WReview />} />
          <Route path="settings" element={<WSettings />} />
        </Route>
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