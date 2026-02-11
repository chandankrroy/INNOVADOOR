import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useSidebar } from '../../context/SidebarContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { Search, X, FileText, CheckCircle, Filter, ChevronDown } from 'lucide-react';

type Party = {
  id: number;
  party_type: string;
  name: string;
  display_name: string | null;
  customer_code: string | null;
  business_type: string | null;
  contact_persons: any[] | null;
  office_city: string | null;
  office_state: string | null;
  gstin_number: string | null;
  pan_number: string | null;
  customer_category: string | null;
  customer_status: string | null;
  approval_status: string | null;
  assigned_sales_executive: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
};

export default function Parties() {
  const { isCollapsed, isHovered } = useSidebar();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [parties, setParties] = useState<Party[]>([]);
  const [filteredParties, setFilteredParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [approvingId, setApprovingId] = useState<number | null>(null);
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<string>('All');
  const [filterPartyType, setFilterPartyType] = useState<string>('All');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterSalesExecutive, setFilterSalesExecutive] = useState<string>('');

  useEffect(() => {
    loadParties();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [parties, searchQuery, filterStatus, filterApprovalStatus, filterPartyType, filterDateFrom, filterDateTo, filterSalesExecutive]);

  const loadParties = async () => {
    try {
      setLoading(true);
      const data = await api.get('/production/parties', true);
      setParties(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load parties');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...parties];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((party) => {
        return (
          party.name?.toLowerCase().includes(query) ||
          party.display_name?.toLowerCase().includes(query) ||
          party.customer_code?.toLowerCase().includes(query) ||
          party.office_city?.toLowerCase().includes(query) ||
          party.office_state?.toLowerCase().includes(query) ||
          party.gstin_number?.toLowerCase().includes(query) ||
          party.assigned_sales_executive?.toLowerCase().includes(query) ||
          party.party_type?.toLowerCase().includes(query) ||
          party.customer_status?.toLowerCase().includes(query) ||
          party.pan_number?.toLowerCase().includes(query)
        );
      });
    }

    // Status filter
    if (filterStatus !== 'All') {
      filtered = filtered.filter(party => party.customer_status === filterStatus);
    }

    // Approval Status filter
    if (filterApprovalStatus !== 'All') {
      filtered = filtered.filter(party => party.approval_status === filterApprovalStatus);
    }

    // Party Type filter
    if (filterPartyType !== 'All') {
      filtered = filtered.filter(party => party.party_type === filterPartyType);
    }

    // Sales Executive filter
    if (filterSalesExecutive.trim()) {
      const execQuery = filterSalesExecutive.toLowerCase();
      filtered = filtered.filter(party => 
        party.assigned_sales_executive?.toLowerCase().includes(execQuery)
      );
    }

    // Date range filter
    if (filterDateFrom) {
      const fromDate = new Date(filterDateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(party => {
        const partyDate = new Date(party.created_at);
        partyDate.setHours(0, 0, 0, 0);
        return partyDate >= fromDate;
      });
    }

    if (filterDateTo) {
      const toDate = new Date(filterDateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(party => {
        const partyDate = new Date(party.created_at);
        return partyDate <= toDate;
      });
    }

    setFilteredParties(filtered);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterStatus('All');
    setFilterApprovalStatus('All');
    setFilterPartyType('All');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterSalesExecutive('');
  };

  // Get unique values for filter dropdowns
  const uniqueStatuses = Array.from(new Set(parties.map(p => p.customer_status).filter(Boolean))).sort();
  const uniquePartyTypes = Array.from(new Set(parties.map(p => p.party_type).filter(Boolean))).sort();
  const uniqueSalesExecutives = Array.from(new Set(parties.map(p => p.assigned_sales_executive).filter(Boolean))).sort();

  const handleApprove = async (partyId: number) => {
    try {
      setApprovingId(partyId);
      await api.post(`/production/parties/${partyId}/approve`, {}, true);
      // Reload parties after approval
      await loadParties();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to approve party');
    } finally {
      setApprovingId(null);
    }
  };

  const canApprove = currentUser?.role === 'production_manager' || currentUser?.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
        <Navbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Parties</h1>
            <p className="text-gray-600 mt-2">View and manage all parties</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">All Parties</h2>
              <Link
                to="/parties/create"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors inline-block"
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
                    placeholder="Search by party name, customer code, city, GSTIN, sales executive..."
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
                  {(filterStatus !== 'All' || filterApprovalStatus !== 'All' || filterPartyType !== 'All' || filterDateFrom || filterDateTo || filterSalesExecutive) && (
                    <span className="ml-1 px-2 py-0.5 text-xs bg-purple-600 text-white rounded-full">
                      {[filterStatus !== 'All' ? 1 : 0, filterApprovalStatus !== 'All' ? 1 : 0, filterPartyType !== 'All' ? 1 : 0, filterDateFrom ? 1 : 0, filterDateTo ? 1 : 0, filterSalesExecutive ? 1 : 0].reduce((a, b) => a + b, 0)}
                    </span>
                  )}
                </button>
                {(filterStatus !== 'All' || filterApprovalStatus !== 'All' || filterPartyType !== 'All' || filterDateFrom || filterDateTo || filterSalesExecutive || searchQuery) && (
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
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
                        {uniqueStatuses.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>

                    {/* Approval Status Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Approval Status
                      </label>
                      <select
                        value={filterApprovalStatus}
                        onChange={(e) => setFilterApprovalStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="All">All</option>
                        <option value="approved">Approved</option>
                        <option value="pending_approval">Pending Approval</option>
                        <option value="draft">Draft</option>
                      </select>
                    </div>

                    {/* Party Type Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Party Type
                      </label>
                      <select
                        value={filterPartyType}
                        onChange={(e) => setFilterPartyType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="All">All</option>
                        {uniquePartyTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    {/* Sales Executive Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sales Executive
                      </label>
                      <input
                        type="text"
                        placeholder="Search sales executive..."
                        value={filterSalesExecutive}
                        onChange={(e) => setFilterSalesExecutive(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
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
                <p className="text-gray-500">Loading parties...</p>
              </div>
            ) : filteredParties.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 mb-4">
                  {searchQuery || filterStatus !== 'All' || filterApprovalStatus !== 'All' || filterPartyType !== 'All' || filterDateFrom || filterDateTo || filterSalesExecutive
                    ? 'No parties found matching your filters' 
                    : 'No parties found'}
                </p>
                {(searchQuery || filterStatus !== 'All' || filterApprovalStatus !== 'All' || filterPartyType !== 'All' || filterDateFrom || filterDateTo || filterSalesExecutive) ? (
                  <button
                    onClick={handleClearFilters}
                    className="text-purple-600 hover:text-purple-700"
                  >
                    Clear filters
                  </button>
                ) : (
                <Link
                  to="/parties/create"
                  className="text-green-600 hover:text-green-700"
                >
                  Create your first party
                </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Party Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        City / State
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        GSTIN
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Approval Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sales Executive
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      {canApprove && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredParties.map((party) => {
                      const primaryContact = party.contact_persons && Array.isArray(party.contact_persons) && party.contact_persons.length > 0
                        ? party.contact_persons[0]
                        : null;
                      
                      return (
                        <tr 
                          key={party.id} 
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => navigate(`/parties/${party.id}`)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{party.name}</div>
                            {party.display_name && (
                              <div className="text-sm text-gray-500">{party.display_name}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {party.party_type || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {party.customer_code || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {party.office_city || '-'}
                            {party.office_city && party.office_state && ', '}
                            {party.office_state || ''}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {party.gstin_number || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              party.customer_status === 'Active' 
                                ? 'bg-green-100 text-green-800'
                                : party.customer_status === 'On Hold'
                                ? 'bg-yellow-100 text-yellow-800'
                                : party.customer_status === 'Blacklisted'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {party.customer_status || 'Prospect'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              party.approval_status === 'approved' 
                                ? 'bg-green-100 text-green-800'
                                : party.approval_status === 'pending_approval'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {party.approval_status === 'approved' ? 'Approved' : 
                               party.approval_status === 'pending_approval' ? 'Pending Approval' : 
                               party.approval_status || 'Draft'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {party.assigned_sales_executive || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(party.created_at).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <Link
                                to={`/parties/${party.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                title="Open party file"
                              >
                                <FileText className="w-4 h-4" />
                                Open File
                              </Link>
                              {canApprove && party.approval_status === 'pending_approval' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApprove(party.id);
                                  }}
                                  disabled={approvingId === party.id}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Approve party"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  {approvingId === party.id ? 'Approving...' : 'Approve'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

