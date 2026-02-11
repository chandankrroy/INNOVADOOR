import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import AccountsSidebar from '../../components/AccountsSidebar';
import AccountsNavbar from '../../components/AccountsNavbar';
import { api } from '../../lib/api';
import { 
  DollarSign, 
  Receipt,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Activity,
  ArrowRight,
  CreditCard,
  FileText,
  Building2,
  BarChart3,
  Users,
  HandCoins
} from 'lucide-react';

interface AccountsStats {
  total_outstanding: number;
  overdue_amount: number;
  payments_received_today: number;
  payments_received_this_month: number;
  pending_payments: number;
  overdue_invoices: number;
  aging_summary: {
    current: number;
    "0-30": number;
    "31-60": number;
    "61-90": number;
    "90+": number;
  };
}

export default function AccountsDashboard() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const [stats, setStats] = useState<AccountsStats>({
    total_outstanding: 0,
    overdue_amount: 0,
    payments_received_today: 0,
    payments_received_this_month: 0,
    pending_payments: 0,
    overdue_invoices: 0,
    aging_summary: {
      current: 0,
      "0-30": 0,
      "31-60": 0,
      "61-90": 0,
      "90+": 0
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (currentUser && currentUser.role === 'accounts_manager') {
        try {
          setLoading(true);
          const statsData = await api.get('/accounts/dashboard/stats').catch(() => ({}));
          
          setStats({
            total_outstanding: statsData.total_outstanding || 0,
            overdue_amount: statsData.overdue_amount || 0,
            payments_received_today: statsData.payments_received_today || 0,
            payments_received_this_month: statsData.payments_received_this_month || 0,
            pending_payments: statsData.pending_payments || 0,
            overdue_invoices: statsData.overdue_invoices || 0,
            aging_summary: statsData.aging_summary || {
              current: 0,
              "0-30": 0,
              "31-60": 0,
              "61-90": 0,
              "90+": 0
            }
          });
        } catch (error) {
          console.error('Error fetching accounts stats:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchStats();
  }, [currentUser]);

  // Only show for accounts_manager
  if (!currentUser || currentUser.role !== 'accounts_manager') {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
        <AccountsSidebar />
        <AccountsNavbar />
        <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      <AccountsSidebar />
      <AccountsNavbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-6 lg:p-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                  Accounts Dashboard
                </h1>
                <p className="text-gray-600 mt-2 text-lg">
                  Control receivables, payables, and financial transactions
                </p>
              </div>
              <div className="hidden md:flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
                <Activity className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">All systems operational</span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
            {/* Total Receivables Card */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div className="px-2 py-1 bg-red-50 rounded-md">
                    <TrendingUp className="w-4 h-4 text-red-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Receivables</p>
                  <p className="text-3xl font-bold text-gray-900">₹{stats.total_outstanding.toLocaleString('en-IN')}</p>
                </div>
                <Link 
                  to="/accounts/receivables" 
                  className="mt-4 flex items-center text-sm font-medium text-red-600 hover:text-red-700 group-hover:translate-x-1 transition-transform"
                >
                  View all <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>

            {/* Overdue Amount Card */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div className="px-2 py-1 bg-orange-50 rounded-md">
                    <TrendingUp className="w-4 h-4 text-orange-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Overdue Amount</p>
                  <p className="text-3xl font-bold text-gray-900">₹{stats.overdue_amount.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>

            {/* Payables Due Card */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="px-2 py-1 bg-blue-50 rounded-md">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Payables Due</p>
                  <p className="text-3xl font-bold text-gray-900">₹0</p>
                </div>
              </div>
            </div>

            {/* Credit Blocked Parties Card */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl shadow-lg">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="px-2 py-1 bg-pink-50 rounded-md">
                    <TrendingUp className="w-4 h-4 text-pink-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Credit Blocked</p>
                  <p className="text-3xl font-bold text-gray-900">0</p>
                </div>
              </div>
            </div>

            {/* Monthly Profit Card */}
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div className="px-2 py-1 bg-green-50 rounded-md">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Monthly Profit</p>
                  <p className="text-3xl font-bold text-gray-900">₹0</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
                </div>
                <span className="text-sm text-gray-500">Get started quickly</span>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  to="/accounts/payments/create-receipt"
                  className="group relative p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100/50 transition-all duration-300 text-center block transform hover:scale-[1.02] hover:shadow-lg"
                >
                  <div className="flex flex-col items-center">
                    <div className="p-4 bg-blue-100 rounded-xl mb-3 group-hover:bg-blue-200 transition-colors">
                      <Receipt className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="font-semibold text-gray-900 mb-1">Record Payment</p>
                    <p className="text-sm text-gray-500">Record a new payment receipt</p>
                    <div className="mt-3 flex items-center text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Get started <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </Link>
                
                <Link
                  to="/accounts/receivables"
                  className="group relative p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-500 hover:bg-gradient-to-br hover:from-purple-50 hover:to-purple-100/50 transition-all duration-300 text-center block transform hover:scale-[1.02] hover:shadow-lg"
                >
                  <div className="flex flex-col items-center">
                    <div className="p-4 bg-purple-100 rounded-xl mb-3 group-hover:bg-purple-200 transition-colors">
                      <Users className="w-8 h-8 text-purple-600" />
                    </div>
                    <p className="font-semibold text-gray-900 mb-1">View Receivables</p>
                    <p className="text-sm text-gray-500">Manage accounts receivable</p>
                    <div className="mt-3 flex items-center text-purple-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Get started <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </Link>
                
                <Link
                  to="/accounts/contractor/output"
                  className="group relative p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-500 hover:bg-gradient-to-br hover:from-green-50 hover:to-green-100/50 transition-all duration-300 text-center block transform hover:scale-[1.02] hover:shadow-lg"
                >
                  <div className="flex flex-col items-center">
                    <div className="p-4 bg-green-100 rounded-xl mb-3 group-hover:bg-green-200 transition-colors">
                      <HandCoins className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="font-semibold text-gray-900 mb-1">Contractor Output</p>
                    <p className="text-sm text-gray-500">Track contractor production</p>
                    <div className="mt-3 flex items-center text-green-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Get started <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

