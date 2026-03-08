import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProjectDataProvider } from "./context/ProjectDataContext";
import AppLayout from "./components/layout/AppLayout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Activities from "./pages/Activities";
import BOQItems from "./pages/BOQItems";
import SettingsPage from "./components/SettingsPage";
import {
  InventoryPage, ManpowerPage, EquipmentPage, SafetyPage, DelaysPage,
  PurchaseOrdersPage, DailyQuantityPage, BillsPage, StaffPage, FuelLogPage,
  QualityPage, ConcreteLogPage, WeldingPage, ToolsPage, SubcontractorsPage,
  PhotosPage, ChangeOrdersPage, DocumentsPage, ReportsPage, BackupPage,
  HelpPage
} from "./pages/modules";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ProjectDataProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
            <Route path="/activities" element={<AppLayout><Activities /></AppLayout>} />
            <Route path="/boq" element={<AppLayout><BOQItems /></AppLayout>} />
            <Route path="/inventory" element={<AppLayout><InventoryPage /></AppLayout>} />
            <Route path="/manpower" element={<AppLayout><ManpowerPage /></AppLayout>} />
            <Route path="/equipment" element={<AppLayout><EquipmentPage /></AppLayout>} />
            <Route path="/safety" element={<AppLayout><SafetyPage /></AppLayout>} />
            <Route path="/delays" element={<AppLayout><DelaysPage /></AppLayout>} />
            <Route path="/purchase-orders" element={<AppLayout><PurchaseOrdersPage /></AppLayout>} />
            <Route path="/daily-quantity" element={<AppLayout><DailyQuantityPage /></AppLayout>} />
            <Route path="/bills" element={<AppLayout><BillsPage /></AppLayout>} />
            <Route path="/staff" element={<AppLayout><StaffPage /></AppLayout>} />
            <Route path="/fuel" element={<AppLayout><FuelLogPage /></AppLayout>} />
            <Route path="/quality" element={<AppLayout><QualityPage /></AppLayout>} />
            <Route path="/concrete" element={<AppLayout><ConcreteLogPage /></AppLayout>} />
            <Route path="/welding" element={<AppLayout><WeldingPage /></AppLayout>} />
            <Route path="/tools" element={<AppLayout><ToolsPage /></AppLayout>} />
            <Route path="/subcontractors" element={<AppLayout><SubcontractorsPage /></AppLayout>} />
            <Route path="/photos" element={<AppLayout><PhotosPage /></AppLayout>} />
            <Route path="/change-orders" element={<AppLayout><ChangeOrdersPage /></AppLayout>} />
            <Route path="/documents" element={<AppLayout><DocumentsPage /></AppLayout>} />
            <Route path="/reports" element={<AppLayout><ReportsPage /></AppLayout>} />
            <Route path="/backup" element={<AppLayout><BackupPage /></AppLayout>} />
            <Route path="/help" element={<AppLayout><HelpPage /></AppLayout>} />
            <Route path="/settings" element={<AppLayout><SettingsPage /></AppLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ProjectDataProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
