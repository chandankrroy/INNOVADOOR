import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useSidebar } from '../../context/SidebarContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { Eye, Trash2, RotateCcw, Search, CheckCircle } from 'lucide-react';

type MeasurementItem = {
  [key: string]: any;
};

type Measurement = {
  id: number;
  measurement_type: string;
  measurement_number: string;
  party_name: string | null;
  party_id: number | null;
  thickness: string | null;
  measurement_date: string | null;
  items: MeasurementItem[] | string;
  notes: string | null;
  approval_status?: string;
  is_deleted?: boolean;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string | null;
  created_by_username: string | null;
};

export default function Measurements() {
  const { isCollapsed, isHovered } = useSidebar();
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [deletedMeasurements, setDeletedMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRecoverModal, setShowRecoverModal] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [measurementToDelete, setMeasurementToDelete] = useState<{ id: number; number: string } | null>(null);
  const [measurementToRecover, setMeasurementToRecover] = useState<{ id: number; number: string } | null>(null);
  const [captchaCode, setCaptchaCode] = useState('');
  const [userCaptchaInput, setUserCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const [deletionReason, setDeletionReason] = useState('');
  const [recoverCaptchaCode, setRecoverCaptchaCode] = useState('');
  const [recoverCaptchaInput, setRecoverCaptchaInput] = useState('');
  const [recoverCaptchaError, setRecoverCaptchaError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCreatedBy, setFilterCreatedBy] = useState<string>('all');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    // If not authenticated, redirect to login
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Load measurements once authenticated
    loadMeasurements();
  }, [authLoading, currentUser, navigate]);

  const loadMeasurements = async () => {
    try {
      setLoading(true);
      setError('');
      const [activeData, deletedData] = await Promise.all([
        api.get('/production/measurements?include_deleted=false', true),
        api.get('/production/measurements?include_deleted=true', true)
      ]);
      const active = (activeData || []).filter((m: Measurement) => !m.is_deleted);
      const deleted = (deletedData || []).filter((m: Measurement) => m.is_deleted);
      setMeasurements(active);
      setDeletedMeasurements(deleted);
    } catch (err: any) {
      // If authentication error, redirect to login
      if (err.message?.includes('authentication') || err.message?.includes('token') || err.message?.includes('login')) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        navigate('/login');
        return;
      }
      setError(err.message || 'Failed to load measurements');
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverClick = (measurementId: number, measurementNumber: string) => {
    const newCaptcha = generateCaptcha();
    setRecoverCaptchaCode(newCaptcha);
    setRecoverCaptchaInput('');
    setRecoverCaptchaError('');
    setMeasurementToRecover({ id: measurementId, number: measurementNumber });
    setShowRecoverModal(true);
  };

  const handleRecoverConfirm = async () => {
    if (!measurementToRecover) return;

    // Validate CAPTCHA
    if (recoverCaptchaInput.toUpperCase() !== recoverCaptchaCode.toUpperCase()) {
      setRecoverCaptchaError('CAPTCHA code does not match. Please try again.');
      // Regenerate CAPTCHA
      const newCaptcha = generateCaptcha();
      setRecoverCaptchaCode(newCaptcha);
      setRecoverCaptchaInput('');
      return;
    }

    try {
      // If id is 0, it means recover all
      if (measurementToRecover.id === 0) {
        await Promise.all(
          deletedMeasurements.map(m => api.post(`/production/measurements/${m.id}/recover`, {}, true))
        );
        alert('All measurements recovered successfully!');
      } else {
        await api.post(`/production/measurements/${measurementToRecover.id}/recover`, {}, true);
        alert('Measurement recovered successfully!');
      }
      loadMeasurements(); // Reload to refresh the list
      setShowRecoverModal(false);
      setMeasurementToRecover(null);
      setRecoverCaptchaInput('');
      setRecoverCaptchaError('');
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message || 'Failed to recover measurement');
    }
  };

  const handleRecoverCancel = () => {
    setShowRecoverModal(false);
    setMeasurementToRecover(null);
    setRecoverCaptchaInput('');
    setRecoverCaptchaError('');
    setRecoverCaptchaCode('');
  };

  const getMeasurementTypeLabel = (type: string): string => {
    const labels: { [key: string]: string } = {
      frame_sample: 'Sample Frame',
      shutter_sample: 'Sample Shutter',
      regular_frame: 'Regular Frame',
      regular_shutter: 'Regular Shutter',
    };
    return labels[type] || type;
  };

  const getItemsCount = (items: MeasurementItem[] | string): number => {
    if (Array.isArray(items)) {
      return items.length;
    }
    if (typeof items === 'string') {
      try {
        const parsed = JSON.parse(items);
        return Array.isArray(parsed) ? parsed.length : 0;
      } catch {
        return 0;
      }
    }
    return 0;
  };

  // Filter measurements based on search term and filters
  const filterMeasurements = (measurements: Measurement[]): Measurement[] => {
    let filtered = measurements;
    
    // Apply search term filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((measurement) => {
        const measurementNumber = (measurement.measurement_number || '').toLowerCase();
        const partyName = (measurement.party_name || '').toLowerCase();
        const type = getMeasurementTypeLabel(measurement.measurement_type).toLowerCase();
        const createdBy = (measurement.created_by_username || '').toLowerCase();
        
        return (
          measurementNumber.includes(searchLower) ||
          partyName.includes(searchLower) ||
          type.includes(searchLower) ||
          createdBy.includes(searchLower)
        );
      });
    }
    
    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter((measurement) => measurement.measurement_type === filterType);
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((measurement) => {
        if (filterStatus === 'pending') {
          return measurement.approval_status === 'pending_approval';
        } else if (filterStatus === 'approved') {
          return measurement.approval_status === 'approved';
        } else if (filterStatus === 'rejected') {
          return measurement.approval_status === 'rejected';
        }
        return true;
      });
    }
    
    // Apply created by filter
    if (filterCreatedBy !== 'all') {
      filtered = filtered.filter((measurement) => 
        (measurement.created_by_username || '').toLowerCase() === filterCreatedBy.toLowerCase()
      );
    }
    
    // Apply date filter
    if (filterStartDate || filterEndDate) {
      filtered = filtered.filter((measurement) => {
        if (!measurement.created_at) return false;
        
        const createdDate = new Date(measurement.created_at);
        createdDate.setHours(0, 0, 0, 0); // Set to start of day for comparison
        
        if (filterStartDate) {
          const startDate = new Date(filterStartDate);
          startDate.setHours(0, 0, 0, 0);
          if (createdDate < startDate) return false;
        }
        
        if (filterEndDate) {
          const endDate = new Date(filterEndDate);
          endDate.setHours(23, 59, 59, 999); // Set to end of day for comparison
          if (createdDate > endDate) return false;
        }
        
        return true;
      });
    }
    
    return filtered;
  };
  
  // Get unique creators for filter dropdown
  const getUniqueCreators = (): string[] => {
    const creators = new Set<string>();
    measurements.forEach((m) => {
      if (m.created_by_username) {
        creators.add(m.created_by_username);
      }
    });
    return Array.from(creators).sort();
  };

  const filteredMeasurements = filterMeasurements(measurements);
  const filteredDeletedMeasurements = filterMeasurements(deletedMeasurements);

  const generateCaptcha = () => {
    // Generate a random 5-character alphanumeric CAPTCHA
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing characters
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleDeleteClick = (measurementId: number, measurementNumber: string) => {
    const newCaptcha = generateCaptcha();
    setCaptchaCode(newCaptcha);
    setUserCaptchaInput('');
    setCaptchaError('');
    setDeletionReason('');
    setMeasurementToDelete({ id: measurementId, number: measurementNumber });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!measurementToDelete) return;

    // Validate deletion reason
    if (!deletionReason.trim()) {
      alert('Please provide a reason for deletion');
      return;
    }

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
      await api.delete(`/production/measurements/${measurementToDelete.id}`, {
        deletion_reason: deletionReason.trim()
      }, true);
      // Reload measurements after deletion
      loadMeasurements();
      setShowDeleteModal(false);
      setMeasurementToDelete(null);
      setUserCaptchaInput('');
      setCaptchaError('');
      setDeletionReason('');
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message || 'Failed to delete measurement');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setMeasurementToDelete(null);
    setUserCaptchaInput('');
    setCaptchaError('');
    setCaptchaCode('');
    setDeletionReason('');
  };

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Measurements</h1>
            <p className="text-gray-600 mt-2">View and manage all measurements</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {showDeleted ? 'Deleted Measurements' : 'All Measurements'}
                  </h2>
                  <button
                    onClick={() => setShowDeleted(!showDeleted)}
                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    {showDeleted ? 'Show Active' : 'Show Deleted'}
                  </button>
                  {showDeleted && deletedMeasurements.length > 0 && (
                    <button
                      onClick={() => {
                        const newCaptcha = generateCaptcha();
                        setRecoverCaptchaCode(newCaptcha);
                        setRecoverCaptchaInput('');
                        setRecoverCaptchaError('');
                        setMeasurementToRecover({ id: 0, number: `All ${deletedMeasurements.length} measurements` });
                        setShowRecoverModal(true);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors inline-flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Recover All
                    </button>
                  )}
                </div>
                <Link
                  to="/measurements/create"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors inline-block"
                >
                  + Create New
                </Link>
              </div>
              
              {/* Search Bar */}
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by measurement number, party name, type, or creator..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <span className="text-gray-400 hover:text-gray-600 text-sm">Clear</span>
                  </button>
                )}
              </div>
              
              {/* Filters */}
              <div className="space-y-4 mb-4">
                {/* First Row: Type, Status, Created By */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Measurement Type Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Measurement Type
                    </label>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Types</option>
                      <option value="frame_sample">Sample Frame</option>
                      <option value="shutter_sample">Sample Shutter</option>
                      <option value="regular_frame">Regular Frame</option>
                      <option value="regular_shutter">Regular Shutter</option>
                    </select>
                  </div>
                  
                  {/* Approval Status Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Approval Status
                    </label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending Approval</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  
                  {/* Created By Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Created By
                    </label>
                    <select
                      value={filterCreatedBy}
                      onChange={(e) => setFilterCreatedBy(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Creators</option>
                      {getUniqueCreators().map((creator) => (
                        <option key={creator} value={creator}>
                          {creator}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Second Row: Date Range Filter */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Start Date Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Created From Date
                    </label>
                    <input
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  {/* End Date Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Created To Date
                    </label>
                    <input
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      min={filterStartDate || undefined}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Clear Filters Button */}
              {(filterType !== 'all' || filterStatus !== 'all' || filterCreatedBy !== 'all' || filterStartDate || filterEndDate || searchTerm) && (
                <div className="mb-4">
                  <button
                    onClick={() => {
                      setFilterType('all');
                      setFilterStatus('all');
                      setFilterCreatedBy('all');
                      setFilterStartDate('');
                      setFilterEndDate('');
                      setSearchTerm('');
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">Loading measurements...</p>
              </div>
            ) : (showDeleted ? filteredDeletedMeasurements : filteredMeasurements).length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 mb-4">
                  {searchTerm 
                    ? `No measurements found matching "${searchTerm}"`
                    : (showDeleted ? 'No deleted measurements found' : 'No measurements found')
                  }
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Clear search
                  </button>
                )}
                {!showDeleted && !searchTerm && (
                  <Link
                    to="/measurements/create"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Create your first measurement
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Measurement Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Party Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Items Count
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Approval Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {showDeleted ? 'Deleted' : 'Created'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(showDeleted ? filteredDeletedMeasurements : filteredMeasurements).map((measurement) => (
                      <tr 
                        key={measurement.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/measurements/${measurement.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {measurement.measurement_number || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {getMeasurementTypeLabel(measurement.measurement_type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {measurement.party_name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {getItemsCount(measurement.items)} items
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {measurement.created_by_username || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {measurement.approval_status === 'approved' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Approved
                            </span>
                          ) : measurement.approval_status === 'rejected' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Rejected
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-400 text-yellow-900">
                              Pending Approval
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {showDeleted && measurement.deleted_at
                            ? new Date(measurement.deleted_at).toLocaleString('en-GB', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })
                            : measurement.created_at 
                            ? new Date(measurement.created_at).toLocaleString('en-GB', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            {!showDeleted && (
                              <>
                                {measurement.approval_status === 'pending_approval' && (
                                  <>
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                          await api.post(`/production/measurements/${measurement.id}/approve`, {}, true);
                                          alert('Measurement approved successfully!');
                                          loadMeasurements();
                                        } catch (err: any) {
                                          alert(err.response?.data?.detail || err.message || 'Failed to approve measurement');
                                        }
                                      }}
                                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                      title="Approve measurement"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                      Approve
                                    </button>
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        const reason = prompt('Please provide a reason for rejection:');
                                        if (reason && reason.trim()) {
                                          try {
                                            await api.post(`/production/measurements/${measurement.id}/reject`, { rejection_reason: reason.trim() }, true);
                                            alert('Measurement rejected successfully!');
                                            loadMeasurements();
                                          } catch (err: any) {
                                            alert(err.response?.data?.detail || err.message || 'Failed to reject measurement');
                                          }
                                        }
                                      }}
                                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                                      title="Reject measurement"
                                    >
                                      <span className="w-4 h-4">✕</span>
                                      Reject
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/measurements/${measurement.id}`);
                                  }}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                  title="View measurement details"
                                >
                                  <Eye className="w-4 h-4" />
                                  View
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteClick(measurement.id, measurement.measurement_number);
                                  }}
                                  className="inline-flex items-center justify-center p-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                                  title="Delete measurement"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {showDeleted && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/measurements/${measurement.id}`);
                                  }}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                  title="View measurement details"
                                >
                                  <Eye className="w-4 h-4" />
                                  View
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRecoverClick(measurement.id, measurement.measurement_number);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                                  title="Recover measurement"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                  Recover
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Delete Confirmation Modal with CAPTCHA */}
          {showDeleteModal && measurementToDelete && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Delete Measurement</h3>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-gray-700">
                    Are you sure you want to delete measurement <span className="font-semibold">"{measurementToDelete.number}"</span>?
                    This action cannot be undone.
                  </p>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Reason for Deletion <span className="text-red-500">*</span>:
                    </label>
                    <textarea
                      value={deletionReason}
                      onChange={(e) => setDeletionReason(e.target.value)}
                      placeholder="Please provide a reason for deleting this measurement..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Enter CAPTCHA Code:
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-md text-center">
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
                      value={userCaptchaInput}
                      onChange={(e) => {
                        setUserCaptchaInput(e.target.value);
                        setCaptchaError('');
                      }}
                      placeholder="Enter CAPTCHA code"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && userCaptchaInput.trim()) {
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
                      disabled={!userCaptchaInput.trim() || !deletionReason.trim()}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Delete Measurement
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

          {/* Recover Confirmation Modal with CAPTCHA */}
          {showRecoverModal && measurementToRecover && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Recover Measurement</h3>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-gray-700">
                    {measurementToRecover.id === 0 
                      ? `Are you sure you want to recover ${measurementToRecover.number}?`
                      : (
                        <>
                          Are you sure you want to recover measurement <span className="font-semibold">"{measurementToRecover.number}"</span>?
                        </>
                      )
                    }
                  </p>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Enter CAPTCHA Code:
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-md text-center">
                        <span className="text-2xl font-bold text-gray-800 tracking-widest select-none">
                          {recoverCaptchaCode}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newCaptcha = generateCaptcha();
                          setRecoverCaptchaCode(newCaptcha);
                          setRecoverCaptchaInput('');
                          setRecoverCaptchaError('');
                        }}
                        className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 underline"
                        title="Refresh CAPTCHA"
                      >
                        Refresh
                      </button>
                    </div>
                    <input
                      type="text"
                      value={recoverCaptchaInput}
                      onChange={(e) => {
                        setRecoverCaptchaInput(e.target.value);
                        setRecoverCaptchaError('');
                      }}
                      placeholder="Enter CAPTCHA code"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && recoverCaptchaInput.trim()) {
                          handleRecoverConfirm();
                        }
                      }}
                      autoFocus
                    />
                    {recoverCaptchaError && (
                      <p className="text-sm text-red-600">{recoverCaptchaError}</p>
                    )}
                  </div>
                  
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleRecoverConfirm}
                      disabled={!recoverCaptchaInput.trim()}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Recover Measurement
                    </button>
                    <button
                      type="button"
                      onClick={handleRecoverCancel}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
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

