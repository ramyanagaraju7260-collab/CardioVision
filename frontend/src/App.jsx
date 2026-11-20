import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './hooks/useToast';
import MainLayout from './layouts/MainLayout';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import PatientDetailPage from './pages/PatientDetailPage';
import NewAssessmentPage from './pages/NewAssessmentPage';
import PredictionResultPage from './pages/PredictionResultPage';
import HistoryPage from './pages/HistoryPage';
import ModelInsightsPage from './pages/ModelInsightsPage';
import AboutPage from './pages/AboutPage';

import LandingPage from './pages/LandingPage';
import RiskStratificationPage from './pages/RiskStratificationPage';
import ReportsPage from './pages/ReportsPage';
import AlertsPage from './pages/AlertsPage';
import BatchScreeningPage from './pages/BatchScreeningPage';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/patients/:id" element={<PatientDetailPage />} />
            <Route path="/assessment/new" element={<NewAssessmentPage />} />
            <Route path="/predictions/:id" element={<PredictionResultPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/model-insights" element={<ModelInsightsPage />} />
            <Route path="/risk" element={<RiskStratificationPage />} />
            <Route path="/batch" element={<BatchScreeningPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Route>
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
