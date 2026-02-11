import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import MeasurementCaptainSidebar from '../../components/MeasurementCaptainSidebar';
import MeasurementCaptainBottomNav from '../../components/MeasurementCaptainBottomNav';
import Navbar from '../../components/Navbar';
import { api } from '../../lib/api';
import { Search, X, CheckCircle, Clock, Calendar, ChevronRight, Plus } from 'lucide-react';

type Measurement = {
  id: number;
  measurement_number: string;
  measurement_type: string;
  party_name: string;
  measurement_date: string | null;
  approval_status: string;
  created_at: string;
  updated_at: string | null;
};

export default function History() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [filteredMeasurements, setFilteredMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    filterMeasurements();
  }, [searchTerm, statusFilter, measurements]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError('');
      // Get all measurements created by the current user
      const data = await api.get('/production/measurements', true);
      // Filter to show only measurements created by current user
      const userMeasurements = data.filter((m: any) =>
        m.created_by === currentUser?.id || m.created_by_username === currentUser?.username
      );
      setMeasurements(userMeasurements);
      setFilteredMeasurements(userMeasurements);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const filterMeasurements = () => {
    let filtered = [...measurements];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(m => {
        if (statusFilter === 'pending') {
          return m.approval_status !== 'approved';
        } else if (statusFilter === 'approved') {
          return m.approval_status === 'approved';
        }
        return true;
      });
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(m =>
        m.measurement_number?.toLowerCase().includes(searchLower) ||
        m.party_name?.toLowerCase().includes(searchLower) ||
        m.measurement_type?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredMeasurements(filtered);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setFilteredMeasurements(measurements);
  };

  const getMeasurementTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'frame_sample': 'Sample Frame',
      'shutter_sample': 'Sample Shutter',
      'regular_frame': 'Regular Frame',
      'regular_shutter': 'Regular Shutter',
    };
    return labels[type] || type;
  };

  const getApprovalStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 flex items-center gap-1">
            Rejected
          </span>
        );
      default:
        // Show "Pending Approval" in yellow for any non-approved status
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-400 text-yellow-900 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pending Approval
          </span>
        );
    }
  };

  if (!currentUser || currentUser.role !== 'measurement_captain') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <MeasurementCaptainSidebar />
      <MeasurementCaptainBottomNav />
      <Navbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'md:ml-20' : 'md:ml-64'} ml-0 pt-16`}>
        <main className="p-4 md:p-8">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">History</h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">View all measurements you have created</p>
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
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">My Measurement History</h2>
                <Link
                  to="/measurement-captain/measurements/create"
                  className="hidden md:inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  + Create New Measurement
                </Link>
              </div>

              {/* Search and Filter Bar */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search measurements..."
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        filterMeasurements();
                      }
                    }}
                  />
                  {searchTerm && (
                    <button
                      onClick={handleClearSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="flex-1 md:flex-none px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                  </select>
                  <button
                    onClick={filterMeasurements}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Search className="w-4 h-4" />
                    <span className="md:hidden">Search</span>
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading history...</p>
              </div>
            ) : filteredMeasurements.length === 0 ? (
              <div className="p-12 text-center">
                <div className="bg-gray-50 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-6">
                  {searchTerm || statusFilter !== 'all'
                    ? 'No measurements found matching your criteria'
                    : 'No measurements found'}
                </p>
                {searchTerm || statusFilter !== 'all' ? (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear filters
                  </button>
                ) : (
                  <Link
                    to="/measurement-captain/measurements/create"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Create new measurement
                  </Link>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Number</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Party Name</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredMeasurements.map((measurement) => (
                        <tr
                          key={measurement.id}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => window.location.href = `/measurements/${measurement.id}`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                            {measurement.measurement_number || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getMeasurementTypeLabel(measurement.measurement_type)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {measurement.party_name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {measurement.measurement_date
                              ? new Date(measurement.measurement_date).toLocaleDateString()
                              : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getApprovalStatusBadge(measurement.approval_status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(measurement.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link
                              to={`/measurements/${measurement.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-gray-400 hover:text-blue-600 transition-colors"
                            >
                              <div className="p-2 hover:bg-blue-50 rounded-full inline-block">
                                <ChevronRight className="w-5 h-5" />
                              </div>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-100">
                  {filteredMeasurements.map((measurement) => (
                    <Link
                      key={measurement.id}
                      to={`/measurements/${measurement.id}`}
                      className="block p-4 bg-white active:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            {measurement.measurement_number || '-'}
                          </span>
                        </div>
                        {getApprovalStatusBadge(measurement.approval_status)}
                      </div>

                      <h3 className="text-base font-semibold text-gray-900 mb-1">
                        {measurement.party_name || '-'}
                      </h3>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">{getMeasurementTypeLabel(measurement.measurement_type)}</p>

                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-500 mt-2 mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{measurement.measurement_date ? new Date(measurement.measurement_date).toLocaleDateString() : '-'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>{new Date(measurement.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="mt-3 text-blue-600 text-sm font-medium flex items-center gap-1">
                        View Details <ChevronRight className="w-4 h-4" />
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Mobile Floating Action Button */}
      <Link
        to="/measurement-captain/measurements/create"
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all z-40"
      >
        <Plus className="w-8 h-8" />
      </Link>
    </div>
  );
}





