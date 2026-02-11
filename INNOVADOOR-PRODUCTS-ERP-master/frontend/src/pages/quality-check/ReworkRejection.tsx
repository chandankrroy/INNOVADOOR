import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import QualityCheckSidebar from '../../components/QualityCheckSidebar';
import QualityCheckNavbar from '../../components/QualityCheckNavbar';
import { api } from '../../lib/api';
import { RotateCcw, XCircle } from 'lucide-react';

export default function ReworkRejection() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const [reworkJobs, setReworkJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReworkJobs = async () => {
      if (currentUser?.role === 'quality_checker') {
        try {
          setLoading(true);
          const data = await api.get('/quality-check/rework-jobs');
          setReworkJobs(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error('Error fetching rework jobs:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchReworkJobs();
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
              Rework / Rejection
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Manage rework jobs and rejections</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rework Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Production Paper</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center">Loading...</td>
                    </tr>
                  ) : reworkJobs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No rework jobs found</td>
                    </tr>
                  ) : (
                    reworkJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{job.rework_number}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{job.production_paper_number}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{job.assigned_department}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            job.status === 'completed' ? 'bg-green-100 text-green-800' :
                            job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {job.target_completion_date ? new Date(job.target_completion_date).toLocaleDateString() : 'N/A'}
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

