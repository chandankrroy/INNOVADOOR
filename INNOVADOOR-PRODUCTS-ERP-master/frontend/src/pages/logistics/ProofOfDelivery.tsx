import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import LogisticsSidebar from '../../components/LogisticsSidebar';
import LogisticsNavbar from '../../components/LogisticsNavbar';
import { api } from '../../lib/api';
import { FileCheck, Camera, CheckCircle2, Clock } from 'lucide-react';

export default function ProofOfDelivery() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const [tracking, setTracking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTracking, setSelectedTracking] = useState<any>(null);
  const [podForm, setPodForm] = useState({
    receiver_name: '',
    receiver_mobile: '',
    pod_photo_url: '',
    pod_signature_url: '',
    remarks: '',
  });

  useEffect(() => {
    fetchTracking();
  }, []);

  const fetchTracking = async () => {
    try {
      setLoading(true);
      const data = await api.get('/logistics/tracking?status_filter=in_transit');
      setTracking(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching tracking:', error);
      setTracking([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPOD = async (dispatchId: number) => {
    try {
      const updateData = {
        status: 'delivered',
        ...podForm,
        delivered_date: new Date().toISOString(),
      };
      await api.put(`/logistics/tracking/${dispatchId}`, updateData);
      setSelectedTracking(null);
      fetchTracking();
      alert('POD submitted successfully!');
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Error submitting POD');
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
            <h1 className="text-3xl font-bold text-gray-900">Proof of Delivery (POD)</h1>
            <p className="text-gray-600 mt-2">Capture and submit proof of delivery</p>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Pending POD Submissions</h2>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : tracking.length === 0 ? (
                <div className="text-center py-12">
                  <FileCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No pending POD submissions</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dispatch No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">POD Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tracking.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.dispatch_number}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              item.status === 'in_transit' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {item.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.pod_photo_url || item.pod_signature_url ? (
                              <span className="flex items-center text-green-600">
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Submitted
                              </span>
                            ) : (
                              <span className="flex items-center text-yellow-600">
                                <Clock className="w-4 h-4 mr-1" />
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => {
                                setSelectedTracking(item);
                                setPodForm({
                                  receiver_name: item.receiver_name || '',
                                  receiver_mobile: item.receiver_mobile || '',
                                  pod_photo_url: item.pod_photo_url || '',
                                  pod_signature_url: item.pod_signature_url || '',
                                  remarks: '',
                                });
                              }}
                              className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Submit POD
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

          {/* POD Submission Modal */}
          {selectedTracking && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-xl font-bold">Submit Proof of Delivery</h3>
                  <button onClick={() => setSelectedTracking(null)} className="text-gray-400 hover:text-gray-600">
                    ×
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Dispatch: <span className="font-medium">{selectedTracking.dispatch_number}</span>
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Receiver Name *</label>
                      <input
                        type="text"
                        required
                        value={podForm.receiver_name}
                        onChange={(e) => setPodForm({ ...podForm, receiver_name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Receiver Mobile *</label>
                      <input
                        type="tel"
                        required
                        value={podForm.receiver_mobile}
                        onChange={(e) => setPodForm({ ...podForm, receiver_mobile: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      POD Photo (URL or Base64) *
                    </label>
                    <input
                      type="text"
                      required
                      value={podForm.pod_photo_url}
                      onChange={(e) => setPodForm({ ...podForm, pod_photo_url: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Enter photo URL or base64 encoded image"
                    />
                    <p className="text-xs text-gray-500 mt-1">Upload photo and paste URL or base64 here</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      POD Signature (URL or Base64)
                    </label>
                    <input
                      type="text"
                      value={podForm.pod_signature_url}
                      onChange={(e) => setPodForm({ ...podForm, pod_signature_url: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Enter signature URL or base64"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                    <textarea
                      value={podForm.remarks}
                      onChange={(e) => setPodForm({ ...podForm, remarks: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      rows={3}
                    />
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> POD is mandatory for order closure. Without POD, the order cannot be closed and accounts will not be notified.
                    </p>
                  </div>
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => setSelectedTracking(null)}
                      className="px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSubmitPOD(selectedTracking.dispatch_id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Submit POD
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
