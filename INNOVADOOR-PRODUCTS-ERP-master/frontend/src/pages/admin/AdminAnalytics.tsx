import { useEffect, useState } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import AdminNavbar from '../../components/AdminNavbar';
import { useSidebar } from '../../context/SidebarContext';
import { api } from '../../lib/api';
import { TrendingUp, Users, FileText, Building2 } from 'lucide-react';

interface ActivityData {
  date: string;
  count: number;
}

export default function AdminAnalytics() {
  const { isCollapsed, isHovered } = useSidebar();
  const [userData, setUserData] = useState<ActivityData[]>([]);
  const [activityData, setActivityData] = useState<{
    measurements_by_date: ActivityData[];
    parties_by_date: ActivityData[];
    production_papers_by_date: ActivityData[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [userAnalytics, activityAnalytics] = await Promise.all([
          api.get(`/admin/analytics/users?days=${days}`),
          api.get(`/admin/analytics/activity?days=${days}`)
        ]);
        setUserData(userAnalytics.users_by_date || []);
        setActivityData(activityAnalytics);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [days]);

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

  const maxCount = Math.max(
    ...userData.map(d => d.count),
    ...(activityData?.measurements_by_date.map(d => d.count) || []),
    ...(activityData?.parties_by_date.map(d => d.count) || []),
    ...(activityData?.production_papers_by_date.map(d => d.count) || []),
    1
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      <AdminSidebar />
      <AdminNavbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-6 lg:p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
              <p className="text-gray-600">Detailed insights and trends</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setDays(7)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  days === 7
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setDays(30)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  days === 30
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                30 Days
              </button>
              <button
                onClick={() => setDays(90)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  days === 90
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                90 Days
              </button>
            </div>
          </div>

          {/* User Growth Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
            <div className="flex items-center mb-4">
              <Users className="w-5 h-5 text-indigo-600 mr-2" />
              <h2 className="text-xl font-bold text-gray-900">User Growth</h2>
            </div>
            <div className="h-64 flex items-end space-x-2">
              {userData.length > 0 ? (
                userData.map((item, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-indigo-500 rounded-t hover:bg-indigo-600 transition-colors cursor-pointer"
                      style={{ height: `${(item.count / maxCount) * 100}%` }}
                      title={`${item.date}: ${item.count} users`}
                    />
                    <span className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top-left">
                      {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="w-full text-center text-gray-500">No data available</div>
              )}
            </div>
          </div>

          {/* Activity Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Measurements */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center mb-4">
                <FileText className="w-5 h-5 text-purple-600 mr-2" />
                <h3 className="text-lg font-bold text-gray-900">Measurements</h3>
              </div>
              <div className="h-48 flex items-end space-x-1">
                {activityData?.measurements_by_date && activityData.measurements_by_date.length > 0 ? (
                  activityData.measurements_by_date.map((item, index) => (
                    <div
                      key={index}
                      className="flex-1 bg-purple-500 rounded-t hover:bg-purple-600 transition-colors cursor-pointer"
                      style={{ height: `${(item.count / maxCount) * 100}%` }}
                      title={`${item.date}: ${item.count}`}
                    />
                  ))
                ) : (
                  <div className="w-full text-center text-gray-500 text-sm">No data</div>
                )}
              </div>
            </div>

            {/* Parties */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center mb-4">
                <Building2 className="w-5 h-5 text-orange-600 mr-2" />
                <h3 className="text-lg font-bold text-gray-900">Parties</h3>
              </div>
              <div className="h-48 flex items-end space-x-1">
                {activityData?.parties_by_date && activityData.parties_by_date.length > 0 ? (
                  activityData.parties_by_date.map((item, index) => (
                    <div
                      key={index}
                      className="flex-1 bg-orange-500 rounded-t hover:bg-orange-600 transition-colors cursor-pointer"
                      style={{ height: `${(item.count / maxCount) * 100}%` }}
                      title={`${item.date}: ${item.count}`}
                    />
                  ))
                ) : (
                  <div className="w-full text-center text-gray-500 text-sm">No data</div>
                )}
              </div>
            </div>

            {/* Production Papers */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center mb-4">
                <TrendingUp className="w-5 h-5 text-pink-600 mr-2" />
                <h3 className="text-lg font-bold text-gray-900">Production Papers</h3>
              </div>
              <div className="h-48 flex items-end space-x-1">
                {activityData?.production_papers_by_date && activityData.production_papers_by_date.length > 0 ? (
                  activityData.production_papers_by_date.map((item, index) => (
                    <div
                      key={index}
                      className="flex-1 bg-pink-500 rounded-t hover:bg-pink-600 transition-colors cursor-pointer"
                      style={{ height: `${(item.count / maxCount) * 100}%` }}
                      title={`${item.date}: ${item.count}`}
                    />
                  ))
                ) : (
                  <div className="w-full text-center text-gray-500 text-sm">No data</div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

