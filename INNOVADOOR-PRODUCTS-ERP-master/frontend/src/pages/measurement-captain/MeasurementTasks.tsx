import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import MeasurementCaptainSidebar from '../../components/MeasurementCaptainSidebar';
import MeasurementCaptainBottomNav from '../../components/MeasurementCaptainBottomNav';
import Navbar from '../../components/Navbar';
import { api } from '../../lib/api';
import {
  ClipboardList,
  MapPin,
  Calendar,
  ChevronRight,
  Plus
} from 'lucide-react';

type MeasurementTask = {
  id: number;
  task_number: string;
  assigned_to: number;
  assigned_by: number;
  party_id: number | null;
  party_name: string;
  project_site_name: string | null;
  site_address: string | null;
  task_description: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  measurement_entry_id: number | null;
  created_at: string;
  updated_at: string | null;
  completed_at: string | null;
};

export default function MeasurementTasks() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const { status: statusFilter } = useParams<{ status?: string }>();
  const [tasks, setTasks] = useState<MeasurementTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTasks();
  }, [statusFilter]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const url = statusFilter
        ? `/measurement-captain/my-tasks?status_filter=${statusFilter}`
        : '/measurement-captain/my-tasks';
      const data = await api.get(url);
      setTasks(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Normal':
        return 'bg-gray-100 text-gray-800';
      case 'Low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!currentUser || currentUser.role !== 'measurement_captain') {
    return null;
  }

  const title = statusFilter
    ? `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1).replace('_', ' ')} Tasks`
    : 'My Tasks';

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <MeasurementCaptainSidebar />
      <MeasurementCaptainBottomNav />
      <Navbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'md:ml-20' : 'md:ml-64'} ml-0 pt-16`}>
        <main className="p-4 md:p-8">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">View and manage your measurement tasks</p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-red-400">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Filters */}
            <div className="p-4 border-b border-gray-100 overflow-x-auto whitespace-nowrap scrollbar-hide">
              <div className="flex justify-between items-center min-w-full md:min-w-0">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900 hidden md:block">All Tasks</h2>
                <div className="flex gap-2">
                  <Link
                    to="/measurement-captain/tasks"
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!statusFilter ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    All
                  </Link>
                  <Link
                    to="/measurement-captain/tasks/pending"
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${statusFilter === 'pending' || (window.location.pathname.includes('pending') && !statusFilter) ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    Pending
                  </Link>
                  <Link
                    to="/measurement-captain/tasks/in-progress"
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${statusFilter === 'in_progress' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    In Progress
                  </Link>
                  <Link
                    to="/measurement-captain/tasks/completed"
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${statusFilter === 'completed' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    Completed
                  </Link>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading tasks...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="p-12 text-center">
                <div className="bg-gray-50 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                  <ClipboardList className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-6">No tasks found</p>
                <Link
                  to="/measurement-captain/tasks"
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all tasks
                </Link>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Task Number</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Party Name</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Project Site</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Due Date</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tasks.map((task) => (
                        <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                            {task.task_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {task.party_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {task.project_site_name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                              {task.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {task.measurement_entry_id ? (
                              <Link
                                to={`/measurement-captain/measurements/${task.measurement_entry_id}`}
                                className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                              >
                                View <ChevronRight className="w-4 h-4 ml-1" />
                              </Link>
                            ) : (
                              <Link
                                to={`/measurement-captain/measurements/create?task_id=${task.id}`}
                                className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                              >
                                Create <ChevronRight className="w-4 h-4 ml-1" />
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-100">
                  {tasks.map((task) => (
                    <div key={task.id} className="p-4 bg-white active:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            {task.task_number}
                          </span>
                          <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full ${getStatusColor(task.status)}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>

                      <h3 className="text-base font-semibold text-gray-900 mb-1">
                        {task.party_name}
                      </h3>

                      <div className="grid grid-cols-1 gap-2 text-sm text-gray-500 mt-2 mb-3">
                        {task.project_site_name && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span>{task.project_site_name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}</span>
                        </div>
                      </div>

                      <div className="mt-3">
                        {task.measurement_entry_id ? (
                          <Link
                            to={`/measurement-captain/measurements/${task.measurement_entry_id}`}
                            className="flex items-center justify-center w-full px-4 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors text-sm font-medium"
                          >
                            View Measurement
                          </Link>
                        ) : (
                          <Link
                            to={`/measurement-captain/measurements/create?task_id=${task.id}`}
                            className="flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Measurement
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

