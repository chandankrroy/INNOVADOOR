import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import RawMaterialSidebar from '../../components/RawMaterialSidebar';
import RawMaterialNavbar from '../../components/RawMaterialNavbar';
import { api } from '../../lib/api';
import { FileText, Plus, Filter, X } from 'lucide-react';

const RAW_MATERIAL_ORDER_STATUSES = ['pending', 'issued', 'progress', 'received'] as const;
type RawMaterialOrderStatus = typeof RAW_MATERIAL_ORDER_STATUSES[number];

const CATEGORY_OPTIONS = ['Shutter', 'Frame'] as const;

interface RawMaterialChecksProps {
  status?: RawMaterialOrderStatus;
}

function formatStatusLabel(s: string): string {
  const map: Record<string, string> = {
    pending: 'Pending',
    issued: 'Issued',
    progress: 'Progress',
    received: 'Received',
  };
  return map[s] ?? s;
}

export default function RawMaterialChecks({ status }: RawMaterialChecksProps) {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const navigate = useNavigate();
  const [papers, setPapers] = useState<any[]>([]);
  const [papersLoading, setPapersLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  // Client-side filters (API only supports raw_material_order_status)
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [partySearch, setPartySearch] = useState<string>('');

  useEffect(() => {
    const fetchPapers = async () => {
      if (currentUser?.role === 'raw_material_checker') {
        try {
          setPapersLoading(true);
          const url = status
            ? `/production/production-papers?raw_material_order_status=${status}&limit=500`
            : '/production/production-papers?limit=500';
          const data = await api.get(url, true);
          const list = Array.isArray(data) ? data : [];
          setPapers(list);
        } catch (err: any) {
          console.error('Error fetching production papers:', err);
          setPapers([]);
        } finally {
          setPapersLoading(false);
        }
      }
    };
    fetchPapers();
  }, [currentUser?.role, status]);

  const handleStatusFilter = (value: RawMaterialOrderStatus | 'all') => {
    if (value === 'all') {
      navigate('/raw-material/checks');
    } else {
      navigate(`/raw-material/checks/${value}`);
    }
  };

  const hasActiveFilters = !!status || !!categoryFilter || !!partySearch.trim();
  const clearFilters = () => {
    setCategoryFilter('');
    setPartySearch('');
    navigate('/raw-material/checks');
  };

  const filteredPapers = useMemo(() => {
    let list = papers;
    if (categoryFilter) {
      list = list.filter((p) => (p.product_category || '').toLowerCase() === categoryFilter.toLowerCase());
    }
    if (partySearch.trim()) {
      const q = partySearch.trim().toLowerCase();
      list = list.filter(
        (p) =>
          (p.party_name || '').toLowerCase().includes(q) ||
          (p.party?.name || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [papers, categoryFilter, partySearch]);

  const handleStatusChange = async (paperId: number, newStatus: RawMaterialOrderStatus) => {
    try {
      setUpdatingId(paperId);
      await api.patch(`/production/production-papers/${paperId}/raw-material-status`, { raw_material_order_status: newStatus }, true);
      setPapers((prev) =>
        prev.map((p) => (p.id === paperId ? { ...p, raw_material_order_status: newStatus } : p))
      );
    } catch (err: any) {
      console.error('Error updating raw material order status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const getPageConfig = () => {
    if (!status) return { title: 'Raw Material Orders', subtitle: 'View and manage all raw material orders' };
    switch (status) {
      case 'pending':
        return { title: 'Pending Raw Material Orders', subtitle: 'View and manage pending orders' };
      case 'issued':
        return { title: 'Order Issued', subtitle: 'View and manage issued orders' };
      case 'progress':
        return { title: 'Order In Progress', subtitle: 'View and manage orders in progress' };
      case 'received':
        return { title: 'Order Received', subtitle: 'View and manage received orders' };
      default:
        return { title: 'Raw Material Orders', subtitle: 'View and manage raw material orders' };
    }
  };

  const config = getPageConfig();

  if (currentUser?.role !== 'raw_material_checker') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      <RawMaterialSidebar />
      <RawMaterialNavbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-6 lg:p-8">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                {config.title}
              </h1>
              <p className="text-gray-600 mt-2 text-lg">{config.subtitle}</p>
            </div>
            <Link
              to="/raw-material/production-papers"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              Create Raw Material Paper
            </Link>
          </div>

          {/* Filter bar */}
          <div className="mt-6 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-gray-700 font-medium">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm">Filters</span>
              </div>
              <div className="h-6 w-px bg-gray-200" />
              <span className="text-xs text-gray-500 uppercase tracking-wider">Order Status</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    !status
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                {RAW_MATERIAL_ORDER_STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      status === s
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {formatStatusLabel(s)}
                  </button>
                ))}
              </div>
              <div className="h-6 w-px bg-gray-200" />
              <span className="text-xs text-gray-500 uppercase tracking-wider">Category</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <span className="text-xs text-gray-500 uppercase tracking-wider">Party</span>
              <input
                type="text"
                placeholder="Search party..."
                value={partySearch}
                onChange={(e) => setPartySearch(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 w-40 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
              />
              {hasActiveFilters && (
                <>
                  <div className="h-6 w-px bg-gray-200" />
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Clear filters
                  </button>
                </>
              )}
            </div>
            {hasActiveFilters && (
              <p className="mt-2 text-xs text-gray-500">
                Showing {filteredPapers.length} of {papers.length} order{papers.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Created Raw Material Papers</h2>
            </div>
            <div className="overflow-x-auto">
              {papersLoading ? (
                <div className="py-12 flex justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
                </div>
              ) : papers.length === 0 ? (
                <p className="px-6 py-8 text-center text-gray-500">No raw material papers yet.</p>
              ) : filteredPapers.length === 0 ? (
                <p className="px-6 py-8 text-center text-gray-500">No orders match the current filters. Try adjusting filters.</p>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paper Number</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPapers.map((paper) => (
                      <tr key={paper.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{paper.paper_number || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{paper.party_name || paper.party?.name || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{paper.product_category || '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{paper.product_type || paper.product_sub_type || paper.product_category || '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{paper.items_total_quantity ?? paper.total_quantity ?? '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">—</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatStatusLabel(paper.raw_material_order_status || 'pending')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <select
                              value={paper.raw_material_order_status || 'pending'}
                              onChange={(e) => handleStatusChange(paper.id, e.target.value as RawMaterialOrderStatus)}
                              disabled={updatingId === paper.id}
                              className="text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                            >
                              {RAW_MATERIAL_ORDER_STATUSES.map((s) => (
                                <option key={s} value={s}>{formatStatusLabel(s)}</option>
                              ))}
                            </select>
                            <Link
                              to={`/raw-material/production-papers/${paper.id}/raw-material-view`}
                              className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800"
                            >
                              <FileText className="w-4 h-4" />
                              View
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
