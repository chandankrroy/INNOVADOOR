import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import CRMSidebar from '../../components/CRMSidebar';
import CRMNavbar from '../../components/CRMNavbar';
import { api } from '../../lib/api';
import { BarChart3, TrendingUp, FileText, Clock, Package, Users } from 'lucide-react';

interface ReportData {
  onTimeDeliveryPercent: number;
  orderCycleTime: number;
  stageWiseAvgTime: Record<string, number>;
  supervisorEfficiency: Record<string, number>;
  builderWisePerformance: Record<string, number>;
  doorVsFrameLeadTime: {
    door: number;
    frame: number;
  };
}

export default function ReportsAnalytics() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReportData = async () => {
      if (currentUser?.role === 'crm_manager') {
        try {
          setLoading(true);
          const [papers, tracking] = await Promise.all([
            api.get('/production/production-papers').catch(() => []),
            api.get('/production/tracking').catch(() => []),
          ]);

          const papersList = Array.isArray(papers) ? papers : [];
          const trackingList = Array.isArray(tracking) ? tracking : [];

          // Calculate on-time delivery percentage
          const dispatched = papersList.filter((p: any) => 
            p.status === 'dispatched' || p.status === 'delivered'
          );
          const onTime = dispatched.filter((p: any) => {
            if (!p.expected_dispatch_date || !p.updated_at) return false;
            const expected = new Date(p.expected_dispatch_date);
            const actual = new Date(p.updated_at);
            return actual <= expected;
          });
          const onTimePercent = dispatched.length > 0 
            ? Math.round((onTime.length / dispatched.length) * 100) 
            : 0;

          // Calculate average order cycle time (days)
          const completedOrders = papersList.filter((p: any) => 
            p.status === 'delivered' && p.created_at && p.updated_at
          );
          let totalCycleTime = 0;
          completedOrders.forEach((p: any) => {
            const created = new Date(p.created_at);
            const updated = new Date(p.updated_at);
            const days = Math.ceil((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
            totalCycleTime += days;
          });
          const avgCycleTime = completedOrders.length > 0 
            ? Math.round(totalCycleTime / completedOrders.length) 
            : 0;

          // Mock data for other metrics
          const mockData: ReportData = {
            onTimeDeliveryPercent: onTimePercent,
            orderCycleTime: avgCycleTime,
            stageWiseAvgTime: {
              'Material Issue': 1,
              'Unloading': 0.5,
              'Sanding': 2,
              'Cutting': 2,
              'Laminate Press': 3,
              'Grooving': 1,
              'Finishing': 2,
              'Packing': 1,
            },
            supervisorEfficiency: {
              'Ramesh': 92,
              'Suresh': 88,
              'Mahesh': 95,
            },
            builderWisePerformance: {
              'ABC Builder': 85,
              'XYZ Developers': 92,
              'PQR Constructions': 78,
            },
            doorVsFrameLeadTime: {
              door: 12,
              frame: 8,
            },
          };

          setReportData(mockData);
        } catch (error) {
          console.error('Error fetching report data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchReportData();
  }, [currentUser?.role]);

  if (currentUser?.role !== 'crm_manager') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/20">
      <CRMSidebar />
      <CRMNavbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
              Reports & Analytics
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Operational and strategic insights</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : !reportData ? (
            <div className="text-center py-12 text-gray-500">No data available</div>
          ) : (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-1">On-Time Delivery %</p>
                  <p className="text-3xl font-bold text-gray-900">{reportData.onTimeDeliveryPercent}%</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Average Order Cycle Time</p>
                  <p className="text-3xl font-bold text-gray-900">{reportData.orderCycleTime} days</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Package className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Door vs Frame Lead Time</p>
                  <p className="text-sm text-gray-900">
                    Door: <span className="font-bold">{reportData.doorVsFrameLeadTime.door} days</span>
                    <br />
                    Frame: <span className="font-bold">{reportData.doorVsFrameLeadTime.frame} days</span>
                  </p>
                </div>
              </div>

              {/* Stage-wise Average Time */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Stage-wise Average Time</h2>
                <div className="space-y-3">
                  {Object.entries(reportData.stageWiseAvgTime).map(([stage, time]) => (
                    <div key={stage} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{stage}</span>
                      <span className="text-sm font-medium text-gray-900">{time} days</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Supervisor Efficiency */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Supervisor Efficiency</h2>
                <div className="space-y-3">
                  {Object.entries(reportData.supervisorEfficiency).map(([supervisor, efficiency]) => (
                    <div key={supervisor} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{supervisor}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              efficiency >= 90 ? 'bg-green-500' :
                              efficiency >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${efficiency}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-12 text-right">{efficiency}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Builder-wise Performance */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Builder-wise Delivery Performance</h2>
                <div className="space-y-3">
                  {Object.entries(reportData.builderWisePerformance).map(([builder, performance]) => (
                    <div key={builder} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{builder}</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              performance >= 85 ? 'bg-green-500' :
                              performance >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${performance}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-12 text-right">{performance}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

