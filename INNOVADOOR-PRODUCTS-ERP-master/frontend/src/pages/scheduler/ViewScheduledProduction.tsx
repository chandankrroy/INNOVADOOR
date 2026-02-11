import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import ProductionSchedulerSidebar from '../../components/ProductionSchedulerSidebar';
import ProductionSchedulerNavbar from '../../components/ProductionSchedulerNavbar';
import { api } from '../../lib/api';
import { 
  Filter, 
  Search,
  Eye,
  Calendar as CalendarIcon
} from 'lucide-react';

interface ScheduledProduction {
  id: number;
  production_paper_id: number;
  paper_number: string;
  party_name: string | null;
  product_type: string;
  order_type: string;
  start_date: string;
  target_date: string;
  supervisor: string | null;
  current_stage: string;
  status: string;
  priority: string;
}

export default function ViewScheduledProduction() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const [schedules, setSchedules] = useState<ScheduledProduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    order_type: '',
    product_type: '',
    supervisor: '',
    date_from: '',
    date_to: '',
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSchedules();
  }, [filters]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status_filter', filters.status);
      if (filters.order_type) params.append('order_type', filters.order_type);
      if (filters.product_type) params.append('product_type', filters.product_type);
      if (filters.supervisor) params.append('supervisor', filters.supervisor);
      
      const data = await api.get(`/scheduler/schedules?${params.toString()}`, true);
      setSchedules(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error fetching schedules:', error);
      const errorMsg = error.message || error.response?.data?.detail || 'Failed to load schedules';
      console.error('Schedule fetch error:', errorMsg);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSchedules = schedules.filter(schedule => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        schedule.paper_number.toLowerCase().includes(searchLower) ||
        (schedule.party_name && schedule.party_name.toLowerCase().includes(searchLower)) ||
        schedule.product_type.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  if (currentUser?.role !== 'production_scheduler') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      <ProductionSchedulerSidebar />
      <ProductionSchedulerNavbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
              View Scheduled Production
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Read-only visibility of what is planned</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Filters
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">All</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Production">In Production</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order Type</label>
                <select
                  value={filters.order_type}
                  onChange={(e) => setFilters({ ...filters, order_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">All</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Regular">Regular</option>
                  <option value="Sample">Sample</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label>
                <select
                  value={filters.product_type}
                  onChange={(e) => setFilters({ ...filters, product_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">All</option>
                  <option value="Door">Door</option>
                  <option value="Frame">Frame</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor</label>
                <input
                  type="text"
                  value={filters.supervisor}
                  onChange={(e) => setFilters({ ...filters, supervisor: e.target.value })}
                  placeholder="Filter by supervisor"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by paper number, party name, or product type..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Scheduled Production Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paper No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Party Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supervisor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : filteredSchedules.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                        No scheduled production found
                      </td>
                    </tr>
                  ) : (
                    filteredSchedules.map((schedule) => (
                      <tr key={schedule.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{schedule.paper_number}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{schedule.party_name || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{schedule.product_type}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            schedule.order_type === 'Urgent' ? 'bg-red-100 text-red-800' :
                            schedule.order_type === 'Sample' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {schedule.order_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(schedule.start_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(schedule.target_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{schedule.supervisor || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{schedule.current_stage}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            schedule.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            schedule.status === 'In Production' ? 'bg-blue-100 text-blue-800' :
                            schedule.status === 'On Hold' ? 'bg-yellow-100 text-yellow-800' :
                            schedule.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {schedule.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => window.location.href = `/scheduler/maintain?id=${schedule.id}`}
                            className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}










