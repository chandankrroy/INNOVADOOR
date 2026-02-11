import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import RawMaterialSidebar from '../../components/RawMaterialSidebar';
import RawMaterialNavbar from '../../components/RawMaterialNavbar';
import { api } from '../../lib/api';
import { Users } from 'lucide-react';

export default function ViewParties() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const [parties, setParties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchParties = async () => {
      if (currentUser?.role === 'raw_material_checker') {
        try {
          setLoading(true);
          const data = await api.get('/production/parties', true);
          setParties(Array.isArray(data) ? data : []);
        } catch (err: any) {
          console.error('Error fetching parties:', err);
          setError(err?.response?.data?.detail || err.message || 'Failed to fetch parties');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchParties();
  }, [currentUser?.role]);

  if (currentUser?.role !== 'raw_material_checker') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      <RawMaterialSidebar />
      <RawMaterialNavbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
              View Party
            </h1>
            <p className="text-gray-600 mt-2 text-lg">View all parties</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">All Parties</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {parties.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          No parties found
                        </td>
                      </tr>
                    ) : (
                      parties.map((party) => (
                        <tr key={party.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{party.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{party.party_type}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{party.phone || party.email || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              party.customer_status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {party.customer_status || 'N/A'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

