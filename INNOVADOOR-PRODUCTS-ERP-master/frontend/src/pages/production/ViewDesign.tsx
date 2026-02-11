import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { useSidebar } from '../../context/SidebarContext';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { ArrowLeft, Edit, Package } from 'lucide-react';

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

export default function ViewDesign() {
  const { isCollapsed, isHovered } = useSidebar();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [design, setDesign] = useState<Design | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadDesign();
    }
  }, [id]);

  const loadDesign = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.get(`/production/designs/${id}`, true);
      setDesign(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load design');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <Navbar />
        <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
          <main className="p-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading design...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !design) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <Navbar />
        <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
          <main className="p-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow p-8">
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error || 'Design not found'}
              </div>
              <button
                onClick={() => navigate('/designs')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Designs
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-8 max-w-4xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => navigate('/designs')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Designs
            </button>
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{design.design_name}</h1>
                <p className="text-gray-600 mt-2">View design details</p>
              </div>
              <button
                onClick={() => navigate(`/designs/${design.id}/edit`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit Design
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-6 space-y-6">
              {/* Design Image */}
              {design.image && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Design Image
                  </label>
                  <div className="border border-gray-300 rounded-md overflow-hidden">
                    <img
                      src={design.image}
                      alt={design.design_name}
                      className="w-full h-96 object-contain bg-gray-50"
                    />
                  </div>
                </div>
              )}

              {/* Design Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Design Code
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900">
                  {design.design_code}
                </div>
              </div>

              {/* Product Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Category
                </label>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  <Package className="w-4 h-4" />
                  {design.product_category}
                </div>
              </div>

              {/* Description */}
              {design.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 whitespace-pre-wrap">
                    {design.description}
                  </div>
                </div>
              )}

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium">
                  {design.is_active ? (
                    <span className="bg-green-100 text-green-800">Active</span>
                  ) : (
                    <span className="bg-red-100 text-red-800">Inactive</span>
                  )}
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Created At
                  </label>
                  <div className="text-sm text-gray-600">
                    {new Date(design.created_at).toLocaleString()}
                  </div>
                </div>
                {design.updated_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Updated At
                    </label>
                    <div className="text-sm text-gray-600">
                      {new Date(design.updated_at).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => navigate('/designs')}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => navigate(`/designs/${design.id}/edit`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Design
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

