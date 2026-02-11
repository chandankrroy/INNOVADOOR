import { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import LogisticsSidebar from '../../components/LogisticsSidebar';
import LogisticsNavbar from '../../components/LogisticsNavbar';
import { api } from '../../lib/api';
import { MapPin, CheckCircle2, Clock, AlertCircle, Camera, FileText } from 'lucide-react';

export default function DeliveryTracking() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const [searchParams] = useSearchParams();
  const statusFilter = searchParams.get('status');

  const [tracking, setTracking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTracking, setSelectedTracking] = useState<any>(null);
  const [updateForm, setUpdateForm] = useState({
    status: '',
    receiver_name: '',
    receiver_mobile: '',
    pod_photo_url: '',
    pod_signature_url: '',
    shortage_remarks: '',
    damage_remarks: '',
    delay_reason: '',
  });

  useEffect(() => {
    fetchTracking();
  }, [statusFilter]);

  const fetchTracking = async () => {
    try {
      setLoading(true);
      const params = statusFilter ? `?status_filter=${statusFilter}` : '';
      const data = await api.get(`/logistics/tracking${params}`);
      setTracking(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching tracking:', error);
      setTracking([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (dispatchId: number) => {
    try {
      await api.put(`/logistics/tracking/${dispatchId}`, updateForm);
      setSelectedTracking(null);
      fetchTracking();
      alert('Status updated successfully!');
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Error updating status');
    }
  };

  if (!currentUser || !['logistics_manager', 'logistics_executive', 'driver', 'admin'].includes(currentUser.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { bg: string; text: string }> = {
      'dispatched': { bg: 'bg-blue-100', text: 'text-blue-800' },
      'in_transit': { bg: 'bg-purple-100', text: 'text-purple-800' },
      'delivered': { bg: 'bg-green-100', text: 'text-green-800' },
      'delayed': { bg: 'bg-red-100', text: 'text-red-800' },
    };
    const config = configs[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <LogisticsNavbar />
      <LogisticsSidebar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-[65px]`}>
        <main className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Delivery Tracking</h1>
            <p className="text-gray-600 mt-2">Track and update delivery status</p>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Active Deliveries</h2>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : tracking.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No tracking records found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dispatch No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receiver</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">POD</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tracking.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.dispatch_number}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(item.status)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.receiver_name || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.pod_photo_url || item.pod_signature_url ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                              <Clock className="w-5 h-5 text-gray-400" />
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => {
                                setSelectedTracking(item);
                                setUpdateForm({
                                  status: item.status,
                                  receiver_name: item.receiver_name || '',
                                  receiver_mobile: item.receiver_mobile || '',
                                  pod_photo_url: item.pod_photo_url || '',
                                  pod_signature_url: item.pod_signature_url || '',
                                  shortage_remarks: item.shortage_remarks || '',
                                  damage_remarks: item.damage_remarks || '',
                                  delay_reason: item.delay_reason || '',
                                });
                              }}
                              className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Update
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Update Modal */}
          {selectedTracking && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-xl font-bold">Update Delivery Status</h3>
                  <button onClick={() => setSelectedTracking(null)} className="text-gray-400 hover:text-gray-600">
                    ×
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                    <select
                      required
                      value={updateForm.status}
                      onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="dispatched">Dispatched</option>
                      <option value="in_transit">In Transit</option>
                      <option value="delivered">Delivered</option>
                      <option value="delayed">Delayed</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Receiver Name</label>
                      <input
                        type="text"
                        value={updateForm.receiver_name}
                        onChange={(e) => setUpdateForm({ ...updateForm, receiver_name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Receiver Mobile</label>
                      <input
                        type="tel"
                        value={updateForm.receiver_mobile}
                        onChange={(e) => setUpdateForm({ ...updateForm, receiver_mobile: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">POD Photo URL (Base64 or URL)</label>
                    <input
                      type="text"
                      value={updateForm.pod_photo_url}
                      onChange={(e) => setUpdateForm({ ...updateForm, pod_photo_url: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Enter photo URL or base64"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">POD Signature URL</label>
                    <input
                      type="text"
                      value={updateForm.pod_signature_url}
                      onChange={(e) => setUpdateForm({ ...updateForm, pod_signature_url: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Enter signature URL or base64"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Shortage Remarks</label>
                    <textarea
                      value={updateForm.shortage_remarks}
                      onChange={(e) => setUpdateForm({ ...updateForm, shortage_remarks: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Damage Remarks</label>
                    <textarea
                      value={updateForm.damage_remarks}
                      onChange={(e) => setUpdateForm({ ...updateForm, damage_remarks: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      rows={2}
                    />
                  </div>
                  {updateForm.status === 'delayed' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Delay Reason *</label>
                      <textarea
                        required
                        value={updateForm.delay_reason}
                        onChange={(e) => setUpdateForm({ ...updateForm, delay_reason: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        rows={3}
                      />
                    </div>
                  )}
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => setSelectedTracking(null)}
                      className="px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedTracking.dispatch_id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Update Status
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
