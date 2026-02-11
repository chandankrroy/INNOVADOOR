import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import Sidebar from '../../components/SupervisorSidebar';
import SupervisorNavbar from '../../components/SupervisorNavbar';
import { api } from '../../lib/api';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface Task {
  id: number;
  production_paper_no: string;
  department: string;
  product_type: string;
  order_type: string;
  quantity: number;
  planned_start_date: string;
  status: string;
}

export default function NewTasks() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<number | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      if (currentUser?.role === 'production_supervisor') {
        try {
          setLoading(true);
          const data = await api.get('/supervisor/tasks/new');
          setTasks(data);
        } catch (error) {
          console.error('Error fetching new tasks:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchTasks();
  }, [currentUser?.role]);

  if (currentUser?.role !== 'production_supervisor') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleAccept = async (taskId: number) => {
    try {
      await api.post(`/supervisor/tasks/${taskId}/accept`);
      setTasks(tasks.filter(t => t.id !== taskId));
      alert('Task accepted successfully!');
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to accept task');
    }
  };

  const handleReject = async (taskId: number) => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      await api.post(`/supervisor/tasks/${taskId}/reject`, { reason: rejectReason });
      setTasks(tasks.filter(t => t.id !== taskId));
      setShowRejectModal(null);
      setRejectReason('');
      alert('Task rejected');
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to reject task');
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
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
              New Tasks
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Newly assigned tasks by Production Scheduler</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Pending Tasks</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Production Paper No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Planned Start Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">Loading...</td>
                    </tr>
                  ) : tasks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">No new tasks</td>
                    </tr>
                  ) : (
                    tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {task.production_paper_no}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {task.department}
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
                          {task.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {task.planned_start_date ? new Date(task.planned_start_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleAccept(task.id)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Accept
                            </button>
                            <button
                              onClick={() => setShowRejectModal(task.id)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Reject Modal */}
          {showRejectModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h3 className="text-lg font-semibold mb-4">Reject Task</h3>
                <p className="text-sm text-gray-600 mb-4">Please provide a reason for rejection:</p>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
                >
                  <option value="">Select reason...</option>
                  <option value="Material">Material</option>
                  <option value="Machine">Machine</option>
                  <option value="Manpower">Manpower</option>
                </select>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowRejectModal(null);
                      setRejectReason('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleReject(showRejectModal)}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

