import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import ProductionSchedulerSidebar from '../../components/ProductionSchedulerSidebar';
import ProductionSchedulerNavbar from '../../components/ProductionSchedulerNavbar';
import { api } from '../../lib/api';
import { 
  AlertCircle, 
  Clock, 
  Package, 
  Factory, 
  Truck,
  Calendar,
  ArrowRight,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface DashboardStats {
  urgent_orders_pending: number;
  regular_orders_pending: number;
  sample_orders: number;
  orders_in_production: number;
  ready_for_dispatch: number;
  today_scheduled_count: number;
}

interface PendingOrder {
  production_paper_id: number;
  paper_number: string;
  party_name: string | null;
  product_type: string;
  order_type: string;
  quantity: number;
  expected_dispatch_date: string | null;
  raw_material_status: string;
  material_checks: {
    measurement_received: boolean;
    production_paper_approved: boolean;
    shutter_available: boolean;
    laminate_available: boolean;
    frame_material_available: boolean;
  };
}

interface TodayScheduled {
  id: number;
  supervisor: string | null;
  department: string;
  product_type: string;
  stage: string;
  quantity: number;
  status: string;
}

export default function SchedulerDashboard() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const [stats, setStats] = useState<DashboardStats>({
    urgent_orders_pending: 0,
    regular_orders_pending: 0,
    sample_orders: 0,
    orders_in_production: 0,
    ready_for_dispatch: 0,
    today_scheduled_count: 0,
  });
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [todayScheduled, setTodayScheduled] = useState<TodayScheduled[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (currentUser?.role === 'production_scheduler') {
        try {
          setLoading(true);
          const [statsData, pendingData, todayData] = await Promise.all([
            api.get('/scheduler/dashboard/stats', true),
            api.get('/scheduler/pending-for-scheduling', true).catch(() => []),
            api.get('/scheduler/dashboard/today-scheduled', true).catch(() => []),
          ]);
          
          setStats(statsData);
          setPendingOrders(Array.isArray(pendingData) ? pendingData : []);
          setTodayScheduled(Array.isArray(todayData) ? todayData : []);
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [currentUser?.role]);

  if (currentUser?.role !== 'production_scheduler') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      <ProductionSchedulerSidebar />
      <ProductionSchedulerNavbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-6 lg:p-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                  Production Scheduler Dashboard
                </h1>
                <p className="text-gray-600 mt-2 text-lg">
                  Welcome back, <span className="font-semibold text-gray-900">{currentUser?.username}</span>! 👋
                </p>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            {/* Urgent Orders Pending */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-red-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Urgent Orders Pending</p>
                  {loading ? (
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">{stats.urgent_orders_pending}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Regular Orders Pending */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-yellow-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Regular Orders Pending</p>
                  {loading ? (
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">{stats.regular_orders_pending}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Sample Orders */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-blue-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Sample Orders</p>
                  {loading ? (
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">{stats.sample_orders}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Orders In Production */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-indigo-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg">
                    <Factory className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Orders In Production</p>
                  {loading ? (
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">{stats.orders_in_production}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Ready for Dispatch */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-green-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                    <Truck className="w-6 h-6 text-white" />
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
              </div>
            </div>
          </div>

          {/* Tables Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending for Scheduling */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Clock className="w-5 h-5 text-red-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Pending for Scheduling</h2>
                  </div>
                  <Link
                    to="/scheduler/schedule"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Schedule Now →
                  </Link>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paper No</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Party</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          Loading...
                        </td>
                      </tr>
                    ) : pendingOrders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          No pending orders
                        </td>
                      </tr>
                    ) : (
                      pendingOrders.slice(0, 5).map((order) => (
                        <tr key={order.production_paper_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{order.paper_number}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{order.party_name || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              order.order_type === 'Urgent' ? 'bg-red-100 text-red-800' :
                              order.order_type === 'Sample' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {order.order_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {order.raw_material_status === 'Available' ? (
                              <span className="flex items-center text-green-600">
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Available
                              </span>
                            ) : (
                              <span className="flex items-center text-red-600">
                                <XCircle className="w-4 h-4 mr-1" />
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Link
                              to={`/scheduler/schedule?paper_id=${order.production_paper_id}`}
                              className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Schedule
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Today's Scheduled Production */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Today's Scheduled Production</h2>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supervisor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          Loading...
                        </td>
                      </tr>
                    ) : todayScheduled.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          No production scheduled for today
                        </td>
                      </tr>
                    ) : (
                      todayScheduled.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{item.supervisor || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.department}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.product_type}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.stage}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.status === 'In Production' ? 'bg-green-100 text-green-800' :
                              item.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}










