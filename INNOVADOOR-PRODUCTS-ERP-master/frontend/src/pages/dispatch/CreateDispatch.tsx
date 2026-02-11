import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import DispatchSidebar from '../../components/DispatchSidebar';
import Navbar from '../../components/Navbar';
import { api } from '../../lib/api';
import { Truck, Save, CheckCircle2 } from 'lucide-react';

export default function CreateDispatch() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    production_paper_id: parseInt(searchParams.get('production_paper_id') || '0'),
    billing_request_id: parseInt(searchParams.get('billing_request_id') || '0'),
    vehicle_type: 'Company',
    vehicle_no: '',
    driver_name: '',
    driver_mobile: '',
    dispatch_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    remarks: '',
  });
  const [readyItem, setReadyItem] = useState<any>(null);

  useEffect(() => {
    const fetchReadyItem = async () => {
      if (formData.production_paper_id) {
        try {
          const items = await api.get('/dispatch/ready-for-dispatch');
          const item = Array.isArray(items) ? items.find(i => i.production_paper_id === formData.production_paper_id) : null;
          if (item) {
            setReadyItem(item);
            setFormData(prev => ({
              ...prev,
              billing_request_id: item.billing_request_id || prev.billing_request_id,
              production_paper_number: item.production_paper_number,
              party_id: item.party_id,
              party_name: item.party_name,
              delivery_address: item.delivery_address,
            }));
          }
        } catch (error) {
          console.error('Error fetching ready item:', error);
        }
      }
    };
    fetchReadyItem();
  }, [formData.production_paper_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!readyItem) return;

    try {
      setLoading(true);
      const dispatchData = {
        production_paper_id: formData.production_paper_id,
        production_paper_number: readyItem.production_paper_number,
        billing_request_id: formData.billing_request_id,
        delivery_challan_id: null,
        tax_invoice_id: null,
        party_id: readyItem.party_id,
        party_name: readyItem.party_name,
        delivery_address: readyItem.delivery_address,
        dispatch_date: formData.dispatch_date,
        expected_delivery_date: formData.expected_delivery_date || null,
        vehicle_type: formData.vehicle_type,
        vehicle_no: formData.vehicle_no,
        driver_name: formData.driver_name || null,
        driver_mobile: formData.driver_mobile || null,
        items: readyItem.items || [],
        remarks: formData.remarks || null,
      };

      await api.post('/dispatch/dispatches', dispatchData);
      navigate('/dispatch/history');
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Error creating dispatch');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser || !['dispatch_executive', 'dispatch_supervisor', 'logistics_manager', 'admin'].includes(currentUser.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      <DispatchSidebar />
      <Navbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
              Create Dispatch
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Create a new dispatch record</p>
          </div>

          {readyItem ? (
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
              {/* Production Paper Info (Read-only) */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-700">Production Paper</label>
                  <p className="text-gray-900 font-semibold">{readyItem.production_paper_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Party</label>
                  <p className="text-gray-900 font-semibold">{readyItem.party_name}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700">Delivery Address</label>
                  <p className="text-gray-900">{readyItem.delivery_address}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">DC Number</label>
                  <p className="text-gray-900">{readyItem.dc_number || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Invoice Number</label>
                  <p className="text-gray-900">{readyItem.invoice_number || '-'}</p>
                </div>
              </div>

              {/* Vehicle & Logistics */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Truck className="w-5 h-5 mr-2" />
                  Vehicle & Logistics
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type *</label>
                    <select
                      value={formData.vehicle_type}
                      onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="Company">Company</option>
                      <option value="Transporter">Transporter</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle No *</label>
                    <input
                      type="text"
                      value={formData.vehicle_no}
                      onChange={(e) => setFormData({ ...formData, vehicle_no: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name</label>
                    <input
                      type="text"
                      value={formData.driver_name}
                      onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Driver Mobile</label>
                    <input
                      type="tel"
                      value={formData.driver_mobile}
                      onChange={(e) => setFormData({ ...formData, driver_mobile: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dispatch Date *</label>
                    <input
                      type="date"
                      value={formData.dispatch_date}
                      onChange={(e) => setFormData({ ...formData, dispatch_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery Date</label>
                    <input
                      type="date"
                      value={formData.expected_delivery_date}
                      onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Submit */}
              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => navigate('/dispatch/ready')}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {loading ? 'Saving...' : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Dispatch
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <p className="text-gray-500">Please select an item from Ready for Dispatch</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

