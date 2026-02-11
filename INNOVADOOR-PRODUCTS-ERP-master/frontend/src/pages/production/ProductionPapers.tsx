import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useSidebar } from '../../context/SidebarContext';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { Eye, Plus, Search, X, Filter, ChevronDown, Trash2, RotateCcw } from 'lucide-react';

type ProductionPaper = {
  id: number;
  paper_number: string;
  title: string;
  description: string | null;
  party_id: number | null;
  measurement_id: number | null;
  status: string;
  created_at: string;
  is_deleted?: boolean;
  deleted_at?: string | null;
  deletion_reason?: string | null;
  party?: {
    id: number;
    name: string;
  } | null;
  measurement?: {
    id: number;
    measurement_number: string;
    party_name: string | null;
  } | null;
};

type Party = {
  id: number;
  name: string;
  display_name: string | null;
};

export default function ProductionPapers() {
  const { isCollapsed, isHovered } = useSidebar();
  const navigate = useNavigate();
  const [papers, setPapers] = useState<ProductionPaper[]>([]);
  const [deletedPapers, setDeletedPapers] = useState<ProductionPaper[]>([]);
  const [filteredPapers, setFilteredPapers] = useState<ProductionPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterParty, setFilterParty] = useState<string>('All');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [parties, setParties] = useState<Party[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [partySearchQuery, setPartySearchQuery] = useState('');
  const [isPartyDropdownOpen, setIsPartyDropdownOpen] = useState(false);
  const partyDropdownRef = useRef<HTMLDivElement>(null);
  
  // Soft delete states
  const [showDeleted, setShowDeleted] = useState(false);
  const [paperToDelete, setPaperToDelete] = useState<{ id: number; number: string } | null>(null);
  const [paperToRecover, setPaperToRecover] = useState<{ id: number; number: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRecoverModal, setShowRecoverModal] = useState(false);
  const [captchaCode, setCaptchaCode] = useState('');
  const [userCaptchaInput, setUserCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const [deletionReason, setDeletionReason] = useState('');
  const [recoverCaptchaCode, setRecoverCaptchaCode] = useState('');
  const [recoverCaptchaInput, setRecoverCaptchaInput] = useState('');
  const [recoverCaptchaError, setRecoverCaptchaError] = useState('');

  useEffect(() => {
    loadPapers();
    loadParties();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [papers, searchQuery, filterStatus, filterParty, filterDateFrom, filterDateTo]);

  // Close party dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (partyDropdownRef.current && !partyDropdownRef.current.contains(event.target as Node)) {
        setIsPartyDropdownOpen(false);
      }
    };

    if (isPartyDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPartyDropdownOpen]);

  const loadPapers = async () => {
    try {
      setLoading(true);
      const data = await api.get('/production/production-papers', true);
      setPapers(data);
      setFilteredPapers(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load production papers');
    } finally {
      setLoading(false);
    }
  };

  const loadParties = async () => {
    try {
      const data = await api.get('/production/parties?limit=1000', true);
      setParties(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load parties:', err);
    }
  };

  const applyFilters = () => {
    let filtered = [...papers];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(paper => {
        const paperNumber = paper.paper_number?.toLowerCase() || '';
        const title = paper.title?.toLowerCase() || '';
        const description = paper.description?.toLowerCase() || '';
        const partyName = paper.party?.name?.toLowerCase() || '';
        const measurementNumber = paper.measurement?.measurement_number?.toLowerCase() || '';
        
        return paperNumber.includes(query) ||
               title.includes(query) ||
               description.includes(query) ||
               partyName.includes(query) ||
               measurementNumber.includes(query);
      });
    }

    // Status filter
    if (filterStatus !== 'All') {
      filtered = filtered.filter(paper => paper.status === filterStatus.toLowerCase());
    }

    // Party filter
    if (filterParty !== 'All') {
      const partyId = parseInt(filterParty);
      filtered = filtered.filter(paper => paper.party_id === partyId);
    }

    // Date range filter
    if (filterDateFrom) {
      const fromDate = new Date(filterDateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(paper => {
        const paperDate = new Date(paper.created_at);
        paperDate.setHours(0, 0, 0, 0);
        return paperDate >= fromDate;
      });
    }

    if (filterDateTo) {
      const toDate = new Date(filterDateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(paper => {
        const paperDate = new Date(paper.created_at);
        return paperDate <= toDate;
      });
    }

    setFilteredPapers(filtered);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterStatus('All');
    setFilterParty('All');
    setFilterDateFrom('');
    setFilterDateTo('');
    setPartySearchQuery('');
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

  const handleDeleteClick = (paperId: number, paperNumber: string) => {
    const newCaptcha = generateCaptcha();
    setCaptchaCode(newCaptcha);
    setUserCaptchaInput('');
    setCaptchaError('');
    setDeletionReason('');
    setPaperToDelete({ id: paperId, number: paperNumber });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!paperToDelete) return;

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
      await api.delete(`/production/production-papers/${paperToDelete.id}`, {
        deletion_reason: deletionReason.trim() || null
      }, true);
      // Reload papers after deletion
      await loadPapers();
      setShowDeleteModal(false);
      setPaperToDelete(null);
      setUserCaptchaInput('');
      setDeletionReason('');
      setCaptchaError('');
      setError('');
      // Show success message
      alert('Production paper deleted successfully!');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to delete production paper';
      setError(errorMessage);
      // Show error in alert as well
      alert(`Error: ${errorMessage}`);
      console.error('Delete error:', err);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setPaperToDelete(null);
    setUserCaptchaInput('');
    setDeletionReason('');
    setCaptchaError('');
  };

  const handleRecoverClick = (paperId: number, paperNumber: string) => {
    const newCaptcha = generateCaptcha();
    setRecoverCaptchaCode(newCaptcha);
    setRecoverCaptchaInput('');
    setRecoverCaptchaError('');
    setPaperToRecover({ id: paperId, number: paperNumber });
    setShowRecoverModal(true);
  };

  const handleRecoverConfirm = async () => {
    if (!paperToRecover) return;

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
      if (paperToRecover.id === 0) {
        await Promise.all(
          deletedPapers.map(p => api.post(`/production/production-papers/${p.id}/recover`, {}, true))
        );
        alert('All production papers recovered successfully!');
      } else {
        await api.post(`/production/production-papers/${paperToRecover.id}/recover`, {}, true);
        alert('Production paper recovered successfully!');
      }
      loadPapers(); // Reload to refresh the list
      setShowRecoverModal(false);
      setPaperToRecover(null);
      setRecoverCaptchaInput('');
      setRecoverCaptchaError('');
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message || 'Failed to recover production paper');
    }
  };

  const handleRecoverCancel = () => {
    setShowRecoverModal(false);
    setPaperToRecover(null);
    setRecoverCaptchaInput('');
    setRecoverCaptchaError('');
    setRecoverCaptchaCode('');
  };

  // Filter parties based on search query
  const filteredParties = parties.filter(party => {
    if (!partySearchQuery.trim()) return true;
    const query = partySearchQuery.toLowerCase();
    const name = (party.name || '').toLowerCase();
    const displayName = (party.display_name || '').toLowerCase();
    return name.includes(query) || displayName.includes(query);
  });

  const getSelectedPartyName = () => {
    if (filterParty === 'All') return 'All';
    const party = parties.find(p => p.id.toString() === filterParty);
    return party ? (party.display_name || party.name) : 'All';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
        <Navbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-8">
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Production Papers</h1>
                <p className="text-gray-600 mt-2">View and manage all production papers</p>
              </div>
              <Link
                to="/production-papers/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors font-medium shadow-sm"
              >
                <Plus className="w-5 h-5" />
                Create Production Paper
              </Link>
            </div>
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
                    {showDeleted ? 'Deleted Production Papers' : 'All Production Papers'}
                  </h2>
                  <button
                    onClick={() => setShowDeleted(!showDeleted)}
                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    {showDeleted ? 'Show Active' : 'Show Deleted'}
                  </button>
                  {showDeleted && deletedPapers.length > 0 && (
                    <button
                      onClick={() => {
                        const newCaptcha = generateCaptcha();
                        setRecoverCaptchaCode(newCaptcha);
                        setRecoverCaptchaInput('');
                        setRecoverCaptchaError('');
                        setPaperToRecover({ id: 0, number: `All ${deletedPapers.length} production papers` });
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
                  to="/production-papers/create"
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors inline-block"
                >
                  + Create New
                </Link>
              </div>

              {/* Search Bar */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by paper number, title, description, party, or measurement..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Toggle Button */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                  {(filterStatus !== 'All' || filterParty !== 'All' || filterDateFrom || filterDateTo) && (
                    <span className="ml-1 px-2 py-0.5 text-xs bg-purple-600 text-white rounded-full">
                      {[filterStatus !== 'All' ? 1 : 0, filterParty !== 'All' ? 1 : 0, filterDateFrom ? 1 : 0, filterDateTo ? 1 : 0].reduce((a, b) => a + b, 0)}
                    </span>
                  )}
                </button>
                {(filterStatus !== 'All' || filterParty !== 'All' || filterDateFrom || filterDateTo || searchQuery) && (
                  <button
                    onClick={handleClearFilters}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Filters Panel */}
              {showFilters && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Status Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="All">All</option>
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    {/* Party Filter */}
                    <div className="relative" ref={partyDropdownRef}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Party
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsPartyDropdownOpen(!isPartyDropdownOpen)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-left flex items-center justify-between"
                      >
                        <span className={filterParty === 'All' ? 'text-gray-500' : 'text-gray-900'}>
                          {getSelectedPartyName()}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isPartyDropdownOpen ? 'transform rotate-180' : ''}`} />
                      </button>
                      
                      {isPartyDropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
                          <div className="p-2 border-b border-gray-200">
                            <div className="relative">
                              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <input
                                type="text"
                                placeholder="Search party..."
                                value={partySearchQuery}
                                onChange={(e) => setPartySearchQuery(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                autoFocus
                              />
                              {partySearchQuery && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPartySearchQuery('');
                                  }}
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="overflow-y-auto max-h-48">
                            <button
                              type="button"
                              onClick={() => {
                                setFilterParty('All');
                                setIsPartyDropdownOpen(false);
                                setPartySearchQuery('');
                              }}
                              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                                filterParty === 'All' ? 'bg-purple-50 text-purple-700 font-medium' : 'text-gray-900'
                              }`}
                            >
                              All
                            </button>
                            {filteredParties.length > 0 ? (
                              filteredParties.map(party => (
                                <button
                                  key={party.id}
                                  type="button"
                                  onClick={() => {
                                    setFilterParty(party.id.toString());
                                    setIsPartyDropdownOpen(false);
                                    setPartySearchQuery('');
                                  }}
                                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                                    filterParty === party.id.toString() ? 'bg-purple-50 text-purple-700 font-medium' : 'text-gray-900'
                                  }`}
                                >
                                  {party.display_name || party.name}
                                </button>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                                No parties found
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Date From Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Created From
                      </label>
                      <input
                        type="date"
                        value={filterDateFrom}
                        onChange={(e) => setFilterDateFrom(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Date To Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Created To
                      </label>
                      <input
                        type="date"
                        value={filterDateTo}
                        onChange={(e) => setFilterDateTo(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">Loading production papers...</p>
              </div>
            ) : filteredPapers.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 mb-4">
                  {papers.length === 0 
                    ? 'No production papers found' 
                    : 'No production papers match your filters'}
                </p>
                {papers.length === 0 && (
                  <Link
                    to="/production-papers/create"
                    className="text-purple-600 hover:text-purple-700"
                  >
                    Create your first production paper
                  </Link>
                )}
                {(searchQuery || filterStatus !== 'All' || filterParty !== 'All' || filterDateFrom || filterDateTo) && (
                  <button
                    onClick={handleClearFilters}
                    className="mt-2 text-purple-600 hover:text-purple-700"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                  <p className="text-sm text-gray-600">
                    Showing <span className="font-semibold">{filteredPapers.length}</span> of <span className="font-semibold">{showDeleted ? deletedPapers.length : papers.length}</span> production papers
                  </p>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Paper Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Party
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Measurement
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
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
                    {filteredPapers.map((paper) => (
                      <tr 
                        key={paper.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/production-papers/${paper.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {paper.paper_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {paper.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {paper.party ? (
                            <span className="text-gray-900">{paper.party.name}</span>
                          ) : paper.party_id ? (
                            <span className="text-gray-400">Party ID: {paper.party_id}</span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {paper.measurement ? (
                            <div>
                              <div className="text-gray-900">{paper.measurement.measurement_number}</div>
                              {paper.measurement.party_name && (
                                <div className="text-xs text-gray-400">{paper.measurement.party_name}</div>
                              )}
                            </div>
                          ) : paper.measurement_id ? (
                            <span className="text-gray-400">Measurement ID: {paper.measurement_id}</span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(paper.status)}`}>
                            {paper.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {paper.description || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {showDeleted && paper.deleted_at
                            ? new Date(paper.deleted_at).toLocaleString('en-GB', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })
                            : new Date(paper.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            {!showDeleted && (
                              <>
                                <Link
                                  to={`/production-papers/${paper.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                  title="View production paper"
                                >
                                  <Eye className="w-4 h-4" />
                                  View
                                </Link>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteClick(paper.id, paper.paper_number);
                                  }}
                                  className="inline-flex items-center justify-center p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors border border-red-200 hover:border-red-300"
                                  title="Delete production paper"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </>
                            )}
                            {showDeleted && (
                              <>
                                <Link
                                  to={`/production-papers/${paper.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                  title="View production paper"
                                >
                                  <Eye className="w-4 h-4" />
                                  View
                                </Link>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRecoverClick(paper.id, paper.paper_number);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                                  title="Recover production paper"
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
          {showDeleteModal && paperToDelete && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Delete Production Paper</h3>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-gray-700">
                    Are you sure you want to delete production paper <span className="font-semibold">"{paperToDelete.number}"</span>?
                    This action cannot be undone.
                  </p>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Reason for Deletion (Optional):
                    </label>
                    <textarea
                      value={deletionReason}
                      onChange={(e) => setDeletionReason(e.target.value)}
                      placeholder="Please provide a reason for deleting this production paper..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
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
                      disabled={!userCaptchaInput.trim()}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Delete Production Paper
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
          {showRecoverModal && paperToRecover && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Recover Production Paper</h3>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-gray-700">
                    {paperToRecover.id === 0 
                      ? `Are you sure you want to recover ${paperToRecover.number}?`
                      : (
                        <>
                          Are you sure you want to recover production paper <span className="font-semibold">"{paperToRecover.number}"</span>?
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
                      Recover Production Paper
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

