import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useSidebar } from '../../context/SidebarContext';
import AccountsSidebar from '../../components/AccountsSidebar';
import AccountsNavbar from '../../components/AccountsNavbar';
import { Search, Plus, FileText, DollarSign } from 'lucide-react';

type Receivable = {
  id: number;
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  party_name: string;
  invoice_amount: number;
  total_paid: number;
  outstanding_amount: number;
  days_overdue: number | null;
  aging_bucket: string | null;
  status: string;
  payment_terms: string | null;
};

export default function CustomerReceivables() {
  const { isCollapsed, isHovered } = useSidebar();
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [agingFilter, setAgingFilter] = useState<string>('all');

  useEffect(() => {
    loadReceivables();
  }, [statusFilter, agingFilter]);

  const loadReceivables = async () => {
    try {
      setLoading(true);
      let url = '/accounts/receivables?';
      if (statusFilter !== 'all') {
        url += `status_filter=${statusFilter}&`;
      }
      if (agingFilter !== 'all') {
        url += `aging_bucket=${agingFilter}&`;
      }
      const data = await api.get(url);
      setReceivables(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load receivables');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partially_paid':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'outstanding':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAgingColor = (bucket: string | null) => {
    if (!bucket) return 'bg-gray-100 text-gray-800';
    switch (bucket) {
      case 'current':
        return 'bg-green-100 text-green-800';
      case '0-30':
        return 'bg-blue-100 text-blue-800';
      case '31-60':
        return 'bg-yellow-100 text-yellow-800';
      case '61-90':
        return 'bg-orange-100 text-orange-800';
      case '90+':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredReceivables = receivables.filter(rec => {
    const matchesSearch = searchTerm === '' || 
      rec.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.party_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalOutstanding = filteredReceivables.reduce((sum, rec) => sum + parseFloat(rec.outstanding_amount.toString()), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <AccountsSidebar />
      <AccountsNavbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Customer Receivables</h1>
            <p className="text-gray-600 mt-2">View and manage customer outstanding invoices</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Summary Card */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Outstanding</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">₹{totalOutstanding.toLocaleString('en-IN')}</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Invoices</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{filteredReceivables.length}</p>
                </div>
                <DollarSign className="w-12 h-12 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1 flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by invoice number or party name..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <select
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="outstanding">Outstanding</option>
                  <option value="partially_paid">Partially Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="paid">Paid</option>
                </select>
                <select
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  value={agingFilter}
                  onChange={(e) => setAgingFilter(e.target.value)}
                >
                  <option value="all">All Aging</option>
                  <option value="current">Current</option>
                  <option value="0-30">0-30 Days</option>
                  <option value="31-60">31-60 Days</option>
                  <option value="61-90">61-90 Days</option>
                  <option value="90+">90+ Days</option>
                </select>
                <Link
                  to="/accounts/payments/create-receipt"
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors inline-flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Record Receipt
                </Link>
              </div>
            </div>
          </div>

          {/* Receivables Table */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">All Receivables</h2>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">Loading receivables...</p>
              </div>
            ) : filteredReceivables.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No receivables found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aging</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredReceivables.map((rec) => (
                      <tr key={rec.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {rec.invoice_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {rec.party_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {new Date(rec.invoice_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {rec.due_date ? new Date(rec.due_date).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          ₹{parseFloat(rec.invoice_amount.toString()).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          ₹{parseFloat(rec.total_paid.toString()).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          ₹{parseFloat(rec.outstanding_amount.toString()).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAgingColor(rec.aging_bucket)}`}>
                            {rec.aging_bucket === 'current' ? 'Current' :
                             rec.aging_bucket === '0-30' ? '0-30 Days' :
                             rec.aging_bucket === '31-60' ? '31-60 Days' :
                             rec.aging_bucket === '61-90' ? '61-90 Days' :
                             rec.aging_bucket === '90+' ? '90+ Days' :
                             rec.days_overdue ? `${rec.days_overdue} Days` : '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(rec.status)}`}>
                            {rec.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Link
                            to={`/accounts/payments/create-receipt?invoice_id=${rec.id}`}
                            className="text-purple-600 hover:text-purple-900 font-medium"
                          >
                            Record Receipt
                          </Link>
                        </td>
                      </tr>
                    ))}
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

