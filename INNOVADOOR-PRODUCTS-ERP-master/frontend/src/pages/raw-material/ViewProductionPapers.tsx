import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import { Link } from 'react-router-dom';
import RawMaterialSidebar from '../../components/RawMaterialSidebar';
import RawMaterialNavbar from '../../components/RawMaterialNavbar';
import { api } from '../../lib/api';
import { FileText, Eye } from 'lucide-react';

export default function ViewProductionPapers() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPapers = async () => {
      if (currentUser?.role === 'raw_material_checker') {
        try {
          setLoading(true);
          const data = await api.get('/production/production-papers', true);
          setPapers(Array.isArray(data) ? data : []);
        } catch (err: any) {
          console.error('Error fetching production papers:', err);
          setError(err?.response?.data?.detail || err.message || 'Failed to fetch production papers');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchPapers();
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
              View Production Papers
            </h1>
            <p className="text-gray-600 mt-2 text-lg">View all production papers</p>
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
                <h2 className="text-xl font-semibold text-gray-900">All Production Papers</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paper Number</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {papers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                          No production papers found
                        </td>
                      </tr>
                    ) : (
                      papers.map((paper) => (
                        <tr key={paper.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{paper.paper_number}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{paper.title || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{paper.party?.name || paper.party_name || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              paper.status === 'active' ? 'bg-green-100 text-green-800' : 
                              paper.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {paper.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link
                              to={`/raw-material/production-papers/${paper.id}`}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                              title="View production paper"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Link>
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

