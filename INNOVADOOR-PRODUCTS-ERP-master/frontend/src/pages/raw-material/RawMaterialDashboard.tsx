import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import RawMaterialSidebar from '../../components/RawMaterialSidebar';
import RawMaterialNavbar from '../../components/RawMaterialNavbar';
import { api } from '../../lib/api';
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  ShoppingCart, 
  Truck,
  Building2,
  TrendingUp,
  ArrowRight,
  Activity,
  BarChart3
} from 'lucide-react';

interface DashboardStats {
  orderStatusPending: number;
  orderStatusIssued: number;
  orderStatusProgress: number;
  orderStatusReceived: number;
  pendingOrders: number;
  completedOrders: number;
  suppliers: number;
}

export default function RawMaterialDashboard() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const [stats, setStats] = useState<DashboardStats>({
    orderStatusPending: 0,
    orderStatusIssued: 0,
    orderStatusProgress: 0,
    orderStatusReceived: 0,
    pendingOrders: 0,
    completedOrders: 0,
    suppliers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (currentUser?.role === 'raw_material_checker') {
        try {
          setLoading(true);
          const [pendingPapers, issuedPapers, progressPapers, receivedPapers, pendingOrders, completedOrders, suppliers] = await Promise.all([
            api.get('/production/production-papers?raw_material_order_status=pending&limit=500', true).catch(() => []),
            api.get('/production/production-papers?raw_material_order_status=issued&limit=500', true).catch(() => []),
            api.get('/production/production-papers?raw_material_order_status=progress&limit=500', true).catch(() => []),
            api.get('/production/production-papers?raw_material_order_status=received&limit=500', true).catch(() => []),
            api.get('/raw-material/orders?status=pending', true).catch(() => []),
            api.get('/raw-material/orders/completed', true).catch(() => []),
            api.get('/raw-material/suppliers', true).catch(() => []),
          ]);
          
          setStats({
            orderStatusPending: Array.isArray(pendingPapers) ? pendingPapers.length : 0,
            orderStatusIssued: Array.isArray(issuedPapers) ? issuedPapers.length : 0,
            orderStatusProgress: Array.isArray(progressPapers) ? progressPapers.length : 0,
            orderStatusReceived: Array.isArray(receivedPapers) ? receivedPapers.length : 0,
            pendingOrders: Array.isArray(pendingOrders) ? pendingOrders.length : 0,
            completedOrders: Array.isArray(completedOrders) ? completedOrders.length : 0,
            suppliers: Array.isArray(suppliers) ? suppliers.length : 0,
          });
        } catch (error) {
          console.error('Error fetching dashboard stats:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchStats();
  }, [currentUser?.role]);

  if (currentUser?.role !== 'raw_material_checker') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      <RawMaterialSidebar />
      <RawMaterialNavbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-6 lg:p-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-gray-600 mt-2 text-lg">
                  Welcome back, <span className="font-semibold text-gray-900">{currentUser?.username}</span>! 👋
                </p>
              </div>
              <div className="hidden md:flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
                <Activity className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">All systems operational</span>
              </div>
            </div>
          </div>

          {/* Stats Cards - Raw Material Order Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Pending Orders Card */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div className="px-2 py-1 bg-amber-50 rounded-md">
                    <TrendingUp className="w-4 h-4 text-amber-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Pending Orders</p>
                  {loading ? (
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">{stats.orderStatusPending}</p>
                  )}
                </div>
                <Link 
                  to="/raw-material/checks/pending" 
                  className="mt-4 flex items-center text-sm font-medium text-amber-600 hover:text-amber-700 group-hover:translate-x-1 transition-transform"
                >
                  View all <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>

            {/* Work In Progress Card */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div className="px-2 py-1 bg-blue-50 rounded-md">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Order Issued</p>
                  {loading ? (
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">{stats.orderStatusIssued}</p>
                  )}
                </div>
                <Link 
                  to="/raw-material/checks/issued" 
                  className="mt-4 flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 group-hover:translate-x-1 transition-transform"
                >
                  View all <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>

            {/* Order In Progress Card */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div className="px-2 py-1 bg-indigo-50 rounded-md">
                    <Activity className="w-4 h-4 text-indigo-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Order In Progress</p>
                  {loading ? (
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">{stats.orderStatusProgress}</p>
                  )}
                </div>
                <Link 
                  to="/raw-material/checks/progress" 
                  className="mt-4 flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700 group-hover:translate-x-1 transition-transform"
                >
                  View all <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>

            {/* Order Received Card */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="px-2 py-1 bg-green-50 rounded-md">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Order Received</p>
                  {loading ? (
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">{stats.orderStatusReceived}</p>
                  )}
                </div>
                <Link 
                  to="/raw-material/checks/received" 
                  className="mt-4 flex items-center text-sm font-medium text-green-600 hover:text-green-700 group-hover:translate-x-1 transition-transform"
                >
                  View all <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>

          {/* Second Row Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Pending Orders Card */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
                    <ShoppingCart className="w-6 h-6 text-white" />
                  </div>
                  <div className="px-2 py-1 bg-purple-50 rounded-md">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Pending Orders</p>
                  {loading ? (
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">{stats.pendingOrders}</p>
                  )}
                </div>
                <Link 
                  to="/raw-material/orders" 
                  className="mt-4 flex items-center text-sm font-medium text-purple-600 hover:text-purple-700 group-hover:translate-x-1 transition-transform"
                >
                  View all <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>

            {/* Completed Orders Card */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                    <Truck className="w-6 h-6 text-white" />
                  </div>
                  <div className="px-2 py-1 bg-green-50 rounded-md">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Completed Orders</p>
                  {loading ? (
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">{stats.completedOrders}</p>
                  )}
                </div>
                <Link 
                  to="/raw-material/orders/completed" 
                  className="mt-4 flex items-center text-sm font-medium text-green-600 hover:text-green-700 group-hover:translate-x-1 transition-transform"
                >
                  View all <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>

            {/* Suppliers Card */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="px-2 py-1 bg-indigo-50 rounded-md">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Suppliers</p>
                  {loading ? (
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">{stats.suppliers}</p>
                  )}
                </div>
                <Link 
                  to="/raw-material/suppliers" 
                  className="mt-4 flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700 group-hover:translate-x-1 transition-transform"
                >
                  View all <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Actions Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
                </div>
                <span className="text-sm text-gray-500">Get started quickly</span>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Link
                  to="/raw-material/analytics"
                  className="group relative p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100/50 transition-all duration-300 text-center block transform hover:scale-[1.02] hover:shadow-lg"
                >
                  <div className="flex flex-col items-center">
                    <div className="p-4 bg-blue-100 rounded-xl mb-3 group-hover:bg-blue-200 transition-colors">
                      <BarChart3 className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="font-semibold text-gray-900 mb-1">Analytics</p>
                    <p className="text-sm text-gray-500">View detailed analytics</p>
                  </div>
                </Link>
                
                <Link
                  to="/raw-material/calendar"
                  className="group relative p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-500 hover:bg-gradient-to-br hover:from-purple-50 hover:to-purple-100/50 transition-all duration-300 text-center block transform hover:scale-[1.02] hover:shadow-lg"
                >
                  <div className="flex flex-col items-center">
                    <div className="p-4 bg-purple-100 rounded-xl mb-3 group-hover:bg-purple-200 transition-colors">
                      <Activity className="w-8 h-8 text-purple-600" />
                    </div>
                    <p className="font-semibold text-gray-900 mb-1">Calendar</p>
                    <p className="text-sm text-gray-500">View calendar events</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

