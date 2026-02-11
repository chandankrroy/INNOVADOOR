import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import LogisticsSidebar from '../../components/LogisticsSidebar';
import LogisticsNavbar from '../../components/LogisticsNavbar';
import { api } from '../../lib/api';
import { 
  Package, 
  Truck,
  AlertCircle,
  CheckCircle2,
  Wrench,
  ArrowRight,
  Activity,
  MapPin,
  Clock
} from 'lucide-react';

interface LogisticsStats {
  orders_assigned_today: number;
  in_transit: number;
  delivered_today: number;
  delayed_deliveries: number;
  vehicle_availability: number;
  total_vehicles: number;
}

export default function LogisticsDashboard() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const [stats, setStats] = useState<LogisticsStats>({
    orders_assigned_today: 0,
    in_transit: 0,
    delivered_today: 0,
    delayed_deliveries: 0,
    vehicle_availability: 0,
    total_vehicles: 0,
  });
  const [loading, setLoading] = useState(true);
  const [liveDeliveries, setLiveDeliveries] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const logisticsRoles = ['logistics_manager', 'logistics_executive', 'driver', 'admin'];
      if (currentUser && logisticsRoles.includes(currentUser.role)) {
        try {
          setLoading(true);
          const [statsData, deliveries] = await Promise.all([
            api.get('/logistics/dashboard/stats').catch(() => ({})),
            api.get('/logistics/dashboard/live-deliveries?limit=10').catch(() => []),
          ]);
          
          setStats({
            orders_assigned_today: statsData.orders_assigned_today || 0,
            in_transit: statsData.in_transit || 0,
            delivered_today: statsData.delivered_today || 0,
            delayed_deliveries: statsData.delayed_deliveries || 0,
            vehicle_availability: statsData.vehicle_availability || 0,
            total_vehicles: statsData.total_vehicles || 0,
          });
          
          setLiveDeliveries(Array.isArray(deliveries) ? deliveries : []);
        } catch (error) {
          console.error('Error fetching logistics stats:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchStats();
  }, [currentUser]);

  // Only show for logistics roles
  if (!currentUser || !['logistics_manager', 'logistics_executive', 'driver', 'admin'].includes(currentUser.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LogisticsNavbar />
      <LogisticsSidebar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-[65px]`}>
        <main className="p-8">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Logistics Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome back, <span className="font-semibold">{currentUser?.username}</span>! View your logistics overview</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
            {/* Orders Assigned Today */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <Package className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Orders Assigned Today</p>
              {loading ? (
                <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <p className="text-3xl font-bold text-gray-900">{stats.orders_assigned_today}</p>
              )}
              <Link 
                to="/logistics/assigned-orders" 
                className="mt-4 flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            {/* In Transit */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <Truck className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">In Transit</p>
              {loading ? (
                <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <p className="text-3xl font-bold text-gray-900">{stats.in_transit}</p>
              )}
              <Link 
                to="/logistics/tracking?status=in_transit" 
                className="mt-4 flex items-center text-sm font-medium text-purple-600 hover:text-purple-700"
              >
                Track <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            {/* Delivered Today */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Delivered Today</p>
              {loading ? (
                <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <p className="text-3xl font-bold text-gray-900">{stats.delivered_today}</p>
              )}
              <Link 
                to="/logistics/tracking?status=delivered" 
                className="mt-4 flex items-center text-sm font-medium text-green-600 hover:text-green-700"
              >
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            {/* Delayed Deliveries */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Delayed Deliveries</p>
              {loading ? (
                <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <p className="text-3xl font-bold text-gray-900">{stats.delayed_deliveries}</p>
              )}
              <Link 
                to="/logistics/issues?issue_type=delivery_delay" 
                className="mt-4 flex items-center text-sm font-medium text-red-600 hover:text-red-700"
              >
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            {/* Vehicle Availability */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <Wrench className="w-8 h-8 text-amber-600" />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Vehicle Availability</p>
              {loading ? (
                <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <p className="text-3xl font-bold text-gray-900">
                  {stats.vehicle_availability}/{stats.total_vehicles}
                </p>
              )}
              <Link 
                to="/logistics/assignment" 
                className="mt-4 flex items-center text-sm font-medium text-amber-600 hover:text-amber-700"
              >
                Manage <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>

          {/* Live Delivery Board */}
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Live Delivery Board</h2>
              <Link
                to="/logistics/tracking"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all →
              </Link>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-200 animate-pulse rounded"></div>
                  ))}
                </div>
              ) : liveDeliveries.length === 0 ? (
                <div className="text-center py-8">
                  <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No active deliveries</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dispatch No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ETA</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {liveDeliveries.map((delivery, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{delivery.dispatch_number}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{delivery.party_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{delivery.vehicle_no}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{delivery.driver_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              delivery.status === 'in_transit' 
                                ? 'bg-purple-100 text-purple-800' 
                                : delivery.status === 'delivered'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {delivery.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {delivery.planned_delivery_date 
                              ? new Date(delivery.planned_delivery_date).toLocaleDateString()
                              : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
