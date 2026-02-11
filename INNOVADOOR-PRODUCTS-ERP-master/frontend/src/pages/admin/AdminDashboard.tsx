import { useEffect, useState } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import AdminNavbar from '../../components/AdminNavbar';
import { useSidebar } from '../../context/SidebarContext';
import { api } from '../../lib/api';
import { 
  Users, 
  FileText, 
  Building2, 
  ClipboardList, 
  TrendingUp, 
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock,
  BarChart3,
  UserCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface AnalyticsOverview {
  total_users: number;
  active_users: number;
  total_measurements: number;
  total_parties: number;
  total_production_papers: number;
  role_distribution: Record<string, number>;
  recent_activity: {
    users: number;
    measurements: number;
    parties: number;
    production_papers: number;
  };
}

export default function AdminDashboard() {
  const { isCollapsed, isHovered } = useSidebar();
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await api.get('/admin/analytics/overview');
        setAnalytics(data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
        <AdminSidebar />
        <AdminNavbar />
        <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      <AdminSidebar />
      <AdminNavbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-6 lg:p-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-gray-600 mt-2 text-lg">
                  System overview and analytics
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
            {/* Total Users Card */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="px-2 py-1 bg-blue-50 rounded-md">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics?.total_users || 0}</p>
                </div>
                <Link 
                  to="/admin/users" 
                  className="mt-4 flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 group-hover:translate-x-1 transition-transform"
                >
                  View all <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>

            {/* Active Users Card */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                    <UserCheck className="w-6 h-6 text-white" />
                  </div>
                  <div className="px-2 py-1 bg-green-50 rounded-md">
                    <Activity className="w-4 h-4 text-green-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Active Users</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics?.active_users || 0}</p>
                </div>
              </div>
            </div>

            {/* Measurements Card */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div className="px-2 py-1 bg-purple-50 rounded-md">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Measurements</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics?.total_measurements || 0}</p>
                </div>
              </div>
            </div>

            {/* Parties Card */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="px-2 py-1 bg-orange-50 rounded-md">
                    <TrendingUp className="w-4 h-4 text-orange-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Parties</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics?.total_parties || 0}</p>
                </div>
              </div>
            </div>

            {/* Production Papers Card */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl shadow-lg">
                    <ClipboardList className="w-6 h-6 text-white" />
                  </div>
                  <div className="px-2 py-1 bg-pink-50 rounded-md">
                    <TrendingUp className="w-4 h-4 text-pink-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Production Papers</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics?.total_production_papers || 0}</p>
                </div>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  to="/admin/users"
                  className="group relative p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100/50 transition-all duration-300 text-center block transform hover:scale-[1.02] hover:shadow-lg"
                >
                  <div className="flex flex-col items-center">
                    <div className="p-4 bg-blue-100 rounded-xl mb-3 group-hover:bg-blue-200 transition-colors">
                      <Users className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="font-semibold text-gray-900 mb-1">Manage Users</p>
                    <p className="text-sm text-gray-500">View and manage system users</p>
                    <div className="mt-3 flex items-center text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Get started <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </Link>
                
                <Link
                  to="/admin/analytics"
                  className="group relative p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-500 hover:bg-gradient-to-br hover:from-purple-50 hover:to-purple-100/50 transition-all duration-300 text-center block transform hover:scale-[1.02] hover:shadow-lg"
                >
                  <div className="flex flex-col items-center">
                    <div className="p-4 bg-purple-100 rounded-xl mb-3 group-hover:bg-purple-200 transition-colors">
                      <BarChart3 className="w-8 h-8 text-purple-600" />
                    </div>
                    <p className="font-semibold text-gray-900 mb-1">View Analytics</p>
                    <p className="text-sm text-gray-500">Detailed insights and reports</p>
                    <div className="mt-3 flex items-center text-purple-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Get started <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </Link>
                
                <Link
                  to="/admin/calendar"
                  className="group relative p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-500 hover:bg-gradient-to-br hover:from-green-50 hover:to-green-100/50 transition-all duration-300 text-center block transform hover:scale-[1.02] hover:shadow-lg"
                >
                  <div className="flex flex-col items-center">
                    <div className="p-4 bg-green-100 rounded-xl mb-3 group-hover:bg-green-200 transition-colors">
                      <Clock className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="font-semibold text-gray-900 mb-1">View Calendar</p>
                    <p className="text-sm text-gray-500">Schedule and events</p>
                    <div className="mt-3 flex items-center text-green-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Get started <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Role Distribution */}
          {analytics && analytics.role_distribution && Object.keys(analytics.role_distribution).length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="text-xl font-semibold text-gray-900">User Role Distribution</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(analytics.role_distribution).map(([role, count]) => (
                    <div key={role} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600 mb-1 capitalize">{role.replace('_', ' ')}</p>
                      <p className="text-2xl font-bold text-gray-900">{count}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Additional Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-100">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">System Status</h3>
                  <p className="text-sm text-gray-600">All services are running smoothly. Your data is secure and backed up.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Quick Tips</h3>
                  <p className="text-sm text-gray-600">Use the sidebar to navigate between different sections of the admin panel.</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

