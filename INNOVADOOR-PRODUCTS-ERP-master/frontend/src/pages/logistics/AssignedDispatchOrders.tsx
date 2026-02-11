import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import LogisticsSidebar from '../../components/LogisticsSidebar';
import LogisticsNavbar from '../../components/LogisticsNavbar';
import { api } from '../../lib/api';
import { Package, Eye, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export default function AssignedDispatchOrders() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = statusFilter ? `?status_filter=${statusFilter}` : '';
      const data = await api.get(`/logistics/assigned-orders${params}`);
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching assigned orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getOrderDetails = async (dispatchId: number) => {
    try {
      const data = await api.get(`/logistics/assigned-orders/${dispatchId}`);
      setSelectedOrder(data);
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  if (!currentUser || !['logistics_manager', 'logistics_executive', 'driver', 'admin'].includes(currentUser.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: any }> = {
      'approved': { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircle2 },
      'dispatched': { bg: 'bg-purple-100', text: 'text-purple-800', icon: Package },
      'in_transit': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      'delivered': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle2 },
      'delayed': { bg: 'bg-red-100', text: 'text-red-800', icon: AlertCircle },
    };
    
    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: Package };
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3 mr-1" />
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
            <h1 className="text-3xl font-bold text-gray-900">Assigned Dispatch Orders</h1>
            <p className="text-gray-600 mt-2">View dispatch orders from Dispatch module (Read-only)</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="approved">Approved</option>
                <option value="dispatched">Dispatched</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="delayed">Delayed</option>
              </select>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Dispatch Orders</h2>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-16 bg-gray-200 animate-pulse rounded"></div>
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No dispatch orders found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dispatch No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Address</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dispatch Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignment</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.dispatch_number}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.party_name}</td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{order.delivery_address}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(order.dispatch_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(order.status)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {order.is_assigned ? (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Assigned</span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Not Assigned</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => getOrderDetails(order.id)}
                              className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Details
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

          {/* Order Details Modal */}
          {selectedOrder && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-900">Order Details</h3>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Dispatch Information</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Dispatch No:</span> {selectedOrder.dispatch?.dispatch_number}</p>
                        <p><span className="font-medium">Production Paper:</span> {selectedOrder.dispatch?.production_paper_number}</p>
                        <p><span className="font-medium">DC Number:</span> {selectedOrder.dispatch?.dc_number || '-'}</p>
                        <p><span className="font-medium">Invoice Number:</span> {selectedOrder.dispatch?.invoice_number || '-'}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Party Information</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Party Name:</span> {selectedOrder.dispatch?.party_name}</p>
                        <p><span className="font-medium">Delivery Address:</span> {selectedOrder.dispatch?.delivery_address}</p>
                      </div>
                    </div>
                  </div>

                  {selectedOrder.assignment && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Assignment Details</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <p><span className="font-medium">Vehicle:</span> {selectedOrder.assignment.vehicle_no}</p>
                        <p><span className="font-medium">Driver:</span> {selectedOrder.assignment.driver_name}</p>
                        <p><span className="font-medium">Driver Mobile:</span> {selectedOrder.assignment.driver_mobile}</p>
                        <p><span className="font-medium">Planned Delivery:</span> {selectedOrder.assignment.planned_delivery_date ? new Date(selectedOrder.assignment.planned_delivery_date).toLocaleDateString() : '-'}</p>
                        <p><span className="font-medium">Route/Area:</span> {selectedOrder.assignment.route_area || '-'}</p>
                        <p><span className="font-medium">Status:</span> {selectedOrder.assignment.status}</p>
                      </div>
                    </div>
                  )}

                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Items</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-4">Product Type</th>
                            <th className="text-left py-2 px-4">Description</th>
                            <th className="text-left py-2 px-4">Quantity</th>
                            <th className="text-left py-2 px-4">Packaging</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.items?.map((item: any, idx: number) => (
                            <tr key={idx} className="border-b border-gray-100">
                              <td className="py-2 px-4">{item.product_type}</td>
                              <td className="py-2 px-4">{item.product_description}</td>
                              <td className="py-2 px-4">{item.quantity}</td>
                              <td className="py-2 px-4">{item.packaging_type || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Close
                    </button>
                    {!selectedOrder.assignment && currentUser.role === 'logistics_manager' && (
                      <a
                        href={`/logistics/assignment?dispatch_id=${selectedOrder.dispatch?.id}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Assign Vehicle & Driver
                      </a>
                    )}
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
