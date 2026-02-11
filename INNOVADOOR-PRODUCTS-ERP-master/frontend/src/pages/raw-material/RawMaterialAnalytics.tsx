import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import RawMaterialSidebar from '../../components/RawMaterialSidebar';
import RawMaterialNavbar from '../../components/RawMaterialNavbar';
import { api } from '../../lib/api';
import { BarChart3, TrendingUp, Package, ShoppingCart } from 'lucide-react';

export default function RawMaterialAnalytics() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>({});

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (currentUser?.role === 'raw_material_checker') {
        try {
          setLoading(true);
          // Fetch analytics data
          const [checks, orders] = await Promise.all([
            api.get('/raw-material/raw-material-checks', true).catch(() => []),
            api.get('/raw-material/orders', true).catch(() => []),
          ]);
          
          const checksData = Array.isArray(checks) ? checks : [];
          const ordersData = Array.isArray(orders) ? orders : [];
          
          // Calculate analytics
          const statusCounts = {
            pending: checksData.filter((c: any) => c.status === 'pending').length,
            work_in_progress: checksData.filter((c: any) => c.status === 'work_in_progress').length,
            approved: checksData.filter((c: any) => c.status === 'approved').length,
          };
          
          const orderStatusCounts = {
            pending: ordersData.filter((o: any) => o.status === 'pending').length,
            ordered: ordersData.filter((o: any) => o.status === 'ordered').length,
            completed: ordersData.filter((o: any) => o.status === 'completed').length,
          };
          
          setAnalytics({
            checks: statusCounts,
            orders: orderStatusCounts,
            totalChecks: checksData.length,
            totalOrders: ordersData.length,
          });
        } catch (error) {
          console.error('Error fetching analytics:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchAnalytics();
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
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
              Analytics
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Detailed analytics and insights</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Checks Analytics */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Raw Material Checks</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Checks</span>
                    <span className="text-2xl font-bold text-gray-900">{analytics.totalChecks || 0}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pending</span>
                      <span className="font-semibold text-amber-600">{analytics.checks?.pending || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Work In Progress</span>
                      <span className="font-semibold text-blue-600">{analytics.checks?.work_in_progress || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Approved</span>
                      <span className="font-semibold text-green-600">{analytics.checks?.approved || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Orders Analytics */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <ShoppingCart className="w-6 h-6 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Orders</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Orders</span>
                    <span className="text-2xl font-bold text-gray-900">{analytics.totalOrders || 0}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pending</span>
                      <span className="font-semibold text-amber-600">{analytics.orders?.pending || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ordered</span>
                      <span className="font-semibold text-blue-600">{analytics.orders?.ordered || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Completed</span>
                      <span className="font-semibold text-green-600">{analytics.orders?.completed || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

