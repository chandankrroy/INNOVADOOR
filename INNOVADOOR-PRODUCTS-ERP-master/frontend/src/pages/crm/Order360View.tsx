import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import CRMSidebar from '../../components/CRMSidebar';
import CRMNavbar from '../../components/CRMNavbar';
import { api } from '../../lib/api';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ArrowLeft,
  Package,
  Factory,
  Calendar,
  User,
  AlertTriangle
} from 'lucide-react';

interface OrderDetails {
  id: number;
  production_paper: string;
  party_name: string;
  project_site: string;
  order_type: string;
  product_mix: string;
  committed_delivery: string;
  risk_level: 'green' | 'yellow' | 'red';
  stages: ManufacturingStage[];
  qc_status: string;
  issues: any[];
  rework_quantity: number;
}

interface ManufacturingStage {
  name: string;
  status: 'completed' | 'in_progress' | 'blocked' | 'not_started';
  completed_date?: string;
  started_date?: string;
  blocked_reason?: string;
}

export default function Order360View() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('id');
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (currentUser?.role === 'crm_manager' && orderId) {
        try {
          setLoading(true);
          const [paper, tracking, qc] = await Promise.all([
            api.get(`/production/production-papers/${orderId}`).catch(() => null),
            api.get(`/production/tracking?production_paper_id=${orderId}`).catch(() => []),
            api.get(`/quality-check/qc-queue?production_paper_id=${orderId}`).catch(() => []),
          ]);

          if (paper) {
            const trackingList = Array.isArray(tracking) ? tracking : [];
            const qcList = Array.isArray(qc) ? qc : [];
            
            // Build manufacturing stages
            const stages: ManufacturingStage[] = [
              { name: 'Material Issue', status: 'not_started' },
              { name: 'Unloading', status: 'not_started' },
              { name: 'Sanding', status: 'not_started' },
              { name: 'Cutting', status: 'not_started' },
              { name: 'Laminate Press', status: 'not_started' },
              { name: 'Grooving', status: 'not_started' },
              { name: 'Finishing', status: 'not_started' },
              { name: 'Packing', status: 'not_started' },
            ];

            // Update stages based on tracking
            trackingList.forEach((track: any) => {
              const stageIndex = stages.findIndex(s => 
                s.name.toLowerCase().includes(track.stage_name.toLowerCase()) ||
                track.stage_name.toLowerCase().includes(s.name.toLowerCase())
              );
              if (stageIndex !== -1) {
                if (track.status === 'Completed') {
                  stages[stageIndex].status = 'completed';
                  stages[stageIndex].completed_date = track.end_date_time;
                } else if (track.status === 'In Progress') {
                  stages[stageIndex].status = 'in_progress';
                  stages[stageIndex].started_date = track.start_date_time;
                } else if (track.status === 'On Hold') {
                  stages[stageIndex].status = 'blocked';
                  stages[stageIndex].blocked_reason = track.remarks;
                }
              }
            });

            // Determine risk level
            let riskLevel: 'green' | 'yellow' | 'red' = 'green';
            if (paper.expected_dispatch_date) {
              const dispatchDate = new Date(paper.expected_dispatch_date);
              const today = new Date();
              const daysDiff = Math.ceil((dispatchDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              if (daysDiff < 0) riskLevel = 'red';
              else if (daysDiff <= 3) riskLevel = 'yellow';
            }

            const orderDetails: OrderDetails = {
              id: paper.id,
              production_paper: paper.paper_number || `PP-${paper.id}`,
              party_name: paper.party_name || 'N/A',
              project_site: paper.project_site_name || 'N/A',
              order_type: paper.order_type || 'Regular',
              product_mix: `${paper.product_category || ''} ${paper.product_type || ''}`.trim() || 'N/A',
              committed_delivery: paper.expected_dispatch_date 
                ? new Date(paper.expected_dispatch_date).toLocaleDateString()
                : 'N/A',
              risk_level: riskLevel,
              stages: stages,
              qc_status: qcList.length > 0 ? qcList[0].qc_status || 'Pending' : 'Pending',
              issues: [],
              rework_quantity: qcList.reduce((sum: number, q: any) => sum + (q.rework_quantity || 0), 0),
            };

            setOrder(orderDetails);
          }
        } catch (error) {
          console.error('Error fetching order details:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchOrderDetails();
  }, [currentUser?.role, orderId]);

  if (currentUser?.role !== 'crm_manager') {
    return null;
  }

  const getStageIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-600 animate-pulse" />;
      case 'blocked':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'red': return 'bg-red-100 text-red-800 border-red-200';
      case 'yellow': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/20">
      <CRMSidebar />
      <CRMNavbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-6 lg:p-8">
          <div className="mb-6">
            <button
              onClick={() => navigate('/crm/dashboard')}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </button>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
              Order 360° View
            </h1>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading order details...</p>
            </div>
          ) : !order ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Order not found</p>
            </div>
          ) : (
            <>
              {/* Header Info */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h2>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Package className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-xs text-gray-500">Production Paper</p>
                          <p className="text-sm font-medium text-gray-900">{order.production_paper}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <User className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-xs text-gray-500">Party Name</p>
                          <p className="text-sm font-medium text-gray-900">{order.party_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Factory className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-xs text-gray-500">Project / Site</p>
                          <p className="text-sm font-medium text-gray-900">{order.project_site}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h2>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500">Order Type</p>
                        <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full mt-1 ${
                          order.order_type === 'Urgent' ? 'bg-red-100 text-red-800' :
                          order.order_type === 'Sample' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.order_type}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Product Mix</p>
                        <p className="text-sm font-medium text-gray-900 mt-1">{order.product_mix}</p>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-xs text-gray-500">Committed Delivery Date</p>
                          <p className="text-sm font-medium text-gray-900">{order.committed_delivery}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Current Risk Level</p>
                        <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full border mt-1 ${getRiskColor(order.risk_level)}`}>
                          {order.risk_level === 'red' ? 'High Risk' : order.risk_level === 'yellow' ? 'At Risk' : 'On Track'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Manufacturing Timeline */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Manufacturing Timeline</h2>
                <div className="space-y-4">
                  {order.stages.map((stage, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {getStageIcon(stage.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-sm font-medium ${
                              stage.status === 'completed' ? 'text-green-700' :
                              stage.status === 'in_progress' ? 'text-blue-700' :
                              stage.status === 'blocked' ? 'text-red-700' :
                              'text-gray-500'
                            }`}>
                              {stage.name}
                            </p>
                            {stage.status === 'blocked' && stage.blocked_reason && (
                              <p className="text-xs text-red-600 mt-1">{stage.blocked_reason}</p>
                            )}
                            {stage.status === 'completed' && stage.completed_date && (
                              <p className="text-xs text-gray-500 mt-1">
                                Completed: {new Date(stage.completed_date).toLocaleDateString()}
                              </p>
                            )}
                            {stage.status === 'in_progress' && stage.started_date && (
                              <p className="text-xs text-gray-500 mt-1">
                                Started: {new Date(stage.started_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            stage.status === 'completed' ? 'bg-green-100 text-green-800' :
                            stage.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            stage.status === 'blocked' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {stage.status === 'completed' ? '✔ Completed' :
                             stage.status === 'in_progress' ? '⏳ In Progress' :
                             stage.status === 'blocked' ? '⏸ Blocked' :
                             '⬜ Not Started'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Issue & QC Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">QC Status</h2>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">QC Status</p>
                      <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full mt-1 ${
                        order.qc_status === 'approved' ? 'bg-green-100 text-green-800' :
                        order.qc_status === 'rework_required' ? 'bg-yellow-100 text-yellow-800' :
                        order.qc_status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.qc_status.charAt(0).toUpperCase() + order.qc_status.slice(1).replace('_', ' ')}
                      </span>
                    </div>
                    {order.rework_quantity > 0 && (
                      <div>
                        <p className="text-xs text-gray-500">Rework Quantity</p>
                        <p className="text-sm font-medium text-gray-900 mt-1">{order.rework_quantity} units</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Issues Raised</h2>
                  {order.issues.length === 0 ? (
                    <p className="text-sm text-gray-500">No issues reported</p>
                  ) : (
                    <div className="space-y-2">
                      {order.issues.map((issue: any, index: number) => (
                        <div key={index} className="p-3 bg-red-50 rounded-lg border border-red-200">
                          <p className="text-sm font-medium text-red-900">{issue.type}</p>
                          <p className="text-xs text-red-700 mt-1">{issue.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

