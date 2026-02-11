import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useSidebar } from '../../context/SidebarContext';
import CarpenterCaptainSidebar from '../../components/CarpenterCaptainSidebar';
import Navbar from '../../components/Navbar';

type WorkAllocation = {
  id: number;
  site_id: number;
  allocation_date: string;
  flat_numbers: string[];
  work_type: string;
  assigned_carpenters: string[] | null;
  target_quantity: number | null;
  status: string;
  remarks: string | null;
  created_at: string;
};

export default function WorkAllocationPage() {
  const { isCollapsed, isHovered } = useSidebar();
  const [allocations, setAllocations] = useState<WorkAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAllocations();
  }, []);

  const loadAllocations = async () => {
    try {
      setLoading(true);
      const data = await api.get('/carpenter/work-allocation');
      setAllocations(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load work allocations');
    } finally {
      setLoading(false);
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
            <h1 className="text-3xl font-bold text-gray-900">Daily Work Allocation</h1>
            <p className="text-gray-600 mt-2">View and manage daily work allocations</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Work Allocations</h2>
              <Link
                to="/carpenter/work-allocation/create"
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors inline-block"
              >
                + Create New
              </Link>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">Loading work allocations...</p>
              </div>
            ) : allocations.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 mb-4">No work allocations found</p>
                <Link
                  to="/carpenter/work-allocation/create"
                  className="text-purple-600 hover:text-purple-700"
                >
                  Create your first work allocation
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Flat Numbers
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Work Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Carpenters
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Target
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allocations.map((allocation) => (
                      <tr key={allocation.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(allocation.allocation_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {allocation.flat_numbers.join(', ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {allocation.work_type}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {allocation.assigned_carpenters ? allocation.assigned_carpenters.join(', ') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {allocation.target_quantity || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(allocation.status)}`}>
                            {allocation.status}
                          </span>
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

