import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import SalesSidebar from '../../components/SalesSidebar';
import SalesNavbar from '../../components/SalesNavbar';
import { api } from '../../lib/api';
import { 
  UserPlus, 
  TrendingUp, 
  ShoppingCart, 
  Ruler,
  DollarSign,
  ArrowRight,
  Percent,
  Activity
} from 'lucide-react';

interface SalesDashboardStats {
  new_leads: number;
  active_opportunities: number;
  orders_confirmed: number;
  measurement_pending: number;
  sales_value_mtd: number;
  lead_conversion_rate: number;
}

export default function SalesDashboard() {
  const { currentUser, loading: authLoading } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const [stats, setStats] = useState<SalesDashboardStats>({
    new_leads: 0,
    active_opportunities: 0,
    orders_confirmed: 0,
    measurement_pending: 0,
    sales_value_mtd: 0,
    lead_conversion_rate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const salesRoles = ['marketing_executive', 'sales_executive', 'sales_manager', 'admin'];
      if (currentUser && salesRoles.includes(currentUser.role)) {
        try {
          setLoading(true);
          const data = await api.get('/sales/dashboard/stats');
          setStats(data);
        } catch (error) {
          console.error('Error fetching dashboard stats:', error);
          // Set default values on error
          setStats({
            new_leads: 0,
            active_opportunities: 0,
            orders_confirmed: 0,
            measurement_pending: 0,
            sales_value_mtd: 0,
            lead_conversion_rate: 0,
          });
        } finally {
          setLoading(false);
        }
      } else if (currentUser) {
        // User is logged in but doesn't have sales role
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchStats();
    }
  }, [currentUser?.role, authLoading]);

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const salesRoles = ['marketing_executive', 'sales_executive', 'sales_manager', 'admin'];
  if (!currentUser || !salesRoles.includes(currentUser.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You don't have permission to access the Sales Dashboard.</p>
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

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'number' ? amount : parseFloat(String(amount || 0));
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(numAmount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SalesSidebar />
      <SalesNavbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Sales Dashboard</h1>
            <p className="text-gray-600 mt-2">Overview of sales performance and pipeline</p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* New Leads Card */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                    <UserPlus className="w-6 h-6 text-white" />
                  </div>
                  <div className="px-2 py-1 bg-green-50 rounded-md">
                    <Activity className="w-4 h-4 text-green-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">New Leads (30 Days)</p>
                  {loading ? (
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">{stats.new_leads}</p>
                  )}
                </div>
                <Link 
                  to="/sales/leads" 
                  className="mt-4 flex items-center text-sm font-medium text-green-600 hover:text-green-700 group-hover:translate-x-1 transition-transform"
                >
                  View all <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>

            {/* Active Opportunities Card */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div className="px-2 py-1 bg-blue-50 rounded-md">
                    <Activity className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Active Opportunities</p>
                  {loading ? (
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">{stats.active_opportunities}</p>
                  )}
                </div>
                <Link 
                  to="/sales/leads?status_filter=Qualified" 
                  className="mt-4 flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 group-hover:translate-x-1 transition-transform"
                >
                  View all <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>

            {/* Orders Confirmed Card */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                    <ShoppingCart className="w-6 h-6 text-white" />
                  </div>
                  <div className="px-2 py-1 bg-purple-50 rounded-md">
                    <Activity className="w-4 h-4 text-purple-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Orders Confirmed</p>
                  {loading ? (
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">{stats.orders_confirmed}</p>
                  )}
                </div>
                <Link 
                  to="/sales/orders" 
                  className="mt-4 flex items-center text-sm font-medium text-purple-600 hover:text-purple-700 group-hover:translate-x-1 transition-transform"
                >
                  View all <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>

            {/* Measurement Pending Card */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                    <Ruler className="w-6 h-6 text-white" />
                  </div>
                  <div className="px-2 py-1 bg-orange-50 rounded-md">
                    <Activity className="w-4 h-4 text-orange-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Measurement Pending</p>
                  {loading ? (
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">{stats.measurement_pending}</p>
                  )}
                </div>
                <Link 
                  to="/sales/measurement-requests" 
                  className="mt-4 flex items-center text-sm font-medium text-orange-600 hover:text-orange-700 group-hover:translate-x-1 transition-transform"
                >
                  View all <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>

            {/* Sales Value MTD Card */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div className="px-2 py-1 bg-teal-50 rounded-md">
                    <TrendingUp className="w-4 h-4 text-teal-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Sales Value (MTD)</p>
                  {loading ? (
                    <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.sales_value_mtd)}</p>
                  )}
                </div>
                <Link 
                  to="/sales/reports" 
                  className="mt-4 flex items-center text-sm font-medium text-teal-600 hover:text-teal-700 group-hover:translate-x-1 transition-transform"
                >
                  View reports <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>

            {/* Lead Conversion Rate Card */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg">
                    <Percent className="w-6 h-6 text-white" />
                  </div>
                  <div className="px-2 py-1 bg-indigo-50 rounded-md">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Lead Conversion Rate</p>
                  {loading ? (
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">
                      {typeof stats.lead_conversion_rate === 'number' 
                        ? stats.lead_conversion_rate.toFixed(1) 
                        : parseFloat(String(stats.lead_conversion_rate || 0)).toFixed(1)}%
                    </p>
                  )}
                </div>
                <Link 
                  to="/sales/reports" 
                  className="mt-4 flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700 group-hover:translate-x-1 transition-transform"
                >
                  View reports <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>

          {/* Lead Pipeline View */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Lead Pipeline</h2>
            <div className="flex items-center justify-between">
              <div className="flex-1 text-center">
                <div className="text-2xl font-bold text-gray-900">New</div>
                <div className="text-sm text-gray-600 mt-1">Initial Contact</div>
              </div>
              <div className="flex-1 text-center border-l border-r border-gray-200">
                <div className="text-2xl font-bold text-blue-600">Qualified</div>
                <div className="text-sm text-gray-600 mt-1">Needs Assessment</div>
              </div>
              <div className="flex-1 text-center border-r border-gray-200">
                <div className="text-2xl font-bold text-purple-600">Quotation</div>
                <div className="text-sm text-gray-600 mt-1">Proposal Sent</div>
              </div>
              <div className="flex-1 text-center border-r border-gray-200">
                <div className="text-2xl font-bold text-orange-600">Negotiation</div>
                <div className="text-sm text-gray-600 mt-1">Price Discussion</div>
              </div>
              <div className="flex-1 text-center">
                <div className="text-2xl font-bold text-green-600">Order Confirmed</div>
                <div className="text-sm text-gray-600 mt-1">Won</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                to="/sales/leads/create"
                className="p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
              >
                <UserPlus className="w-6 h-6 text-green-600 mb-2" />
                <div className="font-medium text-gray-900">Create Lead</div>
                <div className="text-sm text-gray-600">Add new lead</div>
              </Link>
              <Link
                to="/sales/quotations/create"
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <TrendingUp className="w-6 h-6 text-blue-600 mb-2" />
                <div className="font-medium text-gray-900">Create Quotation</div>
                <div className="text-sm text-gray-600">Generate quote</div>
              </Link>
              <Link
                to="/sales/orders/create"
                className="p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
              >
                <ShoppingCart className="w-6 h-6 text-purple-600 mb-2" />
                <div className="font-medium text-gray-900">Create Order</div>
                <div className="text-sm text-gray-600">Confirm order</div>
              </Link>
              <Link
                to="/sales/follow-ups/create"
                className="p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
              >
                <Activity className="w-6 h-6 text-orange-600 mb-2" />
                <div className="font-medium text-gray-900">Add Follow-up</div>
                <div className="text-sm text-gray-600">Log communication</div>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

