import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import QualityCheckSidebar from '../../components/QualityCheckSidebar';
import QualityCheckNavbar from '../../components/QualityCheckNavbar';
import { api } from '../../lib/api';
import { CheckCircle2, XCircle, RotateCcw, Save } from 'lucide-react';

export default function PerformQC() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paperId = searchParams.get('paper_id');
  
  const [qcData, setQcData] = useState<any>({
    accepted_quantity: 0,
    rework_quantity: 0,
    rejected_quantity: 0,
    checklist_results: [],
    defect_category: '',
    severity: '',
    remarks: '',
    photos: [],
  });
  const [paperInfo, setPaperInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPaperInfo = async () => {
      if (currentUser?.role === 'quality_checker' && paperId) {
        try {
          setLoading(true);
          // Fetch production paper info
          const paper = await api.get(`/production/production-papers/${paperId}`);
          setPaperInfo(paper);
          
          // Initialize QC data
          setQcData((prev: any) => ({
            ...prev,
            production_paper_id: parseInt(paperId),
            production_paper_number: paper.paper_number,
            product_type: paper.product_category,
            product_variant: paper.product_sub_type,
            order_type: paper.order_type,
            total_quantity: 1, // Should be calculated from measurement
          }));
        } catch (error) {
          console.error('Error fetching paper info:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchPaperInfo();
  }, [currentUser?.role, paperId]);

  const handleSave = async (status: string) => {
    try {
      setSaving(true);
      const data = {
        ...qcData,
        qc_status: status,
      };
      
      await api.post('/quality-check/quality-checks', data);
      navigate('/quality-check/dashboard');
    } catch (error) {
      console.error('Error saving QC:', error);
      alert('Failed to save QC. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (currentUser?.role !== 'quality_checker') {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/20">
        <QualityCheckSidebar />
        <QualityCheckNavbar />
        <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
          <main className="p-6 lg:p-8">
            <div className="text-center">Loading...</div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/20">
      <QualityCheckSidebar />
      <QualityCheckNavbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-green-800 to-emerald-800 bg-clip-text text-transparent">
              Perform Quality Check
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Inspect and approve/reject production items</p>
          </div>

          {/* QC Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Production Paper Information</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Production Paper No</p>
                <p className="font-semibold">{paperInfo?.paper_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Party Name</p>
                <p className="font-semibold">{paperInfo?.party_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Product Type</p>
                <p className="font-semibold">{paperInfo?.product_category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Order Type</p>
                <p className="font-semibold">{paperInfo?.order_type}</p>
              </div>
            </div>
          </div>

          {/* QC Input Fields */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">QC Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Accepted Quantity</label>
                <input
                  type="number"
                  value={qcData.accepted_quantity}
                  onChange={(e) => setQcData({...qcData, accepted_quantity: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rework Quantity</label>
                <input
                  type="number"
                  value={qcData.rework_quantity}
                  onChange={(e) => setQcData({...qcData, rework_quantity: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rejected Quantity</label>
                <input
                  type="number"
                  value={qcData.rejected_quantity}
                  onChange={(e) => setQcData({...qcData, rejected_quantity: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Defect Category</label>
                <select
                  value={qcData.defect_category}
                  onChange={(e) => setQcData({...qcData, defect_category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Category</option>
                  <option value="Surface">Surface</option>
                  <option value="Dimension">Dimension</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Packaging">Packaging</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                <select
                  value={qcData.severity}
                  onChange={(e) => setQcData({...qcData, severity: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Severity</option>
                  <option value="Critical">Critical</option>
                  <option value="Major">Major</option>
                  <option value="Minor">Minor</option>
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
              <textarea
                value={qcData.remarks}
                onChange={(e) => setQcData({...qcData, remarks: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter QC remarks..."
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => handleSave('approved')}
              disabled={saving}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Approve</span>
            </button>
            <button
              onClick={() => handleSave('rework_required')}
              disabled={saving}
              className="px-6 py-3 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50 flex items-center space-x-2"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Rework Required</span>
            </button>
            <button
              onClick={() => handleSave('rejected')}
              disabled={saving}
              className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
            >
              <XCircle className="w-5 h-5" />
              <span>Reject</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

