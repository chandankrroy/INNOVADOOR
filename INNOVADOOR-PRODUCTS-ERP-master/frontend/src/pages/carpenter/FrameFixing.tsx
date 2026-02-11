import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useSidebar } from '../../context/SidebarContext';
import CarpenterCaptainSidebar from '../../components/CarpenterCaptainSidebar';
import Navbar from '../../components/Navbar';

type FrameFixing = {
  id: number;
  flat_id: number;
  site_id: number;
  frame_type: string;
  fixing_status: string;
  fixing_date: string | null;
  carpenter_name: string | null;
  issue: string | null;
  photo_url: string | null;
  supervisor_approved: boolean;
  created_at: string;
};

export default function FrameFixingPage() {
  const { isCollapsed, isHovered } = useSidebar();
  const [fixings, setFixings] = useState<FrameFixing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFixings();
  }, []);

  const loadFixings = async () => {
    try {
      setLoading(true);
      const data = await api.get('/carpenter/frame-fixing');
      setFixings(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load frame fixing records');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'On Hold':
        return 'bg-yellow-100 text-yellow-800';
      case 'Pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CarpenterCaptainSidebar />
      <Navbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Frame Fixing Record</h1>
            <p className="text-gray-600 mt-2">View and manage frame fixing records</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Frame Fixing Records</h2>
              <Link
                to="/carpenter/frame-fixing/create"
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors inline-block"
              >
                + Create New
              </Link>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">Loading frame fixing records...</p>
              </div>
            ) : fixings.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 mb-4">No frame fixing records found</p>
                <Link
                  to="/carpenter/frame-fixing/create"
                  className="text-purple-600 hover:text-purple-700"
                >
                  Create your first frame fixing record
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Flat ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Frame Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fixing Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Carpenter
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Issue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Approved
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {fixings.map((fixing) => (
                      <tr key={fixing.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {fixing.flat_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {fixing.frame_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(fixing.fixing_status)}`}>
                            {fixing.fixing_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {fixing.fixing_date ? new Date(fixing.fixing_date).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {fixing.carpenter_name || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {fixing.issue || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {fixing.supervisor_approved ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Approved
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

