import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import ProductionSchedulerSidebar from '../../components/ProductionSchedulerSidebar';
import ProductionSchedulerNavbar from '../../components/ProductionSchedulerNavbar';
import { api } from '../../lib/api';
import { 
  Calendar, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  Save,
  X,
  Package
} from 'lucide-react';

interface ProductionPaper {
  id: number;
  paper_number: string;
  title: string;
  party: {
    id: number;
    name: string;
  } | null;
  measurement: {
    id: number;
    measurement_number: string;
  } | null;
}

interface MaterialChecks {
  measurement_received: boolean;
  production_paper_approved: boolean;
  shutter_available: boolean;
  laminate_available: boolean;
  frame_material_available: boolean;
}

interface DepartmentSchedule {
  department: string;
  supervisor: string;
  planned_start: string;
  planned_end: string;
}

export default function ScheduleProduction() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paperId = searchParams.get('paper_id');

  const [productionPaper, setProductionPaper] = useState<ProductionPaper | null>(null);
  const [materialChecks, setMaterialChecks] = useState<MaterialChecks | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    production_start_date: '',
    target_completion_date: '',
    priority: 'Normal',
    primary_supervisor: '',
    backup_supervisor: '',
    remarks: '',
  });

  const [departmentSchedule, setDepartmentSchedule] = useState<DepartmentSchedule[]>([
    { department: 'Sanding', supervisor: '', planned_start: '', planned_end: '' },
    { department: 'Cutting', supervisor: '', planned_start: '', planned_end: '' },
    { department: 'Pressing', supervisor: '', planned_start: '', planned_end: '' },
    { department: 'Finishing', supervisor: '', planned_start: '', planned_end: '' },
  ]);

  const [pendingPapers, setPendingPapers] = useState<any[]>([]);
  const [showPaperSelector, setShowPaperSelector] = useState(false);

  useEffect(() => {
    const fetchProductionPaper = async () => {
      if (paperId) {
        try {
          setLoading(true);
          const paper = await api.get(`/production/production-papers/${paperId}`, true);
          setProductionPaper(paper);
          
          // Get material checks from pending list
          const pendingList = await api.get('/scheduler/pending-for-scheduling', true);
          const pendingItem = pendingList.find((item: any) => item.production_paper_id === parseInt(paperId));
          if (pendingItem) {
            setMaterialChecks(pendingItem.material_checks);
          } else {
            // If not in pending list, create default material checks
            setMaterialChecks({
              measurement_received: paper.measurement_id ? true : false,
              production_paper_approved: paper.status === 'active' || paper.status === 'approved',
              shutter_available: true,
              laminate_available: true,
              frame_material_available: true
            });
          }
        } catch (error: any) {
          console.error('Error fetching production paper:', error);
          const errorMsg = error.message || error.response?.data?.detail || 'Failed to load production paper. Please try again.';
          alert(errorMsg);
          setProductionPaper(null);
        } finally {
          setLoading(false);
        }
      } else {
        // If no paper_id, fetch pending papers for selection
        fetchPendingPapers();
        setLoading(false);
      }
    };

    fetchProductionPaper();
  }, [paperId]);

  const fetchPendingPapers = async () => {
    try {
      const pendingList = await api.get('/scheduler/pending-for-scheduling', true);
      setPendingPapers(Array.isArray(pendingList) ? pendingList : []);
      if (pendingList.length > 0) {
        setShowPaperSelector(true);
      }
    } catch (error) {
      console.error('Error fetching pending papers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productionPaper) return;

    try {
      setSubmitting(true);
      
      // Format dates properly
      const startDate = new Date(formData.production_start_date);
      const endDate = new Date(formData.target_completion_date);
      
      // Format department schedule with proper date handling
      const formattedDeptSchedule = departmentSchedule
        .filter(d => d.supervisor || d.planned_start || d.planned_end)
        .map(d => ({
          department: d.department,
          supervisor: d.supervisor || null,
          planned_start: d.planned_start ? new Date(d.planned_start).toISOString() : null,
          planned_end: d.planned_end ? new Date(d.planned_end).toISOString() : null,
        }));

      const scheduleData = {
        production_paper_id: productionPaper.id,
        production_start_date: startDate.toISOString(),
        target_completion_date: endDate.toISOString(),
        priority: formData.priority,
        primary_supervisor: formData.primary_supervisor || null,
        backup_supervisor: formData.backup_supervisor || null,
        department_schedule: formattedDeptSchedule.length > 0 ? formattedDeptSchedule : null,
        remarks: formData.remarks || null,
      };

      console.log('Submitting schedule data:', scheduleData);
      const response = await api.post('/scheduler/schedule', scheduleData, true);
      console.log('Schedule created successfully:', response);
      navigate('/scheduler/view');
    } catch (error: any) {
      console.error('Error creating schedule:', error);
      const errorMessage = error.message || error.response?.data?.detail || 'Failed to create schedule';
      console.error('Full error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const updateDepartmentSchedule = (index: number, field: keyof DepartmentSchedule, value: string) => {
    const updated = [...departmentSchedule];
    updated[index] = { ...updated[index], [field]: value };
    setDepartmentSchedule(updated);
  };

  if (currentUser?.role !== 'production_scheduler') {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading production paper...</p>
        </div>
      </div>
    );
  }

  if (!productionPaper && !showPaperSelector) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
        <ProductionSchedulerSidebar />
        <ProductionSchedulerNavbar />
        <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
          <div className="min-h-screen flex items-center justify-center p-6">
            <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Production Paper Not Found</h2>
              <p className="text-gray-600 mb-6">
                {paperId 
                  ? 'The production paper you are looking for does not exist or you do not have access to it.'
                  : 'No production paper ID provided. Please select a paper from the list or go to the dashboard.'}
              </p>
              <div className="flex flex-col space-y-3">
                {pendingPapers.length > 0 && (
                  <button
                    onClick={() => setShowPaperSelector(true)}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Select Production Paper
                  </button>
                )}
                <button
                  onClick={() => navigate('/scheduler/dashboard')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showPaperSelector && !productionPaper) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
        <ProductionSchedulerSidebar />
        <ProductionSchedulerNavbar />
        <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
          <main className="p-6 lg:p-8">
            <div className="mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                Select Production Paper
              </h1>
              <p className="text-gray-600 mt-2 text-lg">Choose a production paper to schedule</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6">
                {pendingPapers.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No pending production papers available for scheduling.</p>
                    <button
                      onClick={() => navigate('/scheduler/dashboard')}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Go to Dashboard
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paper No</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Party</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {pendingPapers.map((paper) => (
                          <tr key={paper.production_paper_id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {paper.paper_number}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {paper.party_name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {paper.product_type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {paper.raw_material_status === 'Available' ? (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                  Available
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => {
                                  navigate(`/scheduler/schedule?paper_id=${paper.production_paper_id}`);
                                }}
                                className="text-blue-600 hover:text-blue-900 font-medium"
                              >
                                Select
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const allMaterialsAvailable = materialChecks && 
    materialChecks.shutter_available && 
    materialChecks.laminate_available && 
    materialChecks.frame_material_available;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      <ProductionSchedulerSidebar />
      <ProductionSchedulerNavbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
              Schedule Production
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Convert Production Paper → Actual Production Plan</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Production Paper Info */}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label>
                  <input
                    type="text"
                    value={productionPaper.measurement?.measurement_number ? 
                      (productionPaper.measurement.measurement_number.includes('shutter') ? 'Door' : 'Frame') : 
                      'Unknown'}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order Type</label>
                  <input
                    type="text"
                    value="Regular"
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
              </div>
            </div>

            {/* Material Checks */}
            {materialChecks && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Pre-Scheduling System Checks</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Measurement Received</span>
                    {materialChecks.measurement_received ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Production Paper Approved</span>
                    {materialChecks.production_paper_approved ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Shutter Availability</span>
                    {materialChecks.shutter_available ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Laminate Availability</span>
                    {materialChecks.laminate_available ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Frame Material Availability</span>
                    {materialChecks.frame_material_available ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                </div>
                {!allMaterialsAvailable && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                    <p className="text-sm text-yellow-800">Material Pending: Some materials are not available. Please ensure materials are ready before scheduling.</p>
                  </div>
                )}
              </div>
            )}

            {/* Production Plan */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Production Plan</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Production Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.production_start_date}
                    onChange={(e) => setFormData({ ...formData, production_start_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Completion Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.target_completion_date}
                    onChange={(e) => setFormData({ ...formData, target_completion_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
                  <select
                    required
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

            {/* Department-wise Scheduling */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Department-wise Scheduling (Optional)</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supervisor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Planned Start</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Planned End</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {departmentSchedule.map((dept, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{dept.department}</td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={dept.supervisor}
                            onChange={(e) => updateDepartmentSchedule(index, 'supervisor', e.target.value)}
                            placeholder="Supervisor name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="date"
                            value={dept.planned_start}
                            onChange={(e) => updateDepartmentSchedule(index, 'planned_start', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="date"
                            value={dept.planned_end}
                            onChange={(e) => updateDepartmentSchedule(index, 'planned_end', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

            {/* Remarks */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Remarks</h2>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="Special instructions, delivery priority notes, etc."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/scheduler/dashboard')}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !allMaterialsAvailable}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Calendar className="w-4 h-4 mr-2" />
                {submitting ? 'Scheduling...' : 'Schedule Production'}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}










