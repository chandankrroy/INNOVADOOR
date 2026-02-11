import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import QualityCheckSidebar from '../../components/QualityCheckSidebar';
import QualityCheckNavbar from '../../components/QualityCheckNavbar';
import { api } from '../../lib/api';
import { BarChart3, CheckCircle2, XCircle, RotateCcw, Clock } from 'lucide-react';

export default function QCReports() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (currentUser?.role === 'quality_checker') {
        try {
          setLoading(true);
          const data = await api.get('/quality-check/qc-reports/stats');
          setStats(data || {});
        } catch (error) {
          console.error('Error fetching QC stats:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchStats();
  }, [currentUser?.role]);

  if (currentUser?.role !== 'quality_checker') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/20">
      <QualityCheckSidebar />
      <QualityCheckNavbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-green-800 to-emerald-800 bg-clip-text text-transparent">
              QC Reports
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Quality control analytics and statistics</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-2xl font-bold text-gray-900">{stats.approved || 0}</span>
              </div>
              <p className="text-sm text-gray-600">Approved</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-100 rounded-lg">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <span className="text-2xl font-bold text-gray-900">{stats.rejected || 0}</span>
              </div>
              <p className="text-sm text-gray-600">Rejected</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <RotateCcw className="w-6 h-6 text-amber-600" />
                </div>
                <span className="text-2xl font-bold text-gray-900">{stats.rework_required || 0}</span>
              </div>
              <p className="text-sm text-gray-600">Rework Required</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-2xl font-bold text-gray-900">{stats.pending || 0}</span>
              </div>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">QC Pass Rate</h2>
            <div className="text-4xl font-bold text-green-600">
              {stats.pass_rate || 0}%
            </div>
            <p className="text-sm text-gray-600 mt-2">Total QCs: {stats.total_qcs || 0}</p>
          </div>
        </main>
      </div>
    </div>
  );
}

