import { AppProvider } from './context/AppContext';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { BackOfficeLayout } from './pages/backoffice/BackOfficeLayout';
import { DashboardPage } from './pages/backoffice/DashboardPage';
import { HRMDashboard } from './pages/backoffice/HRM';
import { InventoryPage } from './pages/backoffice/InventoryPage';
import { PatrolAreasPage } from './pages/backoffice/PatrolAreasPage';
import { BackofficeSignInPage } from './pages/BackofficeSignInPage';
import { TaskAssignPage } from './pages/backoffice/TaskAssignPage';
import { ReportManagementPage } from './pages/backoffice/ReportManagementPage';
import { ImageClassificationPage } from './pages/backoffice/ImageClassificationPage';
import { FieldOpsHomePage } from './pages/field-ops/FieldOpsHomePage';
import { FieldOpsLayout } from './pages/field-ops/FieldOpsLayout';
import { FieldOpsMapPage } from './pages/field-ops/FieldOpsMapPage';
import { FieldOpsProfilePage } from './pages/field-ops/FieldOpsProfilePage';
import { FieldOpsReportPage } from './pages/field-ops/FieldOpsReportPage';
import { FieldOpsTasksPage } from './pages/field-ops/FieldOpsTasksPage';
import { FieldOpsSignInPage } from './pages/FieldOpsSignInPage';
import { FieldOpsNavigate } from './pages/field-ops/FieldOpsNavigate';


function App() {
  return (
    <AppProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/signin/backoffice" replace />} />
        <Route path="/signin/backoffice" element={<BackofficeSignInPage />} />
        <Route path="/signin/fieldops" element={<FieldOpsSignInPage />} />

        <Route element={<ProtectedRoute allowedRoles={['backoffice']} />}>
          <Route element={<BackOfficeLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/hrm" element={<HRMDashboard />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/areas" element={<PatrolAreasPage />} />
            <Route path="/taskassignment" element={<TaskAssignPage />} />
            <Route path="/report-management" element={<ReportManagementPage />} />
            <Route path="/image-classification" element={<ImageClassificationPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['fieldops']} />}>
          <Route element={<FieldOpsLayout />}>
            <Route path="/field-ops/home" element={<FieldOpsHomePage />} />
            <Route path="/field-ops/map" element={<FieldOpsMapPage />} />
            <Route path="/field-ops/tasks" element={<FieldOpsTasksPage />} />
            <Route path="/field-ops/report" element={<FieldOpsReportPage />} />
            <Route path="/field-ops/profile" element={<FieldOpsProfilePage />} />
            <Route path="/field-ops/navigate" element={<FieldOpsNavigate />} />
          </Route>
        </Route>

        <Route path="/field-ops" element={<Navigate to="/field-ops/home" replace />} />

        <Route path="*" element={<Navigate to="/signin/backoffice" replace />} />

      </Routes>
    </AppProvider>
  );
}

export default App;