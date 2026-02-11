import { useEffect, useState } from 'react';
import { Navigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import DispatchSidebar from '../../components/DispatchSidebar';
import Navbar from '../../components/Navbar';
import { api } from '../../lib/api';
import { History, Truck, Eye } from 'lucide-react';

export default function DispatchHistory() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const [searchParams] = useSearchParams();
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDispatches = async () => {
      if (currentUser) {
        try {
          setLoading(true);
          const status = searchParams.get('status');
          const url = status ? `/dispatch/dispatches?status_filter=${status}` : '/dispatch/dispatches';
          const data = await api.get(url);
          setDispatches(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error('Error fetching dispatches:', error);
          setDispatches([]);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchDispatches();
  }, [currentUser, searchParams]);

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
              Dispatch History
            </h1>
            <p className="text-gray-600 mt-2 text-lg">View all dispatch records</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <History className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">All Dispatches</h2>
              </div>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : dispatches.length === 0 ? (
                <div className="text-center py-12">
                  <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No dispatches found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Dispatch No</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Production Paper</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Party</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Vehicle No</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Dispatch Date</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dispatches.map((dispatch) => (
                        <tr key={dispatch.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm text-gray-900 font-medium">{dispatch.dispatch_number}</td>
                          <td className="py-3 px-4 text-sm text-gray-700">{dispatch.production_paper_number}</td>
                          <td className="py-3 px-4 text-sm text-gray-700">{dispatch.party_name}</td>
                          <td className="py-3 px-4 text-sm text-gray-700">{dispatch.vehicle_no}</td>
                          <td className="py-3 px-4 text-sm text-gray-700">{dispatch.dispatch_date}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              dispatch.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                              dispatch.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                              dispatch.status === 'dispatched' ? 'bg-green-100 text-green-800' :
                              dispatch.status === 'delivered' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {dispatch.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Link
                              to={`/dispatch/view/${dispatch.id}`}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center justify-end"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Link>
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

