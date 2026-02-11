import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import ProductionSchedulerSidebar from '../../components/ProductionSchedulerSidebar';
import ProductionSchedulerNavbar from '../../components/ProductionSchedulerNavbar';
import { api } from '../../lib/api';
import { 
  Save, 
  X,
  Calendar,
  User,
  AlertCircle
} from 'lucide-react';

interface Schedule {
  id: number;
  production_paper_id: number;
  production_start_date: string;
  target_completion_date: string;
  priority: string;
  primary_supervisor: string | null;
  backup_supervisor: string | null;
  status: string;
  remarks: string | null;
  department_schedule: any;
}

interface ProductionPaper {
  paper_number: string;
  title: string;
  party: { name: string } | null;
}

export default function MaintainScheduledProduction() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const scheduleId = searchParams.get('id');

  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [productionPaper, setProductionPaper] = useState<ProductionPaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    production_start_date: '',
    target_completion_date: '',
    priority: '',
    primary_supervisor: '',
    backup_supervisor: '',
    status: '',
    remarks: '',
    reason_for_change: '',
  });

  useEffect(() => {
    const fetchSchedule = async () => {
      if (scheduleId) {
        try {
          setLoading(true);
          const scheduleData = await api.get(`/scheduler/schedules/${scheduleId}`, true);
          setSchedule(scheduleData);
          
          // Get production paper info
          const paperData = await api.get(`/production/production-papers/${scheduleData.production_paper_id}`, true);
          setProductionPaper(paperData);
          
          // Format dates for date inputs (YYYY-MM-DD)
          const formatDateForInput = (dateStr: string) => {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            return date.toISOString().split('T')[0];
          };
          
          // Set form data
          setFormData({
            production_start_date: formatDateForInput(scheduleData.production_start_date),
            target_completion_date: formatDateForInput(scheduleData.target_completion_date),
            priority: scheduleData.priority,
            primary_supervisor: scheduleData.primary_supervisor || '',
            backup_supervisor: scheduleData.backup_supervisor || '',
            status: scheduleData.status,
            remarks: scheduleData.remarks || '',
            reason_for_change: '',
          });
        } catch (error: any) {
          console.error('Error fetching schedule:', error);
          const errorMsg = error.message || error.response?.data?.detail || 'Failed to load schedule';
          alert(errorMsg);
          setSchedule(null);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [scheduleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!schedule) return;

    // Format dates for comparison (compare ISO strings)
    const formatDateForComparison = (dateStr: string) => {
      if (!dateStr) return '';
      return new Date(dateStr).toISOString();
    };

    // Validate reason for change if dates are being changed
    const originalStartDate = formatDateForComparison(schedule.production_start_date);
    const originalEndDate = formatDateForComparison(schedule.target_completion_date);
    const newStartDate = formatDateForComparison(formData.production_start_date);
    const newEndDate = formatDateForComparison(formData.target_completion_date);
    
    const datesChanged = 
      newStartDate !== originalStartDate ||
      newEndDate !== originalEndDate;
    
    if (datesChanged && !formData.reason_for_change.trim()) {
      alert('Reason for change is required when rescheduling dates');
      return;
    }

    try {
      setSubmitting(true);
      
      // Format dates as ISO strings for backend
      const startDate = new Date(formData.production_start_date);
      const endDate = new Date(formData.target_completion_date);
      
      const updateData: any = {
        production_start_date: startDate.toISOString(),
        target_completion_date: endDate.toISOString(),
        priority: formData.priority,
        primary_supervisor: formData.primary_supervisor || null,
        backup_supervisor: formData.backup_supervisor || null,
        status: formData.status,
        remarks: formData.remarks || null,
      };

      if (datesChanged) {
        updateData.reason_for_change = formData.reason_for_change;
      }

      await api.put(`/scheduler/schedules/${schedule.id}`, updateData, true);
      navigate('/scheduler/view');
    } catch (error: any) {
      console.error('Error updating schedule:', error);
      const errorMsg = error.response?.data?.detail || error.message || 'Failed to update schedule';
      alert(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (currentUser?.role !== 'production_scheduler') {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading schedule...</p>
        </div>
      </div>
    );
  }

  if (!scheduleId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
        <ProductionSchedulerSidebar />
        <ProductionSchedulerNavbar />
        <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
          <div className="min-h-screen flex items-center justify-center p-6">
            <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
              <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Schedule ID Required</h2>
              <p className="text-gray-600 mb-6">
                Please select a schedule from the view page to maintain it.
              </p>
              <button
                onClick={() => navigate('/scheduler/view')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Go to View Schedules
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!schedule || !productionPaper) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
        <ProductionSchedulerSidebar />
        <ProductionSchedulerNavbar />
        <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
          <div className="min-h-screen flex items-center justify-center p-6">
            <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
              <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Schedule Not Found</h2>
              <p className="text-gray-600 mb-6">
                The schedule you are looking for does not exist or you do not have access to it.
              </p>
              <button
                onClick={() => navigate('/scheduler/view')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Go Back to View Schedules
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Format dates for comparison
  const formatDateForComparison = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toISOString().split('T')[0];
  };

  const datesChanged = 
    formatDateForComparison(formData.production_start_date) !== formatDateForComparison(schedule.production_start_date) ||
    formatDateForComparison(formData.target_completion_date) !== formatDateForComparison(schedule.target_completion_date);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      <ProductionSchedulerSidebar />
      <ProductionSchedulerNavbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
              Maintain Scheduled Production
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Controlled changes after scheduling</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Production Paper Info (Read-only) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Production Paper Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Production Paper No</label>
                  <input
                    type="text"
                    value={productionPaper.paper_number}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Party Name</label>
                  <input
                    type="text"
                    value={productionPaper.party?.name || 'N/A'}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
              </div>
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> You cannot change product type, quantity, or edit production paper. Only scheduling details can be modified.
                </p>
              </div>
            </div>

            {/* Current Schedule */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Schedule</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.production_start_date}
                    onChange={(e) => setFormData({ ...formData, production_start_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Completion Date</label>
                  <input
                    type="date"
                    value={formData.target_completion_date}
                    onChange={(e) => setFormData({ ...formData, target_completion_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="High">High (Urgent)</option>
                    <option value="Normal">Normal</option>
                    <option value="Low">Low (Sample)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Supervisor Assignment */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Supervisor Assignment</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Supervisor</label>
                  <input
                    type="text"
                    value={formData.primary_supervisor}
                    onChange={(e) => setFormData({ ...formData, primary_supervisor: e.target.value })}
                    placeholder="Enter supervisor name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Backup Supervisor</label>
                  <input
                    type="text"
                    value={formData.backup_supervisor}
                    onChange={(e) => setFormData({ ...formData, backup_supervisor: e.target.value })}
                    placeholder="Enter backup supervisor name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Status Control */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Status Control</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Production">In Production</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Reason for Change (Required if dates changed) */}
            {datesChanged && (
              <div className="bg-white rounded-xl shadow-sm border border-yellow-200 p-6">
                <div className="flex items-start mb-4">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Reason for Change *</h2>
                    <p className="text-sm text-gray-600 mt-1">Required when rescheduling dates</p>
                  </div>
                </div>
                <textarea
                  required
                  value={formData.reason_for_change}
                  onChange={(e) => setFormData({ ...formData, reason_for_change: e.target.value })}
                  placeholder="Explain why you are changing the schedule dates..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {/* Remarks */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Remarks</h2>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="Additional notes or special instructions..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/scheduler/view')}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}










