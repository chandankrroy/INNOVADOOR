import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useSidebar } from '../../context/SidebarContext';
import PurchaseSidebar from '../../components/PurchaseSidebar';
import PurchaseNavbar from '../../components/PurchaseNavbar';
import { 
  FileText, 
  ShoppingCart, 
  Truck, 
  XCircle, 
  DollarSign,
  Plus,
  ArrowRight
} from 'lucide-react';

type DashboardKPIs = {
  pr_pending_approval: number;
  open_purchase_orders: number;
  material_in_transit: number;
  shortage_rejection: number;
  payables_due: number;
  payables_amount: number;
};

export default function PurchaseDashboard() {
  const { isCollapsed, isHovered } = useSidebar();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadKPIs();
  }, []);

  const loadKPIs = async () => {
    try {
      setLoading(true);
      const data = await api.get('/purchase/dashboard/kpis');
      setKpis(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const kpiCards = [
    {
      title: 'PR Pending Approval',
      value: kpis?.pr_pending_approval || 0,
      icon: FileText,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      link: '/purchase/pr/pending'
    },
    {
      title: 'Open Purchase Orders',
      value: kpis?.open_purchase_orders || 0,
      icon: ShoppingCart,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      link: '/purchase/po/pending'
    },
    {
      title: 'Material In Transit',
      value: kpis?.material_in_transit || 0,
      icon: Truck,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      link: '/purchase/po/pending'
    },
    {
      title: 'Shortage / Rejection',
      value: kpis?.shortage_rejection || 0,
      icon: XCircle,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      link: '/purchase/grn'
    },
    {
      title: 'Payables Due',
      value: kpis?.payables_due || 0,
      icon: DollarSign,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      link: '/purchase/bills/pending'
    },
    {
      title: 'Payables Amount',
      value: `₹${(kpis?.payables_amount || 0).toLocaleString('en-IN')}`,
      icon: DollarSign,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
      link: '/purchase/bills/pending',
      isAmount: true
    }
  ];

  const quickActions = [
    { label: 'Create PR', path: '/purchase/pr/create', icon: FileText, color: 'bg-blue-600 hover:bg-blue-700' },
    { label: 'Create PO', path: '/purchase/po/create', icon: ShoppingCart, color: 'bg-purple-600 hover:bg-purple-700' },
    { label: 'Create GRN', path: '/purchase/grn/create', icon: Truck, color: 'bg-green-600 hover:bg-green-700' },
    { label: 'Create Vendor', path: '/purchase/vendors/create', icon: Plus, color: 'bg-orange-600 hover:bg-orange-700' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <PurchaseSidebar />
      <PurchaseNavbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Purchase Dashboard</h1>
            <p className="text-gray-600 mt-2">Overview of purchase operations and key metrics</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* KPI Cards */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {kpiCards.map((card, index) => {
                const IconComponent = card.icon;
                return (
                  <Link
                    key={index}
                    to={card.link}
                    className={`${card.bgColor} rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`${card.color} p-3 rounded-lg`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <ArrowRight className={`w-5 h-5 ${card.textColor} opacity-50`} />
                    </div>
                    <h3 className={`text-sm font-medium ${card.textColor} mb-2`}>{card.title}</h3>
                    <p className={`text-2xl font-bold ${card.textColor}`}>
                      {card.value}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => {
                const IconComponent = action.icon;
                return (
                  <Link
                    key={index}
                    to={action.path}
                    className={`${action.color} text-white rounded-lg p-4 flex items-center space-x-3 transition-colors`}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span className="font-medium">{action.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Golden Rules */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg mb-8">
            <h2 className="text-lg font-semibold text-yellow-900 mb-3">Golden Rules</h2>
            <ul className="space-y-2 text-yellow-800">
              <li className="flex items-start">
                <XCircle className="w-5 h-5 mr-2 mt-0.5 text-red-500" />
                <span>No purchase without approved requirement</span>
              </li>
              <li className="flex items-start">
                <XCircle className="w-5 h-5 mr-2 mt-0.5 text-red-500" />
                <span>No payment without GRN</span>
              </li>
            </ul>
          </div>

          {/* Module Flow */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Purchase Flow in ERP</h2>
            <div className="flex flex-wrap items-center justify-center space-x-4 text-sm">
              <div className="bg-blue-100 px-4 py-2 rounded-lg font-medium text-blue-800">Sales Order</div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
              <div className="bg-blue-100 px-4 py-2 rounded-lg font-medium text-blue-800">Measurement</div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
              <div className="bg-blue-100 px-4 py-2 rounded-lg font-medium text-blue-800">Production Paper</div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
              <div className="bg-green-100 px-4 py-2 rounded-lg font-medium text-green-800">Material Requirement (BOM)</div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
              <div className="bg-green-100 px-4 py-2 rounded-lg font-medium text-green-800">Purchase Management</div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
              <div className="bg-blue-100 px-4 py-2 rounded-lg font-medium text-blue-800">Store / Inventory</div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
              <div className="bg-blue-100 px-4 py-2 rounded-lg font-medium text-blue-800">Production</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

