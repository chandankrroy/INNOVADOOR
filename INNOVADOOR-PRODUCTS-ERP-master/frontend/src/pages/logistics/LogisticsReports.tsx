import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import LogisticsSidebar from '../../components/LogisticsSidebar';
import LogisticsNavbar from '../../components/LogisticsNavbar';
import { api } from '../../lib/api';
import { BarChart3, TrendingUp, Truck, Clock, AlertCircle } from 'lucide-react';

export default function LogisticsReports() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const [reports, setReports] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/logistics/reports/summary?start_date=${startDate}&end_date=${endDate}`);
      setReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReports(null);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser || !['logistics_manager', 'logistics_executive', 'driver', 'admin'].includes(currentUser.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LogisticsNavbar />
      <LogisticsSidebar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-[65px]`}>
        <main className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Logistics Reports</h1>
            <p className="text-gray-600 mt-2">Analytics and performance reports</p>
          </div>

          {/* Date Range */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Start Date:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              />
              <label className="text-sm font-medium text-gray-700">End Date:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              />
              <button
                onClick={fetchReports}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">Loading reports...</div>
          ) : reports ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Truck className="w-8 h-8 text-blue-600" />
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Total Deliveries</p>
                  <p className="text-3xl font-bold text-gray-900">{reports.total_deliveries || 0}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Clock className="w-8 h-8 text-green-600" />
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600 mb-1">On-Time Deliveries</p>
                  <p className="text-3xl font-bold text-gray-900">{reports.on_time_deliveries || 0}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <BarChart3 className="w-8 h-8 text-purple-600" />
                    <span className="text-2xl font-bold text-purple-600">{reports.on_time_percentage || 0}%</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">On-Time Percentage</p>
                  <p className="text-lg font-semibold text-gray-900">Performance</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Delayed Deliveries</p>
                  <p className="text-3xl font-bold text-gray-900">{reports.delayed_deliveries || 0}</p>
                </div>
              </div>

              {/* Vehicle Utilization */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Vehicle Utilization</h2>
                <p className="text-lg text-gray-700">
                  Total Assignments: <span className="font-bold">{reports.vehicle_assignments || 0}</span>
                </p>
              </div>

              {/* Delay Reasons Analysis */}
              {reports.delay_reasons_analysis && Object.keys(reports.delay_reasons_analysis).length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Delay Reasons Analysis</h2>
                  <div className="space-y-3">
                    {Object.entries(reports.delay_reasons_analysis).map(([reason, count]: [string, any]) => (
                      <div key={reason} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700">{reason}</span>
                        <span className="font-bold text-gray-900">{count} occurrences</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No reports available for the selected period</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
