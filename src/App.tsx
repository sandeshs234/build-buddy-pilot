import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProjectDataProvider } from "./context/ProjectDataContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Activities from "./pages/Activities";
import BOQItems from "./pages/BOQItems";
import UserManagement from "./pages/UserManagement";
import ProjectManagement from "./pages/ProjectManagement";
import SettingsPage from "./components/SettingsPage";
import MaterialProcurement from "./pages/MaterialProcurement";
import ProcurementDigest from "./pages/ProcurementDigest";
import ProjectSummaryReport from "./pages/ProjectSummaryReport";
import {
  InventoryPage, ManpowerPage, EquipmentPage, SafetyPage, DelaysPage,
  PurchaseOrdersPage, DailyQuantityPage, BillsPage, StaffPage, FuelLogPage,
  QualityPage, ConcreteLogPage, WeldingPage, ToolsPage, SubcontractorsPage,
  PhotosPage, ChangeOrdersPage, DocumentsPage, ReportsPage, BackupPage,
  HelpPage
} from "./pages/modules";

const queryClient = new QueryClient();

const ProtectedPage = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <AppLayout>{children}</AppLayout>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ProjectDataProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
              <Route path="/dashboard" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
              <Route path="/projects" element={<ProtectedPage><ProjectManagement /></ProtectedPage>} />
              <Route path="/activities" element={<ProtectedPage><Activities /></ProtectedPage>} />
              <Route path="/boq" element={<ProtectedPage><BOQItems /></ProtectedPage>} />
              <Route path="/inventory" element={<ProtectedPage><InventoryPage /></ProtectedPage>} />
              <Route path="/procurement-plan" element={<ProtectedPage><MaterialProcurement /></ProtectedPage>} />
              <Route path="/procurement-digest" element={<ProtectedPage><ProcurementDigest /></ProtectedPage>} />
              <Route path="/project-summary" element={<ProtectedPage><ProjectSummaryReport /></ProtectedPage>} />
              <Route path="/manpower" element={<ProtectedPage><ManpowerPage /></ProtectedPage>} />
              <Route path="/equipment" element={<ProtectedPage><EquipmentPage /></ProtectedPage>} />
              <Route path="/safety" element={<ProtectedPage><SafetyPage /></ProtectedPage>} />
              <Route path="/delays" element={<ProtectedPage><DelaysPage /></ProtectedPage>} />
              <Route path="/purchase-orders" element={<ProtectedPage><PurchaseOrdersPage /></ProtectedPage>} />
              <Route path="/daily-quantity" element={<ProtectedPage><DailyQuantityPage /></ProtectedPage>} />
              <Route path="/bills" element={<ProtectedPage><BillsPage /></ProtectedPage>} />
              <Route path="/staff" element={<ProtectedPage><StaffPage /></ProtectedPage>} />
              <Route path="/fuel" element={<ProtectedPage><FuelLogPage /></ProtectedPage>} />
              <Route path="/quality" element={<ProtectedPage><QualityPage /></ProtectedPage>} />
              <Route path="/concrete" element={<ProtectedPage><ConcreteLogPage /></ProtectedPage>} />
              <Route path="/welding" element={<ProtectedPage><WeldingPage /></ProtectedPage>} />
              <Route path="/tools" element={<ProtectedPage><ToolsPage /></ProtectedPage>} />
              <Route path="/subcontractors" element={<ProtectedPage><SubcontractorsPage /></ProtectedPage>} />
              <Route path="/photos" element={<ProtectedPage><PhotosPage /></ProtectedPage>} />
              <Route path="/change-orders" element={<ProtectedPage><ChangeOrdersPage /></ProtectedPage>} />
              <Route path="/documents" element={<ProtectedPage><DocumentsPage /></ProtectedPage>} />
              <Route path="/reports" element={<ProtectedPage><ReportsPage /></ProtectedPage>} />
              <Route path="/backup" element={<ProtectedPage><BackupPage /></ProtectedPage>} />
              <Route path="/help" element={<ProtectedPage><HelpPage /></ProtectedPage>} />
              <Route path="/settings" element={<ProtectedPage><SettingsPage /></ProtectedPage>} />
              <Route path="/users" element={<ProtectedPage><UserManagement /></ProtectedPage>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ProjectDataProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
