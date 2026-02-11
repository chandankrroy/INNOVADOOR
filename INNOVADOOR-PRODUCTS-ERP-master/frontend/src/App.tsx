import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import { default as ProductionMeasurements } from './pages/production/Measurements';
import { default as CreateProductionMeasurement } from './pages/production/CreateMeasurement';
import ViewMeasurement from './pages/production/ViewMeasurement';
import EditMeasurement from './pages/production/EditMeasurement';
import PendingMeasurements from './pages/production/PendingMeasurements';
import Parties from './pages/production/Parties';
import CreateParty from './pages/production/CreateParty';
import ViewParty from './pages/production/ViewParty';
import ProductionPapers from './pages/production/ProductionPapers';
import CreateProductionPaper from './pages/production/CreateProductionPaper';
import ViewProductionPaper from './pages/production/ViewProductionPaper';
import Products from './pages/production/Products';
import CreateProduct from './pages/production/CreateProduct';
import ProductionTracking from './pages/production/ProductionTracking';
import ProductsSupervisorDashboard from './pages/production/SupervisorDashboard';
import Designs from './pages/production/Designs';
import CreateDesign from './pages/production/CreateDesign';
import ViewDesign from './pages/production/ViewDesign';
import EditDesign from './pages/production/EditDesign';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminUserManagement from './pages/admin/AdminUserManagement';
import AdminSupervisorManagement from './pages/admin/AdminSupervisorManagement';
import AdminCalendar from './pages/admin/AdminCalendar';
import AdminSectionPage from './pages/admin/AdminSectionPage';
import AdminProductionDocsSettings from './pages/admin/AdminProductionDocsSettings';
import RawMaterialDashboard from './pages/raw-material/RawMaterialDashboard';
import RawMaterialAnalytics from './pages/raw-material/RawMaterialAnalytics';
import RawMaterialCalendar from './pages/raw-material/RawMaterialCalendar';
import ViewParties from './pages/raw-material/ViewParties';
import ViewProductionPapers from './pages/raw-material/ViewProductionPapers';
import ViewProductionPaperRMCS from './pages/raw-material/ViewProductionPaper';
import RawMaterialProductionPaperView from './pages/raw-material/RawMaterialProductionPaperView';
import RawMaterialChecks from './pages/raw-material/RawMaterialChecks';
import Orders from './pages/raw-material/Orders';
import CompletedOrders from './pages/raw-material/CompletedOrders';
import SupplierDetails from './pages/raw-material/SupplierDetails';
import RawMaterialCategories from './pages/raw-material/RawMaterialCategories';
import SchedulerDashboard from './pages/scheduler/SchedulerDashboard';
import ScheduleProduction from './pages/scheduler/ScheduleProduction';
import ViewScheduledProduction from './pages/scheduler/ViewScheduledProduction';
import MaintainScheduledProduction from './pages/scheduler/MaintainScheduledProduction';
import SupervisorDashboard from './pages/supervisor/SupervisorDashboard';
import NewTasks from './pages/supervisor/NewTasks';
import SiteSupervisorDashboard from './pages/site-supervisor/SiteSupervisorDashboard';
import SiteList from './pages/site-supervisor/SiteList';
import QCDashboard from './pages/quality-check/QCDashboard';
import PendingQC from './pages/quality-check/PendingQC';
import PerformQC from './pages/quality-check/PerformQC';
import QCHistory from './pages/quality-check/QCHistory';
import ReworkRejection from './pages/quality-check/ReworkRejection';
import QCReports from './pages/quality-check/QCReports';
import QCCertificates from './pages/quality-check/QCCertificates';
import CRMDashboard from './pages/crm/CRMDashboard';
import Order360View from './pages/crm/Order360View';
import ManufacturingStageTracker from './pages/crm/ManufacturingStageTracker';
import EmployeePerformance from './pages/crm/EmployeePerformance';
import DeliveryCommitmentPlanner from './pages/crm/DeliveryCommitmentPlanner';
import DelayIssueMonitor from './pages/crm/DelayIssueMonitor';
import CommunicationUpdates from './pages/crm/CommunicationUpdates';
import ReportsAnalytics from './pages/crm/ReportsAnalytics';
import BillingDashboard from './pages/billing/BillingDashboard';
import BillingRequests from './pages/billing/BillingRequests';
import AccountsDashboard from './pages/accounts/AccountsDashboard';
import CustomerReceivables from './pages/accounts/CustomerReceivables';
import DispatchDashboard from './pages/dispatch/DispatchDashboard';
import ReadyForDispatch from './pages/dispatch/ReadyForDispatch';
import CreateDispatch from './pages/dispatch/CreateDispatch';
import DispatchHistory from './pages/dispatch/DispatchHistory';
import DeliveryTracking from './pages/dispatch/DeliveryTracking';
import GatePass from './pages/dispatch/GatePass';
import LogisticsDashboard from './pages/logistics/LogisticsDashboard';
import AssignedDispatchOrders from './pages/logistics/AssignedDispatchOrders';
import VehicleDriverAssignment from './pages/logistics/VehicleDriverAssignment';
import DeliveryTrackingLogistics from './pages/logistics/DeliveryTracking';
import ProofOfDelivery from './pages/logistics/ProofOfDelivery';
import DeliveryIssues from './pages/logistics/DeliveryIssues';
import LogisticsReports from './pages/logistics/LogisticsReports';
import SalesDashboard from './pages/sales/SalesDashboard';
import Leads from './pages/sales/Leads';
import CreateLead from './pages/sales/CreateLead';
import CarpenterDashboard from './pages/carpenter/CarpenterDashboard';
import AssignedSite from './pages/carpenter/AssignedSite';
import WorkAllocation from './pages/carpenter/WorkAllocation';
import FrameFixing from './pages/carpenter/FrameFixing';
import DoorFixing from './pages/carpenter/DoorFixing';
import PurchaseDashboard from './pages/purchase/Dashboard';
import PurchaseRequisitions from './pages/purchase/PurchaseRequisitions';
import MeasurementCaptainDashboard from './pages/measurement-captain/MeasurementCaptainDashboard';
import MeasurementTasks from './pages/measurement-captain/MeasurementTasks';
import { default as CreateMeasurementCaptainMeasurement } from './pages/measurement-captain/CreateMeasurement';
import { default as MeasurementCaptainMeasurements } from './pages/measurement-captain/Measurements';
import MeasurementCaptainHistory from './pages/measurement-captain/History';
import {
  FileText, Calendar as CalendarIcon, ClipboardList, Hammer, CheckCircle,
  Layers, Wrench, Package as PackageIcon, TrendingUp, Building2, Boxes, ShoppingCart,
  Briefcase, Truck, DollarSign, Settings, Lock, UserCog, Network, Users
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SidebarProvider } from './context/SidebarContext';
import { UndoRedoProvider } from './context/UndoRedoContext';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <SidebarProvider>
          <UndoRedoProvider>
            <div className="min-h-screen bg-gray-100">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                {/* Production Management Routes */}
                <Route
                  path="/measurements"
                  element={
                    <RoleProtectedRoute allowedRoles={['production_manager', 'admin']}>
                      <ProductionMeasurements />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/measurements/create"
                  element={
                    <RoleProtectedRoute allowedRoles={['production_manager', 'admin']}>
                      <CreateProductionMeasurement />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/measurements/:id"
                  element={
                    <RoleProtectedRoute allowedRoles={['production_manager', 'admin', 'measurement_captain']}>
                      <ViewMeasurement />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/measurements/:id/edit"
                  element={
                    <RoleProtectedRoute allowedRoles={['production_manager', 'production_scheduler', 'admin']}>
                      <EditMeasurement />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/pending-measurements"
                  element={
                    <RoleProtectedRoute allowedRoles={['production_manager', 'admin']}>
                      <PendingMeasurements />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/parties"
                  element={
                    <RoleProtectedRoute allowedRoles={['production_manager', 'admin', 'measurement_captain']}>
                      <Parties />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/parties/:id"
                  element={
                    <RoleProtectedRoute allowedRoles={['production_manager', 'admin']}>
                      <ViewParty />
                    </RoleProtectedRoute>
                  }
                />
                {/* Products Routes */}
                <Route
                  path="/products"
                  element={
                    <RoleProtectedRoute allowedRoles={['production_manager', 'admin']}>
                      <Products />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/products/create"
                  element={
                    <RoleProtectedRoute allowedRoles={['production_manager', 'admin']}>
                      <CreateProduct />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/products/tracking"
                  element={
                    <RoleProtectedRoute allowedRoles={['production_manager', 'admin', 'production_supervisor']}>
                      <ProductionTracking />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/products/supervisor"
                  element={
                    <RoleProtectedRoute allowedRoles={['production_supervisor', 'admin']}>
                      <ProductsSupervisorDashboard />
                    </RoleProtectedRoute>
                  }
                />
                {/* Design Routes */}
                <Route
                  path="/designs"
                  element={
                    <RoleProtectedRoute allowedRoles={['production_manager', 'admin']}>
                      <Designs />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/designs/create"
                  element={
                    <RoleProtectedRoute allowedRoles={['production_manager', 'admin']}>
                      <CreateDesign />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/designs/:id"
                  element={
                    <RoleProtectedRoute allowedRoles={['production_manager', 'admin']}>
                      <ViewDesign />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/designs/:id/edit"
                  element={
                    <RoleProtectedRoute allowedRoles={['production_manager', 'admin']}>
                      <EditDesign />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/parties/create"
                  element={
                    <RoleProtectedRoute allowedRoles={['production_manager', 'admin', 'measurement_captain']}>
                      <CreateParty />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/production-papers"
                  element={
                    <RoleProtectedRoute allowedRoles={['production_manager', 'admin']}>
                      <ProductionPapers />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/production-papers/create"
                  element={
                    <RoleProtectedRoute allowedRoles={['production_manager', 'admin']}>
                      <CreateProductionPaper />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/production-papers/:id"
                  element={
                    <RoleProtectedRoute allowedRoles={['production_manager', 'admin']}>
                      <ViewProductionPaper />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                {/* Raw Material Checker Routes */}
                <Route
                  path="/raw-material/dashboard"
                  element={
                    <RoleProtectedRoute allowedRoles={['raw_material_checker', 'admin']}>
                      <RawMaterialDashboard />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/raw-material/analytics"
                  element={
                    <RoleProtectedRoute allowedRoles={['raw_material_checker', 'admin']}>
                      <RawMaterialAnalytics />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/raw-material/calendar"
                  element={
                    <RoleProtectedRoute allowedRoles={['raw_material_checker', 'admin']}>
                      <RawMaterialCalendar />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/raw-material/parties"
                  element={
                    <RoleProtectedRoute allowedRoles={['raw_material_checker', 'admin']}>
                      <ViewParties />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/raw-material/production-papers"
                  element={
                    <RoleProtectedRoute allowedRoles={['raw_material_checker', 'admin']}>
                      <ViewProductionPapers />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/raw-material/production-papers/:id"
                  element={
                    <RoleProtectedRoute allowedRoles={['raw_material_checker', 'admin']}>
                      <ViewProductionPaperRMCS />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/raw-material/production-papers/:id/raw-material-view"
                  element={
                    <RoleProtectedRoute allowedRoles={['raw_material_checker', 'production_manager', 'admin']}>
                      <RawMaterialProductionPaperView />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/raw-material/checks"
                  element={
                    <RoleProtectedRoute allowedRoles={['raw_material_checker', 'admin']}>
                      <Navigate to="/raw-material/checks/pending" replace />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/raw-material/checks/pending"
                  element={
                    <RoleProtectedRoute allowedRoles={['raw_material_checker', 'admin']}>
                      <RawMaterialChecks status="pending" />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/raw-material/checks/work-in-progress"
                  element={
                    <RoleProtectedRoute allowedRoles={['raw_material_checker', 'admin']}>
                      <RawMaterialChecks status="work_in_progress" />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/raw-material/checks/approved"
                  element={
                    <RoleProtectedRoute allowedRoles={['raw_material_checker', 'admin']}>
                      <RawMaterialChecks status="approved" />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/raw-material/orders"
                  element={
                    <RoleProtectedRoute allowedRoles={['raw_material_checker', 'admin']}>
                      <Orders />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/raw-material/orders/completed"
                  element={
                    <RoleProtectedRoute allowedRoles={['raw_material_checker', 'admin']}>
                      <CompletedOrders />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/raw-material/suppliers"
                  element={
                    <RoleProtectedRoute allowedRoles={['raw_material_checker', 'admin']}>
                      <SupplierDetails />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/raw-material/categories"
                  element={
                    <RoleProtectedRoute allowedRoles={['raw_material_checker', 'admin']}>
                      <RawMaterialCategories />
                    </RoleProtectedRoute>
                  }
                />
                {/* Production Scheduler Routes */}
                <Route
                  path="/scheduler/dashboard"
                  element={
                    <RoleProtectedRoute allowedRoles={['production_scheduler', 'admin']}>
                      <SchedulerDashboard />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/scheduler/schedule"
                  element={
                    <RoleProtectedRoute allowedRoles={['production_scheduler', 'admin']}>
                      <ScheduleProduction />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/scheduler/view"
                  element={
                    <RoleProtectedRoute allowedRoles={['production_scheduler', 'admin']}>
                      <ViewScheduledProduction />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/scheduler/maintain"
                  element={
                    <RoleProtectedRoute allowedRoles={['production_scheduler', 'admin']}>
                      <MaintainScheduledProduction />
                    </RoleProtectedRoute>
                  }
                />
                {/* Production Supervisor Routes */}
                <Route
                  path="/supervisor/dashboard"
                  element={
                    <RoleProtectedRoute allowedRoles={['production_supervisor', 'admin']}>
                      <SupervisorDashboard />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/supervisor/tasks/new"
                  element={
                    <RoleProtectedRoute allowedRoles={['production_supervisor', 'admin']}>
                      <NewTasks />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/supervisor/tasks"
                  element={
                    <RoleProtectedRoute allowedRoles={['production_supervisor', 'admin']}>
                      <NewTasks />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/supervisor/tasks/wip"
                  element={
                    <RoleProtectedRoute allowedRoles={['production_supervisor', 'admin']}>
                      <NewTasks />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/supervisor/tasks/completed"
                  element={
                    <RoleProtectedRoute allowedRoles={['production_supervisor', 'admin']}>
                      <NewTasks />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/supervisor/issues/report"
                  element={
                    <RoleProtectedRoute allowedRoles={['production_supervisor', 'admin']}>
                      <NewTasks />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/supervisor/reports/summary"
                  element={
                    <RoleProtectedRoute allowedRoles={['production_supervisor', 'admin']}>
                      <NewTasks />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/supervisor/issues"
                  element={
                    <RoleProtectedRoute allowedRoles={['production_supervisor', 'admin']}>
                      <NewTasks />
                    </RoleProtectedRoute>
                  }
                />
                {/* Site Supervisor Routes */}
                <Route
                  path="/site-supervisor/dashboard"
                  element={
                    <RoleProtectedRoute allowedRoles={['site_supervisor', 'admin']}>
                      <SiteSupervisorDashboard />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/site-supervisor/sites"
                  element={
                    <RoleProtectedRoute allowedRoles={['site_supervisor', 'admin']}>
                      <SiteList />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/site-supervisor/flats"
                  element={
                    <RoleProtectedRoute allowedRoles={['site_supervisor', 'admin']}>
                      <SiteList />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/site-supervisor/measurements"
                  element={
                    <RoleProtectedRoute allowedRoles={['site_supervisor', 'admin']}>
                      <SiteList />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/site-supervisor/measurements/create"
                  element={
                    <RoleProtectedRoute allowedRoles={['site_supervisor', 'admin']}>
                      <SiteList />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/site-supervisor/frame-fixing"
                  element={
                    <RoleProtectedRoute allowedRoles={['site_supervisor', 'admin']}>
                      <SiteList />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/site-supervisor/door-fixing"
                  element={
                    <RoleProtectedRoute allowedRoles={['site_supervisor', 'admin']}>
                      <SiteList />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/site-supervisor/daily-progress"
                  element={
                    <RoleProtectedRoute allowedRoles={['site_supervisor', 'admin']}>
                      <SiteList />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/site-supervisor/daily-progress/create"
                  element={
                    <RoleProtectedRoute allowedRoles={['site_supervisor', 'admin']}>
                      <SiteList />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/site-supervisor/issues"
                  element={
                    <RoleProtectedRoute allowedRoles={['site_supervisor', 'admin']}>
                      <SiteList />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/site-supervisor/photos"
                  element={
                    <RoleProtectedRoute allowedRoles={['site_supervisor', 'admin']}>
                      <SiteList />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/site-supervisor/reports"
                  element={
                    <RoleProtectedRoute allowedRoles={['site_supervisor', 'admin']}>
                      <SiteList />
                    </RoleProtectedRoute>
                  }
                />
                {/* Carpenter Captain Routes */}
                <Route
                  path="/carpenter/dashboard"
                  element={
                    <RoleProtectedRoute allowedRoles={['carpenter_captain', 'admin']}>
                      <CarpenterDashboard />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/carpenter/assigned-site"
                  element={
                    <RoleProtectedRoute allowedRoles={['carpenter_captain', 'admin']}>
                      <AssignedSite />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/carpenter/work-allocation"
                  element={
                    <RoleProtectedRoute allowedRoles={['carpenter_captain', 'admin']}>
                      <WorkAllocation />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/carpenter/frame-fixing"
                  element={
                    <RoleProtectedRoute allowedRoles={['carpenter_captain', 'admin']}>
                      <FrameFixing />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/carpenter/door-fixing"
                  element={
                    <RoleProtectedRoute allowedRoles={['carpenter_captain', 'admin']}>
                      <DoorFixing />
                    </RoleProtectedRoute>
                  }
                />
                {/* Measurement Captain Routes */}
                <Route
                  path="/measurement-captain/dashboard"
                  element={
                    <RoleProtectedRoute allowedRoles={['measurement_captain', 'admin']}>
                      <MeasurementCaptainDashboard />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/measurement-captain/tasks"
                  element={
                    <RoleProtectedRoute allowedRoles={['measurement_captain', 'admin']}>
                      <MeasurementTasks />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/measurement-captain/tasks/:status"
                  element={
                    <RoleProtectedRoute allowedRoles={['measurement_captain', 'admin']}>
                      <MeasurementTasks />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/measurement-captain/measurements"
                  element={
                    <RoleProtectedRoute allowedRoles={['measurement_captain', 'admin']}>
                      <MeasurementCaptainMeasurements />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/measurement-captain/measurements/create"
                  element={
                    <RoleProtectedRoute allowedRoles={['measurement_captain', 'admin']}>
                      <CreateMeasurementCaptainMeasurement />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/measurement-captain/history"
                  element={
                    <RoleProtectedRoute allowedRoles={['measurement_captain', 'admin']}>
                      <MeasurementCaptainHistory />
                    </RoleProtectedRoute>
                  }
                />
                {/* Quality Checker Routes */}
                <Route
                  path="/quality-check/dashboard"
                  element={
                    <RoleProtectedRoute allowedRoles={['quality_checker', 'admin']}>
                      <QCDashboard />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/quality-check/pending"
                  element={
                    <RoleProtectedRoute allowedRoles={['quality_checker', 'admin']}>
                      <PendingQC />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/quality-check/perform"
                  element={
                    <RoleProtectedRoute allowedRoles={['quality_checker', 'admin']}>
                      <PerformQC />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/quality-check/history"
                  element={
                    <RoleProtectedRoute allowedRoles={['quality_checker', 'admin']}>
                      <QCHistory />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/quality-check/rework"
                  element={
                    <RoleProtectedRoute allowedRoles={['quality_checker', 'admin']}>
                      <ReworkRejection />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/quality-check/reports"
                  element={
                    <RoleProtectedRoute allowedRoles={['quality_checker', 'admin']}>
                      <QCReports />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/quality-check/certificates"
                  element={
                    <RoleProtectedRoute allowedRoles={['quality_checker', 'admin']}>
                      <QCCertificates />
                    </RoleProtectedRoute>
                  }
                />
                {/* CRM Routes */}
                <Route
                  path="/crm/dashboard"
                  element={
                    <RoleProtectedRoute allowedRoles={['crm_manager', 'admin']}>
                      <CRMDashboard />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/crm/order-360"
                  element={
                    <RoleProtectedRoute allowedRoles={['crm_manager', 'admin']}>
                      <Order360View />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/crm/manufacturing-tracker"
                  element={
                    <RoleProtectedRoute allowedRoles={['crm_manager', 'admin']}>
                      <ManufacturingStageTracker />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/crm/employee-performance"
                  element={
                    <RoleProtectedRoute allowedRoles={['crm_manager', 'admin']}>
                      <EmployeePerformance />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/crm/delivery-planner"
                  element={
                    <RoleProtectedRoute allowedRoles={['crm_manager', 'admin']}>
                      <DeliveryCommitmentPlanner />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/crm/delay-monitor"
                  element={
                    <RoleProtectedRoute allowedRoles={['crm_manager', 'admin']}>
                      <DelayIssueMonitor />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/crm/communication"
                  element={
                    <RoleProtectedRoute allowedRoles={['crm_manager', 'admin']}>
                      <CommunicationUpdates />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/crm/reports"
                  element={
                    <RoleProtectedRoute allowedRoles={['crm_manager', 'admin']}>
                      <ReportsAnalytics />
                    </RoleProtectedRoute>
                  }
                />
                {/* Billing Routes */}
                <Route
                  path="/billing/dashboard"
                  element={
                    <RoleProtectedRoute allowedRoles={['billing_executive', 'accounts_manager', 'dispatch_executive', 'admin']}>
                      <BillingDashboard />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/billing/requests"
                  element={
                    <RoleProtectedRoute allowedRoles={['billing_executive', 'accounts_manager', 'dispatch_executive', 'admin']}>
                      <BillingRequests />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/billing/dc"
                  element={
                    <RoleProtectedRoute allowedRoles={['billing_executive', 'accounts_manager', 'admin']}>
                      <BillingRequests />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/billing/dc/create"
                  element={
                    <RoleProtectedRoute allowedRoles={['billing_executive', 'accounts_manager', 'admin']}>
                      <BillingRequests />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/billing/invoice"
                  element={
                    <RoleProtectedRoute allowedRoles={['billing_executive', 'accounts_manager', 'admin']}>
                      <BillingRequests />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/billing/invoice/create"
                  element={
                    <RoleProtectedRoute allowedRoles={['billing_executive', 'accounts_manager', 'admin']}>
                      <BillingRequests />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/billing/history"
                  element={
                    <RoleProtectedRoute allowedRoles={['billing_executive', 'accounts_manager', 'dispatch_executive', 'admin']}>
                      <BillingRequests />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/billing/tally"
                  element={
                    <RoleProtectedRoute allowedRoles={['billing_executive', 'accounts_manager', 'admin']}>
                      <BillingRequests />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/billing/credit"
                  element={
                    <RoleProtectedRoute allowedRoles={['accounts_manager', 'admin']}>
                      <BillingRequests />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/billing/reports"
                  element={
                    <RoleProtectedRoute allowedRoles={['billing_executive', 'accounts_manager', 'admin']}>
                      <BillingRequests />
                    </RoleProtectedRoute>
                  }
                />
                {/* Accounts Routes */}
                <Route
                  path="/accounts/dashboard"
                  element={
                    <RoleProtectedRoute allowedRoles={['accounts_manager', 'accounts_executive', 'finance_head', 'auditor', 'admin']}>
                      <AccountsDashboard />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/accounts/receivables"
                  element={
                    <RoleProtectedRoute allowedRoles={['accounts_manager', 'accounts_executive', 'finance_head', 'auditor', 'admin']}>
                      <CustomerReceivables />
                    </RoleProtectedRoute>
                  }
                />
                {/* Dispatch Routes */}
                <Route
                  path="/dispatch/dashboard"
                  element={
                    <RoleProtectedRoute allowedRoles={['dispatch_executive', 'dispatch_supervisor', 'logistics_manager', 'admin']}>
                      <DispatchDashboard />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/dispatch/ready"
                  element={
                    <RoleProtectedRoute allowedRoles={['dispatch_executive', 'dispatch_supervisor', 'logistics_manager', 'admin']}>
                      <ReadyForDispatch />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/dispatch/create"
                  element={
                    <RoleProtectedRoute allowedRoles={['dispatch_executive', 'dispatch_supervisor', 'admin']}>
                      <CreateDispatch />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/dispatch/history"
                  element={
                    <RoleProtectedRoute allowedRoles={['dispatch_executive', 'dispatch_supervisor', 'logistics_manager', 'admin']}>
                      <DispatchHistory />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/dispatch/tracking"
                  element={
                    <RoleProtectedRoute allowedRoles={['dispatch_executive', 'dispatch_supervisor', 'logistics_manager', 'admin']}>
                      <DeliveryTracking />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/dispatch/gate-pass"
                  element={
                    <RoleProtectedRoute allowedRoles={['dispatch_executive', 'dispatch_supervisor', 'logistics_manager', 'admin']}>
                      <GatePass />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/dispatch/reports"
                  element={
                    <RoleProtectedRoute allowedRoles={['dispatch_executive', 'dispatch_supervisor', 'admin']}>
                      <DispatchHistory />
                    </RoleProtectedRoute>
                  }
                />
                {/* Logistics Routes */}
                <Route
                  path="/logistics/dashboard"
                  element={
                    <RoleProtectedRoute allowedRoles={['logistics_manager', 'logistics_executive', 'driver', 'admin']}>
                      <LogisticsDashboard />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/logistics/assigned-orders"
                  element={
                    <RoleProtectedRoute allowedRoles={['logistics_manager', 'logistics_executive', 'driver', 'admin']}>
                      <AssignedDispatchOrders />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/logistics/assignment"
                  element={
                    <RoleProtectedRoute allowedRoles={['logistics_manager', 'logistics_executive', 'admin']}>
                      <VehicleDriverAssignment />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/logistics/tracking"
                  element={
                    <RoleProtectedRoute allowedRoles={['logistics_manager', 'logistics_executive', 'driver', 'admin']}>
                      <DeliveryTrackingLogistics />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/logistics/pod"
                  element={
                    <RoleProtectedRoute allowedRoles={['logistics_manager', 'logistics_executive', 'driver', 'admin']}>
                      <ProofOfDelivery />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/logistics/issues"
                  element={
                    <RoleProtectedRoute allowedRoles={['logistics_manager', 'logistics_executive', 'driver', 'admin']}>
                      <DeliveryIssues />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/logistics/reports"
                  element={
                    <RoleProtectedRoute allowedRoles={['logistics_manager', 'logistics_executive', 'driver', 'admin']}>
                      <LogisticsReports />
                    </RoleProtectedRoute>
                  }
                />
                {/* Sales & Marketing Routes */}
                <Route
                  path="/sales/dashboard"
                  element={
                    <RoleProtectedRoute allowedRoles={['marketing_executive', 'sales_executive', 'sales_manager', 'admin']}>
                      <SalesDashboard />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/sales/leads"
                  element={
                    <RoleProtectedRoute allowedRoles={['marketing_executive', 'sales_executive', 'sales_manager', 'admin']}>
                      <Leads />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/sales/leads/create"
                  element={
                    <RoleProtectedRoute allowedRoles={['marketing_executive', 'sales_executive', 'sales_manager', 'admin']}>
                      <CreateLead />
                    </RoleProtectedRoute>
                  }
                />
                {/* Admin Panel Routes */}
                <Route
                  path="/admin"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <Navigate to="/admin/dashboard" replace />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/admin/dashboard"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/admin/analytics"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <AdminAnalytics />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <AdminUserManagement />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/admin/supervisors"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <AdminSupervisorManagement />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/admin/calendar"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <AdminCalendar />
                    </RoleProtectedRoute>
                  }
                />
                {/* Production Sections */}
                <Route
                  path="/admin/production-docs"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <AdminProductionDocsSettings />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/admin/production-scheduler"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <AdminSectionPage
                        title="Production Scheduler"
                        description="Schedule and manage production timelines"
                        icon={CalendarIcon}
                      />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/admin/production-supervisor"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <AdminSectionPage
                        title="Production Supervisor"
                        description="Supervise production operations and teams"
                        icon={Users}
                      />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/admin/measurement-captain"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <AdminSectionPage
                        title="Measurement Captain"
                        description="Manage measurement operations and teams"
                        icon={ClipboardList}
                      />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/admin/carpenter-captain"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <AdminSectionPage
                        title="Carpenter Captain"
                        description="Oversee carpentry operations and teams"
                        icon={Hammer}
                      />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/admin/quality-control"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <AdminSectionPage
                        title="Quality Control"
                        description="Monitor and ensure product quality standards"
                        icon={CheckCircle}
                      />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/admin/laminate-veneer"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <AdminSectionPage
                        title="Laminate & Veneer"
                        description="Manage laminate and veneer operations"
                        icon={Layers}
                      />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/admin/hardware"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <AdminSectionPage
                        title="Hardware"
                        description="Manage hardware inventory and operations"
                        icon={Wrench}
                      />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/admin/material-issuer"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <AdminSectionPage
                        title="Material Issuer To Production"
                        description="Issue and track materials for production"
                        icon={PackageIcon}
                      />
                    </RoleProtectedRoute>
                  }
                />
                {/* Management Sections */}
                <Route
                  path="/admin/operations-manager"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <AdminSectionPage
                        title="Operations Manager"
                        description="Oversee and coordinate overall operations and workflow"
                        icon={Network}
                      />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/admin/sales-marketing"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <AdminSectionPage
                        title="Sales & Marketing"
                        description="Manage sales and marketing activities"
                        icon={TrendingUp}
                      />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/admin/site-supervisor"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <AdminSectionPage
                        title="Site Supervisor"
                        description="Oversee site operations and management"
                        icon={Building2}
                      />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/admin/raw-material-checker"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <AdminSectionPage
                        title="Raw Material Checker"
                        description="Inspect and verify raw materials"
                        icon={CheckCircle}
                      />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/admin/raw-material-stock"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <AdminSectionPage
                        title="Raw Material Stock"
                        description="Manage raw material inventory and stock levels"
                        icon={Boxes}
                      />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/admin/purchase-management"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <AdminSectionPage
                        title="Purchase Management"
                        description="Handle procurement and purchasing operations"
                        icon={ShoppingCart}
                      />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/admin/contractor"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <AdminSectionPage
                        title="Contractor"
                        description="Manage contractor relationships and operations"
                        icon={Briefcase}
                      />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/admin/dispatch-logistics"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <AdminSectionPage
                        title="Dispatch & Logistics"
                        description="Coordinate dispatch and logistics operations"
                        icon={Truck}
                      />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/admin/accounts"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <AdminSectionPage
                        title="Accounts"
                        description="Manage financial accounts and transactions"
                        icon={DollarSign}
                      />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/admin/maintenance-captain"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <AdminSectionPage
                        title="Maintenance Captain"
                        description="Oversee maintenance operations and schedules"
                        icon={Settings}
                      />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/admin/security"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <AdminSectionPage
                        title="Security"
                        description="Manage security operations and access control"
                        icon={Lock}
                      />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/admin/hr"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <AdminSectionPage
                        title="HR"
                        description="Manage human resources and employee relations"
                        icon={UserCog}
                      />
                    </RoleProtectedRoute>
                  }
                />
                {/* Purchase Management Routes */}
                <Route
                  path="/purchase/dashboard"
                  element={
                    <RoleProtectedRoute allowedRoles={['purchase_executive', 'purchase_manager', 'store_incharge', 'admin']}>
                      <PurchaseDashboard />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/purchase/pr"
                  element={
                    <RoleProtectedRoute allowedRoles={['purchase_executive', 'purchase_manager', 'store_incharge', 'admin']}>
                      <PurchaseRequisitions />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/purchase/pr/create"
                  element={
                    <RoleProtectedRoute allowedRoles={['purchase_executive', 'purchase_manager', 'admin']}>
                      <PurchaseRequisitions />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/purchase/pr/pending"
                  element={
                    <RoleProtectedRoute allowedRoles={['purchase_executive', 'purchase_manager', 'store_incharge', 'admin']}>
                      <PurchaseRequisitions />
                    </RoleProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </UndoRedoProvider>
        </SidebarProvider>
      </AuthProvider>
    </Router>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return currentUser ? children : <Navigate to="/login" />;
}

function RoleProtectedRoute({
  children,
  allowedRoles
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
          <a
            href="/dashboard"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default App;
