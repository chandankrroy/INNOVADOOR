import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import DispatchSidebar from '../../components/DispatchSidebar';
import Navbar from '../../components/Navbar';
import { api } from '../../lib/api';
import { ClipboardCheck } from 'lucide-react';

export default function GatePass() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const [gatePasses, setGatePasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGatePasses = async () => {
      if (currentUser) {
        try {
          setLoading(true);
          const data = await api.get('/dispatch/gate-passes');
          setGatePasses(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error('Error fetching gate passes:', error);
          setGatePasses([]);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchGatePasses();
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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
              Gate Pass
            </h1>
            <p className="text-gray-600 mt-2 text-lg">View and manage gate passes</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <ClipboardCheck className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">All Gate Passes</h2>
              </div>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : gatePasses.length === 0 ? (
                <div className="text-center py-12">
                  <ClipboardCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No gate passes found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Gate Pass No</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Dispatch No</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Vehicle No</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Driver</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Verified</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Time Out</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gatePasses.map((gp) => (
                        <tr key={gp.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm text-gray-900 font-medium">{gp.gate_pass_number}</td>
                          <td className="py-3 px-4 text-sm text-gray-700">{gp.dispatch_number}</td>
                          <td className="py-3 px-4 text-sm text-gray-700">{gp.vehicle_no}</td>
                          <td className="py-3 px-4 text-sm text-gray-700">{gp.driver_name || '-'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              gp.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {gp.verified ? 'Verified' : 'Pending'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-700">
                            {gp.time_out ? new Date(gp.time_out).toLocaleString() : '-'}
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

