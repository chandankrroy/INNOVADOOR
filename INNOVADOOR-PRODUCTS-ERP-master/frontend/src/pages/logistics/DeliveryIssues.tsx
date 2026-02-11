import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import LogisticsSidebar from '../../components/LogisticsSidebar';
import LogisticsNavbar from '../../components/LogisticsNavbar';
import { api } from '../../lib/api';
import { AlertTriangle, Plus, CheckCircle2, Clock } from 'lucide-react';

export default function DeliveryIssues() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [availableDispatches, setAvailableDispatches] = useState<any[]>([]);
  const [issueForm, setIssueForm] = useState({
    dispatch_id: 0,
    issue_type: 'delivery_delay',
    title: '',
    description: '',
    severity: 'medium',
    issue_photo_url: '',
  });

  useEffect(() => {
    fetchIssues();
    fetchAvailableDispatches();
  }, []);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const data = await api.get('/logistics/issues');
      setIssues(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching issues:', error);
      setIssues([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableDispatches = async () => {
    try {
      const data = await api.get('/logistics/assigned-orders');
      setAvailableDispatches(Array.isArray(data) ? data.filter((d: any) => d.is_assigned) : []);
    } catch (error) {
      console.error('Error fetching dispatches:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/logistics/issues', issueForm);
      setShowForm(false);
      setIssueForm({
        dispatch_id: 0,
        issue_type: 'delivery_delay',
        title: '',
        description: '',
        severity: 'medium',
        issue_photo_url: '',
      });
      fetchIssues();
      alert('Issue reported successfully!');
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Error reporting issue');
    }
  };

  if (!currentUser || !['logistics_manager', 'logistics_executive', 'driver', 'admin'].includes(currentUser.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  const getSeverityBadge = (severity: string) => {
    const configs: Record<string, { bg: string; text: string }> = {
      'low': { bg: 'bg-blue-100', text: 'text-blue-800' },
      'medium': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      'high': { bg: 'bg-orange-100', text: 'text-orange-800' },
      'critical': { bg: 'bg-red-100', text: 'text-red-800' },
    };
    const config = configs[severity] || configs.medium;
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {severity.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <LogisticsNavbar />
      <LogisticsSidebar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-[65px]`}>
        <main className="p-8">
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Delivery Issues</h1>
                <p className="text-gray-600 mt-2">Report and manage delivery issues</p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors inline-block flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Report Issue
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : issues.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No issues reported</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dispatch No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {issues.map((issue) => (
                        <tr key={issue.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{issue.dispatch_number}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{issue.issue_type.replace('_', ' ')}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{issue.title}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{getSeverityBadge(issue.severity)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              issue.status === 'resolved' ? 'bg-green-100 text-green-800' :
                              issue.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {issue.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(issue.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Report Issue Form */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-xl font-bold">Report Delivery Issue</h3>
                  <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                    ×
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dispatch Order *</label>
                    <select
                      required
                      value={issueForm.dispatch_id}
                      onChange={(e) => setIssueForm({ ...issueForm, dispatch_id: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="0">Select Dispatch Order</option>
                      {availableDispatches.map((dispatch) => (
                        <option key={dispatch.id} value={dispatch.id}>
                          {dispatch.dispatch_number} - {dispatch.party_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Issue Type *</label>
                    <select
                      required
                      value={issueForm.issue_type}
                      onChange={(e) => setIssueForm({ ...issueForm, issue_type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="delivery_delay">Delivery Delay</option>
                      <option value="damage">Damage</option>
                      <option value="shortage">Shortage</option>
                      <option value="wrong_address">Wrong Address</option>
                      <option value="vehicle_breakdown">Vehicle Breakdown</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      required
                      value={issueForm.title}
                      onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <textarea
                      required
                      value={issueForm.description}
                      onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      rows={4}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Severity *</label>
                    <select
                      required
                      value={issueForm.severity}
                      onChange={(e) => setIssueForm({ ...issueForm, severity: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Issue Photo URL (Optional)</label>
                    <input
                      type="text"
                      value={issueForm.issue_photo_url}
                      onChange={(e) => setIssueForm({ ...issueForm, issue_photo_url: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Enter photo URL or base64"
                    />
                  </div>
                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Report Issue
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
