import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import CRMSidebar from '../../components/CRMSidebar';
import CRMNavbar from '../../components/CRMNavbar';
import { api } from '../../lib/api';
import { 
  AlertCircle, 
  AlertTriangle,
  CheckCircle2,
  Package,
  Truck,
  Factory,
  Activity,
  ArrowRight,
  TrendingUp,
  Eye,
  Clock
} from 'lucide-react';

interface DashboardStats {
  ordersDelayed: number;
  ordersAtRisk: number;
  onTimeOrders: number;
  doorsInProduction: number;
  framesInProduction: number;
  readyForDispatch: number;
  dispatchedToday: number;
}

interface OrderStatus {
  id: number;
  production_paper: string;
  party: string;
  product: string;
  stage: string;
  supervisor: string;
  percentComplete: number;
  eta: string;
  riskLevel: 'green' | 'yellow' | 'red';
}

export default function CRMDashboard() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    ordersDelayed: 0,
    ordersAtRisk: 0,
    onTimeOrders: 0,
    doorsInProduction: 0,
    framesInProduction: 0,
    readyForDispatch: 0,
    dispatchedToday: 0,
  });
  const [orders, setOrders] = useState<OrderStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (currentUser?.role === 'crm_manager') {
        try {
          setLoading(true);
          // Fetch production papers and calculate stats
          const [papers, tracking] = await Promise.all([
            api.get('/production/production-papers').catch(() => []),
            api.get('/production/tracking').catch(() => []),
          ]);
          
          const papersList = Array.isArray(papers) ? papers : [];
          const trackingList = Array.isArray(tracking) ? tracking : [];
          
          // Calculate stats
          const delayed = papersList.filter((p: any) => {
            if (!p.expected_dispatch_date) return false;
            const dispatchDate = new Date(p.expected_dispatch_date);
            const today = new Date();
            return dispatchDate < today && p.status !== 'dispatched' && p.status !== 'delivered';
          }).length;
          
          const atRisk = papersList.filter((p: any) => {
            if (!p.expected_dispatch_date) return false;
            const dispatchDate = new Date(p.expected_dispatch_date);
            const today = new Date();
            const daysDiff = Math.ceil((dispatchDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return daysDiff <= 3 && daysDiff > 0 && p.status !== 'dispatched';
          }).length;
          
          const onTime = papersList.filter((p: any) => {
            if (!p.expected_dispatch_date) return false;
            const dispatchDate = new Date(p.expected_dispatch_date);
            const today = new Date();
            const daysDiff = Math.ceil((dispatchDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return daysDiff > 3 || p.status === 'dispatched';
          }).length;
          
          const doors = papersList.filter((p: any) => 
            p.product_category === 'Door' && 
            ['active', 'in_production'].includes(p.status)
          ).length;
          
          const frames = papersList.filter((p: any) => 
            p.product_category === 'Frame' && 
            ['active', 'in_production'].includes(p.status)
          ).length;
          
          const ready = papersList.filter((p: any) => 
            p.status === 'ready_for_dispatch'
          ).length;
          
          const dispatched = papersList.filter((p: any) => {
            if (!p.updated_at) return false;
            const updateDate = new Date(p.updated_at);
            const today = new Date();
            return p.status === 'dispatched' && 
                   updateDate.toDateString() === today.toDateString();
          }).length;
          
          setStats({
            ordersDelayed: delayed,
            ordersAtRisk: atRisk,
            onTimeOrders: onTime,
            doorsInProduction: doors,
            framesInProduction: frames,
            readyForDispatch: ready,
            dispatchedToday: dispatched,
          });
          
          // Build order status list
          const orderStatusList: OrderStatus[] = papersList.slice(0, 20).map((paper: any) => {
            const currentTracking = trackingList.find((t: any) => 
              t.production_paper_id === paper.id && t.status === 'In Progress'
            );
            
            let percentComplete = 0;
            let currentStage = 'Not Started';
            let supervisor = 'N/A';
            
            if (currentTracking) {
              percentComplete = Math.min(95, (currentTracking.stage_sequence / 8) * 100);
              currentStage = currentTracking.stage_name;
              supervisor = currentTracking.supervisor_name || 'N/A';
            }
            
            let riskLevel: 'green' | 'yellow' | 'red' = 'green';
            if (paper.expected_dispatch_date) {
              const dispatchDate = new Date(paper.expected_dispatch_date);
              const today = new Date();
              const daysDiff = Math.ceil((dispatchDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              if (daysDiff < 0) riskLevel = 'red';
              else if (daysDiff <= 3) riskLevel = 'yellow';
            }
            
            return {
              id: paper.id,
              production_paper: paper.paper_number || `PP-${paper.id}`,
              party: paper.party_name || 'N/A',
              product: paper.product_type || paper.product_category || 'N/A',
              stage: currentStage,
              supervisor: supervisor,
              percentComplete: percentComplete,
              eta: paper.expected_dispatch_date 
                ? new Date(paper.expected_dispatch_date).toLocaleDateString()
                : 'N/A',
              riskLevel: riskLevel,
            };
          });
          
          setOrders(orderStatusList);
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();
  }, [currentUser?.role]);

  if (currentUser?.role !== 'crm_manager') {
    return null;
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'red': return 'bg-red-100 text-red-800 border-red-200';
      case 'yellow': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/20">
      <CRMSidebar />
      <CRMNavbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-6 lg:p-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
                  CRM Dashboard
                </h1>
                <p className="text-gray-600 mt-2 text-lg">
                  Welcome back, <span className="font-semibold text-gray-900">{currentUser?.username}</span>! 👋
                </p>
                <p className="text-sm text-gray-500 mt-1">360° Order & Production Visibility</p>
              </div>
              <div className="hidden md:flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
                <Activity className="w-4 h-4 text-indigo-500" />
                <span className="text-sm text-gray-600">All systems operational</span>
              </div>
            </div>
          </div>

          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Orders Delayed */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-5 relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
                    <AlertCircle className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Orders Delayed</p>
                  {loading ? (
                    <div className="h-7 w-16 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{stats.ordersDelayed}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Orders At Risk */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-5 relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl shadow-lg">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Orders At Risk</p>
                  {loading ? (
                    <div className="h-7 w-16 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{stats.ordersAtRisk}</p>
                  )}
                </div>
              </div>
            </div>

            {/* On-Time Orders */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-5 relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">On-Time Orders</p>
                  {loading ? (
                    <div className="h-7 w-16 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{stats.onTimeOrders}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Ready for Dispatch */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-5 relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Ready for Dispatch</p>
                  {loading ? (
                    <div className="h-7 w-16 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{stats.readyForDispatch}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Second Row KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {/* Doors In Production */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-5 relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
                    <Factory className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">🚪 Doors In Production</p>
                  {loading ? (
                    <div className="h-7 w-16 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{stats.doorsInProduction}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Frames In Production */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-5 relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl shadow-lg">
                    <Factory className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">🪟 Frames In Production</p>
                  {loading ? (
                    <div className="h-7 w-16 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{stats.framesInProduction}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Dispatched Today */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-5 relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl shadow-lg">
                    <Truck className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">🚚 Dispatched Today</p>
                  {loading ? (
                    <div className="h-7 w-16 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{stats.dispatchedToday}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="group bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-indigo-100 overflow-hidden relative">
              <div className="p-5 relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-2">Quick Actions</p>
                  <Link 
                    to="/crm/order-360" 
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center"
                  >
                    View Order 360° <ArrowRight className="w-3 h-3 ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Live Order Status Board */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Activity className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Live Order Status Board</h2>
                </div>
                <span className="text-sm text-gray-500">Click any row to view details</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Production Paper</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supervisor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Complete</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ETA</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                        No orders found
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr 
                        key={order.id} 
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/crm/order-360?id=${order.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.production_paper}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {order.party}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {order.product}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {order.stage}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {order.supervisor}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  order.riskLevel === 'red' ? 'bg-red-500' :
                                  order.riskLevel === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${order.percentComplete}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">{order.percentComplete}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {order.eta}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRiskColor(order.riskLevel)}`}>
                            {order.riskLevel === 'red' ? 'Delayed' : order.riskLevel === 'yellow' ? 'At Risk' : 'On Track'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

