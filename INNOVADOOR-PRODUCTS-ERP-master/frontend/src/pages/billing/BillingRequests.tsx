import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSidebar } from '../../context/SidebarContext';
import BillingSidebar from '../../components/BillingSidebar';
import Navbar from '../../components/Navbar';
import { api } from '../../lib/api';
import { FileText, Package, ArrowRight } from 'lucide-react';

export default function BillingRequests() {
  const { isCollapsed, isHovered } = useSidebar();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await api.get('/billing/billing-requests');
      setRequests(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error loading billing requests:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <BillingSidebar />
      <Navbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dispatch Billing Requests</h1>
            <p className="text-gray-600 mt-2">View and manage billing requests from dispatch</p>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">All Billing Requests</h2>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">Loading billing requests...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No billing requests found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dispatch Req No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Party</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Production Paper</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {requests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {request.dispatch_request_no}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{request.party_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{request.production_paper_number}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            request.status === 'dc_created' ? 'bg-blue-100 text-blue-800' :
                            request.status === 'invoice_created' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {request.status === 'pending' && (
                            <Link
                              to={`/billing/dc/create?request_id=${request.id}`}
                              className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
                            >
                              Create DC <ArrowRight className="w-4 h-4 ml-1" />
                            </Link>
                          )}
                          {request.status === 'dc_created' && (
                            <Link
                              to={`/billing/invoice/create?request_id=${request.id}`}
                              className="text-green-600 hover:text-green-700 font-medium flex items-center"
                            >
                              Create Invoice <ArrowRight className="w-4 h-4 ml-1" />
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

