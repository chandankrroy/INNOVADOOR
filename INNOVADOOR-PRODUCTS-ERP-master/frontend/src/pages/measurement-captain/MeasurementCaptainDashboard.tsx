import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import MeasurementCaptainSidebar from '../../components/MeasurementCaptainSidebar';
import MeasurementCaptainBottomNav from '../../components/MeasurementCaptainBottomNav';
import Navbar from '../../components/Navbar';
import { api } from '../../lib/api';
import {
  ClipboardList,
  Ruler,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowRight
} from 'lucide-react';

interface DashboardStats {
  total_tasks: number;
  pending_tasks: number;
  in_progress_tasks: number;
  completed_tasks: number;
  total_measurements: number;
  sent_to_production: number;
}

export default function MeasurementCaptainDashboard() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const [stats, setStats] = useState<DashboardStats>({
    total_tasks: 0,
    pending_tasks: 0,
    in_progress_tasks: 0,
    completed_tasks: 0,
    total_measurements: 0,
    sent_to_production: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (currentUser?.role === 'measurement_captain') {
        try {
          setLoading(true);
          const data = await api.get('/measurement-captain/dashboard/stats');
          setStats(data);
        } catch (error) {
          console.error('Error fetching dashboard stats:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchStats();
  }, [currentUser?.role]);

  if (!currentUser || currentUser.role !== 'measurement_captain') {
    return null;
  }

  const statCards = [
    {
      title: 'Total Tasks',
      value: stats.total_tasks,
      icon: ClipboardList,
      color: 'bg-blue-500',
      link: '/measurement-captain/tasks'
    },
    {
      title: 'Pending Tasks',
      value: stats.pending_tasks,
      icon: Clock,
      color: 'bg-yellow-500',
      link: '/measurement-captain/tasks/pending'
    },
    {
      title: 'In Progress',
      value: stats.in_progress_tasks,
      icon: TrendingUp,
      color: 'bg-purple-500',
      link: '/measurement-captain/tasks/in-progress'
    },
    {
      title: 'Completed Tasks',
      value: stats.completed_tasks,
      icon: CheckCircle2,
      color: 'bg-green-500',
      link: '/measurement-captain/tasks/completed'
    },
    {
      title: 'Total Measurements',
      value: stats.total_measurements,
      icon: Ruler,
      color: 'bg-indigo-500',
      link: '/measurement-captain/measurements'
    },
    {
      title: 'Sent to Production',
      value: stats.sent_to_production,
      icon: CheckCircle2,
      color: 'bg-teal-500',
      link: '/measurement-captain/measurements'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <MeasurementCaptainSidebar />
      <MeasurementCaptainBottomNav />
      <Navbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'md:ml-20' : 'md:ml-64'} ml-0 pt-16`}>
        <main className="p-4 md:p-8">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Measurement Captain Dashboard</h1>
            <p className="text-gray-600 mt-2 text-sm md:text-base">Overview of your tasks and measurements</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading dashboard statistics...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
                {statCards.map((stat, index) => {
                  const IconComponent = stat.icon;
                  return (
                    <Link
                      key={index}
                      to={stat.link}
                      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 md:p-6 border border-gray-100"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-500 text-sm font-medium mb-1">{stat.title}</p>
                          <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                        <div className={`${stat.color} p-3 md:p-4 rounded-xl`}>
                          <IconComponent className="w-6 h-6 md:w-8 md:h-8 text-white" />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center text-sm text-blue-600 font-medium group">
                        <span>View details</span>
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                  <div className="space-y-3">
                    <Link
                      to="/measurement-captain/measurements/create"
                      className="flex items-center justify-center w-full px-4 py-3.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm active:scale-[0.98] transition-transform"
                    >
                      Create New Measurement
                    </Link>
                    <Link
                      to="/measurement-captain/tasks"
                      className="flex items-center justify-center w-full px-4 py-3.5 bg-white text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                    >
                      View All Tasks
                    </Link>
                    <Link
                      to="/measurement-captain/measurements"
                      className="flex items-center justify-center w-full px-4 py-3.5 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      View All Measurements
                    </Link>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
                  <div className="flex items-center justify-center h-32 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <p className="text-sm">Activity summary will be displayed here</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

