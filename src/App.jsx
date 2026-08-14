import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import AppShell from './components/AppShell';
import ToastHost from './components/ToastHost';
import RequireAuth from './components/RequireAuth';
import CapGate from './components/CapGate';
import { ToastProvider } from './state/ToastContext';
import { AuthProvider } from './state/AuthContext';
import { WorkspaceProvider } from './state/WorkspaceContext';
import { LiveWorkspaceProvider } from './state/LiveWorkspaceProvider';
import { CAP } from './permissions/engine';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import InquiriesPage from './pages/InquiriesPage';
import PipelinePage from './pages/PipelinePage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import IdeasPage from './pages/IdeasPage';
import ReviewsPage from './pages/ReviewsPage';
import ReviewRoomPage from './pages/ReviewRoomPage';
import ClientsPage from './pages/ClientsPage';
import PaymentsPage from './pages/PaymentsPage';
import PublishingPage from './pages/PublishingPage';
import ClientPortalPage from './pages/ClientPortalPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import OnboardingPage from './pages/OnboardingPage';
import InvitePage from './pages/InvitePage';
import TeamPage from './pages/TeamPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import ClientPortalShell, { ClientHome } from './pages/ClientHomePage';
import ClientProjectPage from './pages/ClientProjectPage';
import SuspendedPage from './pages/SuspendedPage';

const LEGACY = new Set(['dashboard', 'inquiries', 'pipeline', 'projects', 'reviews', 'ideas', 'clients', 'payments', 'publishing', 'settings']);

function LiveOrLegacy() {
  const { workspaceSlug } = useParams();
  if (LEGACY.has(workspaceSlug)) return <Navigate to={`/demo/${workspaceSlug}`} replace />;
  return (
    <RequireAuth>
      <LiveWorkspaceProvider>
        <AppShell />
      </LiveWorkspaceProvider>
    </RequireAuth>
  );
}

function WorkspaceRoutes() {
  return (
    <>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="inquiries" element={<CapGate cap={CAP.INQUIRY_VIEW}><InquiriesPage /></CapGate>} />
      <Route path="pipeline" element={<PipelinePage />} />
      <Route path="projects" element={<ProjectsPage />} />
      <Route path="projects/:id" element={<ProjectDetailPage />} />
      <Route path="reviews" element={<CapGate cap={CAP.REVIEW_VIEW}><ReviewsPage /></CapGate>} />
      <Route path="reviews/:id" element={<CapGate cap={CAP.REVIEW_VIEW}><ReviewRoomPage /></CapGate>} />
      <Route path="ideas" element={<CapGate cap={CAP.IDEA_VIEW}><IdeasPage /></CapGate>} />
      <Route path="clients" element={<CapGate cap={CAP.CLIENT_VIEW}><ClientsPage /></CapGate>} />
      <Route path="payments" element={<CapGate cap={CAP.PAYMENT_VIEW}><PaymentsPage /></CapGate>} />
      <Route path="publishing" element={<CapGate cap={CAP.DELIVERY_VIEW}><PublishingPage /></CapGate>} />
      <Route path="team" element={<CapGate cap={CAP.TEAM_VIEW}><TeamPage /></CapGate>} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="notifications" element={<NotificationsPage />} />
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <ToastHost />
          <Routes>
            <Route path="/" element={<WorkspaceProvider><LandingPage /></WorkspaceProvider>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/invite" element={<InvitePage />} />
            <Route path="/invite/:token" element={<InvitePage />} />
            <Route path="/suspended" element={<SuspendedPage />} />
            <Route path="/demo" element={<WorkspaceProvider><AppShell /></WorkspaceProvider>}>
              {WorkspaceRoutes()}
            </Route>
            <Route path="/app/:workspaceSlug" element={<LiveOrLegacy />}>
              {WorkspaceRoutes()}
            </Route>
            <Route path="/portal/:id" element={<WorkspaceProvider><ClientPortalPage /></WorkspaceProvider>} />
            <Route path="/client" element={<RequireAuth><ClientPortalShell /></RequireAuth>}>
              <Route index element={<ClientHome />} />
              <Route path="projects/:id" element={<ClientProjectPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
