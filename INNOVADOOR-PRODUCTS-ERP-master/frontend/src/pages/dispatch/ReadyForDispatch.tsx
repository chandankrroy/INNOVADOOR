import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import DispatchSidebar from '../../components/DispatchSidebar';
import Navbar from '../../components/Navbar';
import { api } from '../../lib/api';
import { Package, CheckCircle2, ArrowRight, Truck } from 'lucide-react';

export default function ReadyForDispatch() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const navigate = useNavigate();
  const [readyItems, setReadyItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReadyItems = async () => {
      if (currentUser) {
        try {
          setLoading(true);
          const items = await api.get('/dispatch/ready-for-dispatch');
          setReadyItems(Array.isArray(items) ? items : []);
        } catch (error) {
          console.error('Error fetching ready items:', error);
          setReadyItems([]);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchReadyItems();
  }, [currentUser]);

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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                  Ready for Dispatch
                </h1>
                <p className="text-gray-600 mt-2 text-lg">
                  Items with QC approval and Billing documents ready
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Ready Items</h2>
              </div>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-gray-200 animate-pulse rounded"></div>
                  ))}
                </div>
              ) : readyItems.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No items ready for dispatch</p>
                  <p className="text-gray-400 text-sm mt-2">Items will appear here once QC and Billing are approved</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Production Paper</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Party</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Delivery Address</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">DC No</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Invoice No</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Items</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {readyItems.map((item) => (
                        <tr key={item.production_paper_id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm text-gray-900 font-medium">{item.production_paper_number}</td>
                          <td className="py-3 px-4 text-sm text-gray-700">{item.party_name}</td>
                          <td className="py-3 px-4 text-sm text-gray-700 max-w-xs truncate">{item.delivery_address}</td>
                          <td className="py-3 px-4 text-sm text-gray-700">{item.dc_number || '-'}</td>
                          <td className="py-3 px-4 text-sm text-gray-700">{item.invoice_number || '-'}</td>
                          <td className="py-3 px-4 text-sm text-gray-700">
                            {Array.isArray(item.items) ? item.items.length : 0} items
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => navigate(`/dispatch/create?production_paper_id=${item.production_paper_id}&billing_request_id=${item.billing_request_id}`)}
                              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <Truck className="w-4 h-4 mr-2" />
                              Create Dispatch
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
        </main>
      </div>
    </div>
  );
}

