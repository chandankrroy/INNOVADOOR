import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useSidebar } from '../../context/SidebarContext';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { Plus, Package, Search, Trash2, X, Clock, List, Edit } from 'lucide-react';

type ManufacturingStage = {
  step_name: string;
  time_hours?: number;
  duration_unit?: 'hours' | 'days';
  sequence?: number;
};

type Product = {
  id: number;
  product_code: string;
  product_category: string;
  product_type: string;
  sub_type: string | null;
  variant: string | null;
  description: string | null;
  specifications: any;
  manufacturing_process: ManufacturingStage[] | string[];
  is_active: boolean;
  created_at: string;
};

export default function Products() {
  const { isCollapsed, isHovered } = useSidebar();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{ id: number; code: string } | null>(null);
  const [captchaCode, setCaptchaCode] = useState('');
  const [userCaptchaInput, setUserCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [editFormData, setEditFormData] = useState({
    product_code: '',
    product_category: 'Shutter',
    product_type: '',
    sub_type: '',
    manufacturing_process: [] as ManufacturingStage[]
  });
  const [availableStages, setAvailableStages] = useState<Array<{ id: number; stage_name: string }>>([]);
  const [currentEditStage, setCurrentEditStage] = useState({ 
    step_name: '', 
    time_hours: 1 as number | null,
    duration_unit: 'days' as 'hours' | 'days'
  });

  useEffect(() => {
    loadProducts();
    loadStages();
  }, [filterCategory]);

  const loadStages = async () => {
    try {
      const stages = await api.get('/production/stages?active_only=true', true);
      setAvailableStages(stages);
    } catch (err: any) {
      console.error('Failed to load stages:', err);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const url = filterCategory ? `/production/products?category=${filterCategory}` : '/production/products';
      const data = await api.get(url);
      setProducts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = searchTerm === '' || 
      product.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.product_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sub_type && product.sub_type.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const generateCaptcha = () => {
    // Generate a random 5-character alphanumeric CAPTCHA
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing characters
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleDeleteClick = (productId: number, productCode: string) => {
    const newCaptcha = generateCaptcha();
    setCaptchaCode(newCaptcha);
    setUserCaptchaInput('');
    setCaptchaError('');
    setProductToDelete({ id: productId, code: productCode });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    // Validate CAPTCHA
    if (userCaptchaInput.toUpperCase() !== captchaCode.toUpperCase()) {
      setCaptchaError('CAPTCHA code does not match. Please try again.');
      // Regenerate CAPTCHA
      const newCaptcha = generateCaptcha();
      setCaptchaCode(newCaptcha);
      setUserCaptchaInput('');
      return;
    }

    try {
      await api.delete(`/production/products/${productToDelete.id}`, true);
      // Reload products after deletion
      loadProducts();
      setShowDeleteModal(false);
      setProductToDelete(null);
      setUserCaptchaInput('');
      setCaptchaError('');
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setProductToDelete(null);
    setUserCaptchaInput('');
    setCaptchaError('');
    setCaptchaCode('');
  };

  const handleEditClick = (product: Product) => {
    setProductToEdit(product);
    const process = parseManufacturingProcess(product.manufacturing_process || []);
    setEditFormData({
      product_code: product.product_code,
      product_category: product.product_category,
      product_type: product.product_type,
      sub_type: product.sub_type || '',
      manufacturing_process: process
    });
    setShowEditModal(true);
  };

  const handleUpdateProduct = async () => {
    if (!productToEdit) return;

    if (!editFormData.product_code.trim() || !editFormData.product_type.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const updateData = {
        product_code: editFormData.product_code.trim(),
        product_category: editFormData.product_category,
        product_type: editFormData.product_type.trim(),
        sub_type: editFormData.sub_type.trim() || null,
        manufacturing_process: editFormData.manufacturing_process.length > 0 
          ? editFormData.manufacturing_process.map((stage, index) => ({
              step_name: stage.step_name,
              time_hours: stage.time_hours,
              duration_unit: stage.duration_unit || 'days',
              sequence: index + 1
            }))
          : null
      };

      await api.put(`/production/products/${productToEdit.id}`, updateData, true);
      setShowEditModal(false);
      setProductToEdit(null);
      loadProducts();
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to update product');
    }
  };

  const handleAddEditStage = () => {
    if (!currentEditStage.step_name.trim()) {
      setError('Please select a stage');
      return;
    }
    if (!currentEditStage.time_hours || currentEditStage.time_hours <= 0) {
      setError('Please enter a valid duration time');
      return;
    }
    setEditFormData({
      ...editFormData,
      manufacturing_process: [...editFormData.manufacturing_process, { ...currentEditStage }]
    });
    setCurrentEditStage({ step_name: '', time_hours: 1, duration_unit: 'days' });
    setError('');
  };

  const handleRemoveEditStage = (index: number) => {
    setEditFormData({
      ...editFormData,
      manufacturing_process: editFormData.manufacturing_process.filter((_, i) => i !== index)
    });
  };

  const handleViewProcess = (product: Product) => {
    setSelectedProduct(product);
    setShowProcessModal(true);
  };

  const parseManufacturingProcess = (process: ManufacturingStage[] | string[]): ManufacturingStage[] => {
    if (!process || process.length === 0) return [];
    
    // If it's already an array of objects, return as is
    if (typeof process[0] === 'object' && process[0] !== null) {
      return process as ManufacturingStage[];
    }
    
    // If it's an array of strings, convert to objects
    return (process as string[]).map((stage, index) => ({
      step_name: stage,
      sequence: index + 1,
      time_hours: undefined,
      duration_unit: 'hours' as const
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600 mt-2">Manage products and manufacturing processes</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1 flex items-center gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    <option value="Shutter">Shutter</option>
                    <option value="Frame">Frame</option>
                  </select>
                </div>
                <Link
                  to="/products/create"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Create Product
                </Link>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No products found</p>
                <Link
                  to="/products/create"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Plus className="w-5 h-5" />
                  Create your first product
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Product Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sub Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Process Of Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.product_code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.product_category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          {product.product_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.sub_type || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleEditClick(product)}
                              className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                              title="Edit product"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleViewProcess(product)}
                              className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                              title="View manufacturing process"
                            >
                              <List className="w-4 h-4" />
                              Process
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDeleteClick(product.id, product.product_code)}
                            className="text-red-600 hover:text-red-900 flex items-center gap-1"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Manufacturing Process Modal */}
          {showProcessModal && selectedProduct && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Manufacturing Process</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedProduct.product_code} - {selectedProduct.product_type}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowProcessModal(false);
                      setSelectedProduct(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="p-6">
                  {(() => {
                    const steps = parseManufacturingProcess(selectedProduct.manufacturing_process || []);
                    if (steps.length === 0) {
                      return (
                        <div className="text-center py-12">
                          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">No manufacturing process steps defined for this product.</p>
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-4">
                        {steps.map((stage, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-4 flex-1">
                                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-blue-600 font-semibold text-sm">
                                    {stage.sequence || index + 1}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-semibold text-gray-900 mb-1">
                                    {stage.step_name}
                                  </h3>
                                  {stage.time_hours && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                                      <Clock className="w-4 h-4" />
                                      <span>Time: {stage.time_hours} {stage.duration_unit === 'days' ? 'days' : 'hours'}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal with CAPTCHA */}
          {showDeleteModal && productToDelete && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Delete Product</h3>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-gray-700">
                    Are you sure you want to delete product <span className="font-semibold">"{productToDelete.code}"</span>?
                    This action cannot be undone.
                  </p>
                  
                  {/* CAPTCHA Section */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Enter CAPTCHA Code *
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-white border-2 border-gray-300 rounded px-4 py-3 text-center">
                        <span className="text-2xl font-bold text-gray-800 tracking-widest select-none">
                          {captchaCode}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newCaptcha = generateCaptcha();
                          setCaptchaCode(newCaptcha);
                          setUserCaptchaInput('');
                          setCaptchaError('');
                        }}
                        className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 underline"
                        title="Refresh CAPTCHA"
                      >
                        Refresh
                      </button>
                    </div>
                    <input
                      type="text"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        captchaError
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      placeholder="Enter CAPTCHA code"
                      value={userCaptchaInput}
                      onChange={(e) => {
                        setUserCaptchaInput(e.target.value);
                        setCaptchaError('');
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleDeleteConfirm();
                        }
                      }}
                      autoFocus
                    />
                    {captchaError && (
                      <p className="text-sm text-red-600">{captchaError}</p>
                    )}
                  </div>
                  
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleDeleteConfirm}
                      disabled={!userCaptchaInput.trim()}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Delete Product
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteCancel}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit Product Modal */}
          {showEditModal && productToEdit && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Edit Product</h2>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setProductToEdit(null);
                      setError('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="p-6 space-y-6">
                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Code *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={editFormData.product_code}
                        onChange={(e) => setEditFormData({ ...editFormData, product_code: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={editFormData.product_category}
                        onChange={(e) => setEditFormData({ ...editFormData, product_category: e.target.value })}
                      >
                        <option value="Shutter">Shutter</option>
                        <option value="Frame">Frame</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={editFormData.product_type}
                        onChange={(e) => setEditFormData({ ...editFormData, product_type: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sub Type
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={editFormData.sub_type}
                        onChange={(e) => setEditFormData({ ...editFormData, sub_type: e.target.value })}
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  {/* Manufacturing Process Stages */}
                  <div className="border-t border-gray-200 pt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Process Of Product
                    </label>
                    
                    {/* Add Stage Form */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Stage *
                          </label>
                          <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                            value={currentEditStage.step_name}
                            onChange={(e) => setCurrentEditStage({ ...currentEditStage, step_name: e.target.value })}
                          >
                            <option value="">-- Select Stage --</option>
                            {availableStages.map((stage) => (
                              <option key={stage.id} value={stage.stage_name}>
                                {stage.stage_name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Duration Unit
                          </label>
                          <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                            value={currentEditStage.duration_unit}
                            onChange={(e) => setCurrentEditStage({ ...currentEditStage, duration_unit: e.target.value as 'hours' | 'days' })}
                          >
                            <option value="hours">Time (Hours)</option>
                            <option value="days">In Days</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            {currentEditStage.duration_unit === 'days' ? 'Time (Days)' : 'Time (Hours)'} *
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                            value={currentEditStage.time_hours || ''}
                            onChange={(e) => setCurrentEditStage({ ...currentEditStage, time_hours: e.target.value ? parseFloat(e.target.value) : null })}
                            placeholder={currentEditStage.duration_unit === 'days' ? 'e.g., 2.5' : 'e.g., 2.5'}
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddEditStage}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        Add Stage
                      </button>
                    </div>

                    {/* Stages List */}
                    {editFormData.manufacturing_process.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Added Stages ({editFormData.manufacturing_process.length})
                        </h4>
                        {editFormData.manufacturing_process.map((stage, index) => (
                          <div key={index} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-semibold text-sm">{index + 1}</span>
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{stage.step_name}</p>
                                {stage.time_hours && (
                                  <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{stage.time_hours} {stage.duration_unit === 'days' ? 'days' : 'hours'}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveEditStage(index)}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Remove stage"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleUpdateProduct}
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Update Product
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setProductToEdit(null);
                        setError('');
                      }}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
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

