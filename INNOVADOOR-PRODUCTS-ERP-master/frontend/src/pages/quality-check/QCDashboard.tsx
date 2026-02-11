import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import QualityCheckSidebar from '../../components/QualityCheckSidebar';
import QualityCheckNavbar from '../../components/QualityCheckNavbar';
import { api } from '../../lib/api';
import { 
  Clock, 
  CheckCircle2, 
  XCircle,
  RotateCcw,
  FileText,
  TrendingUp,
  ArrowRight,
  Activity,
  BarChart3,
  ClipboardCheck
} from 'lucide-react';

interface DashboardStats {
  pendingUrgent: number;
  pendingRegular: number;
  pendingSample: number;
  rejectedToday: number;
  approvedToday: number;
}

export default function QCDashboard() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const [stats, setStats] = useState<DashboardStats>({
    pendingUrgent: 0,
    pendingRegular: 0,
    pendingSample: 0,
    rejectedToday: 0,
    approvedToday: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (currentUser?.role === 'quality_checker') {
        try {
          setLoading(true);
          const [pendingQCs, statsData] = await Promise.all([
            api.get('/quality-check/qc-queue?status_filter=pending').catch(() => []),
            api.get('/quality-check/qc-reports/stats').catch(() => ({})),
          ]);
          
          // Calculate stats from pending QCs
          const pendingList = Array.isArray(pendingQCs) ? pendingQCs : [];
          const urgent = pendingList.filter((qc: any) => qc.order_type === 'Urgent').length;
          const regular = pendingList.filter((qc: any) => qc.order_type === 'Regular').length;
          const sample = pendingList.filter((qc: any) => qc.order_type === 'Sample').length;
          
          // Get today's date
          const today = new Date().toISOString().split('T')[0];
          
          // Get today's approved and rejected (would need date filtering in backend)
          const approvedToday = statsData?.approved || 0;
          const rejectedToday = statsData?.rejected || 0;
          
          setStats({
            pendingUrgent: urgent,
            pendingRegular: regular,
            pendingSample: sample,
            rejectedToday: rejectedToday,
            approvedToday: approvedToday,
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

  if (currentUser?.role !== 'quality_checker') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/20">
      <QualityCheckSidebar />
      <QualityCheckNavbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-6 lg:p-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-green-800 to-emerald-800 bg-clip-text text-transparent">
                  QC Dashboard
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

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Pending QC (Urgent) */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div className="px-2 py-1 bg-red-50 rounded-md">
                    <TrendingUp className="w-4 h-4 text-red-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Pending QC (Urgent)</p>
                  {loading ? (
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">{stats.pendingUrgent}</p>
                  )}
                </div>
                <Link 
                  to="/quality-check/pending" 
                  className="mt-4 flex items-center text-sm font-medium text-red-600 hover:text-red-700 group-hover:translate-x-1 transition-transform"
                >
                  View all <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>

            {/* Pending QC (Regular) */}
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
                  <p className="text-sm font-medium text-gray-600 mb-1">Pending QC (Regular)</p>
                  {loading ? (
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">{stats.pendingRegular}</p>
                  )}
                </div>
                <Link 
                  to="/quality-check/pending" 
                  className="mt-4 flex items-center text-sm font-medium text-amber-600 hover:text-amber-700 group-hover:translate-x-1 transition-transform"
                >
                  View all <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>

            {/* Pending QC (Sample) */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div className="px-2 py-1 bg-blue-50 rounded-md">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Pending QC (Sample)</p>
                  {loading ? (
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">{stats.pendingSample}</p>
                  )}
                </div>
                <Link 
                  to="/quality-check/pending" 
                  className="mt-4 flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 group-hover:translate-x-1 transition-transform"
                >
                  View all <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>

          {/* Second Row Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Rejected Today */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
                    <XCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="px-2 py-1 bg-red-50 rounded-md">
                    <TrendingUp className="w-4 h-4 text-red-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Rejected Today</p>
                  {loading ? (
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">{stats.rejectedToday}</p>
                  )}
                </div>
                <Link 
                  to="/quality-check/rework" 
                  className="mt-4 flex items-center text-sm font-medium text-red-600 hover:text-red-700 group-hover:translate-x-1 transition-transform"
                >
                  View details <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>

            {/* Approved Today */}
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
                  <p className="text-sm font-medium text-gray-600 mb-1">Approved Today</p>
                  {loading ? (
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">{stats.approvedToday}</p>
                  )}
                </div>
                <Link 
                  to="/quality-check/history" 
                  className="mt-4 flex items-center text-sm font-medium text-green-600 hover:text-green-700 group-hover:translate-x-1 transition-transform"
                >
                  View history <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Actions Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
                </div>
                <span className="text-sm text-gray-500">Get started quickly</span>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  to="/quality-check/perform"
                  className="group relative p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-500 hover:bg-gradient-to-br hover:from-green-50 hover:to-green-100/50 transition-all duration-300 text-center block transform hover:scale-[1.02] hover:shadow-lg"
                >
                  <div className="flex flex-col items-center">
                    <div className="p-4 bg-green-100 rounded-xl mb-3 group-hover:bg-green-200 transition-colors">
                      <ClipboardCheck className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="font-semibold text-gray-900 mb-1">Perform Quality Check</p>
                    <p className="text-sm text-gray-500">Start a new quality inspection</p>
                    <div className="mt-3 flex items-center text-green-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Get started <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </Link>
                
                <Link
                  to="/quality-check/reports"
                  className="group relative p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100/50 transition-all duration-300 text-center block transform hover:scale-[1.02] hover:shadow-lg"
                >
                  <div className="flex flex-col items-center">
                    <div className="p-4 bg-blue-100 rounded-xl mb-3 group-hover:bg-blue-200 transition-colors">
                      <BarChart3 className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="font-semibold text-gray-900 mb-1">QC Reports</p>
                    <p className="text-sm text-gray-500">View quality analytics</p>
                    <div className="mt-3 flex items-center text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      View reports <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </Link>
                
                <Link
                  to="/quality-check/certificates"
                  className="group relative p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-500 hover:bg-gradient-to-br hover:from-purple-50 hover:to-purple-100/50 transition-all duration-300 text-center block transform hover:scale-[1.02] hover:shadow-lg"
                >
                  <div className="flex flex-col items-center">
                    <div className="p-4 bg-purple-100 rounded-xl mb-3 group-hover:bg-purple-200 transition-colors">
                      <FileText className="w-8 h-8 text-purple-600" />
                    </div>
                    <p className="font-semibold text-gray-900 mb-1">QC Certificates</p>
                    <p className="text-sm text-gray-500">View quality certificates</p>
                    <div className="mt-3 flex items-center text-purple-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      View certificates <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
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

