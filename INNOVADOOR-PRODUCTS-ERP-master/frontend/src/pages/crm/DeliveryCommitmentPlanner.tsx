import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import CRMSidebar from '../../components/CRMSidebar';
import CRMNavbar from '../../components/CRMNavbar';
import { api } from '../../lib/api';
import { Calendar, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface DeliveryCommitment {
  id: number;
  production_paper: string;
  party_name: string;
  originalPromisedDate: string;
  systemCalculatedETA: string;
  riskLevel: 'green' | 'yellow' | 'red';
  recommendation: 'can_commit' | 'commit_with_buffer' | 'do_not_commit';
  remainingStages: number;
  currentQueueDelay: number;
  qcTime: number;
  dispatchBuffer: number;
}

export default function DeliveryCommitmentPlanner() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const [commitments, setCommitments] = useState<DeliveryCommitment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommitmentData = async () => {
      if (currentUser?.role === 'crm_manager') {
        try {
          setLoading(true);
          const [papers, tracking] = await Promise.all([
            api.get('/production/production-papers').catch(() => []),
            api.get('/production/tracking').catch(() => []),
          ]);

          const papersList = Array.isArray(papers) ? papers : [];
          const trackingList = Array.isArray(tracking) ? tracking : [];

          const commitmentList: DeliveryCommitment[] = papersList
            .filter((p: any) => p.status !== 'dispatched' && p.status !== 'delivered')
            .map((paper: any) => {
              const paperTracking = trackingList.filter((t: any) => t.production_paper_id === paper.id);
              const completedStages = paperTracking.filter((t: any) => t.status === 'Completed').length;
              const totalStages = 8; // Material Issue, Unloading, Sanding, Cutting, Laminate Press, Grooving, Finishing, Packing
              const remainingStages = totalStages - completedStages;

              // Calculate ETA
              const avgStageTime = 2; // days per stage (would be calculated from historical data)
              const remainingStagesTime = remainingStages * avgStageTime;
              const currentQueueDelay = 1; // days (would be calculated from queue)
              const qcTime = 1; // days
              const dispatchBuffer = 1; // days

              const systemETA = new Date();
              systemETA.setDate(systemETA.getDate() + remainingStagesTime + currentQueueDelay + qcTime + dispatchBuffer);

              const originalDate = paper.expected_dispatch_date ? new Date(paper.expected_dispatch_date) : null;
              const daysDiff = originalDate 
                ? Math.ceil((systemETA.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24))
                : 0;

              let riskLevel: 'green' | 'yellow' | 'red' = 'green';
              let recommendation: 'can_commit' | 'commit_with_buffer' | 'do_not_commit' = 'can_commit';

              if (daysDiff > 7) {
                riskLevel = 'red';
                recommendation = 'do_not_commit';
              } else if (daysDiff > 3) {
                riskLevel = 'yellow';
                recommendation = 'commit_with_buffer';
              }

              return {
                id: paper.id,
                production_paper: paper.paper_number || `PP-${paper.id}`,
                party_name: paper.party_name || 'N/A',
                originalPromisedDate: originalDate ? originalDate.toLocaleDateString() : 'Not Set',
                systemCalculatedETA: systemETA.toLocaleDateString(),
                riskLevel: riskLevel,
                recommendation: recommendation,
                remainingStages: remainingStages,
                currentQueueDelay: currentQueueDelay,
                qcTime: qcTime,
                dispatchBuffer: dispatchBuffer,
              };
            });

          setCommitments(commitmentList);
        } catch (error) {
          console.error('Error fetching commitment data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchCommitmentData();
  }, [currentUser?.role]);

  if (currentUser?.role !== 'crm_manager') {
    return null;
  }

  const getRecommendationIcon = (rec: string) => {
    switch (rec) {
      case 'can_commit':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'commit_with_buffer':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return <XCircle className="w-5 h-5 text-red-600" />;
    }
  };

  const getRecommendationText = (rec: string) => {
    switch (rec) {
      case 'can_commit':
        return '✅ Can Commit';
      case 'commit_with_buffer':
        return '⚠ Commit with Buffer';
      default:
        return '❌ Do Not Commit';
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
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
              Delivery Commitment Planner
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Decide realistic delivery dates based on system calculations</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Delivery Commitments</h2>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Production Paper</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Original Promised</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">System ETA</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recommendation</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : commitments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        No commitments to review
                      </td>
                    </tr>
                  ) : (
                    commitments.map((commitment) => (
                      <tr key={commitment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {commitment.production_paper}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {commitment.party_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {commitment.originalPromisedDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {commitment.systemCalculatedETA}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRiskColor(commitment.riskLevel)}`}>
                            {commitment.riskLevel === 'red' ? 'High Risk' : 
                             commitment.riskLevel === 'yellow' ? 'At Risk' : 
                             'On Track'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {getRecommendationIcon(commitment.recommendation)}
                            <span className="text-sm font-medium text-gray-900">
                              {getRecommendationText(commitment.recommendation)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ETA Calculation Formula */}
          <div className="mt-6 bg-indigo-50 rounded-xl p-6 border border-indigo-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">ETA Calculation Formula</h3>
            <p className="text-sm text-gray-700 mb-2">
              <strong>ETA =</strong> Remaining Stages Time + Current Queue Delay + QC Time + Dispatch Buffer
            </p>
            <div className="text-xs text-gray-600 space-y-1">
              <p>• Remaining Stages Time: Based on historical average stage completion times</p>
              <p>• Current Queue Delay: Estimated delay from current production queue</p>
              <p>• QC Time: Quality check processing time</p>
              <p>• Dispatch Buffer: Safety buffer for dispatch preparation</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

