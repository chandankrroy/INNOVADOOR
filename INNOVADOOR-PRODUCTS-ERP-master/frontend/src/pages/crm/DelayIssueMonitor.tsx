import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import CRMSidebar from '../../components/CRMSidebar';
import CRMNavbar from '../../components/CRMNavbar';
import { api } from '../../lib/api';
import { AlertTriangle, Package, Factory, Wrench, CheckCircle2, FileText } from 'lucide-react';

interface DelayIssue {
  id: number;
  production_paper: string;
  party_name: string;
  category: string;
  description: string;
  delayDays: number;
  responsibleDepartment: string;
  status: string;
}

export default function DelayIssueMonitor() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const [delays, setDelays] = useState<DelayIssue[]>([]);
  const [delayByCategory, setDelayByCategory] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDelayData = async () => {
      if (currentUser?.role === 'crm_manager') {
        try {
          setLoading(true);
          const [papers, tracking, issues] = await Promise.all([
            api.get('/production/production-papers').catch(() => []),
            api.get('/production/tracking').catch(() => []),
            api.get('/supervisor/issues').catch(() => []),
          ]);

          const papersList = Array.isArray(papers) ? papers : [];
          const trackingList = Array.isArray(tracking) ? tracking : [];
          const issuesList = Array.isArray(issues) ? issues : [];

          // Find delayed orders
          const delayedOrders: DelayIssue[] = [];
          const categoryCount: Record<string, number> = {};

          papersList.forEach((paper: any) => {
            if (!paper.expected_dispatch_date) return;
            
            const dispatchDate = new Date(paper.expected_dispatch_date);
            const today = new Date();
            const daysDiff = Math.ceil((dispatchDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            if (daysDiff < 0 && paper.status !== 'dispatched' && paper.status !== 'delivered') {
              // Determine delay category from issues or tracking
              let category = 'Unknown';
              let responsibleDepartment = 'Production';
              
              const paperIssues = issuesList.filter((i: any) => i.production_paper_id === paper.id);
              if (paperIssues.length > 0) {
                category = paperIssues[0].issue_type || 'Unknown';
                responsibleDepartment = paperIssues[0].department || 'Production';
              } else {
                // Check tracking for blocked stages
                const blockedStages = trackingList.filter((t: any) => 
                  t.production_paper_id === paper.id && t.status === 'On Hold'
                );
                if (blockedStages.length > 0) {
                  category = 'Production Delay';
                  responsibleDepartment = blockedStages[0].department || 'Production';
                } else {
                  category = 'Material Shortage';
                  responsibleDepartment = 'Procurement';
                }
              }

              delayedOrders.push({
                id: paper.id,
                production_paper: paper.paper_number || `PP-${paper.id}`,
                party_name: paper.party_name || 'N/A',
                category: category,
                description: paperIssues.length > 0 ? paperIssues[0].description : 'Delay in production',
                delayDays: Math.abs(daysDiff),
                responsibleDepartment: responsibleDepartment,
                status: 'Active',
              });

              categoryCount[category] = (categoryCount[category] || 0) + 1;
            }
          });

          setDelays(delayedOrders);
          setDelayByCategory(categoryCount);
        } catch (error) {
          console.error('Error fetching delay data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchDelayData();
  }, [currentUser?.role]);

  if (currentUser?.role !== 'crm_manager') {
    return null;
  }

  const getCategoryIcon = (category: string) => {
    if (category.includes('Material')) return <Package className="w-5 h-5 text-orange-600" />;
    if (category.includes('Machine')) return <Wrench className="w-5 h-5 text-red-600" />;
    if (category.includes('Manpower')) return <Factory className="w-5 h-5 text-blue-600" />;
    if (category.includes('QC')) return <CheckCircle2 className="w-5 h-5 text-yellow-600" />;
    return <AlertTriangle className="w-5 h-5 text-gray-600" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/20">
      <CRMSidebar />
      <CRMNavbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
              Delay & Issue Monitor
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Early warning system for production delays</p>
          </div>

          {/* Delay by Category */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {Object.entries(delayByCategory).map(([category, count]) => (
              <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  {getCategoryIcon(category)}
                  <span className="text-2xl font-bold text-gray-900">{count}</span>
                </div>
                <p className="text-xs font-medium text-gray-600">{category}</p>
              </div>
            ))}
          </div>

          {/* Delay Details Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Active Delays</h2>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Production Paper</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delay Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delay Days</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsible Department</th>
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
                  ) : delays.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                        No active delays
                      </td>
                    </tr>
                  ) : (
                    delays.map((delay) => (
                      <tr key={delay.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {delay.production_paper}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {delay.party_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {getCategoryIcon(delay.category)}
                            <span className="text-sm text-gray-900">{delay.category}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {delay.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                            {delay.delayDays} days
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {delay.responsibleDepartment}
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

