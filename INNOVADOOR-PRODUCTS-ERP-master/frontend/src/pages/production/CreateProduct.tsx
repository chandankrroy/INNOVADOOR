import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useSidebar } from '../../context/SidebarContext';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { Plus, X, Clock, Edit, Trash2, Settings } from 'lucide-react';
import { useEffect } from 'react';

export default function CreateProduct() {
  const { isCollapsed, isHovered } = useSidebar();
  const navigate = useNavigate();

  useEffect(() => {
    loadStages();
  }, []);

  const loadStages = async (activeOnly: boolean = true) => {
    try {
      const stages = await api.get(`/production/stages?active_only=${activeOnly}`, true);
      setAvailableStages(stages);
    } catch (err: any) {
      console.error('Failed to load stages:', err);
    }
  };
  const [formData, setFormData] = useState({
    product_category: 'Shutter',
    name: '',
    post_form: '',
    variant: '',
    description: '',
    image: '',
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [manufacturingStages, setManufacturingStages] = useState<Array<{ step_name: string; time_hours: number | null; duration_unit: 'hours' | 'days' }>>([]);
  const [currentStage, setCurrentStage] = useState({ 
    step_name: '', 
    time_hours: 1 as number | null,
    duration_unit: 'days' as 'hours' | 'days'
  });
  const [availableStages, setAvailableStages] = useState<Array<{ id: number; stage_name: string; description: string | null; is_active: boolean }>>([]);
  const [showCreateStageModal, setShowCreateStageModal] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [newStageDescription, setNewStageDescription] = useState('');
  const [activeTab, setActiveTab] = useState<'create' | 'edit' | 'delete'>('create');
  const [editingStage, setEditingStage] = useState<{ id: number; stage_name: string; description: string | null } | null>(null);
  const [editStageName, setEditStageName] = useState('');
  const [editStageDescription, setEditStageDescription] = useState('');
  const [stageToDelete, setStageToDelete] = useState<{ id: number; stage_name: string } | null>(null);
  const [deleteStageCaptcha, setDeleteStageCaptcha] = useState('');
  const [deleteStageCaptchaInput, setDeleteStageCaptchaInput] = useState('');
  const [deleteStageCaptchaError, setDeleteStageCaptchaError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate required fields
    if (!formData.name) {
      setError('Please enter a name');
      return;
    }

    setIsLoading(true);
    try {
      // Map form data to backend schema
      const productData = {
        product_category: formData.product_category,
        product_type: formData.name, // Map name to product_type
        sub_type: formData.post_form || null, // Map post_form to sub_type
        variant: formData.variant || null,
        description: formData.description || null,
        // Store image in specifications if provided
        specifications: formData.image ? { image: formData.image } : null,
        // Include manufacturing process stages with time
        manufacturing_process: manufacturingStages.length > 0 
          ? manufacturingStages.map((stage, index) => ({
              step_name: stage.step_name,
              time_hours: stage.time_hours,
              duration_unit: stage.duration_unit,
              sequence: index + 1
            }))
          : null,
      };

      await api.post('/production/products', productData, true);
      navigate('/products');
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to create product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFormData({ ...formData, image: base64String });
      setImagePreview(base64String);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, image: '' });
    setImagePreview(null);
  };

  const handleAddStage = () => {
    if (!currentStage.step_name.trim()) {
      setError('Please select a stage');
      return;
    }
    if (!currentStage.time_hours || currentStage.time_hours <= 0) {
      setError('Please enter a valid duration time');
      return;
    }
    setManufacturingStages([...manufacturingStages, { ...currentStage }]);
    setCurrentStage({ step_name: '', time_hours: 1, duration_unit: 'days' });
    setError('');
  };

  const handleRemoveStage = (index: number) => {
    setManufacturingStages(manufacturingStages.filter((_, i) => i !== index));
  };

  const generateCaptcha = () => {
    // Generate a random 5-character alphanumeric CAPTCHA
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing characters
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateStage = async () => {
    if (!newStageName.trim()) {
      setError('Please enter a stage name');
      setSuccessMessage('');
      return;
    }
    try {
      await api.post('/production/stages', {
        stage_name: newStageName.trim(),
        description: newStageDescription.trim() || null,
        is_active: true
      }, true);
      setNewStageName('');
      setNewStageDescription('');
      setError('');
      setSuccessMessage('Stage Created Successfully');
      await loadStages(false); // Load all stages including inactive
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to create stage');
      setSuccessMessage('');
    }
  };

  const handleEditStage = (stage: { id: number; stage_name: string; description: string | null }) => {
    setEditingStage(stage);
    setEditStageName(stage.stage_name);
    setEditStageDescription(stage.description || '');
    setActiveTab('edit');
  };

  const handleUpdateStage = async () => {
    if (!editingStage || !editStageName.trim()) {
      setError('Please enter a stage name');
      return;
    }
    try {
      await api.put(`/production/stages/${editingStage.id}`, {
        stage_name: editStageName.trim(),
        description: editStageDescription.trim() || null
      }, true);
      setEditingStage(null);
      setEditStageName('');
      setEditStageDescription('');
      await loadStages(false); // Load all stages
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to update stage');
    }
  };

  const handleDeleteStageClick = (stage: { id: number; stage_name: string }) => {
    const newCaptcha = generateCaptcha();
    setDeleteStageCaptcha(newCaptcha);
    setDeleteStageCaptchaInput('');
    setDeleteStageCaptchaError('');
    setStageToDelete(stage);
    setActiveTab('delete');
  };

  const handleDeleteStage = async () => {
    if (!stageToDelete) return;

    // Validate CAPTCHA
    if (deleteStageCaptchaInput.toUpperCase() !== deleteStageCaptcha.toUpperCase()) {
      setDeleteStageCaptchaError('CAPTCHA code does not match. Please try again.');
      // Regenerate CAPTCHA
      const newCaptcha = generateCaptcha();
      setDeleteStageCaptcha(newCaptcha);
      setDeleteStageCaptchaInput('');
      return;
    }

    try {
      await api.delete(`/production/stages/${stageToDelete.id}`, true);
      setStageToDelete(null);
      setDeleteStageCaptchaInput('');
      setDeleteStageCaptchaError('');
      setDeleteStageCaptcha('');
      await loadStages(false); // Load all stages
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to delete stage');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Create Product</h1>
            <p className="text-gray-600 mt-2">Add a new product to the system</p>
          </div>

          <div className="bg-white rounded-lg shadow max-w-4xl">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Category *
                </label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.product_category}
                  onChange={(e) => {
                    setFormData({ ...formData, product_category: e.target.value, name: '', post_form: '', variant: '', image: '' });
                    setImagePreview(null);
                  }}
                >
                  <option value="Shutter">Shutter</option>
                  <option value="Frame">Frame</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.product_category === 'Shutter' ? 'Name Shutter' : 'Frame Name'} *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={formData.product_category === 'Shutter' ? 'Enter shutter name...' : 'Enter frame name...'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Post Form / Non Post Form
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.post_form}
                  onChange={(e) => setFormData({ ...formData, post_form: e.target.value })}
                >
                  <option value="">-- Select --</option>
                  <option value="Post Form">Post Form</option>
                  <option value="Non Post Form">Non Post Form</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image of {formData.product_category === 'Shutter' ? 'Shutter' : 'Frame'}
                </label>
                {!imagePreview ? (
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="image-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span>Upload an image</span>
                          <input
                            id="image-upload"
                            name="image-upload"
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handleImageUpload}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 relative">
                    <img
                      src={imagePreview}
                      alt={formData.product_category === 'Shutter' ? 'Shutter' : 'Frame'}
                      className="w-full h-64 object-contain border border-gray-300 rounded-md"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Product description..."
                />
              </div>

              {/* Manufacturing Process Stages */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Manufacturing Process Stages
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCreateStageModal(true)}
                    className="text-sm font-bold text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                    title="Stage settings"
                  >
                    <Settings className="w-4 h-4" />
                    Stage Setting
                  </button>
                </div>
                
                {/* Add Stage Form */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Stage *
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                        value={currentStage.step_name}
                        onChange={(e) => setCurrentStage({ ...currentStage, step_name: e.target.value })}
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
                        value={currentStage.duration_unit}
                        onChange={(e) => setCurrentStage({ ...currentStage, duration_unit: e.target.value as 'hours' | 'days' })}
                      >
                        <option value="hours">Time (Hours)</option>
                        <option value="days">In Days</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {currentStage.duration_unit === 'days' ? 'Time (Days)' : 'Time (Hours)'} *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                        value={currentStage.time_hours || ''}
                        onChange={(e) => setCurrentStage({ ...currentStage, time_hours: e.target.value ? parseFloat(e.target.value) : null })}
                        placeholder={currentStage.duration_unit === 'days' ? 'e.g., 2.5' : 'e.g., 2.5'}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddStage}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Stage
                  </button>
                </div>

                {/* Stages List */}
                {manufacturingStages.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Added Stages ({manufacturingStages.length})
                    </h4>
                    {manufacturingStages.map((stage, index) => (
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
                          onClick={() => handleRemoveStage(index)}
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

              {/* Stage Setting Modal */}
              {showCreateStageModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                      <h3 className="text-lg font-semibold text-gray-900">Stage Setting</h3>
                      <button
                        onClick={() => {
                          setShowCreateStageModal(false);
                          setNewStageName('');
                          setNewStageDescription('');
                          setEditStageName('');
                          setEditStageDescription('');
                          setEditingStage(null);
                          setStageToDelete(null);
                          setActiveTab('create');
                          setError('');
                          setSuccessMessage('');
                          loadStages(true); // Reload active stages only
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    {/* Tabs */}
                    <div className="border-b border-gray-200 px-6">
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('create');
                            setEditingStage(null);
                            setStageToDelete(null);
                            setError('');
                            setSuccessMessage('');
                          }}
                          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'create'
                              ? 'border-blue-600 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          Create Stage
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('edit');
                            setEditingStage(null);
                            setStageToDelete(null);
                            setError('');
                            setSuccessMessage('');
                            loadStages(false);
                          }}
                          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'edit'
                              ? 'border-blue-600 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          Edit Stage
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('delete');
                            setEditingStage(null);
                            setStageToDelete(null);
                            setDeleteStageCaptchaInput('');
                            setDeleteStageCaptchaError('');
                            setDeleteStageCaptcha('');
                            setError('');
                            setSuccessMessage('');
                            loadStages(false);
                          }}
                          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'delete'
                              ? 'border-blue-600 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          Delete Stage
                        </button>
                      </div>
                    </div>

                    <div className="p-6">
                      {error && (
                        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                          {error}
                        </div>
                      )}
                      {successMessage && (
                        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                          {successMessage}
                        </div>
                      )}

                      {/* Create Stage Tab */}
                      {activeTab === 'create' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Stage Name *
                            </label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              value={newStageName}
                              onChange={(e) => setNewStageName(e.target.value)}
                              placeholder="e.g., Material Unloading, Sanding, Cutting..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Description
                            </label>
                            <textarea
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              value={newStageDescription}
                              onChange={(e) => setNewStageDescription(e.target.value)}
                              placeholder="Optional description..."
                            />
                          </div>
                          <div className="flex gap-3 pt-2">
                            <button
                              type="button"
                              onClick={handleCreateStage}
                              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                              Create Stage
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Edit Stage Tab */}
                      {activeTab === 'edit' && (
                        <div className="space-y-4">
                          {editingStage ? (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Stage Name *
                                </label>
                                <input
                                  type="text"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                  value={editStageName}
                                  onChange={(e) => setEditStageName(e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Description
                                </label>
                                <textarea
                                  rows={3}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                  value={editStageDescription}
                                  onChange={(e) => setEditStageDescription(e.target.value)}
                                  placeholder="Optional description..."
                                />
                              </div>
                              <div className="flex gap-3 pt-2">
                                <button
                                  type="button"
                                  onClick={handleUpdateStage}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                  Update Stage
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingStage(null);
                                    setEditStageName('');
                                    setEditStageDescription('');
                                  }}
                                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                                >
                                  Cancel
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-sm text-gray-600 mb-4">Select a stage to edit:</p>
                              {availableStages.map((stage) => (
                                <div
                                  key={stage.id}
                                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                                >
                                  <div>
                                    <p className="font-medium text-gray-900">{stage.stage_name}</p>
                                    {stage.description && (
                                      <p className="text-sm text-gray-500">{stage.description}</p>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleEditStage(stage)}
                                    className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                  >
                                    <Edit className="w-4 h-4" />
                                    Edit
                                  </button>
                                </div>
                              ))}
                              {availableStages.length === 0 && (
                                <p className="text-sm text-gray-500 text-center py-4">No stages available</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Delete Stage Tab */}
                      {activeTab === 'delete' && (
                        <div className="space-y-4">
                          {stageToDelete ? (
                            <>
                              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-sm text-gray-700 mb-2">
                                  Are you sure you want to delete the stage <span className="font-semibold">"{stageToDelete.stage_name}"</span>?
                                </p>
                                <p className="text-xs text-red-600">This action cannot be undone.</p>
                              </div>
                              
                              {/* CAPTCHA Section */}
                              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                <label className="block text-sm font-medium text-gray-700">
                                  Enter CAPTCHA Code *
                                </label>
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 bg-white border-2 border-gray-300 rounded px-4 py-3 text-center">
                                    <span className="text-2xl font-bold text-gray-800 tracking-widest select-none">
                                      {deleteStageCaptcha}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newCaptcha = generateCaptcha();
                                      setDeleteStageCaptcha(newCaptcha);
                                      setDeleteStageCaptchaInput('');
                                      setDeleteStageCaptchaError('');
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
                                    deleteStageCaptchaError
                                      ? 'border-red-500 focus:ring-red-500'
                                      : 'border-gray-300 focus:ring-blue-500'
                                  }`}
                                  placeholder="Enter CAPTCHA code"
                                  value={deleteStageCaptchaInput}
                                  onChange={(e) => {
                                    setDeleteStageCaptchaInput(e.target.value);
                                    setDeleteStageCaptchaError('');
                                  }}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      handleDeleteStage();
                                    }
                                  }}
                                  autoFocus
                                />
                                {deleteStageCaptchaError && (
                                  <p className="text-sm text-red-600">{deleteStageCaptchaError}</p>
                                )}
                              </div>
                              
                              <div className="flex gap-3 pt-2">
                                <button
                                  type="button"
                                  onClick={handleDeleteStage}
                                  disabled={!deleteStageCaptchaInput.trim()}
                                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Delete Stage
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setStageToDelete(null);
                                    setDeleteStageCaptchaInput('');
                                    setDeleteStageCaptchaError('');
                                    setDeleteStageCaptcha('');
                                  }}
                                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                                >
                                  Cancel
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-sm text-gray-600 mb-4">Select a stage to delete:</p>
                              {availableStages.map((stage) => (
                                <div
                                  key={stage.id}
                                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                                >
                                  <div>
                                    <p className="font-medium text-gray-900">{stage.stage_name}</p>
                                    {stage.description && (
                                      <p className="text-sm text-gray-500">{stage.description}</p>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteStageClick(stage)}
                                    className="px-3 py-1 text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                  </button>
                                </div>
                              ))}
                              {availableStages.length === 0 && (
                                <p className="text-sm text-gray-500 text-center py-4">No stages available</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating...' : 'Create Product'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/products')}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

