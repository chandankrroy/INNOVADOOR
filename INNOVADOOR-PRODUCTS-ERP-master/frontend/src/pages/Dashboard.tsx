import { Link, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { api } from '../lib/api';
import { 
  Ruler, 
  Users, 
  FileText, 
  TrendingUp, 
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock,
  BarChart3
} from 'lucide-react';

interface DashboardStats {
  measurements: number;
  parties: number;
  productionPapers: number;
}

export default function Dashboard() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const [stats, setStats] = useState<DashboardStats>({
    measurements: 0,
    parties: 0,
    productionPapers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (currentUser?.role === 'production_manager') {
        try {
          setLoading(true);
          const [measurements, parties, papers] = await Promise.all([
            api.get('/production/measurements', true).catch(() => []),
            api.get('/production/parties', true).catch(() => []),
            api.get('/production/production-papers', true).catch(() => []),
          ]);
          
          setStats({
            measurements: Array.isArray(measurements) ? measurements.length : 0,
            parties: Array.isArray(parties) ? parties.length : 0,
            productionPapers: Array.isArray(papers) ? papers.length : 0,
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

  // Redirect raw_material_checker users to their dashboard
  if (currentUser?.role === 'raw_material_checker') {
    return <Navigate to="/raw-material/dashboard" replace />;
  }

  // Redirect production_scheduler users to their dashboard
  if (currentUser?.role === 'production_scheduler') {
    return <Navigate to="/scheduler/dashboard" replace />;
  }

  // Redirect production_supervisor users to their dashboard
  if (currentUser?.role === 'production_supervisor') {
    return <Navigate to="/supervisor/dashboard" replace />;
  }

  // Redirect quality_checker users to their dashboard
  if (currentUser?.role === 'quality_checker') {
    return <Navigate to="/quality-check/dashboard" replace />;
  }

  // Redirect crm_manager users to their dashboard
  if (currentUser?.role === 'crm_manager') {
    return <Navigate to="/crm/dashboard" replace />;
  }

  // Redirect billing users to their dashboard
  if (['billing_executive', 'accounts_manager'].includes(currentUser?.role || '')) {
    return <Navigate to="/billing/dashboard" replace />;
  }

  // Redirect logistics users to their dashboard
  if (['logistics_manager', 'logistics_executive', 'driver'].includes(currentUser?.role || '')) {
    return <Navigate to="/logistics/dashboard" replace />;
  }

  // Redirect dispatch users to their dashboard
  if (['dispatch_executive', 'dispatch_supervisor'].includes(currentUser?.role || '')) {
    return <Navigate to="/dispatch/dashboard" replace />;
  }

  // Redirect site_supervisor users to their dashboard
  if (currentUser?.role === 'site_supervisor') {
    return <Navigate to="/site-supervisor/dashboard" replace />;
  }

  // Production Manager Dashboard
  if (currentUser?.role === 'production_manager') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
        <Sidebar />
        <Navbar />
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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Measurements Card */}
              <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="p-6 relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                      <Ruler className="w-6 h-6 text-white" />
                    </div>
                    <div className="px-2 py-1 bg-blue-50 rounded-md">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Measurements</p>
                    {loading ? (
                      <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      <p className="text-3xl font-bold text-gray-900">{stats.measurements}</p>
                    )}
                  </div>
                  <Link 
                    to="/measurements" 
                    className="mt-4 flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 group-hover:translate-x-1 transition-transform"
                  >
                    View all <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>

              {/* Parties Card */}
              <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="p-6 relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div className="px-2 py-1 bg-green-50 rounded-md">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Parties</p>
                    {loading ? (
                      <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      <p className="text-3xl font-bold text-gray-900">{stats.parties}</p>
                    )}
                  </div>
                  <Link 
                    to="/parties" 
                    className="mt-4 flex items-center text-sm font-medium text-green-600 hover:text-green-700 group-hover:translate-x-1 transition-transform"
                  >
                    View all <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>

              {/* Production Papers Card */}
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
                    <p className="text-sm font-medium text-gray-600 mb-1">Production Papers</p>
                    {loading ? (
                      <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      <p className="text-3xl font-bold text-gray-900">{stats.productionPapers}</p>
                    )}
                  </div>
                  <Link 
                    to="/production-papers" 
                    className="mt-4 flex items-center text-sm font-medium text-purple-600 hover:text-purple-700 group-hover:translate-x-1 transition-transform"
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link
                    to="/measurements/create"
                    className="group relative p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100/50 transition-all duration-300 text-center block transform hover:scale-[1.02] hover:shadow-lg"
                  >
                    <div className="flex flex-col items-center">
                      <div className="p-4 bg-blue-100 rounded-xl mb-3 group-hover:bg-blue-200 transition-colors">
                        <Ruler className="w-8 h-8 text-blue-600" />
                      </div>
                      <p className="font-semibold text-gray-900 mb-1">Create Measurement</p>
                      <p className="text-sm text-gray-500">Add a new measurement record</p>
                      <div className="mt-3 flex items-center text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Get started <ArrowRight className="w-4 h-4 ml-1" />
                      </div>
                    </div>
                  </Link>
                  
                  <Link
                    to="/production-papers/create"
                    className="group relative p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-500 hover:bg-gradient-to-br hover:from-purple-50 hover:to-purple-100/50 transition-all duration-300 text-center block transform hover:scale-[1.02] hover:shadow-lg"
                  >
                    <div className="flex flex-col items-center">
                      <div className="p-4 bg-purple-100 rounded-xl mb-3 group-hover:bg-purple-200 transition-colors">
                        <FileText className="w-8 h-8 text-purple-600" />
                      </div>
                      <p className="font-semibold text-gray-900 mb-1">Create Production Paper</p>
                      <p className="text-sm text-gray-500">Generate a new production document</p>
                      <div className="mt-3 flex items-center text-purple-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Get started <ArrowRight className="w-4 h-4 ml-1" />
                      </div>
                    </div>
                  </Link>
                  
                  <Link
                    to="/parties/create"
                    className="group relative p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-500 hover:bg-gradient-to-br hover:from-green-50 hover:to-green-100/50 transition-all duration-300 text-center block transform hover:scale-[1.02] hover:shadow-lg"
                  >
                    <div className="flex flex-col items-center">
                      <div className="p-4 bg-green-100 rounded-xl mb-3 group-hover:bg-green-200 transition-colors">
                        <Users className="w-8 h-8 text-green-600" />
                      </div>
                      <p className="font-semibold text-gray-900 mb-1">Create Party</p>
                      <p className="text-sm text-gray-500">Register a new business party</p>
                      <div className="mt-3 flex items-center text-green-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Get started <ArrowRight className="w-4 h-4 ml-1" />
                      </div>
                    </div>
                  </Link>
                  
                </div>
              </div>
            </div>

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
                    <p className="text-sm text-gray-600">Use the sidebar to navigate between different sections of the system.</p>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Default Dashboard for other roles
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 shadow-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                  Dashboard
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="px-4 py-2 bg-sky-100 rounded-xl border border-sky-200">
                <span className="text-sm font-medium text-gray-700">{currentUser?.email}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-2">
              Welcome, {currentUser?.username || currentUser?.email?.split('@')[0]}!
            </h1>
            <p className="text-gray-600 text-lg">Here's your personalized dashboard overview.</p>
          </header>
          
          <main>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-12">
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 mb-6">
                    <BarChart3 className="w-10 h-10 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Dashboard Content</h2>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Your personalized dashboard content will appear here. Contact your administrator for access to additional features.
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
