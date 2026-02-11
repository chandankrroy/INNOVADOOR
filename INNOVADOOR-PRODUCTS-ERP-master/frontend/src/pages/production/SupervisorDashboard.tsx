import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useSidebar } from '../../context/SidebarContext';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { Package, Clock, CheckCircle, AlertCircle } from 'lucide-react';

type ProductionPaper = {
  id: number;
  paper_number: string;
  po_number: string | null;
  party_name: string | null;
  project_site_name: string | null;
  order_type: string;
  product_category: string;
  status: string;
  expected_dispatch_date: string | null;
};

export default function ProductsSupervisorDashboard() {
  const { isCollapsed, isHovered } = useSidebar();
  const [urgentOrders, setUrgentOrders] = useState<ProductionPaper[]>([]);
  const [regularOrders, setRegularOrders] = useState<ProductionPaper[]>([]);
  const [sampleOrders, setSampleOrders] = useState<ProductionPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const papers = await api.get('/production/production-papers');
      
      setUrgentOrders(papers.filter((p: ProductionPaper) => p.order_type === 'Urgent' && p.status !== 'delivered'));
      setRegularOrders(papers.filter((p: ProductionPaper) => p.order_type === 'Regular' && p.status !== 'delivered'));
      setSampleOrders(papers.filter((p: ProductionPaper) => p.order_type === 'Sample' && p.status !== 'delivered'));
    } catch (err: any) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const OrderCard = ({ order }: { order: ProductionPaper }) => (
    <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-gray-900">{order.paper_number}</h3>
          <p className="text-sm text-gray-600">{order.party_name || 'N/A'}</p>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${
          order.status === 'in_production' ? 'bg-blue-100 text-blue-800' :
          order.status === 'ready_for_dispatch' ? 'bg-green-100 text-green-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {order.status.replace('_', ' ')}
        </span>
      </div>
      <div className="text-xs text-gray-500 space-y-1">
        {order.po_number && <p>PO: {order.po_number}</p>}
        {order.project_site_name && <p>Site: {order.project_site_name}</p>}
        <p>Category: {order.product_category}</p>
        {order.expected_dispatch_date && (
          <p className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Dispatch: {new Date(order.expected_dispatch_date).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );

  const OrderSection = ({ title, orders, icon: Icon, color }: { 
    title: string; 
    orders: ProductionPaper[]; 
    icon: any;
    color: string;
  }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-3 mb-4">
        <Icon className={`w-6 h-6 ${color}`} />
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <span className={`px-3 py-1 text-sm rounded-full ${color.replace('text-', 'bg-').replace('-600', '-100')} ${color}`}>
          {orders.length}
        </span>
      </div>
      {orders.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No {title.toLowerCase()} found</p>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Supervisor Dashboard</h1>
            <p className="text-gray-600 mt-2">View and manage production orders</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading orders...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <OrderSection 
                title="Urgent Orders" 
                orders={urgentOrders} 
                icon={AlertCircle}
                color="text-red-600"
              />
              <OrderSection 
                title="Regular Orders" 
                orders={regularOrders} 
                icon={Package}
                color="text-blue-600"
              />
              <OrderSection 
                title="Sample Orders" 
                orders={sampleOrders} 
                icon={CheckCircle}
                color="text-green-600"
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}










