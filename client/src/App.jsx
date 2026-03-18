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
import { FieldOpsHomePage } from './pages/field-ops/FieldOpsHomePage';
import { FieldOpsSignInPage } from './pages/FieldOpsSignInPage';


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
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['fieldops']} />}>
          <Route path="/field-ops/home" element={<FieldOpsHomePage />} />
        </Route>

      </Routes>
    </AppProvider>
  );
}

export default App;