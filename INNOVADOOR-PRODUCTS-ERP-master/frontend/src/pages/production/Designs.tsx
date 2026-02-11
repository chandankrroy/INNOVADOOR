import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useSidebar } from '../../context/SidebarContext';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { Plus, Search, Eye, Edit, Package } from 'lucide-react';

type Design = {
  id: number;
  design_name: string;
  design_code: string;
  description: string | null;
  image: string | null;
  product_category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
};

export default function Designs() {
  const { isCollapsed, isHovered } = useSidebar();
  const navigate = useNavigate();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');

  useEffect(() => {
    loadDesigns();
  }, [filterCategory]);

  const loadDesigns = async () => {
    try {
      setLoading(true);
      setError('');
      const url = filterCategory
        ? `/production/designs?product_category=${filterCategory}`
        : '/production/designs';
      const data = await api.get(url, true);
      setDesigns(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load designs');
      setDesigns([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredDesigns = designs.filter(design => {
    const matchesSearch = searchTerm === '' ||
      design.design_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      design.design_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (design.description && design.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-8">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Designs</h1>
              <p className="text-gray-600 mt-2">View and manage product designs.</p>
            </div>
            <button
              onClick={() => navigate('/designs/create')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Design
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Search and Filter */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search designs by name, code, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:w-48">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  <option value="Shutter">Shutter</option>
                  <option value="Frame">Frame</option>
                </select>
              </div>
            </div>
          </div>

          {/* Designs Grid */}
          {loading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading designs...</p>
            </div>
          ) : filteredDesigns.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
              {searchTerm || filterCategory
                ? 'No designs found matching your search criteria.'
                : 'No designs available. Click "Create Design" to add a new design.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDesigns.map((design) => (
                <div
                  key={design.id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
                >
                  {/* Design Image */}
                  <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                    {design.image ? (
                      <img
                        src={design.image}
                        alt={design.design_name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Package className="w-16 h-16 text-gray-400" />
                    )}
                  </div>

                  {/* Design Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg truncate">
                          {design.design_name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">Code: {design.design_code}</p>
                      </div>
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${design.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                        }`}>
                        {design.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {design.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {design.description}
                      </p>
                    )}

                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {design.product_category}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => navigate(`/designs/${design.id}`)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      <button
                        onClick={() => navigate(`/designs/${design.id}/edit`)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))} 
            </div>
          )}
        </main>
      </div>
    </div>
  );
}







