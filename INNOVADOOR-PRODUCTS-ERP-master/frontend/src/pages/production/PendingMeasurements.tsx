import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useSidebar } from '../../context/SidebarContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { CheckCircle, XCircle, Eye, AlertCircle } from 'lucide-react';

type Measurement = {
  id: number;
  measurement_type: string;
  measurement_number: string;
  party_name: string | null;
  party_id: number | null;
  thickness: string | null;
  measurement_date: string | null;
  items: any[] | string;
  notes: string | null;
  approval_status: string;
  rejection_reason: string | null;
  created_at: string;
  created_by_username: string | null;
};

export default function PendingMeasurements() {
  const { isCollapsed, isHovered } = useSidebar();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState<{ [key: number]: string }>({});
  const [showRejectModal, setShowRejectModal] = useState<number | null>(null);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    loadPendingMeasurements();
  }, [currentUser, navigate]);

  const loadPendingMeasurements = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.get('/production/measurements/pending', true);
      setMeasurements(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load pending measurements');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (measurementId: number) => {
    if (!confirm('Are you sure you want to approve this measurement?')) {
      return;
    }

    try {
      setProcessingId(measurementId);
      await api.post(`/production/measurements/${measurementId}/approve`, {}, true);
      alert('Measurement approved successfully!');
      loadPendingMeasurements();
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message || 'Failed to approve measurement');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (measurementId: number) => {
    const reason = rejectReason[measurementId]?.trim();
    if (!reason) {
      alert('Please provide a reason for rejection');
      return;
    }

    if (!confirm('Are you sure you want to reject this measurement?')) {
      return;
    }

    try {
      setProcessingId(measurementId);
      await api.post(`/production/measurements/${measurementId}/reject`, { rejection_reason: reason }, true);
      alert('Measurement rejected successfully!');
      setRejectReason({ ...rejectReason, [measurementId]: '' });
      setShowRejectModal(null);
      loadPendingMeasurements();
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message || 'Failed to reject measurement');
    } finally {
      setProcessingId(null);
    }
  };

  const getMeasurementTypeLabel = (type: string): string => {
    const labels: { [key: string]: string } = {
      frame_sample: 'Sample Frame',
      shutter_sample: 'Sample Shutter',
      regular_frame: 'Regular Frame',
      regular_shutter: 'Regular Shutter',
    };
    return labels[type] || type;
  };

  const getItemsCount = (items: any[] | string): number => {
    if (Array.isArray(items)) {
      return items.length;
    }
    if (typeof items === 'string') {
      try {
        const parsed = JSON.parse(items);
        return Array.isArray(parsed) ? parsed.length : 0;
      } catch {
        return 0;
      }
    }
    return 0;
  };

  if (!currentUser || (currentUser.role !== 'production_manager' && currentUser.role !== 'admin')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Pending Measurements</h1>
            <p className="text-gray-600 mt-2">Review and approve/reject measurements from Measurement Captains</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">Loading pending measurements...</p>
            </div>
          ) : measurements.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">No pending measurements</p>
              <p className="text-gray-400 text-sm">All measurements have been reviewed.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Measurement No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Party Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created At
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {measurements.map((measurement) => (
                      <tr key={measurement.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {measurement.measurement_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getMeasurementTypeLabel(measurement.measurement_type)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {measurement.party_name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {getItemsCount(measurement.items)} items
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {measurement.created_by_username || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {measurement.created_at
                            ? new Date(measurement.created_at).toLocaleString('en-GB', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => navigate(`/measurements/${measurement.id}`)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                              title="View measurement details"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </button>
                            <button
                              onClick={() => handleApprove(measurement.id)}
                              disabled={processingId === measurement.id}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Approve measurement"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => setShowRejectModal(measurement.id)}
                              disabled={processingId === measurement.id}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Reject measurement"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reject Modal */}
          {showRejectModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Reject Measurement</h3>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-gray-700">
                    Please provide a reason for rejecting this measurement:
                  </p>
                  <textarea
                    value={rejectReason[showRejectModal] || ''}
                    onChange={(e) => setRejectReason({ ...rejectReason, [showRejectModal]: e.target.value })}
                    placeholder="Enter rejection reason..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                    required
                  />
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowRejectModal(null);
                        setRejectReason({ ...rejectReason, [showRejectModal]: '' });
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleReject(showRejectModal)}
                      disabled={!rejectReason[showRejectModal]?.trim() || processingId === showRejectModal}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}


