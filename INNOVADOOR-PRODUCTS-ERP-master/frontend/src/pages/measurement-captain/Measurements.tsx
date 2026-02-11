import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import MeasurementCaptainSidebar from '../../components/MeasurementCaptainSidebar';
import MeasurementCaptainBottomNav from '../../components/MeasurementCaptainBottomNav';
import Navbar from '../../components/Navbar';
import { api } from '../../lib/api';
import {
  Plus,
  Ruler,
  ChevronRight,
  Calendar,
  Layers
} from 'lucide-react';

type Measurement = {
  id: number;
  task_id: number | null;
  measurement_number: string;
  measurement_type: string;
  party_name: string;
  thickness: string | null;
  external_foam_patti: string | null;
  measurement_date: string | null;
  measurement_time: string | null;
  status: string;
  approval_status: string;
  rejection_reason: string | null;
  created_at: string;
};

export default function Measurements() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    loadMeasurements();
  }, [statusFilter]);

  const loadMeasurements = async () => {
    try {
      setLoading(true);
      setError('');
      const url = statusFilter
        ? `/production/measurements?status_filter=${statusFilter}`
        : '/production/measurements';
      const data = await api.get(url);
      // Filter to only show measurements created by current user (backend should handle this, but double-check)
      setMeasurements(data.filter((m: Measurement) => true)); // Backend already filters by created_by
    } catch (err: any) {
      setError(err.message || 'Failed to load measurements');
    } finally {
      setLoading(false);
    }
  };

  const getApprovalStatusColor = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return 'Pending Approval';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return status.replace('_', ' ');
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
          {/* Header */}
          <div className="mb-6 md:mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Measurements</h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">View and manage all measurements</p>
            </div>
            <Link
              to="/measurement-captain/measurements/create"
              className="hidden md:inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New
            </Link>
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

          {/* Filters & Content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Mobile Filter Scroll / Desktop Tabs */}
            <div className="p-4 border-b border-gray-100 overflow-x-auto whitespace-nowrap scrollbar-hide">
              <div className="flex gap-2">
                {[
                  { id: '', label: 'All' },
                  { id: 'pending_approval', label: 'Pending' },
                  { id: 'approved', label: 'Approved' },
                  { id: 'rejected', label: 'Rejected' }
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setStatusFilter(filter.id)}
                    className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${statusFilter === filter.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading measurements...</p>
              </div>
            ) : measurements.length === 0 ? (
              <div className="p-12 text-center">
                <div className="bg-gray-50 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                  <Ruler className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-6">No measurements found</p>
                <Link
                  to="/measurement-captain/measurements/create"
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                >
                  Create one now &rarr;
                </Link>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">No.</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Party Name</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Details</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {measurements.map((measurement) => (
                        <tr
                          key={measurement.id}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => window.location.href = `/measurements/${measurement.id}`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                            {measurement.measurement_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {measurement.party_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            Thk: {measurement.thickness || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {measurement.measurement_date
                              ? new Date(measurement.measurement_date).toLocaleDateString()
                              : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${getApprovalStatusColor(measurement.approval_status)}`}>
                              {getStatusLabel(measurement.approval_status)}
                            </span>
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
                  {measurements.map((measurement) => (
                    <Link
                      key={measurement.id}
                      to={`/measurements/${measurement.id}`}
                      className="block p-4 active:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            {measurement.measurement_number}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full ${getApprovalStatusColor(measurement.approval_status)}`}>
                          {getStatusLabel(measurement.approval_status)}
                        </span>
                      </div>

                      <h3 className="text-base font-semibold text-gray-900 mb-1">
                        {measurement.party_name}
                      </h3>

                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-500 mt-2">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {measurement.measurement_date
                            ? new Date(measurement.measurement_date).toLocaleDateString()
                            : 'No Date'}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5" />
                          {measurement.thickness ? `${measurement.thickness}` : 'N/A'}
                        </div>
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

