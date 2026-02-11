import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import Sidebar from '../../components/SupervisorSidebar';
import SupervisorNavbar from '../../components/SupervisorNavbar';
import { api } from '../../lib/api';
import {
  AlertCircle,
  Clock,
  PlayCircle,
  Wrench,
  CheckCircle2,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

interface DashboardStats {
  urgent_pending: number;
  regular_pending: number;
  sample_pending: number;
  wip_count: number;
  completed_today: number;
}

interface Task {
  id: number;
  production_paper_no: string;
  party_name: string;
  product_type: string;
  order_type: string;
  stage: string;
  quantity: number;
  planned_date: string;
  status: string;
}

export default function SupervisorDashboard() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const [stats, setStats] = useState<DashboardStats>({
    urgent_pending: 0,
    regular_pending: 0,
    sample_pending: 0,
    wip_count: 0,
    completed_today: 0,
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (currentUser?.role === 'production_supervisor') {
        try {
          setLoading(true);
          const [statsData, tasksData] = await Promise.all([
            api.get('/supervisor/dashboard/stats'),
            api.get('/supervisor/dashboard/tasks'),
          ]);

          setStats(statsData);
          setTasks(tasksData);
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [currentUser?.role]);

  // Redirect if not supervisor
  if (currentUser?.role !== 'production_supervisor') {
    return <Navigate to="/dashboard" replace />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'On Hold':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderTypeColor = (orderType: string) => {
    switch (orderType) {
      case 'Urgent':
        return 'bg-red-100 text-red-800';
      case 'Regular':
        return 'bg-blue-100 text-blue-800';
      case 'Sample':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      <Sidebar />
      <SupervisorNavbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'md:ml-20' : 'md:ml-64'} ml-0 pt-16`}>
        <main className="p-4 md:p-6 lg:p-8">
          {/* Header Section */}
          <div className="mb-6 md:mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                  Production Supervisor Dashboard
                </h1>
                <p className="text-gray-600 mt-2 text-base md:text-lg">
                  Welcome back, <span className="font-semibold text-gray-900">{currentUser?.username}</span>! 👋
                </p>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6 mb-8">
            {/* Urgent Tasks Pending */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Urgent Tasks Pending</p>
                  {loading ? (
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">{stats.urgent_pending}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Regular Tasks Pending */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Regular Tasks Pending</p>
                  {loading ? (
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">{stats.regular_pending}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Sample Tasks Pending */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                    <PlayCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Sample Tasks Pending</p>
                  {loading ? (
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">{stats.sample_pending}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Work In Progress */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg">
                    <Wrench className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Work In Progress</p>
                  {loading ? (
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">{stats.wip_count}</p>
                  )}
                </div>
                <Link
                  to="/supervisor/tasks/wip"
                  className="mt-4 flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700 group-hover:translate-x-1 transition-transform p-2 -ml-2 rounded-lg hover:bg-indigo-50"
                >
                  View all <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>

            {/* Completed Today */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Completed Today</p>
                  {loading ? (
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">{stats.completed_today}</p>
                  )}
                </div>
                <Link
                  to="/supervisor/tasks/completed"
                  className="mt-4 flex items-center text-sm font-medium text-green-600 hover:text-green-700 group-hover:translate-x-1 transition-transform p-2 -ml-2 rounded-lg hover:bg-green-50"
                >
                  View all <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>

          {/* Task Overview Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900">Task Overview</h2>
                </div>
                <Link
                  to="/supervisor/tasks"
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium p-2 hover:bg-indigo-50 rounded"
                >
                  View All Tasks →
                </Link>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Production Paper No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planned Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : tasks.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                        No tasks found
                      </td>
                    </tr>
                  ) : (
                    tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {task.production_paper_no}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {task.party_name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {task.product_type || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getOrderTypeColor(task.order_type)}`}>
                            {task.order_type || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {task.stage || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {task.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {task.planned_date ? new Date(task.planned_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden">
              {loading ? (
                <div className="p-6 text-center text-gray-500">Loading...</div>
              ) : tasks.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No tasks found</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {tasks.map((task) => (
                    <div key={task.id} className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                            {task.production_paper_no}
                          </span>
                          <h3 className="font-semibold text-gray-900 mt-1">{task.party_name || 'N/A'}</h3>
                        </div>
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                          <span className="text-xs text-gray-500 block">Product Type</span>
                          <span className="text-gray-900">{task.product_type || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block">Quantity</span>
                          <span className="text-gray-900">{task.quantity}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block">Order Type</span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium mt-1 ${getOrderTypeColor(task.order_type)}`}>
                            {task.order_type || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block">Planned Date</span>
                          <span className="text-gray-900">{task.planned_date ? new Date(task.planned_date).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

