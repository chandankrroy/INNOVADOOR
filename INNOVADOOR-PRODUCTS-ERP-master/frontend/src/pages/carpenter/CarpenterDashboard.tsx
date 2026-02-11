import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useSidebar } from '../../context/SidebarContext';
import CarpenterCaptainSidebar from '../../components/CarpenterCaptainSidebar';
import Navbar from '../../components/Navbar';
import { DoorOpen, Hammer, Users, AlertCircle, Clock } from 'lucide-react';

type DashboardStats = {
  doors_fixed_today: number;
  frames_fixed_today: number;
  carpenters_present: number;
  issues_open: number;
  pending_flats: number;
  today_work_list: Array<{
    flat_no: string;
    work_type: string;
    status: string;
  }>;
};

export default function CarpenterDashboard() {
  const { isCollapsed, isHovered } = useSidebar();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const data = await api.get('/carpenter/dashboard/stats');
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in progress':
        return 'bg-blue-100 text-blue-800';
      case 'on hold':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CarpenterCaptainSidebar />
      <Navbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Captain Dashboard</h1>
            <p className="text-gray-600 mt-2">Overview of today's work and statistics</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">Loading dashboard...</p>
            </div>
          ) : stats && (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Doors Fixed Today</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.doors_fixed_today}</p>
                    </div>
                    <DoorOpen className="w-12 h-12 text-purple-600" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Frames Fixed Today</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.frames_fixed_today}</p>
                    </div>
                    <Hammer className="w-12 h-12 text-blue-600" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Carpenters Present</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.carpenters_present}</p>
                    </div>
                    <Users className="w-12 h-12 text-green-600" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Issues Open</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.issues_open}</p>
                    </div>
                    <AlertCircle className="w-12 h-12 text-red-600" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Flats</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pending_flats}</p>
                    </div>
                    <Clock className="w-12 h-12 text-orange-600" />
                  </div>
                </div>
              </div>

              {/* Today's Work List */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Today's Work List</h2>
                </div>
                {stats.today_work_list.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-500">No work allocated for today</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Flat No
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Work Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {stats.today_work_list.map((work, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {work.flat_no}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {work.work_type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(work.status)}`}>
                                {work.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

