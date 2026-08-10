import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';
import { WorkspaceProvider } from './state/WorkspaceContext';
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
import NotFoundPage from './pages/NotFoundPage';

export default function App(){return <WorkspaceProvider><BrowserRouter><Routes><Route path="/" element={<LandingPage/>}/><Route path="/app" element={<AppShell/>}><Route index element={<Navigate to="dashboard" replace/>}/><Route path="dashboard" element={<DashboardPage/>}/><Route path="inquiries" element={<InquiriesPage/>}/><Route path="pipeline" element={<PipelinePage/>}/><Route path="projects" element={<ProjectsPage/>}/><Route path="projects/:id" element={<ProjectDetailPage/>}/><Route path="reviews" element={<ReviewsPage/>}/><Route path="reviews/:id" element={<ReviewRoomPage/>}/><Route path="ideas" element={<IdeasPage/>}/><Route path="clients" element={<ClientsPage/>}/><Route path="payments" element={<PaymentsPage/>}/><Route path="publishing" element={<PublishingPage/>}/></Route><Route path="/portal/:id" element={<ClientPortalPage/>}/><Route path="*" element={<NotFoundPage/>}/></Routes></BrowserRouter></WorkspaceProvider>}
