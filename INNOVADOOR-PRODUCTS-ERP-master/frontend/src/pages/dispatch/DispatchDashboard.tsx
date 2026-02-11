import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import DispatchSidebar from '../../components/DispatchSidebar';
import Navbar from '../../components/Navbar';
import { api } from '../../lib/api';
import { 
  Package, 
  Truck,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Activity,
  MapPin
} from 'lucide-react';

interface DispatchStats {
  ready_for_dispatch: number;
  dispatch_pending: number;
  dispatched_today: number;
  pending_delivery: number;
  delivery_delayed: number;
}

export default function DispatchDashboard() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const [stats, setStats] = useState<DispatchStats>({
    ready_for_dispatch: 0,
    dispatch_pending: 0,
    dispatched_today: 0,
    pending_delivery: 0,
    delivery_delayed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [readyList, setReadyList] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const dispatchRoles = ['dispatch_executive', 'dispatch_supervisor', 'logistics_manager', 'admin'];
      if (currentUser && dispatchRoles.includes(currentUser.role)) {
        try {
          setLoading(true);
          const [statsData, ready] = await Promise.all([
            api.get('/dispatch/dashboard/stats').catch(() => ({})),
            api.get('/dispatch/ready-for-dispatch?limit=5').catch(() => []),
          ]);
          
          setStats({
            ready_for_dispatch: statsData.ready_for_dispatch || 0,
            dispatch_pending: statsData.dispatch_pending || 0,
            dispatched_today: statsData.dispatched_today || 0,
            pending_delivery: statsData.pending_delivery || 0,
            delivery_delayed: statsData.delivery_delayed || 0,
          });
          
          setReadyList(Array.isArray(ready) ? ready : []);
        } catch (error) {
          console.error('Error fetching dispatch stats:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchStats();
  }, [currentUser]);

  // Only show for dispatch roles
  if (!currentUser || !['dispatch_executive', 'dispatch_supervisor', 'logistics_manager', 'admin'].includes(currentUser.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      <DispatchSidebar />
      <Navbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-6 lg:p-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                  Dispatch Dashboard
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

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
            {/* Ready for Dispatch */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div className="px-2 py-1 bg-green-50 rounded-md">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Ready for Dispatch</p>
                  {loading ? (
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">{stats.ready_for_dispatch}</p>
                  )}
                </div>
                <Link 
                  to="/dispatch/ready" 
                  className="mt-4 flex items-center text-sm font-medium text-green-600 hover:text-green-700 group-hover:translate-x-1 transition-transform"
                >
                  View all <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>

            {/* Dispatch Pending */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div className="px-2 py-1 bg-yellow-50 rounded-md">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Dispatch Pending</p>
                  {loading ? (
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">{stats.dispatch_pending}</p>
                  )}
                </div>
                <Link 
                  to="/dispatch/history?status=draft" 
                  className="mt-4 flex items-center text-sm font-medium text-yellow-600 hover:text-yellow-700 group-hover:translate-x-1 transition-transform"
                >
                  View all <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>

            {/* Dispatched Today */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                    <Truck className="w-6 h-6 text-white" />
                  </div>
                  <div className="px-2 py-1 bg-blue-50 rounded-md">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Dispatched Today</p>
                  {loading ? (
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">{stats.dispatched_today}</p>
                  )}
                </div>
                <Link 
                  to="/dispatch/history?status=dispatched" 
                  className="mt-4 flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 group-hover:translate-x-1 transition-transform"
                >
                  View all <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>

            {/* Pending Delivery */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div className="px-2 py-1 bg-purple-50 rounded-md">
                    <Clock className="w-4 h-4 text-purple-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Pending Delivery</p>
                  {loading ? (
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">{stats.pending_delivery}</p>
                  )}
                </div>
                <Link 
                  to="/dispatch/tracking" 
                  className="mt-4 flex items-center text-sm font-medium text-purple-600 hover:text-purple-700 group-hover:translate-x-1 transition-transform"
                >
                  Track <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>

            {/* Delivery Delayed */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="px-2 py-1 bg-red-50 rounded-md">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Delivery Delayed</p>
                  {loading ? (
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">{stats.delivery_delayed}</p>
                  )}
                </div>
                <Link 
                  to="/dispatch/tracking?status=delayed" 
                  className="mt-4 flex items-center text-sm font-medium text-red-600 hover:text-red-700 group-hover:translate-x-1 transition-transform"
                >
                  View all <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>

          {/* Ready List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Package className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Ready for Dispatch</h2>
                </div>
                <Link
                  to="/dispatch/ready"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all →
                </Link>
              </div>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-200 animate-pulse rounded"></div>
                  ))}
                </div>
              ) : readyList.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No items ready for dispatch</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Production Paper</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Party</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">DC No</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Invoice No</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {readyList.map((item) => (
                        <tr key={item.production_paper_id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm text-gray-900 font-medium">{item.production_paper_number}</td>
                          <td className="py-3 px-4 text-sm text-gray-700">{item.party_name}</td>
                          <td className="py-3 px-4 text-sm text-gray-700">{item.dc_number || '-'}</td>
                          <td className="py-3 px-4 text-sm text-gray-700">{item.invoice_number || '-'}</td>
                          <td className="py-3 px-4 text-right">
                            <Link
                              to={`/dispatch/create?production_paper_id=${item.production_paper_id}`}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              Create Dispatch →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              to="/dispatch/ready"
              className="group relative p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-500 hover:bg-gradient-to-br hover:from-green-50 hover:to-green-100/50 transition-all duration-300 text-center block transform hover:scale-[1.02] hover:shadow-lg"
            >
              <div className="flex flex-col items-center">
                <div className="p-4 bg-green-100 rounded-xl mb-3 group-hover:bg-green-200 transition-colors">
                  <Package className="w-8 h-8 text-green-600" />
                </div>
                <p className="font-semibold text-gray-900 mb-1">Ready for Dispatch</p>
                <p className="text-sm text-gray-500">View QC + Billing approved items</p>
              </div>
            </Link>
            
            <Link
              to="/dispatch/create"
              className="group relative p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100/50 transition-all duration-300 text-center block transform hover:scale-[1.02] hover:shadow-lg"
            >
              <div className="flex flex-col items-center">
                <div className="p-4 bg-blue-100 rounded-xl mb-3 group-hover:bg-blue-200 transition-colors">
                  <Truck className="w-8 h-8 text-blue-600" />
                </div>
                <p className="font-semibold text-gray-900 mb-1">Create Dispatch</p>
                <p className="text-sm text-gray-500">Create new dispatch record</p>
              </div>
            </Link>
            
            <Link
              to="/dispatch/tracking"
              className="group relative p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-500 hover:bg-gradient-to-br hover:from-purple-50 hover:to-purple-100/50 transition-all duration-300 text-center block transform hover:scale-[1.02] hover:shadow-lg"
            >
              <div className="flex flex-col items-center">
                <div className="p-4 bg-purple-100 rounded-xl mb-3 group-hover:bg-purple-200 transition-colors">
                  <MapPin className="w-8 h-8 text-purple-600" />
                </div>
                <p className="font-semibold text-gray-900 mb-1">Delivery Tracking</p>
                <p className="text-sm text-gray-500">Track delivery status</p>
              </div>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}

