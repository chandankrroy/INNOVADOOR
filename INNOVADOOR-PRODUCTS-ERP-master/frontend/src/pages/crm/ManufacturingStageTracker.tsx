import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import CRMSidebar from '../../components/CRMSidebar';
import CRMNavbar from '../../components/CRMNavbar';
import { api } from '../../lib/api';
import { Factory, AlertCircle, Users } from 'lucide-react';

interface StageData {
  stage: string;
  orders: number;
  delayed: number;
  supervisor: string;
  riskLevel: 'green' | 'yellow' | 'red';
}

export default function ManufacturingStageTracker() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const [stages, setStages] = useState<StageData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStageData = async () => {
      if (currentUser?.role === 'crm_manager') {
        try {
          setLoading(true);
          const [papers, tracking] = await Promise.all([
            api.get('/production/production-papers').catch(() => []),
            api.get('/production/tracking').catch(() => []),
          ]);

          const papersList = Array.isArray(papers) ? papers : [];
          const trackingList = Array.isArray(tracking) ? tracking : [];

          const stageNames = [
            'Material Issue',
            'Unloading',
            'Sanding',
            'Cutting',
            'Laminate Press',
            'Grooving',
            'Finishing',
            'Packing'
          ];

          const stageData: StageData[] = stageNames.map(stageName => {
            const stageTracking = trackingList.filter((t: any) => 
              t.stage_name.toLowerCase().includes(stageName.toLowerCase()) ||
              stageName.toLowerCase().includes(t.stage_name.toLowerCase())
            );

            const ordersInStage = stageTracking.length;
            const delayedInStage = stageTracking.filter((t: any) => {
              if (!t.expected_end_date) return false;
              const endDate = new Date(t.expected_end_date);
              const today = new Date();
              return endDate < today && t.status !== 'Completed';
            }).length;

            const supervisors = [...new Set(stageTracking.map((t: any) => t.supervisor_name).filter(Boolean))];
            const supervisor = supervisors.length > 0 ? supervisors.join(', ') : 'N/A';

            let riskLevel: 'green' | 'yellow' | 'red' = 'green';
            if (delayedInStage > ordersInStage * 0.3) riskLevel = 'red';
            else if (delayedInStage > ordersInStage * 0.1) riskLevel = 'yellow';

            return {
              stage: stageName,
              orders: ordersInStage,
              delayed: delayedInStage,
              supervisor: supervisor,
              riskLevel: riskLevel,
            };
          });

          setStages(stageData);
        } catch (error) {
          console.error('Error fetching stage data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchStageData();
  }, [currentUser?.role]);

  if (currentUser?.role !== 'crm_manager') {
    return null;
  }

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
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
              Manufacturing Stage Tracker
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Stage-wise view across all orders</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Factory className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Stage Performance Overview</h2>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delayed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supervisor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : stages.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        No stage data available
                      </td>
                    </tr>
                  ) : (
                    stages.map((stage, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {stage.stage}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {stage.orders}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {stage.delayed > 0 ? (
                            <span className="text-red-600 font-medium">{stage.delayed}</span>
                          ) : (
                            <span className="text-gray-600">0</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div className="flex items-center">
                            <Users className="w-4 h-4 text-gray-400 mr-2" />
                            {stage.supervisor}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRiskColor(stage.riskLevel)}`}>
                            {stage.riskLevel === 'red' ? '🔴 Bottleneck' : 
                             stage.riskLevel === 'yellow' ? '🟡 Watch' : 
                             '🟢 Normal'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

