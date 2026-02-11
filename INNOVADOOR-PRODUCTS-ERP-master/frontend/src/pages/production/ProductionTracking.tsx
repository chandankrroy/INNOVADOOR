import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useSidebar } from '../../context/SidebarContext';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { Search, Play, CheckCircle, Clock, XCircle } from 'lucide-react';

type ProductionTracking = {
  id: number;
  production_paper_id: number;
  production_paper_number: string;
  product_type: string;
  stage_name: string;
  stage_sequence: number;
  start_date_time: string | null;
  end_date_time: string | null;
  supervisor_name: string | null;
  status: string;
  rework_flag: boolean;
  remarks: string | null;
};

const DOOR_STAGES = [
  'Material Unloading',
  'Sanding',
  'Cutting',
  'Round Edge',
  'Laminate Pressing',
  'Grooving',
  'Finishing',
  'Packing',
  'Ready for Dispatch',
  'Dispatch',
  'Delivery (On the Way)',
  'Delivered'
];

const FRAME_STAGES = [
  'Material Unloading',
  'Sanding',
  'Cutting',
  'Round Edge',
  'Laminate Pressing',
  'Nailing',
  'Finishing',
  'Packing',
  'Ready for Dispatch',
  'Dispatch',
  'Delivery (On the Way)',
  'Delivered'
];

export default function ProductionTracking() {
  const { isCollapsed, isHovered } = useSidebar();
  const [trackingEntries, setTrackingEntries] = useState<ProductionTracking[]>([]);
  const [selectedPaperId, setSelectedPaperId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedPaperId) {
      loadTracking(selectedPaperId);
    } else {
      loadAllTracking();
    }
  }, [selectedPaperId]);

  const loadAllTracking = async () => {
    try {
      setLoading(true);
      const data = await api.get('/production/production-tracking');
      setTrackingEntries(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load tracking data');
    } finally {
      setLoading(false);
    }
  };

  const loadTracking = async (paperId: number) => {
    try {
      setLoading(true);
      const data = await api.get(`/production/production-tracking/paper/${paperId}`);
      setTrackingEntries(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load tracking data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'In Progress':
        return <Play className="w-5 h-5 text-blue-600" />;
      case 'Pending':
        return <Clock className="w-5 h-5 text-gray-400" />;
      default:
        return <XCircle className="w-5 h-5 text-red-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Production Tracking</h1>
            <p className="text-gray-600 mt-2">Track production stages for all orders</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center gap-4">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="number"
                placeholder="Enter Production Paper ID to filter (leave empty for all)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={selectedPaperId || ''}
                onChange={(e) => setSelectedPaperId(e.target.value ? parseInt(e.target.value) : null)}
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading tracking data...</p>
            </div>
          ) : trackingEntries.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-600">No tracking data found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {trackingEntries.map((entry) => (
                <div key={entry.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{entry.stage_name}</h3>
                      <p className="text-sm text-gray-600">Paper: {entry.production_paper_number}</p>
                      <p className="text-sm text-gray-600">Product: {entry.product_type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(entry.status)}
                      <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(entry.status)}`}>
                        {entry.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Sequence</p>
                      <p className="font-medium">{entry.stage_sequence}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Start Time</p>
                      <p className="font-medium">
                        {entry.start_date_time 
                          ? new Date(entry.start_date_time).toLocaleString()
                          : 'Not started'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">End Time</p>
                      <p className="font-medium">
                        {entry.end_date_time 
                          ? new Date(entry.end_date_time).toLocaleString()
                          : 'Not completed'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Supervisor</p>
                      <p className="font-medium">{entry.supervisor_name || 'Not assigned'}</p>
                    </div>
                  </div>

                  {entry.rework_flag && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-sm font-medium text-yellow-800">⚠️ Rework Required</p>
                    </div>
                  )}

                  {entry.remarks && (
                    <div className="mt-4 p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Remarks:</span> {entry.remarks}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}










